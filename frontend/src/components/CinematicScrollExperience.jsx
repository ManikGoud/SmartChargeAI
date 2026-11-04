import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  ArrowRight,
  Car,
  MapPin,
  Route,
  BarChart3,
  Bot,
  Zap,
  Layers,
  Activity,
  ShieldCheck,
  Navigation,
  Wind,
  BatteryCharging,
  ChevronDown,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useVehicle } from '../context/VehicleContext';
import { DemoDataBadge } from './Badge';

const CHAPTERS = [
  {
    id: 'intro',
    title: 'Chapter 01: Urban Departure & Energy Recovery',
    subtitle: 'Kinetic Regeneration & Smart Departure Routing',
    folder: '/assets/frames/clip1',
    videoSrc: '/assets/take%201.mp4',
    totalFrames: 200,
    range: [0.0, 0.25],
    telemetry: {
      status: 'Urban Outbound Active',
      speed: '54 km/h',
      power: '+28.4 kW',
      powerLabel: 'BMS Regenerative Recovery',
      bmsTemp: '28.5°C',
      goal: 'Outer Ring Road (ORR) Gachibowli Corridor',
      nextHub: 'Zeon FastHub Gachibowli (4.2 km)'
    }
  },
  {
    id: 'corridor',
    title: 'Chapter 02: Highway Corridor Range Conservation',
    subtitle: 'Aerodynamic Compensation at 118 km/h on NH65',
    folder: '/assets/frames/clip2',
    videoSrc: '/assets/take%202.mp4',
    totalFrames: 200,
    range: [0.25, 0.50],
    telemetry: {
      status: 'Corridor Cruising Engaged',
      speed: '118 km/h',
      power: '42.1 kW',
      powerLabel: 'Aerodynamic Drag Consumption',
      bmsTemp: '31.2°C',
      goal: 'Hyderabad → Vijayawada Expressway',
      nextHub: 'Tata Power Mega Plaza Suryapet (62 km)'
    }
  },
  {
    id: 'approach',
    title: 'Chapter 03: Hypercharger Approach & Pre-conditioning',
    subtitle: 'Automated 800V Battery Thermal Conditioning',
    folder: '/assets/frames/clip3',
    videoSrc: '/assets/take%203.mp4',
    totalFrames: 200,
    range: [0.50, 0.75],
    telemetry: {
      status: 'Plaza Docking Inbound',
      speed: '35 km/h',
      power: '12.0 kW',
      powerLabel: 'Stall Deceleration & HVAC Pre-heat',
      bmsTemp: '32.0°C (Optimal)',
      goal: 'Jio-bp Pulse Hypercharger Plaza',
      nextHub: 'Bay 03 (350 kW CCS-2 Reserved)'
    }
  },
  {
    id: 'exploded',
    title: 'Chapter 04: 3D Exploded Powertrain Architecture',
    subtitle: 'Inside the 800V Cell Matrix, CCS-2 Bus & Smart BMS',
    folder: '/assets/frames/flow',
    videoSrc: '/assets/flow.mp4',
    totalFrames: 200,
    range: [0.75, 1.00],
    telemetry: {
      status: '3D Powertrain Exploded',
      speed: '0 km/h (Docked)',
      power: '350 kW DC',
      powerLabel: 'Ultra-Fast Peak Acceptance Window',
      bmsTemp: '32.5°C Active Liquid Cooling',
      goal: '10% → 80% Dwell Time: 18 mins',
      nextHub: 'ISO 15118-20 Plug & Charge Handshake'
    }
  }
];

