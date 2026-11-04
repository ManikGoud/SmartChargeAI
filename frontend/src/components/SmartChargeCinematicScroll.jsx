import React, { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Zap, 
  Activity, 
  Navigation, 
  ShieldCheck, 
  Cpu, 
  Layers, 
  Wind, 
  BatteryCharging, 
  ArrowRight,
  Search,
  Compass
} from 'lucide-react';
import { DemoDataBadge } from './Badge';

gsap.registerPlugin(ScrollTrigger);

// 4 Cinematic Scenes mapped to the 800-frame sequences
const SCENES = [
  {
    id: 'take1',
    sceneNum: '01',
    name: 'Departure & Energy Recovery',
    subtitle: 'Kinetic Regeneration in Urban Corridors',
    folderKey: 'clip1',
    folderPath: '/assets/frames/clip1',
    range: [0.0, 0.25],
    totalFrames: 200,
    headline: 'Urban Energy Recovery',
    tagline: 'Dual-motor regenerative braking captures up to +32 kW during city deceleration.',
    telemetry: {
      speed: '54 km/h',
      power: '+28.4 kW',
      powerLabel: 'Regenerative Balance',
      soc: '84%',
      temp: '28.5°C',
      goal: 'Outer Ring Road (ORR) Outbound Corridor',
      status: 'Illustrative Telemetry'
    }
  },
  {
    id: 'take2',
    sceneNum: '02',
    name: 'Corridor High-Speed Cruising',
    subtitle: 'Aerodynamic Drag Compensation at 118 km/h',
    folderKey: 'clip2',
    folderPath: '/assets/frames/clip2',
    range: [0.25, 0.50],
    totalFrames: 200,
    headline: 'Corridor Aerodynamics',
    tagline: 'Continuous telemetry cross-references frontal area, wind vectors, and road gradient.',
    telemetry: {
      speed: '118 km/h',
      power: '42.1 kW',
      powerLabel: 'High-Speed Consumption',
      soc: '56%',
      temp: '31.2°C',
      goal: 'NH65 Vijayawada Expressway Corridor',
      status: 'Illustrative Telemetry'
    }
  },
  {
    id: 'take3',
    sceneNum: '03',
    name: 'Hypercharger Plaza Docking',
    subtitle: 'Automated 800V Cell Thermal Pre-Conditioning',
    folderKey: 'clip3',
    folderPath: '/assets/frames/clip3',
    range: [0.50, 0.75],
    totalFrames: 200,
    headline: '800V Thermal Conditioning',
    tagline: 'Cells pre-conditioned to 32.0°C to accept peak 350 kW DC charging without throttling.',
    telemetry: {
      speed: '35 km/h',
      power: '12.0 kW',
      powerLabel: 'Plaza Approach & HVAC Prep',
      soc: '22%',
      temp: '32.0°C (Optimal)',
      goal: 'Bay 03 • 350 kW CCS-2 High-Power Dispenser',
      status: 'Illustrative Telemetry'
    }
  },
  {
    id: 'flow',
    sceneNum: '04',
    name: '3D Exploded Powertrain',
    subtitle: 'Inside the 800V Liquid-Cooled Architecture',
    folderKey: 'flow',
    folderPath: '/assets/frames/flow',
    range: [0.75, 1.00],
    totalFrames: 200,
    headline: 'Exploded Powertrain Architecture',
    tagline: 'Inspect the 800V lithium pack, liquid-cooled CCS-2 busbar, and dual SiC inverters.',
    telemetry: {
      speed: '0 km/h (Docked)',
      power: '350 kW DC',
      powerLabel: 'Ultra-Fast Peak Acceptance',
      soc: '22% → 80%',
      temp: '32.5°C Matrix Cooled',
      goal: 'ISO 15118-20 Plug & Charge Handshake',
      status: 'Illustrative Telemetry'
    }
  }
];

