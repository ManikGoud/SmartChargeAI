import { useState, useEffect, useRef } from 'react';
import { 
  Sliders, 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  Layers, 
  Cpu, 
  Video
} from 'lucide-react';
import { DemoDataBadge } from './Badge';

// 200 frames from flowframe
const TOTAL_FRAMES = 200;

// Hotspot definitions at different explosion milestones (0 to 100%)
const HOTSPOTS = [
  {
    id: 'battery',
    title: '800V High-Voltage Battery Pack',
    minPct: 35,
    x: 48, // % from left
    y: 62, // % from top
    category: 'Energy Storage',
    summary: 'Liquid-immersed NMC lithium-ion cells with 800V ultra-fast architecture. Optimized for 350 kW DC charging with active thermal management.',
    specs: [
      { label: 'Nominal Capacity', value: '72.6 kWh (usable)' },
      { label: 'Max Fast Charging', value: '350 kW DC (800V)' },
      { label: '10% to 80% Dwell', value: '18 minutes' },
      { label: 'Thermal Window', value: '25°C - 35°C (liquid cooled)' }
    ]
  },
  {
    id: 'charger',
    title: 'CCS-2 High-Power Charging Inlet',
    minPct: 20,
    x: 26,
    y: 52,
    category: 'Charging Interface',
    summary: 'Combined Charging System 2 connector with liquid-cooled pins, supporting bidirectional V2G power transfer and ISO 15118 Plug & Charge automation.',
    specs: [
      { label: 'Connector Standard', value: 'CCS-2 (Combined Type 2)' },
      { label: 'Continuous Current', value: '500A (liquid-cooled)' },
      { label: 'AC Charging', value: '11 kW / 22 kW 3-Phase' },
      { label: 'Protocol', value: 'ISO 15118-20 Plug & Charge' }
    ]
  },
  {
    id: 'bms',
    title: 'SmartChargeAI Onboard BMS Telemetry',
    minPct: 45,
    x: 68,
    y: 42,
    category: 'AI Gateway',
    summary: 'Edge telemetry controller communicating live State-of-Charge (SoC), State-of-Health (SoH), and cell temperature directly to our recommendation engine.',
    specs: [
      { label: 'Data Bus', value: 'CAN-FD / Telematics 5G' },
      { label: 'Refresh Rate', value: '1 Hz Live Cloud Sync' },
      { label: 'Optimization', value: 'AI Pre-conditioning Trigger' },
      { label: 'Cell Balancing', value: 'Active Matrix Balancing' }
    ]
  },
  {
    id: 'motor',
    title: 'Dual Permanent Magnet E-Drive',
    minPct: 55,
    x: 78,
    y: 68,
    category: 'Powertrain',
    summary: 'High-efficiency silicon-carbide (SiC) inverter driving dual permanent-magnet motors with regenerative deceleration capturing up to 225 kW.',
    specs: [
      { label: 'Regen Capacity', value: 'Up to 225 kW' },
      { label: 'Energy Recovery', value: '~28% in urban traffic' },
      { label: 'Inverter Type', value: 'Silicon Carbide (SiC) 800V' },
      { label: 'Efficiency', value: '97.2% peak' }
    ]
  }
];

