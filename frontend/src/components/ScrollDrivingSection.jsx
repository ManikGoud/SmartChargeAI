import React, { useState, useRef } from 'react';
import { 
  Gauge, 
  BatteryCharging, 
  Navigation, 
  Zap, 
  ShieldCheck, 
  Activity, 
  Wind, 
  Compass, 
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { ScrollCanvasBackground } from './ScrollCanvasBackground';
import { DemoDataBadge } from './Badge';

export function ScrollDrivingSection() {
  const containerRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentFrameNum, setCurrentFrameNum] = useState(1);

  // We split the container into 2 halves:
  // 0.0 - 0.5: Sequence 02 (clip2frame: Highway Cruising)
  // 0.5 - 1.0: Sequence 03 (clip3frame: Hypercharger Approach)
  const isSequence2 = scrollProgress < 0.5;
  const currentSequenceId = isSequence2 ? 'clip2' : 'clip3';
  const sequenceProgress = isSequence2 ? (scrollProgress / 0.5) : ((scrollProgress - 0.5) / 0.5);

  const handleProgressChange = (progress, frame) => {
    setScrollProgress(progress);
    setCurrentFrameNum(frame);
  };

  return (
    <section 
      ref={containerRef}
      className="relative w-full h-[320vh] bg-dark-950"
    >
      {/* Sticky 100vh Viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between">
        
        {/* Sequence 2 Canvas (clip2frame: 0% to 50% scroll) */}
        <div 
          className="absolute inset-0 transition-opacity duration-500"
          style={{ opacity: isSequence2 ? 1 : 0 }}
        >
          <ScrollCanvasBackground
            folderPath="/assets/frames/clip2"
            totalFrames={200}
            containerRef={containerRef}
            posterSrc="/assets/shot1.png"
            overlayClassName="bg-gradient-to-b from-dark-950/85 via-dark-950/65 to-dark-950/90"
            active={isSequence2}
            onProgressChange={isSequence2 ? handleProgressChange : null}
          />
        </div>

        {/* Sequence 3 Canvas (clip3frame: 50% to 100% scroll) */}
        <div 
          className="absolute inset-0 transition-opacity duration-500"
          style={{ opacity: !isSequence2 ? 1 : 0 }}
        >
          <ScrollCanvasBackground
            folderPath="/assets/frames/clip3"
            totalFrames={200}
            containerRef={containerRef}
            posterSrc="/assets/shot2.png"
            overlayClassName="bg-gradient-to-b from-dark-950/85 via-dark-950/65 to-dark-950/90"
            active={!isSequence2}
            onProgressChange={!isSequence2 ? handleProgressChange : null}
          />
        </div>

        {/* Top Header & Telemetry Pill */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono bg-dark-900/80 border border-brand-cyan/30 text-brand-cyan backdrop-blur-md">
              <Activity className="w-3.5 h-3.5" />
              <span>Scroll-Controlled Highway Corridor Dynamics</span>
              <span className="text-slate-500">•</span>
              <span className="text-white font-bold">
                {isSequence2 ? 'Take 02 (clip2frame)' : 'Take 03 (clip3frame)'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <DemoDataBadge />
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-dark-900/80 border border-white/10 text-xs font-mono text-slate-300 backdrop-blur-md">
              <span>Sync: <strong className="text-brand-cyan">{Math.round(scrollProgress * 100)}%</strong></span>
              <span className="text-slate-600">|</span>
              <span>Frame: <strong className="text-white">{currentFrameNum}/200</strong></span>
            </div>
          </div>
        </div>

        {/* Main Content Area (Layered above canvas) */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col justify-center">
          
          {/* Phase 1: Highway Corridor Cruising (0% - 50% scroll) */}
          {isSequence2 ? (
            <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 border border-brand-cyan/30 backdrop-blur-xl space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-white/10 gap-2">
                <div>
                  <div className="text-xs font-mono text-brand-cyan uppercase tracking-wider mb-1 flex items-center space-x-1.5">
                    <Wind className="w-4 h-4" />
                    <span>Phase 1 of 2: Aerodynamic Range Preservation</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                    High-Speed Expressway Cruising on NH65
                  </h3>
                </div>
                <div className="text-right font-mono text-xs text-slate-400">
                  <span>Speed: <strong className="text-white text-base">118 km/h</strong></span>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                As vehicle cruising speed increases, aerodynamic drag scales exponentially. SmartChargeAI continuously evaluates highway elevation changes, wind vectors, and cabin HVAC draw to guarantee you reach the next ultra-fast charger with at least 20% SoC buffer.
              </p>

              {/* Dynamic HUD Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
                <div className="p-3.5 rounded-2xl bg-dark-950/80 border border-white/5">
                  <span className="text-slate-400 text-[10px] block uppercase">Corridor Power Draw</span>
                  <span className="text-2xl font-black text-brand-cyan">42.1</span>
                  <span className="text-[10px] text-slate-400"> kW Draw</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-dark-950/80 border border-white/5">
                  <span className="text-slate-400 text-[10px] block uppercase">Battery Level</span>
                  <span className="text-2xl font-black text-emerald-400">54%</span>
                  <span className="text-[10px] text-slate-400"> (~248 km range)</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-dark-950/80 border border-white/5">
                  <span className="text-slate-400 text-[10px] block uppercase">Motor Angular Rate</span>
                  <span className="text-2xl font-black text-white">10,400</span>
                  <span className="text-[10px] text-slate-400"> RPM</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-dark-950/80 border border-white/5">
                  <span className="text-slate-400 text-[10px] block uppercase">Next Planned Stop</span>
                  <span className="text-sm font-bold text-brand-cyan block truncate mt-1">Suryapet MegaHub</span>
                  <span className="text-[10px] text-slate-400">62 km ahead (Locked)</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-white/5">
                <span className="flex items-center space-x-1.5">
                  <Navigation className="w-3.5 h-3.5 text-brand-cyan" />
                  <span>Scroll down to approach the hypercharger plaza →</span>
                </span>
                <span className="text-brand-cyan font-bold">{Math.round(sequenceProgress * 100)}% through Corridor</span>
              </div>
            </div>
          ) : (
            /* Phase 2: Hypercharger Approach & Thermal Pre-conditioning (50% - 100% scroll) */
            <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 border border-emerald-500/30 backdrop-blur-xl space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-white/10 gap-2">
                <div>
                  <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
                    <Zap className="w-4 h-4" />
                    <span>Phase 2 of 2: Automated 800V Thermal Pre-Conditioning</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                    Approaching 350 kW Liquid-Cooled Plaza
                  </h3>
                </div>
                <div className="text-right font-mono text-xs text-slate-400">
                  <span>Target: <strong className="text-emerald-400 text-base">32.0°C</strong> Cell Temp</span>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                Cold or overheated lithium-ion batteries cannot accept peak DC charging power. By synchronizing with your arrival schedule, SmartChargeAI triggers thermal pre-conditioning so your battery pack absorbs 350 kW immediately upon plug-in, cutting total charging dwell by up to 14 minutes.
              </p>

              {/* Dynamic HUD Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
                <div className="p-3.5 rounded-2xl bg-dark-950/80 border border-white/5">
                  <span className="text-slate-400 text-[10px] block uppercase">Approach Velocity</span>
                  <span className="text-2xl font-black text-white">35</span>
                  <span className="text-[10px] text-slate-400"> km/h Decel</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-dark-950/80 border border-white/5">
                  <span className="text-slate-400 text-[10px] block uppercase">Arrival Battery SoC</span>
                  <span className="text-2xl font-black text-amber-400">22%</span>
                  <span className="text-[10px] text-slate-400"> (Ideal 10-80% window)</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-dark-950/80 border border-white/5">
                  <span className="text-slate-400 text-[10px] block uppercase">Thermal Conditioning</span>
                  <span className="text-2xl font-black text-emerald-400">32.0°C</span>
                  <span className="text-[10px] text-slate-400"> Optimal Liquid Thermal</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-dark-950/80 border border-white/5">
                  <span className="text-slate-400 text-[10px] block uppercase">Assigned Stall</span>
                  <span className="text-sm font-bold text-emerald-400 block truncate mt-1">Bay 03 (350 kW)</span>
                  <span className="text-[10px] text-slate-400">ISO 15118 Autocharge</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-white/5">
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ready to dock at high-power DC dispenser</span>
                </span>
                <span className="text-emerald-400 font-bold">{Math.round(sequenceProgress * 100)}% Approach Complete</span>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Scroll Cue */}
        <div className="relative z-10 w-full pb-6 text-center text-slate-400 text-xs font-mono flex items-center justify-center space-x-2">
          <span>Scroll to advance / reverse cinematic sequence</span>
          <ChevronDown className="w-4 h-4 text-brand-cyan animate-bounce" />
        </div>

      </div>
    </section>
  );
}

