import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * High-performance, hardware-accelerated Scroll-Driven Canvas Animation.
 *
 * Requirements Met:
 * 1. Synchronized directly to user scroll position (no timers, no autoplay).
 * 2. Scrolling DOWN advances frames; scrolling UP reverses frames; stopping freezes.
 * 3. Preloads frames progressively with nearest-frame fallback so canvas never flickers.
 * 4. Responsive canvas with aspect-ratio "cover" logic and devicePixelRatio support.
 * 5. Respects prefers-reduced-motion.
 */
/**
 * @param {{
 *   folderPath: string;
 *   totalFrames?: number;
 *   framePrefix?: string;
 *   frameExtension?: string;
 *   containerRef: { current: HTMLElement | null };
 *   posterSrc?: string;
 *   overlayClassName?: string;
 *   onProgressChange?: ((progress: number, frame: number) => void) | null;
 *   active?: boolean;
 * }} props
 */
export function ScrollCanvasBackground({
  folderPath,
  totalFrames = 200,
  framePrefix = 'ezgif-frame-',
  frameExtension = '.jpg',
  containerRef,
  posterSrc = '/assets/batman_be6.png',
  overlayClassName = 'bg-gradient-to-b from-dark-950/85 via-dark-950/75 to-dark-950',
  onProgressChange = null,
  active = true
}) {
  const canvasRef = useRef(/** @type {HTMLCanvasElement | null} */ (null));
  const imagesRef = useRef(/** @type {HTMLImageElement[]} */ ([]));
  const loadedMapRef = useRef(new Uint8Array(totalFrames + 1));
  const currentFrameRef = useRef(1);
  const targetFrameRef = useRef(1);
  const rafIdRef = useRef(/** @type {number | null} */ (null));
  const [loadPercentage, setLoadPercentage] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Render frame to canvas with aspect-ratio "cover" positioning
  const renderFrame = useCallback((/** @type {number} */ frameIdx) => {
    const canvas = /** @type {HTMLCanvasElement | null} */ (canvasRef.current);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI scaling
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const displayWidth = Math.round(rect.width * dpr);
    const displayHeight = Math.round(rect.height * dpr);

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }

    // Find best loaded frame (nearest neighbor if requested frame is buffering)
    let bestImg = /** @type {HTMLImageElement | undefined} */ (imagesRef.current[frameIdx]);
    if (!bestImg || !bestImg.complete) {
      // Find closest loaded frame
      const loadedMap = loadedMapRef.current;
      let closest = 1;
      let minDiff = 9999;
      for (let i = 1; i <= totalFrames; i++) {
        if (loadedMap[i]) {
          const diff = Math.abs(i - frameIdx);
          if (diff < minDiff) {
            minDiff = diff;
            closest = i;
          }
        }
      }
      bestImg = imagesRef.current[closest];
    }

    if (bestImg && bestImg.complete && bestImg.naturalWidth > 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const hRatio = canvas.width / bestImg.naturalWidth;
      const vRatio = canvas.height / bestImg.naturalHeight;
      const ratio = Math.max(hRatio, vRatio);
      const centerShiftX = (canvas.width - bestImg.naturalWidth * ratio) / 2;
      const centerShiftY = (canvas.height - bestImg.naturalHeight * ratio) / 2;

      ctx.drawImage(
        bestImg,
        0,
        0,
        bestImg.naturalWidth,
        bestImg.naturalHeight,
        centerShiftX,
        centerShiftY,
        bestImg.naturalWidth * ratio,
        bestImg.naturalHeight * ratio
      );
    }
  }, [totalFrames]);

  // Progressive image preloader
  useEffect(() => {
    let isCancelled = false;
    const images = /** @type {HTMLImageElement[]} */ ([]);
    const loadedMap = new Uint8Array(totalFrames + 1);
    let loadedCount = 0;

    const getFrameUrl = (/** @type {number} */ idx) => {
      const padded = String(idx).padStart(3, '0');
      return `${folderPath}/${framePrefix}${padded}${frameExtension}`;
    };

    imagesRef.current = images;
    loadedMapRef.current = loadedMap;

    // Load frame helper
    const loadSingleFrame = (/** @type {number} */ idx) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = getFrameUrl(idx);
        img.onload = () => {
          if (isCancelled) return resolve(null);
          images[idx] = img;
          loadedMap[idx] = 1;
          loadedCount++;
          if (loadedCount % 10 === 0 || loadedCount === totalFrames) {
            setLoadPercentage(Math.round((loadedCount / totalFrames) * 100));
          }
          if (idx === 1) {
            setIsReady(true);
            renderFrame(1);
          }
          resolve(null);
        };
        img.onerror = () => {
          if (isCancelled) return resolve(null);
          // Fallback to poster if individual frame fails
          resolve(null);
        };
      });
    };

    // Stage 1: Load Frame 1 immediately for instant paint
    loadSingleFrame(1).then(() => {
      if (isCancelled) return;
      renderFrame(1);
      // Stage 2: Load keyframes first (every 5th frame)
      const keyframePromises = [];
      for (let i = 5; i <= totalFrames; i += 5) {
        keyframePromises.push(loadSingleFrame(i));
      }
      Promise.all(keyframePromises).then(() => {
        if (isCancelled) return;
        // Stage 3: Fill in remaining intermediate frames
        for (let i = 2; i <= totalFrames; i++) {
          if (i % 5 !== 0) {
            loadSingleFrame(i);
          }
        }
      });
    });

    return () => {
      isCancelled = true;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [folderPath, totalFrames, framePrefix, frameExtension, renderFrame]);

  // Render immediately when ready
  useEffect(() => {
    if (isReady) {
      renderFrame(currentFrameRef.current || 1);
    }
  }, [isReady, renderFrame]);

  // Scroll synchronization logic
  useEffect(() => {
    if (!active) return;

    // Check for prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      renderFrame(1);
      return;
    }

    let isScheduled = false;

    const handleScroll = () => {
      const container = containerRef?.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const scrollableDistance = rect.height - windowHeight;

      if (scrollableDistance <= 0) return;

      // When container is sticky, top becomes negative as user scrolls into it
      const currentScroll = -rect.top;
      const rawProgress = currentScroll / scrollableDistance;
      const progress = Math.min(1, Math.max(0, rawProgress));

      // Calculate frame directly: 0% -> Frame 1, 100% -> Frame totalFrames
      const calculatedFrame = Math.min(
        totalFrames,
        Math.max(1, Math.floor(progress * (totalFrames - 1)) + 1)
      );

      targetFrameRef.current = calculatedFrame;

      if (onProgressChange) {
        onProgressChange(progress, calculatedFrame);
      }

      if (!isScheduled) {
        isScheduled = true;
        rafIdRef.current = requestAnimationFrame(() => {
          isScheduled = false;
          currentFrameRef.current = targetFrameRef.current;
          renderFrame(targetFrameRef.current);
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    // Initial render
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [active, containerRef, totalFrames, onProgressChange, renderFrame]);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none">
      {/* HTML5 Canvas Surface */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover transition-opacity duration-300"
        style={{ opacity: isReady ? 1 : 0 }}
      />

      {/* Fallback Poster before initial frame loads */}
      {!isReady && (
        <img
          src={posterSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-[2px] opacity-40 scale-105"
        />
      )}

      {/* Cinematic Dark & Gradient Overlays for High Text Contrast */}
      <div className={`absolute inset-0 ${overlayClassName}`}></div>
      <div className="absolute inset-0 bg-dark-950/20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-dark-950/70 pointer-events-none"></div>

      {/* Subtle Frame Loading Indicator */}
      {loadPercentage < 100 && (
        <div className="absolute bottom-4 right-4 z-10 flex items-center space-x-2 px-2.5 py-1 rounded-full bg-dark-950/80 border border-brand-cyan/20 text-[10px] font-mono text-slate-400 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse"></span>
          <span>Frames: {loadPercentage}%</span>
        </div>
      )}
    </div>
  );
}