export function SmartChargeCinematicScroll({ setCurrentPage, onSearch }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const queryInputRef = useRef('');

  // Performance telemetry refs (Mutated directly without triggering React re-renders)
  const hudSceneRef = useRef(null);
  const hudFrameRef = useRef(null);
  const hudSpeedRef = useRef(null);
  const hudPowerRef = useRef(null);
  const hudTempRef = useRef(null);
  const hudGoalRef = useRef(null);
  const progressLineRef = useRef(null);

  // Discrete state for scene-level changes (only 4 states, preventing render churn)
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [cacheProgress, setCacheProgress] = useState(0);

  // In-memory multi-scene image caches (800 frames total)
  const imageCaches = useRef({
    clip1: new Map(),
    clip2: new Map(),
    clip3: new Map(),
    flow: new Map()
  });

  const lastDrawnFrameRef = useRef({ sceneKey: '', frameIdx: -1 });

  // -------------------------------------------------------------
  // 1. Draw Frame to Canvas (True 16:9 Aspect Ratio & High-DPI)
  // -------------------------------------------------------------
  const drawImageToCanvas = useCallback((img, alpha = 1.0, clear = true) => {
    const canvas = canvasRef.current;
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const displayW = Math.round((rect.width || window.innerWidth || 1280) * dpr);
    const displayH = Math.round((rect.height || window.innerHeight || 720) * dpr);

    if (canvas.width !== displayW || canvas.height !== displayH) {
      canvas.width = displayW;
      canvas.height = displayH;
    }

    if (clear) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Aspect-ratio cover math (preserves 16:9 vehicle without stretching)
    const hRatio = canvas.width / img.naturalWidth;
    const vRatio = canvas.height / img.naturalHeight;
    const ratio = Math.max(hRatio, vRatio);

    const drawW = img.naturalWidth * ratio;
    const drawH = img.naturalHeight * ratio;
    const offsetX = (canvas.width - drawW) / 2;
    const offsetY = (canvas.height - drawH) / 2;

    ctx.globalAlpha = alpha;
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, offsetX, offsetY, drawW, drawH);
    ctx.globalAlpha = 1.0;
  }, []);

  // Find nearest loaded frame if current frame is loading
  const getLoadedFrame = useCallback((folderKey, targetIdx) => {
    const cache = imageCaches.current[folderKey];
    if (!cache) return null;

    if (cache.has(targetIdx)) {
      return cache.get(targetIdx);
    }

    // Nearest-neighbor search
    let closestImg = null;
    let minDiff = 9999;
    for (const [idx, img] of cache.entries()) {
      if (img && img.complete && img.naturalWidth > 0) {
        const diff = Math.abs(idx - targetIdx);
        if (diff < minDiff) {
          minDiff = diff;
          closestImg = img;
        }
      }
    }
    return closestImg;
  }, []);

  // -------------------------------------------------------------
  // 2. Progressive Image Preloading Pipeline
  // -------------------------------------------------------------
  useEffect(() => {
    let isCancelled = false;
    let totalLoadedCount = 0;
    const TOTAL_ALL_FRAMES = 800;

    const formatUrl = (folderPath, idx) => {
      const padded = String(idx).padStart(3, '0');
      return `${folderPath}/ezgif-frame-${padded}.jpg`;
    };

    const loadSingle = async (folderKey, folderPath, idx) => {
      if (imageCaches.current[folderKey].has(idx)) {
        return imageCaches.current[folderKey].get(idx);
      }

      const img = new Image();
      img.src = formatUrl(folderPath, idx);

      try {
        if ('decode' in img) {
          await img.decode();
        } else {
          await new Promise((res, rej) => {
            img.onload = res;
            img.onerror = rej;
          });
        }
      } catch (e) {
        // Fallback for decode errors
      }

      if (isCancelled) return null;

      imageCaches.current[folderKey].set(idx, img);
      totalLoadedCount++;

      if (totalLoadedCount % 40 === 0 || totalLoadedCount === TOTAL_ALL_FRAMES) {
        setCacheProgress(Math.round((totalLoadedCount / TOTAL_ALL_FRAMES) * 100));
      }

      return img;
    };

    // STAGE A: Load Frame 1 of Scene 1 IMMEDIATELY & paint
    loadSingle('clip1', '/assets/frames/clip1', 1).then((firstImg) => {
      if (isCancelled || !firstImg) return;
      setIsCanvasReady(true);
      drawImageToCanvas(firstImg, 1.0, true);
    });

    // STAGE B: Prioritized progressive load across scenes
    const queueLoads = async () => {
      // 1. Keyframes of Scene 1 (every 5th frame for instant scrub response)
      for (let i = 5; i <= 200; i += 5) {
        if (isCancelled) return;
        await loadSingle('clip1', '/assets/frames/clip1', i);
      }

      // 2. Keyframes of Scene 2 (prepare upcoming scene)
      for (let i = 1; i <= 200; i += 5) {
        if (isCancelled) return;
        await loadSingle('clip2', '/assets/frames/clip2', i);
      }

      // 3. Fill in Scene 1 intermediate frames
      for (let i = 2; i <= 200; i++) {
        if (isCancelled) return;
        if (i % 5 !== 0) await loadSingle('clip1', '/assets/frames/clip1', i);
      }

      // 4. Fill in Scene 2 intermediate frames
      for (let i = 2; i <= 200; i++) {
        if (isCancelled) return;
        if (i % 5 !== 0) await loadSingle('clip2', '/assets/frames/clip2', i);
      }

      // 5. Keyframes of Scene 3 and Scene 4
      for (let i = 1; i <= 200; i += 5) {
        if (isCancelled) return;
        await loadSingle('clip3', '/assets/frames/clip3', i);
        await loadSingle('flow', '/assets/frames/flow', i);
      }

      // 6. Complete all remaining frames for Scene 3 & Scene 4
      for (let i = 2; i <= 200; i++) {
        if (isCancelled) return;
        if (i % 5 !== 0) {
          await loadSingle('clip3', '/assets/frames/clip3', i);
          await loadSingle('flow', '/assets/frames/flow', i);
        }
      }
    };

    queueLoads();

    return () => {
      isCancelled = true;
    };
  }, [drawImageToCanvas]);

  // -------------------------------------------------------------
  // 3. GSAP ScrollTrigger Continuous Pinned Timeline
  // -------------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let activeSceneIndexLocal = 0;

    const renderProgress = (progress) => {
      // Determine active scene (0, 1, 2, or 3)
      let sceneIdx = 0;
      if (progress >= 0.75) sceneIdx = 3;
      else if (progress >= 0.50) sceneIdx = 2;
      else if (progress >= 0.25) sceneIdx = 1;

      if (sceneIdx !== activeSceneIndexLocal) {
        activeSceneIndexLocal = sceneIdx;
        setActiveSceneIdx(sceneIdx);
      }

      const scene = SCENES[sceneIdx];
      const [startP, endP] = scene.range;
      const localProgress = Math.min(1, Math.max(0, (progress - startP) / (endP - startP)));

      // Exact frame (1 to 200)
      const targetFrame = Math.min(200, Math.max(1, Math.floor(localProgress * 199) + 1));

      // Direct DOM updates for ultra-low latency & zero React render churn
      if (hudSceneRef.current) {
        hudSceneRef.current.textContent = `Scene ${scene.sceneNum} • ${scene.name}`;
      }
      if (hudFrameRef.current) {
        hudFrameRef.current.textContent = `Frame ${String(targetFrame).padStart(3, '0')} / 200`;
      }
      if (hudSpeedRef.current) {
        hudSpeedRef.current.textContent = scene.telemetry.speed;
      }
      if (hudPowerRef.current) {
        hudPowerRef.current.textContent = scene.telemetry.power;
      }
      if (hudTempRef.current) {
        hudTempRef.current.textContent = scene.telemetry.temp;
      }
      if (hudGoalRef.current) {
        hudGoalRef.current.textContent = scene.telemetry.goal;
      }
      if (progressLineRef.current) {
        progressLineRef.current.style.width = `${Math.min(100, Math.max(0, progress * 100))}%`;
      }

      // Check transition boundary (last 5% of scene crossfades with first 5% of next scene)
      const isTransitionZone = localProgress > 0.95 && sceneIdx < 3;

      if (isTransitionZone) {
        const nextScene = SCENES[sceneIdx + 1];
        const blendFactor = (localProgress - 0.95) / 0.05; // 0 to 1

        const currentImg = getLoadedFrame(scene.folderKey, targetFrame);
        const nextImg = getLoadedFrame(nextScene.folderKey, 1);

        if (currentImg) drawImageToCanvas(currentImg, 1.0, true);
        if (nextImg) drawImageToCanvas(nextImg, blendFactor, false);
      } else {
        const img = getLoadedFrame(scene.folderKey, targetFrame);
        if (img) {
          drawImageToCanvas(img, 1.0, true);
        }
      }

      lastDrawnFrameRef.current = { sceneKey: scene.folderKey, frameIdx: targetFrame };
    };

    // Create GSAP ScrollTrigger
    const trigger = ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: '+=4500', // Smooth 4500px scroll distance
      pin: true,
      scrub: 0.4, // Responsive forward & backward scrubbing with silky smoothing
      anticipatePin: 1,
      onUpdate: (self) => {
        renderProgress(self.progress);
      }
    });

    // Handle viewport resize
    const handleResize = () => {
      const active = SCENES[activeSceneIndexLocal];
      const img = getLoadedFrame(active.folderKey, lastDrawnFrameRef.current.frameIdx || 1);
      if (img) drawImageToCanvas(img, 1.0, true);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      trigger.kill();
      ScrollTrigger.refresh();
    };
  }, [drawImageToCanvas, getLoadedFrame]);

  const activeScene = SCENES[activeSceneIdx];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch && queryInputRef.current) {
      onSearch(queryInputRef.current.value);
    }
    if (setCurrentPage) {
      setCurrentPage('discovery');
    }
  };

  return (
    <section 
      ref={containerRef} 
      className="relative w-full h-screen bg-black overflow-hidden select-none text-white font-sans"
    >
      {/* 1. Pure Black Canvas Viewport (Vehicles rendered in native 16:9 aspect ratio) */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black z-0">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover transition-opacity duration-300"
          style={{ opacity: isCanvasReady ? 1 : 0 }}
        />

        {/* Fallback image while frame 1 decodes */}
        {!isCanvasReady && (
          <img 
            src="/assets/batman_be6.png" 
            alt="SmartChargeAI EV" 
            className="absolute inset-0 w-full h-full object-cover filter blur-[2px] opacity-30"
          />
        )}

        {/* Minimal Vignette & Top/Bottom Readability Gradients (Vehicle center remains 100% crystal clear) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80 pointer-events-none z-1"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_50%,_rgba(0,0,0,0.7)_100%)] pointer-events-none z-1"></div>
      </div>

      {/* 2. Top Minimal Luxury Navigation & Telemetry Pill */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-6 px-4 sm:px-8 max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand identity with Electric Green accent */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-black/80 border border-[#00FF66]/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,255,102,0.2)]">
            <Zap className="w-5 h-5 text-[#00FF66]" />
          </div>
          <div>
            <div className="text-xs font-mono tracking-widest uppercase font-bold text-white flex items-center space-x-2">
              <span>SMARTCHARGE</span>
              <span className="text-[#00FF66]">AI</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 tracking-wider">
              800V CINEMATIC TELEMETRY
            </div>
          </div>
        </div>

        {/* Scene Selection Indicators (GreenIQ minimal aesthetic) */}
        <div className="hidden md:flex items-center space-x-1.5 p-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-xs font-mono">
          {SCENES.map((sc, i) => (
            <div 
              key={sc.id}
              className={`px-3 py-1 rounded-full transition-all duration-300 flex items-center space-x-1.5 ${
                activeSceneIdx === i 
                  ? 'bg-[#00FF66]/15 text-[#00FF66] border border-[#00FF66]/40 font-bold shadow-[0_0_12px_rgba(0,255,102,0.25)]' 
                  : 'text-slate-400'
              }`}
            >
              <span>{sc.sceneNum}</span>
              <span className="hidden lg:inline">{sc.name.split(' ')[0]}</span>
            </div>
          ))}
        </div>

        {/* Demo / Status badge */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-black/80 border border-[#00FF66]/20 text-[11px] font-mono text-slate-300 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse"></span>
            <span ref={hudFrameRef}>Frame 001 / 200</span>
          </div>
          <DemoDataBadge />
        </div>
      </div>

      {/* 3. Floating Cinematic Overlays (Edge-anchored, leaving central car view completely unobstructed) */}
      <div className="absolute inset-0 z-10 pointer-events-none p-6 sm:p-10 flex flex-col justify-between pt-24 sm:pt-28">
        
        {/* Top-Left Scene Narrative Header */}
        <div className="max-w-md pointer-events-auto">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-black/80 border border-white/10 text-[10px] font-mono uppercase tracking-wider text-[#00FF66] mb-2 backdrop-blur-sm">
            <Activity className="w-3 h-3 text-[#00FF66]" />
            <span ref={hudSceneRef}>Scene 01 • Departure & Energy Recovery</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight drop-shadow-lg">
            {activeScene.headline}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed drop-shadow">
            {activeScene.tagline}
          </p>

          {/* Quick Search Action on Scene 1 */}
          {activeSceneIdx === 0 && (
            <form 
              onSubmit={handleSearchSubmit}
              className="mt-4 flex items-center max-w-sm rounded-xl bg-black/80 border border-white/15 p-1.5 backdrop-blur-md focus-within:border-[#00FF66] transition-all"
            >
              <Search className="w-4 h-4 text-[#00FF66] ml-2 shrink-0" />
              <input
                ref={queryInputRef}
                type="text"
                placeholder="Find 350 kW charging hubs..."
                className="w-full bg-transparent px-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-[#00FF66] text-black font-mono font-bold text-xs hover:bg-[#00FF66]/90 transition-all shrink-0"
              >
                Search
              </button>
            </form>
          )}
        </div>

        {/* Bottom Telemetry Bar: Electric Green Accents */}
        <div className="pointer-events-auto w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
          
          {/* Active Navigation Waypoint */}
          <div className="p-3.5 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10 max-w-sm text-xs font-mono">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5 flex items-center space-x-1">
              <Navigation className="w-3 h-3 text-[#00FF66]" />
              <span>Target Waypoint</span>
            </div>
            <div ref={hudGoalRef} className="text-white font-bold truncate">
              {activeScene.telemetry.goal}
            </div>
            <div className="text-[10px] text-[#00FF66] mt-1 font-semibold flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3" />
              <span>{activeScene.telemetry.status}</span>
            </div>
          </div>

          {/* Precision Gauges */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 font-mono">
            <div className="p-3 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10 text-center min-w-[90px] sm:min-w-[110px]">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Velocity</span>
              <span ref={hudSpeedRef} className="text-base sm:text-xl font-black text-white">
                {activeScene.telemetry.speed}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10 text-center min-w-[90px] sm:min-w-[110px]">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Power Balance</span>
              <span ref={hudPowerRef} className="text-base sm:text-xl font-black text-[#00FF66]">
                {activeScene.telemetry.power}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10 text-center min-w-[90px] sm:min-w-[110px]">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block">BMS Temp</span>
              <span ref={hudTempRef} className="text-base sm:text-xl font-black text-white">
                {activeScene.telemetry.temp}
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* 4. Bottom Continuous Scrub Timeline Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-30">
        <div 
          ref={progressLineRef}
          className="h-full bg-gradient-to-r from-[#00FF66] via-emerald-400 to-[#00FF66] shadow-[0_0_10px_#00FF66] transition-all duration-75"
          style={{ width: '0%' }}
        />
      </div>

      {/* Subtle Frame Preload Status Indicator */}
      {cacheProgress < 100 && (
        <div className="absolute bottom-3 right-6 z-30 text-[9px] font-mono text-slate-500 bg-black/60 px-2 py-0.5 rounded border border-white/5">
          Caching 800 frames: {cacheProgress}%
        </div>
      )}
    </section>
  );
}