export function CinematicScrollExperience({ setCurrentPage, onSearch }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const bgVideoRef = useRef(null);
  const { activeVehicle, currentSoC, usableRangeKm } = useVehicle();

  // State
  const [query, setQuery] = useState('');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);
  const [activeFrameNumber, setActiveFrameNumber] = useState(1);
  const [totalCachedPercent, setTotalCachedPercent] = useState(0);
  const [experienceMode, setExperienceMode] = useState('canvas'); // Default to 'canvas' so the scroll-driven animation is visible immediately on load!
  const [videoPlaying, setVideoPlaying] = useState(false);

  // References for Animation & Caching
  const imagesCacheRef = useRef({
    clip1: [],
    clip2: [],
    clip3: [],
    flow: []
  });
  const loadedMapRef = useRef({
    clip1: new Uint8Array(201),
    clip2: new Uint8Array(201),
    clip3: new Uint8Array(201),
    flow: new Uint8Array(201)
  });

  // Smooth lerp tracking
  const targetFrameRef = useRef(1);
  const displayedFrameRef = useRef(1);
  const currentChapterFolderRef = useRef('/assets/frames/clip1');
  const animFrameIdRef = useRef(null);

  // Safe background video autoplay enforcement
  useEffect(() => {
    const video = bgVideoRef.current;
    if (!video) return;

    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setVideoPlaying(true))
        .catch((err) => {
          console.warn('Background video autoplay retry muted:', err);
          video.muted = true;
          video.play().then(() => setVideoPlaying(true)).catch(() => { });
        });
    }
  }, [activeChapterIdx, experienceMode]);

  // Progressive frame loading across all 4 chapters
  useEffect(() => {
    let isCancelled = false;
    let totalLoaded = 0;
    const totalAllFrames = 800; // 200 * 4

    const loadChapterKeyframes = async (folderKey, folderPath) => {
      const images = imagesCacheRef.current[folderKey]?.length > 0
        ? imagesCacheRef.current[folderKey]
        : new Array(201);
      const loadedMap = loadedMapRef.current[folderKey] || new Uint8Array(201);
      imagesCacheRef.current[folderKey] = images;
      loadedMapRef.current[folderKey] = loadedMap;

      const loadSingle = (idx) => {
        return new Promise((resolve) => {
          const padded = String(idx).padStart(3, '0');
          const img = new Image();
          img.src = `${folderPath}/ezgif-frame-${padded}.jpg`;
          img.onload = () => {
            if (isCancelled) return resolve();
            images[idx] = img;
            loadedMap[idx] = 1;
            totalLoaded++;
            if (folderKey === 'clip1' && idx === 1) {
              // Immediately paint Frame 1 as soon as loaded!
              drawFrame('clip1', 1);
            }
            if (totalLoaded % 20 === 0 || totalLoaded === totalAllFrames) {
              setTotalCachedPercent(Math.round((totalLoaded / totalAllFrames) * 100));
            }
            resolve();
          };
          img.onerror = () => resolve();
        });
      };

      // 1. Load Frame 1 immediately and draw to canvas
      await loadSingle(1);
      if (isCancelled) return;
      drawFrame(folderKey, 1);

      // 2. Load keyframes (every 5th frame)
      const keyPromises = [];
      for (let i = 5; i <= 200; i += 5) {
        keyPromises.push(loadSingle(i));
      }
      await Promise.all(keyPromises);

      // 3. Fill remaining frames in background
      for (let i = 2; i <= 200; i++) {
        if (i % 5 !== 0) {
          loadSingle(i);
        }
      }
    };

    // Load Chapter 1 (clip1) with highest priority, then the others
    loadChapterKeyframes('clip1', '/assets/frames/clip1').then(() => {
      if (isCancelled) return;
      loadChapterKeyframes('clip2', '/assets/frames/clip2');
      loadChapterKeyframes('clip3', '/assets/frames/clip3');
      loadChapterKeyframes('flow', '/assets/frames/flow');
    });

    return () => {
      isCancelled = true;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, []);

  // Canvas drawing routine (Aspect cover + devicePixelRatio crispness)
  const drawFrame = useCallback((folderKey, frameIdx) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle High-DPI
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const displayW = Math.round((rect.width || window.innerWidth || 1280) * dpr);
    const displayH = Math.round((rect.height || window.innerHeight || 720) * dpr);

    if (canvas.width !== displayW || canvas.height !== displayH) {
      canvas.width = displayW;
      canvas.height = displayH;
    }

    const cache = imagesCacheRef.current[folderKey] || [];
    const loadedMap = loadedMapRef.current[folderKey] || new Uint8Array(201);

    // Nearest loaded neighbor fallback if current frame is loading
    let bestImg = cache[frameIdx];
      if (!bestImg || !bestImg.complete || !bestImg.naturalWidth) {
        let closest = 1;
        let minDiff = 9999;
        for (let i = 1; i <= 200; i++) {
            if (loadedMap[i] && cache[i] && cache[i].complete && cache[i].naturalWidth > 0) {
              const diff = Math.abs(i - frameIdx);
              if (diff < minDiff) {
                minDiff = diff;
                closest = i;
              }
            }
          }
          bestImg = cache[closest];
        }

        if (bestImg && bestImg.complete && bestImg.naturalWidth > 0) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const hRatio = canvas.width / bestImg.naturalWidth;
          const vRatio = canvas.height / bestImg.naturalHeight;
          const ratio = Math.max(hRatio, vRatio);
          const shiftX = (canvas.width - bestImg.naturalWidth * ratio) / 2;
          const shiftY = (canvas.height - bestImg.naturalHeight * ratio) / 2;

          ctx.drawImage(
            bestImg,
            0,
            0,
            bestImg.naturalWidth,
            bestImg.naturalHeight,
            shiftX,
            shiftY,
            bestImg.naturalWidth * ratio,
            bestImg.naturalHeight * ratio
          );
        }
      }, []);

  // Smooth scroll listener & continuous render loop
  useEffect(() => {
    let isScheduled = false;

    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const windowH = window.innerHeight;
      const scrollable = rect.height - windowH;

      if (scrollable <= 0) return;

      const currentScroll = -rect.top;
      const rawProgress = currentScroll / scrollable;
      const progress = Math.min(1, Math.max(0, rawProgress));

      setScrollProgress(progress);

      // Determine active chapter (0 to 3)
      let chapterIdx = 0;
      if (progress >= 0.75) chapterIdx = 3;
      else if (progress >= 0.50) chapterIdx = 2;
      else if (progress >= 0.25) chapterIdx = 1;

      setActiveChapterIdx(chapterIdx);

      const chapter = CHAPTERS[chapterIdx];
      const [startP, endP] = chapter.range;
      const localProgress = Math.min(1, Math.max(0, (progress - startP) / (endP - startP)));

      // Exact frame calculated from scroll progress
      const targetFrame = Math.min(200, Math.max(1, Math.floor(localProgress * 199) + 1));
      targetFrameRef.current = targetFrame;
      setActiveFrameNumber(targetFrame);

      const folderKeys = ['clip1', 'clip2', 'clip3', 'flow'];
      const currentFolderKey = folderKeys[chapterIdx];

      // Schedule continuous smooth canvas render loop until target frame is reached
      const step = () => {
        const diff = targetFrameRef.current - displayedFrameRef.current;
        if (Math.abs(diff) < 0.1) {
          displayedFrameRef.current = targetFrameRef.current;
          drawFrame(currentFolderKey, Math.round(displayedFrameRef.current));
          isScheduled = false;
          return;
        }
        displayedFrameRef.current += diff * 0.35;
        drawFrame(currentFolderKey, Math.round(displayedFrameRef.current));
        animFrameIdRef.current = requestAnimationFrame(step);
      };

      if (!isScheduled) {
        isScheduled = true;
        animFrameIdRef.current = requestAnimationFrame(step);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    // Initial render
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [drawFrame]);

  const activeChapter = CHAPTERS[activeChapterIdx];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(query);
    setCurrentPage('discovery');
  };

  // Chapter 1 sub-progress for hero text fadeout
  const heroOpacity = Math.max(0, 1 - (scrollProgress / 0.12));
  const chapter1HudOpacity = scrollProgress >= 0.08 && scrollProgress < 0.25
    ? Math.min(1, (scrollProgress - 0.08) * 8)
    : 0;

  return (
    <section
      ref={containerRef}
      className="relative w-full h-[600vh] bg-dark-950"
    >
      {/* Pinned Sticky 100vh Viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between">

        {/* Fullscreen HTML5 Background Video & Canvas Layer */}
          <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 overflow-hidden">
            {/* HTML5 Canvas Background for Scroll-Scrub Mode (Default active & visible) */}
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${experienceMode === 'canvas' ? 'opacity-100 z-10' : 'opacity-0 -z-10 pointer-events-none'
                }`}
            />

            {/* HTML5 Background Video (Available when toggled to video mode) */}
            <video
              ref={bgVideoRef}
              key={activeChapter.videoSrc}
              src={activeChapter.videoSrc}
              poster="/assets/batman_be6.png"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${experienceMode === 'video' ? 'opacity-100 z-10' : 'opacity-0 -z-10 pointer-events-none'
                }`}
              onCanPlay={() => {
                if (bgVideoRef.current) {
                  bgVideoRef.current.defaultMuted = true;
                  bgVideoRef.current.muted = true;
                  bgVideoRef.current.play().catch(() => { });
                }
              }}
            />

            {/* Fallback Poster */}
            <img
              src="/assets/batman_be6.png"
              alt=""
              className="absolute inset-0 w-full h-full object-cover filter blur-[2px] opacity-20 -z-20"
            />

            {/* Cinematic Dark & Radial Overlays (Balanced for bright car graphics & crisp readable text) */}
            <div className="absolute inset-0 bg-gradient-to-b from-dark-950/80 via-dark-950/25 to-dark-950/90 z-20 pointer-events-none"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-dark-950/60 z-20 pointer-events-none"></div>
          </div>

          {/* Ambient Cyan Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-brand-cyan/10 blur-[150px] pointer-events-none"></div>

          {/* TOP HUD BAR: Sequence Timeline & Frame Telemetry */}
          <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-mono bg-dark-900/80 border border-brand-cyan/30 text-brand-cyan backdrop-blur-md shadow-cyan-glow">
                <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse"></span>
                <span className="font-bold">{activeChapter.title.split(':')[0]}</span>
                <span className="text-slate-500">•</span>
                <span className="text-white hidden sm:inline">{activeChapter.subtitle.split(' ')[0]} {activeChapter.subtitle.split(' ')[1]}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 pointer-events-auto">
              {/* Experience Mode Toggle */}
              <div className="inline-flex items-center p-1 rounded-xl bg-dark-900/90 border border-white/10 text-xs font-mono">
                <button
                  onClick={() => setExperienceMode('video')}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition-all ${experienceMode === 'video' ? 'bg-brand-cyan text-dark-950 font-bold shadow-cyan-glow' : 'text-slate-400 hover:text-white'
                    }`}
                >
                  <span>🎬 Background Video</span>
                </button>
                <button
                  onClick={() => setExperienceMode('canvas')}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition-all ${experienceMode === 'canvas' ? 'bg-brand-cyan text-dark-950 font-bold shadow-cyan-glow' : 'text-slate-400 hover:text-white'
                    }`}
                >
                  <span>📜 Scroll Canvas</span>
                </button>
              </div>

              <DemoDataBadge />

              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-dark-900/80 border border-white/10 text-xs font-mono text-slate-300 backdrop-blur-md">
                <span className="text-slate-400">Scroll:</span>
                <span className="text-brand-cyan font-bold">{Math.round(scrollProgress * 100)}%</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">Frame:</span>
                <span className="text-white font-bold">{activeFrameNumber}/200</span>
              </div>
            </div>
          </div>

          {/* MIDDLE CONTENT STAGE: Transitions smoothly as user scrolls */}
          <div className="relative z-20 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col justify-center">

            {/* ========================================================
              STAGE 0: Hero Search & Main Announcement (Scroll: 0% - 10%)
             ======================================================== */}
            {scrollProgress < 0.12 && (
              <div
                className="text-center space-y-6 transition-all duration-300 pointer-events-auto"
                style={{
                  opacity: heroOpacity,
                  transform: `translateY(-${scrollProgress * 80}px)`
                }}
              >
                <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-mono bg-dark-900/80 border border-brand-cyan/30 text-slate-300 shadow-cyan-glow backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse"></span>
                  <span>SmartChargeAI • Next-Gen EV Infrastructure Assistant</span>
                  <span className="text-brand-cyan font-bold">2.0</span>
                </div>

                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
                  Intelligent EV Charging.{' '}
                  <span className="bg-gradient-to-r from-brand-cyan via-slate-100 to-brand-blue bg-clip-text text-transparent">
                    Engineered by AI.
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
                  Scroll to control vehicle acceleration, highway aerodynamics, and 3D exploded powertrain architecture.
                </p>

                {/* Search Bar Input */}
                <form
                  onSubmit={handleSearchSubmit}
                  className="max-w-2xl mx-auto relative flex items-center p-2 rounded-2xl bg-dark-900/90 border border-brand-cyan/40 shadow-2xl backdrop-blur-xl group focus-within:border-brand-cyan focus-within:shadow-cyan-glow transition-all"
                >
                  <div className="pl-3 text-brand-cyan">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by city, landmark, or charging network (e.g. HITEC City, Gachibowli, Shell)..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-transparent px-3 py-2.5 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="shrink-0 flex items-center space-x-2 px-5 py-3 rounded-xl bg-brand-cyan text-dark-950 font-bold hover:bg-brand-cyan/90 transition-all text-xs sm:text-sm shadow-md"
                  >
                    <span>Find Chargers</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Active Vehicle Bar */}
                <div className="inline-flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-slate-400 bg-dark-900/70 backdrop-blur-md px-4 py-2 rounded-xl border border-white/5">
                  <span className="text-slate-500">Active Vehicle:</span>
                  <span className="text-white font-semibold flex items-center space-x-1">
                    <Car className="w-3.5 h-3.5 text-brand-cyan inline" />
                    <span>{activeVehicle.make} {activeVehicle.model}</span>
                  </span>
                  <span className="text-slate-600">•</span>
                  <span>Battery: <strong className="text-brand-cyan">{currentSoC}%</strong> (~{usableRangeKm} km)</span>
                  <button
                    onClick={() => setCurrentPage('garage')}
                    className="text-brand-cyan hover:underline text-[11px]"
                  >
                    Change EV →
                  </button>
                </div>

                {/* Quick Module Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                  <button
                    onClick={() => setCurrentPage('discovery')}
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 hover:border-brand-cyan/30 transition-all text-xs"
                  >
                    <MapPin className="w-3.5 h-3.5 text-brand-cyan" />
                    <span>Station Discovery</span>
                  </button>
                  <button
                    onClick={() => setCurrentPage('trips')}
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 hover:border-brand-cyan/30 transition-all text-xs"
                  >
                    <Route className="w-3.5 h-3.5 text-emerald-400" />
                    <span>EV Trip Planner</span>
                  </button>
                  <button
                    onClick={() => setCurrentPage('comparison')}
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 hover:border-brand-cyan/30 transition-all text-xs"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cost Comparison</span>
                  </button>
                  <button
                    onClick={() => setCurrentPage('assistant')}
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-cyan/20 to-purple-500/20 border border-brand-cyan/40 text-brand-cyan font-semibold hover:bg-brand-cyan/20 transition-all text-xs shadow-cyan-glow"
                  >
                    <Bot className="w-3.5 h-3.5 text-brand-cyan" />
                    <span>AI Assistant</span>
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================
              STAGE 1: Chapter 01 Urban Departure Telemetry (Scroll: 10% - 25%)
             ======================================================== */}
            {scrollProgress >= 0.08 && scrollProgress < 0.25 && (
              <div
                className="glass-panel-glow rounded-3xl p-6 sm:p-8 border border-brand-cyan/40 backdrop-blur-xl space-y-5 animate-in fade-in duration-300 pointer-events-auto"
                style={{ opacity: chapter1HudOpacity }}
              >
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div>
                    <span className="text-xs font-mono text-brand-cyan uppercase tracking-wider block mb-1">
                      Sequence 01 • clip1framezip
                    </span>
                    <h3 className="text-2xl font-bold text-white">
                      Urban Energy Recovery & Departure Corridors
                    </h3>
                  </div>
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                    ● Kinetic Regen Active
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
                  <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5">
                    <span className="text-[10px] text-slate-400 block uppercase">Urban Speed</span>
                    <span className="text-2xl font-black text-white">{activeChapter.telemetry.speed}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5">
                    <span className="text-[10px] text-slate-400 block uppercase">Regen Power</span>
                    <span className="text-2xl font-black text-emerald-400">{activeChapter.telemetry.power}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5">
                    <span className="text-[10px] text-slate-400 block uppercase">BMS Temp</span>
                    <span className="text-2xl font-black text-brand-cyan">{activeChapter.telemetry.bmsTemp}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5">
                    <span className="text-[10px] text-slate-400 block uppercase">Next Planned Stop</span>
                    <span className="text-xs font-bold text-white truncate block mt-1">Zeon Gachibowli</span>
                    <span className="text-[10px] text-brand-cyan">4.2 km</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-white/5">
                  <div className="flex items-center space-x-1.5">
                    <Navigation className="w-3.5 h-3.5 text-brand-cyan" />
                    <span>Outbound to Outer Ring Road (ORR)</span>
                  </div>
                  <span className="text-brand-cyan font-bold">Scroll down to accelerate to highway cruising speed ↓</span>
                </div>
              </div>
            )}

            {/* ========================================================
              STAGE 2: Chapter 02 Highway Cruising on NH65 (Scroll: 25% - 50%)
             ======================================================== */}
            {scrollProgress >= 0.25 && scrollProgress < 0.50 && (
              <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 border border-brand-cyan/40 backdrop-blur-xl space-y-5 animate-in fade-in duration-300 pointer-events-auto">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div>
                    <span className="text-xs font-mono text-brand-cyan uppercase tracking-wider block mb-1">
                      Sequence 02 • clip2frame
                    </span>
                    <h3 className="text-2xl font-bold text-white">
                      High-Speed Expressway Cruising on NH65
                    </h3>
                  </div>
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30 font-bold">
                    ● 118 km/h Aerodynamics
                  </span>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                  Aerodynamic drag scales quadratically with velocity. SmartChargeAI continuously cross-references real-time highway wind vectors, elevation climb, and vehicle frontal area to adjust estimated arrival battery levels.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
                  <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5">
                    <span className="text-[10px] text-slate-400 block uppercase">Corridor Speed</span>
                    <span className="text-2xl font-black text-white">{activeChapter.telemetry.speed}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5">
                    <span className="text-[10px] text-slate-400 block uppercase">Continuous Draw</span>
                    <span className="text-2xl font-black text-brand-cyan">{activeChapter.telemetry.power}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5">
                    <span className="text-[10px] text-slate-400 block uppercase">BMS Cell Temp</span>
                    <span className="text-2xl font-black text-white">{activeChapter.telemetry.bmsTemp}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5">
                    <span className="text-[10px] text-slate-400 block uppercase">Waypoint Lock</span>
                    <span className="text-xs font-bold text-emerald-400 truncate block mt-1">Suryapet MegaHub</span>
                    <span className="text-[10px] text-slate-400">Guaranteed 20% SoC Arrival</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-white/5">
                  <div className="flex items-center space-x-1.5">
                    <Wind className="w-3.5 h-3.5 text-brand-cyan" />
                    <span>Corridor Range Buffer: 248 km remaining</span>
                  </div>
                  <span className="text-brand-cyan font-bold">Scroll down to approach the hypercharger plaza ↓</span>
                </div>
              </div>
            )}

            {/* ========================================================
              STAGE 3: Chapter 03 Hypercharger Approach (Scroll: 50% - 75%)
             ======================================================== */}
            {scrollProgress >= 0.50 && scrollProgress < 0.75 && (
              <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 border border-emerald-500/40 backdrop-blur-xl space-y-5 animate-in fade-in duration-300 pointer-events-auto">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div>
                    <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider block mb-1">
                      Sequence 03 • clip3frame
                    </span>
                    <h3 className="text-2xl font-bold text-white">
                      Hypercharger Docking & Automated 800V Pre-Conditioning
                    </h3>
                  </div>
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                    ● 32.0°C Thermal Target Reached
                  </span>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                  Battery cells must reach optimal core temperature before connecting to high-voltage DC dispensers. SmartChargeAI automatically conditioned the battery pack on the descent, allowing maximum 350 kW intake immediately without thermal throttling.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
                  <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5">
                    <span className="text-[10px] text-slate-400 block uppercase">Deceleration</span>
                    <span className="text-2xl font-black text-white">{activeChapter.telemetry.speed}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5">
                    <span className="text-[10px] text-slate-400 block uppercase">Pre-Condition State</span>
                    <span className="text-2xl font-black text-emerald-400">32.0°C</span>
                  </div>
                  <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5">
                    <span className="text-[10px] text-slate-400 block uppercase">Reserved Stall</span>
                    <span className="text-xs font-bold text-brand-cyan truncate block mt-1">Bay 03 (350 kW)</span>
                    <span className="text-[10px] text-slate-400">CCS-2 Liquid Cooled</span>
                  </div>
                  <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5">
                    <span className="text-[10px] text-slate-400 block uppercase">Session Handshake</span>
                    <span className="text-xs font-bold text-white truncate block mt-1">ISO 15118-20</span>
                    <span className="text-[10px] text-emerald-400">Autocharge Ready</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-white/5">
                  <div className="flex items-center space-x-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Estimated charging dwell: 18 minutes (10% → 80%)</span>
                  </div>
                  <span className="text-emerald-400 font-bold">Scroll down to explode vehicle architecture in 3D ↓</span>
                </div>
              </div>
            )}

            {/* ========================================================
              STAGE 4: Chapter 04 3D Exploded Powertrain (Scroll: 75% - 100%)
             ======================================================== */}
            {scrollProgress >= 0.75 && (
              <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 border border-purple-500/40 backdrop-blur-xl space-y-5 animate-in fade-in duration-300 pointer-events-auto">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div>
                    <span className="text-xs font-mono text-purple-400 uppercase tracking-wider block mb-1">
                      Sequence 04 • flowframe (Scroll-Controlled Exploded View)
                    </span>
                    <h3 className="text-2xl font-bold text-white">
                      3D Exploded Powertrain & Energy Storage Architecture
                    </h3>
                  </div>
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 font-bold">
                    ● 800V Architecture Exposed
                  </span>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                  Scrolling advances the exploded view layer-by-layer; scrolling backwards reassembles the chassis. Inspect the 800V high-density battery pack, liquid-cooled CCS-2 inlet, dual silicon-carbide inverters, and SmartChargeAI BMS telemetry gateway.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
                  <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5">
                    <span className="text-[10px] text-slate-400 block uppercase">Battery Chemistry</span>
                    <span className="text-xl font-black text-brand-cyan">800V NMC</span>
                    <span className="text-[10px] text-slate-400 block">72.6 kWh Usable</span>
                  </div>
                  <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5">
                    <span className="text-[10px] text-slate-400 block uppercase">Peak DC Input</span>
                    <span className="text-xl font-black text-emerald-400">350 kW</span>
                    <span className="text-[10px] text-slate-400 block">Liquid-Cooled Pins</span>
                  </div>
                  <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5">
                    <span className="text-[10px] text-slate-400 block uppercase">BMS Telemetry</span>
                    <span className="text-xl font-black text-purple-400">1 Hz Sync</span>
                    <span className="text-[10px] text-slate-400 block">Cell Health & Temp</span>
                  </div>
                  <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5">
                    <span className="text-[10px] text-slate-400 block uppercase">E-Drive Inverter</span>
                    <span className="text-xl font-black text-white">SiC 97.2%</span>
                    <span className="text-[10px] text-slate-400 block">Silicon Carbide</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-white/5">
                  <div className="flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    <span>Reverse scroll reassembles the vehicle</span>
                  </div>
                  <button
                    onClick={() => setCurrentPage('discovery')}
                    className="px-4 py-2 rounded-xl bg-brand-cyan text-dark-950 font-bold hover:bg-brand-cyan/90 transition-all text-xs font-mono shadow-cyan-glow"
                  >
                    Explore Charging Stations →
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* BOTTOM TIMELINE TRACKER: 4 Chapters with Progress Indicator */}
          <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
            <div className="glass-panel p-3 rounded-2xl border border-white/10 backdrop-blur-md">
              <div className="grid grid-cols-4 gap-2">
                {CHAPTERS.map((ch, idx) => {
                  const isActive = activeChapterIdx === idx;
                  const isCompleted = activeChapterIdx > idx;

                  return (
                    <div key={ch.id} className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className={`truncate font-bold ${isActive ? 'text-brand-cyan' : isCompleted ? 'text-slate-300' : 'text-slate-500'}`}>
                          Ch 0{idx + 1}
                        </span>
                        <span className="text-slate-500 hidden sm:inline">
                          {ch.folder.split('/').pop()}
                        </span>
                      </div>
                      {/* Progress Bar Segment */}
                      <div className="h-1.5 w-full bg-dark-900 rounded-full overflow-hidden border border-white/5">
                        <div
                          className={`h-full transition-all duration-75 ${isActive
                              ? 'bg-gradient-to-r from-brand-cyan to-brand-blue'
                              : isCompleted
                                ? 'bg-slate-600'
                                : 'bg-transparent'
                            }`}
                          style={{
                            width: isCompleted
                              ? '100%'
                              : isActive
                                ? `${Math.min(100, Math.max(0, ((scrollProgress - ch.range[0]) / (ch.range[1] - ch.range[0])) * 100))}%`
                                : '0%'
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
    </section>
  );
}

