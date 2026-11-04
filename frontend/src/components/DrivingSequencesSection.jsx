import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Gauge, 
  BatteryCharging, 
  Navigation, 
  Zap, 
  ShieldCheck, 
  Sliders, 
  Video, 
  Compass, 
  Maximize2,
  ChevronRight,
  TrendingDown,
  Activity
} from 'lucide-react';
import { DemoDataBadge } from './Badge';

const TOTAL_FRAMES = 200;

const DRIVING_SCENARIOS = [
  {
    id: 'take1',
    title: 'Scenario 1: Urban Energy Recovery & Smart Departure',
    subtitle: 'Kinetic Regeneration in City Traffic',
    videoSrc: '/assets/take%201.mp4',
    frameFolder: '/assets/frames/clip1',
    description: 'BMS actively harnesses deceleration energy through dual-motor regenerative braking, capturing +32 kW while calculating lowest-cost charging plaza along the departure corridor.',
    telemetry: {
      speedKmh: 54,
      powerKw: -28.4, // regen
      powerLabel: 'Regenerative Braking',
      socPct: 84,
      rangeKm: 382,
      bmsTempC: 28.5,
      motorRpm: 4850,
      navGoal: 'Outbound to Outer Ring Road (ORR)',
      nextWaypoint: 'Zeon FastHub Gachibowli (4.2 km)'
    }
  },
  {
    id: 'take2',
    title: 'Scenario 2: Highway Corridor High-Speed Cruising',
    subtitle: 'Aerodynamic Efficiency & Range Preservation',
    videoSrc: '/assets/take%202.mp4',
    frameFolder: '/assets/frames/clip2',
    description: 'Vehicle cruises at 118 km/h on NH65. Real-time wind and elevation telematics adjust estimated arrival SoC to prevent range anxiety before reaching the midway plaza.',
    telemetry: {
      speedKmh: 118,
      powerKw: 42.1,
      powerLabel: 'Corridor Cruising Draw',
      socPct: 56,
      rangeKm: 248,
      bmsTempC: 31.2,
      motorRpm: 10400,
      navGoal: 'Hyderabad → Vijayawada Expressway',
      nextWaypoint: 'Tata Power Mega Plaza Suryapet (62 km)'
    }
  },
  {
    id: 'take3',
    title: 'Scenario 3: Hypercharger Approach & Pre-conditioning',
    subtitle: 'Automated 800V Thermal Conditioning',
    videoSrc: '/assets/take%203.mp4',
    frameFolder: '/assets/frames/clip3',
    description: 'As the EV nears the 350 kW liquid-cooled charging plaza, the thermal management system heats/cools cells to optimal 32°C for peak charging speed acceptance.',
    telemetry: {
      speedKmh: 35,
      powerKw: 12.0,
      powerLabel: 'Station Deceleration & HVAC Pre-heat',
      socPct: 22,
      rangeKm: 98,
      bmsTempC: 32.0,
      motorRpm: 3100,
      navGoal: 'Entering Jio-bp Pulse Hypercharger Hub',
      nextWaypoint: 'Bay 03 (350 kW CCS-2 Reserved)'
    }
  }
];