export function ExplodedViewSection() {
  const canvasRef = useRef(/** @type {HTMLCanvasElement | null} */ (null));
  const imagesRef = useRef(/** @type {HTMLImageElement[]} */ ([]));
  const [currentFrame, setCurrentFrame] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 2x
  const [loadProgress, setLoadProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState(HOTSPOTS[0]);
  const [mode, setMode] = useState('canvas'); // 'canvas' | 'video'
  const animFrameIdRef = useRef(/** @type {number | null} */ (null));
  const isReverseRef = useRef(false);

  // Progressive frame loading
  useEffect(() => {
    let mounted = true;
    const images = /** @type {HTMLImageElement[]} */ ([]);
    let loadedCount = 0;

    // Helper to format frame path: /assets/frames/flow/ezgif-frame-001.jpg
    const getFrameUrl = (/** @type {number} */ idx) => {
      const padded = String(idx).padStart(3, '0');
      return `/assets/frames/flow/ezgif-frame-${padded}.jpg`;
    };

    // Preload keyframes first (every 5th frame for fast responsiveness), then fill in
    const loadBatch = () => {
      for (let i = 1; i <= TOTAL_FRAMES; i++) {
        const img = new Image();
        img.src = getFrameUrl(i);
        img.onload = () => {
          if (!mounted) return;
          loadedCount++;
          setLoadProgress(Math.min(100, Math.round((loadedCount / TOTAL_FRAMES) * 100)));
          if (loadedCount >= 20) {
            setIsLoaded(true); // ready for interactive scrubbing early
          }
        };
        images[i] = img;
      }
      imagesRef.current = images;
    };

    loadBatch();

    return () => {
      mounted = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, []);

  // Render current frame to canvas
  useEffect(() => {
    if (mode !== 'canvas') return;
    const canvas = /** @type {HTMLCanvasElement | null} */ (canvasRef.current);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = imagesRef.current[currentFrame];

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
  }, [currentFrame, mode, isLoaded]);

  // Autoplay loop
  useEffect(() => {
    if (!isPlaying || mode !== 'canvas') {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      return;
    }

    let lastTime = performance.now();
    const interval = 1000 / (25 * playbackSpeed); // 25 fps base

    const loop = (/** @type {number} */ time) => {
      if (time - lastTime >= interval) {
        lastTime = time;
        setCurrentFrame((prev) => {
          if (!isReverseRef.current) {
            if (prev >= TOTAL_FRAMES) {
              isReverseRef.current = true;
              return prev - 1;
            }
            return prev + 1;
          } else {
            if (prev <= 1) {
              isReverseRef.current = false;
              return 2;
            }
            return prev - 1;
          }
        });
      }
      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isPlaying, playbackSpeed, mode]);

  const explosionPct = Math.round(((currentFrame - 1) / (TOTAL_FRAMES - 1)) * 100);

  const handleSliderChange = (/** @type {React.ChangeEvent<HTMLInputElement>} */ e) => {
    setIsPlaying(false);
    setCurrentFrame(Number(e.target.value));
  };

  const handleQuickExplode = (/** @type {number} */ pct) => {
    setIsPlaying(false);
    const target = Math.max(1, Math.min(TOTAL_FRAMES, Math.round((pct / 100) * (TOTAL_FRAMES - 1)) + 1));
    setCurrentFrame(target);
  };

  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Background glow orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-brand-cyan/5 blur-[160px] pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 gap-4 relative z-10">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono bg-dark-900 border border-brand-cyan/30 text-brand-cyan mb-3">
            <Layers className="w-3.5 h-3.5" />
            <span>Interactive 3D Architectural Exploder</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">200 High-Resolution Frames</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Inside the Electric Powertrain & Battery Architecture
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl mt-1.5 leading-relaxed">
            Scrub through the vehicle assembly to inspect how 800V battery design, thermal cooling channels, and bidirectional CCS-2 ports enable lightning-fast charging.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <DemoDataBadge />
          {/* Mode Switcher */}
          <div className="inline-flex items-center p-1 rounded-xl bg-dark-900/90 border border-white/10 text-xs font-mono">
            <button
              onClick={() => setMode('canvas')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                mode === 'canvas' ? 'bg-brand-cyan text-dark-950 font-bold shadow-cyan-glow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Interactive Scrub</span>
            </button>
            <button
              onClick={() => setMode('video')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                mode === 'video' ? 'bg-brand-cyan text-dark-950 font-bold shadow-cyan-glow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>1080p MP4 Loop</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="glass-panel-glow rounded-3xl border border-white/10 overflow-hidden relative shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          
          {/* Visual Viewport (8 Cols) */}
          <div className="lg:col-span-8 relative bg-dark-950 flex flex-col items-center justify-center p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-white/10 min-h-[380px] sm:min-h-[480px]">
            
            {/* Loading Overlay */}
            {mode === 'canvas' && loadProgress < 100 && (
              <div className="absolute top-4 right-4 z-20 flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-dark-900/90 border border-brand-cyan/20 text-[11px] font-mono text-slate-300 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse"></span>
                <span>Caching Frames: {loadProgress}%</span>
              </div>
            )}

            {/* Frame Canvas Display */}
            {mode === 'canvas' ? (
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/5 bg-black/60 shadow-inner flex items-center justify-center group">
                <canvas
                  ref={canvasRef}
                  width={1280}
                  height={720}
                  className="w-full h-full object-contain cursor-ew-resize select-none"
                  onMouseDown={() => setIsPlaying(false)}
                />

                {/* Hotspot Pins Overlay (visible when exploded > 20%) */}
                {HOTSPOTS.map((hs) => {
                  const isVisible = explosionPct >= hs.minPct;
                  const isSelected = activeHotspot.id === hs.id;
                  if (!isVisible) return null;

                  return (
                    <button
                      key={hs.id}
                      onClick={() => setActiveHotspot(hs)}
                      style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 group/pin z-20 transition-all duration-300 ${
                        isSelected ? 'scale-125' : 'hover:scale-110'
                      }`}
                    >
                      <div className="relative flex items-center justify-center">
                        <span className={`absolute w-8 h-8 rounded-full animate-ping opacity-60 ${
                          isSelected ? 'bg-brand-cyan' : 'bg-brand-blue'
                        }`}></span>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-lg transition-colors ${
                          isSelected 
                            ? 'bg-brand-cyan border-white text-dark-950 font-bold' 
                            : 'bg-dark-900/90 border-brand-cyan text-brand-cyan hover:bg-brand-cyan hover:text-dark-950'
                        }`}>
                          <Zap className="w-3 h-3" />
                        </div>
                        {/* Tooltip badge */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden group-hover/pin:flex items-center px-2.5 py-1 rounded-md bg-dark-950/95 border border-brand-cyan/40 text-[10px] font-mono text-white whitespace-nowrap shadow-2xl pointer-events-none">
                          {hs.title}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Explosion Level HUD Indicator */}
                <div className="absolute top-4 left-4 flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-dark-900/80 backdrop-blur-md border border-white/10 text-xs font-mono text-slate-300">
                  <span className="text-slate-500">Stage:</span>
                  <span className="text-brand-cyan font-bold">{explosionPct}% Exploded</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-400">Frame {currentFrame}/{TOTAL_FRAMES}</span>
                </div>
              </div>
            ) : (
              /* Fallback / Video Mode */
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/5 bg-black/60 shadow-inner flex items-center justify-center">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source src="/assets/flow.mp4" type="video/mp4" />
                </video>
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-dark-900/80 backdrop-blur-md border border-white/10 text-xs font-mono text-emerald-400">
                  ● H.264 Cinema Stream (flow.mp4)
                </div>
              </div>
            )}

            {/* Interactive Timeline & Scrubber Bar (Only in Canvas mode) */}
            {mode === 'canvas' && (
              <div className="w-full mt-4 space-y-3">
                <div className="flex items-center space-x-4">
                  {/* Play/Pause Button */}
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="shrink-0 w-10 h-10 rounded-xl bg-brand-cyan text-dark-950 flex items-center justify-center font-bold hover:bg-brand-cyan/90 transition-all shadow-cyan-glow"
                    title={isPlaying ? 'Pause' : 'Auto Explode / Assemble'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-dark-950" /> : <Play className="w-4 h-4 fill-dark-950 ml-0.5" />}
                  </button>

                  {/* Reset to 0% */}
                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentFrame(1);
                    }}
                    className="shrink-0 p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                    title="Reset to Assembled View"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* Range Slider */}
                  <div className="flex-1 relative flex items-center">
                    <input
                      type="range"
                      min={1}
                      max={TOTAL_FRAMES}
                      value={currentFrame}
                      onChange={handleSliderChange}
                      className="w-full h-2 bg-dark-900 rounded-lg appearance-none cursor-pointer accent-brand-cyan focus:outline-none"
                    />
                  </div>

                  {/* Speed Selector */}
                  <button
                    onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 2 : 1)}
                    className="shrink-0 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-slate-300 hover:text-brand-cyan transition-all"
                  >
                    {playbackSpeed}x Speed
                  </button>
                </div>

                {/* Quick Stage Markers */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 px-1">
                  <button onClick={() => handleQuickExplode(0)} className="hover:text-brand-cyan">0% Assembled</button>
                  <button onClick={() => handleQuickExplode(35)} className="hover:text-brand-cyan">35% Pack Reveal</button>
                  <button onClick={() => handleQuickExplode(65)} className="hover:text-brand-cyan">65% Cell Isolation</button>
                  <button onClick={() => handleQuickExplode(100)} className="hover:text-brand-cyan">100% Full Explode</button>
                </div>
              </div>
            )}
          </div>

          {/* Component Deep-Dive Inspector (4 Cols) */}
          <div className="lg:col-span-4 p-6 sm:p-8 flex flex-col justify-between bg-dark-900/40">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-brand-cyan" />
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    Component Telemetry
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan">
                  {activeHotspot.category}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                {activeHotspot.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                {activeHotspot.summary}
              </p>

              {/* Technical Specifications Matrix */}
              <div className="space-y-2 mb-6">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold block mb-2">
                  Hardware Specifications
                </span>
                {activeHotspot.specs.map((spec, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-2.5 rounded-xl bg-dark-950/60 border border-white/5 text-xs font-mono"
                  >
                    <span className="text-slate-400">{spec.label}</span>
                    <span className="text-white font-semibold">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Hotspot Buttons */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-2">
                Select Subsystem to Inspect:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {HOTSPOTS.map((hs) => (
                  <button
                    key={hs.id}
                    onClick={() => {
                      setActiveHotspot(hs);
                      handleQuickExplode(hs.minPct + 10);
                    }}
                    className={`px-3 py-2 rounded-xl text-left text-xs font-mono transition-all border ${
                      activeHotspot.id === hs.id
                        ? 'bg-brand-cyan/15 border-brand-cyan text-brand-cyan font-bold'
                        : 'bg-dark-950/60 border-white/5 text-slate-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <div className="truncate">{hs.title.split(' ')[0]} {hs.title.split(' ')[1]}</div>
                    <div className="text-[10px] text-slate-500">Stage: {hs.minPct}%+</div>
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}