export function DrivingSequencesSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeScenario = DRIVING_SCENARIOS[activeIdx];

  // Playback States
  const [playbackMode, setPlaybackMode] = useState('video'); // 'video' | 'scrub'
  const [isPlaying, setIsPlaying] = useState(true);
  const [scrubFrame, setScrubFrame] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [hudVisible, setHudVisible] = useState(true);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scrubImagesRef = useRef({});
  const animFrameRef = useRef(null);

  // Restart video when active tab changes with safe autoplay handling
  useEffect(() => {
    const video = videoRef.current;
    if (video && playbackMode === 'video') {
      video.defaultMuted = true;
      video.muted = true;
      video.playsInline = true;
      video.currentTime = 0;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Playback error, retrying muted...', err);
            video.muted = true;
            video.play().then(() => setIsPlaying(true)).catch(() => {});
          });
      }
    }
    setScrubFrame(1);
  }, [activeIdx, playbackMode]);

  // Handle Scrub Frame Canvas Rendering
  useEffect(() => {
    if (playbackMode !== 'scrub') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Load frame on demand
    const padded = String(scrubFrame).padStart(3, '0');
    const url = `${activeScenario.frameFolder}/ezgif-frame-${padded}.jpg`;

    const img = new Image();
    img.src = url;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
  }, [scrubFrame, activeScenario, playbackMode]);

  const togglePlay = () => {
    if (playbackMode === 'video' && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Background glow orb */}
      <div className="absolute top-1/3 -left-40 w-96 h-96 bg-brand-blue/10 blur-[150px] pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono bg-dark-900 border border-brand-cyan/30 text-brand-cyan mb-3">
            <Activity className="w-3.5 h-3.5 text-brand-cyan" />
            <span>Cinematic Vehicle Telemetry Feeds</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">Takes 1, 2 & 3 Integrated</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Real-Time Driving Dynamics & Range Intelligence
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl mt-1.5 leading-relaxed">
            Experience how SmartChargeAI interfaces with vehicle telemetry across urban commuting, high-speed corridor travel, and hypercharger pre-conditioning.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <DemoDataBadge />
          {/* Stream vs Scrub Mode Switch */}
          <div className="inline-flex items-center p-1 rounded-xl bg-dark-900/90 border border-white/10 text-xs font-mono">
            <button
              onClick={() => {
                setPlaybackMode('video');
                setIsPlaying(true);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                playbackMode === 'video' ? 'bg-brand-cyan text-dark-950 font-bold shadow-cyan-glow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Cinema Stream</span>
            </button>
            <button
              onClick={() => {
                setPlaybackMode('scrub');
                setIsPlaying(false);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                playbackMode === 'scrub' ? 'bg-brand-cyan text-dark-950 font-bold shadow-cyan-glow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Frame Scrubber</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scenario Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {DRIVING_SCENARIOS.map((scen, idx) => (
          <button
            key={scen.id}
            onClick={() => setActiveIdx(idx)}
            className={`p-4 rounded-2xl text-left border transition-all relative overflow-hidden group ${
              activeIdx === idx 
                ? 'bg-dark-900/90 border-brand-cyan shadow-cyan-glow' 
                : 'bg-dark-950/60 border-white/5 hover:border-white/20 hover:bg-dark-900/40'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                activeIdx === idx 
                  ? 'bg-brand-cyan text-dark-950' 
                  : 'bg-white/5 text-slate-400'
              }`}>
                Take 0{idx + 1}
              </span>
              <span className="text-xs font-mono text-slate-500">
                {scen.telemetry.speedKmh} km/h • {scen.telemetry.socPct}% SoC
              </span>
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-brand-cyan transition-colors line-clamp-1">
              {scen.title.split(': ')[1]}
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
              {scen.subtitle}
            </p>
          </button>
        ))}
      </div>

      {/* Cinema / Scrubber Stage with Live HUD */}
      <div className="glass-panel-glow rounded-3xl border border-white/10 overflow-hidden relative shadow-2xl">
        <div className="relative w-full aspect-video sm:min-h-[480px] bg-black flex items-center justify-center">
          
          {/* Mode A: Video Stream */}
          {playbackMode === 'video' ? (
            <video
              ref={videoRef}
              key={activeScenario.videoSrc}
              src={activeScenario.videoSrc}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="w-full h-full object-cover"
            />
          ) : (
            /* Mode B: Canvas Frame Scrubber */
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              className="w-full h-full object-contain cursor-ew-resize"
            />
          )}

          {/* HUD Overlay (Can be toggled) */}
          {hudVisible && (
            <div className="absolute inset-0 pointer-events-none p-4 sm:p-6 flex flex-col justify-between">
              
              {/* HUD Top Bar: Mission & Telemetry Status */}
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-2xl bg-dark-950/80 backdrop-blur-md border border-white/10 text-xs font-mono max-w-sm pointer-events-auto">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-white font-bold">{activeScenario.title.split(': ')[1]}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <Navigation className="w-3 h-3 text-brand-cyan shrink-0" />
                    <span className="truncate">{activeScenario.telemetry.navGoal}</span>
                  </div>
                  <div className="text-[10px] text-brand-cyan mt-1 font-semibold flex items-center space-x-1">
                    <Zap className="w-3 h-3" />
                    <span>Next Hub: {activeScenario.telemetry.nextWaypoint}</span>
                  </div>
                </div>

                {/* Battery & Thermal Badge */}
                <div className="p-3 rounded-2xl bg-dark-950/80 backdrop-blur-md border border-white/10 text-right pointer-events-auto space-y-1 font-mono">
                  <div className="text-xl sm:text-2xl font-extrabold text-brand-cyan tracking-tight">
                    {activeScenario.telemetry.socPct}% <span className="text-xs text-slate-400 font-normal">SoC</span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    ~{activeScenario.telemetry.rangeKm} km Range
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Pack Temp: <span className="text-emerald-400 font-bold">{activeScenario.telemetry.bmsTempC}°C</span>
                  </div>
                </div>
              </div>

              {/* HUD Bottom Gauges & Telemetry Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pointer-events-auto">
                <div className="p-3 rounded-xl bg-dark-950/80 backdrop-blur-md border border-white/10 font-mono">
                  <span className="text-[10px] uppercase text-slate-400 block">Cruising Velocity</span>
                  <div className="text-lg sm:text-xl font-bold text-white flex items-baseline space-x-1">
                    <span>{activeScenario.telemetry.speedKmh}</span>
                    <span className="text-xs text-slate-400">km/h</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-dark-950/80 backdrop-blur-md border border-white/10 font-mono">
                  <span className="text-[10px] uppercase text-slate-400 block">Power Balance</span>
                  <div className={`text-lg sm:text-xl font-bold flex items-baseline space-x-1 ${
                    activeScenario.telemetry.powerKw < 0 ? 'text-emerald-400' : 'text-brand-cyan'
                  }`}>
                    <span>{activeScenario.telemetry.powerKw > 0 ? `+${activeScenario.telemetry.powerKw}` : activeScenario.telemetry.powerKw}</span>
                    <span className="text-xs text-slate-400">kW</span>
                  </div>
                  <span className="text-[9px] text-slate-400 truncate block">{activeScenario.telemetry.powerLabel}</span>
                </div>

                <div className="p-3 rounded-xl bg-dark-950/80 backdrop-blur-md border border-white/10 font-mono">
                  <span className="text-[10px] uppercase text-slate-400 block">E-Motor Speed</span>
                  <div className="text-lg sm:text-xl font-bold text-white flex items-baseline space-x-1">
                    <span>{activeScenario.telemetry.motorRpm.toLocaleString()}</span>
                    <span className="text-xs text-slate-400">RPM</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-dark-950/80 backdrop-blur-md border border-white/10 font-mono flex flex-col justify-between">
                  <span className="text-[10px] uppercase text-slate-400">AI Routing Status</span>
                  <div className="text-xs font-bold text-brand-cyan flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-cyan" />
                    <span>Corridor Guard Active</span>
                  </div>
                  <span className="text-[9px] text-slate-400">Buffer arrival ≥ 20%</span>
                </div>
              </div>

            </div>
          )}

          {/* Quick HUD Visibility Toggle */}
          <button
            onClick={() => setHudVisible(!hudVisible)}
            className="absolute top-4 right-4 z-20 px-2.5 py-1 rounded-lg bg-dark-900/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300 hover:text-brand-cyan transition-all"
          >
            {hudVisible ? 'Hide HUD' : 'Show HUD Telemetry'}
          </button>
        </div>

        {/* Scrubber Controls (When in Frame Scrubber Mode) */}
        {playbackMode === 'scrub' && (
          <div className="p-4 sm:p-6 bg-dark-950 border-t border-white/10 space-y-3">
            <div className="flex items-center space-x-4">
              <span className="text-xs font-mono text-slate-400 shrink-0">
                Frame {scrubFrame} / {TOTAL_FRAMES}
              </span>
              <input
                type="range"
                min={1}
                max={TOTAL_FRAMES}
                value={scrubFrame}
                onChange={(e) => setScrubFrame(Number(e.target.value))}
                className="w-full h-2 bg-dark-900 rounded-lg appearance-none cursor-pointer accent-brand-cyan focus:outline-none"
              />
              <button
                onClick={() => setScrubFrame(1)}
                className="shrink-0 p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white"
                title="Reset to Start"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Narrative Description Banner */}
        <div className="p-4 sm:p-6 bg-dark-900/60 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
            <strong className="text-white font-semibold">{activeScenario.title}: </strong> 
            {activeScenario.description}
          </p>
          <div className="inline-flex items-center space-x-2 text-[11px] font-mono text-brand-cyan shrink-0">
            <span>Integrated Asset: {activeScenario.videoSrc.split('/').pop()}</span>
            <span>•</span>
            <span>200 Frames</span>
          </div>
        </div>

      </div>
    </section>
  );
}

