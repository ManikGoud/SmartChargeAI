import React, { useState, useRef } from 'react';
import { 
  Search, 
  ArrowRight, 
  Car, 
  MapPin, 
  Route, 
  BarChart3, 
  Bot, 
  Zap, 
  ChevronDown,
  Navigation,
  Activity
} from 'lucide-react';
import { ScrollCanvasBackground } from './ScrollCanvasBackground';
import { useVehicle } from '../context/VehicleContext';

export function ScrollHeroSection({ setCurrentPage, onSearch }) {
  const containerRef = useRef(null);
  const { activeVehicle, currentSoC, usableRangeKm } = useVehicle();
  const [query, setQuery] = useState('');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentFrameNum, setCurrentFrameNum] = useState(1);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(query);
    setCurrentPage('discovery');
  };

  const handleProgressChange = (progress, frame) => {
    setScrollProgress(progress);
    setCurrentFrameNum(frame);
  };

  // Phase calculation:
  // Phase 1 (0 to 45%): Hero Title, Search, CTA Buttons
  // Phase 2 (45% to 100%): Live Departure Telemetry HUD
  const isPhase1 = scrollProgress < 0.45;
  const phase1Opacity = Math.max(0, 1 - scrollProgress * 2.2);
  const phase2Opacity = Math.min(1, Math.max(0, (scrollProgress - 0.35) * 2.5));

  return (
    <section 
      ref={containerRef}
      className="relative w-full h-[280vh] bg-dark-950"
    >
      {/* Sticky 100vh Viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between">
        
        {/* Scroll-Controlled Background Canvas (clip1framezip: 200 frames) */}
        <ScrollCanvasBackground
          folderPath="/assets/frames/clip1"
          totalFrames={200}
          containerRef={containerRef}
          posterSrc="/assets/batman_be6.png"
          overlayClassName="bg-gradient-to-b from-dark-950/80 via-dark-950/65 to-dark-950/90"
          onProgressChange={handleProgressChange}
        />

        {/* Ambient Top Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-brand-cyan/10 blur-[140px] pointer-events-none"></div>

        {/* HUD Frame Indicator (Fixed subtle top-right badge) */}
        <div className="absolute top-20 right-6 z-20 hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-dark-900/80 border border-white/10 text-[11px] font-mono text-slate-300 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse"></span>
          <span>Scroll Sequence 01</span>
          <span className="text-slate-500">•</span>
          <span className="text-brand-cyan font-bold">Frame {currentFrameNum}/200</span>
        </div>

        {/* Content Container (Layered above canvas) */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 flex-1 flex flex-col justify-center">
          
          {/* STAGE A: Hero Search & Main Announcement (Fades smoothly as user scrolls) */}
          <div 
            className="text-center space-y-6 transition-all duration-300 pointer-events-auto"
            style={{ 
              opacity: phase1Opacity,
              transform: `translateY(-${scrollProgress * 40}px)`,
              display: scrollProgress > 0.65 ? 'none' : 'block'
            }}
          >
            {/* Pill announcement */}
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-mono bg-dark-900/80 border border-brand-cyan/30 text-slate-300 shadow-cyan-glow backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse"></span>
              <span>SmartChargeAI • Next-Gen EV Infrastructure Assistant</span>
              <span className="text-brand-cyan font-bold">2.0</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
              Intelligent EV Charging.{' '}
              <span className="bg-gradient-to-r from-brand-cyan via-slate-100 to-brand-blue bg-clip-text text-transparent">
                Engineered by AI.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
              Eliminate range anxiety and charging guesswork. SmartChargeAI matches your EV’s battery profile with optimal fast chargers, accurate session pricing, and dynamic journey planning.
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

            {/* Selected EV Context Bar */}
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

            {/* Quick CTA Links */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                onClick={() => setCurrentPage('discovery')}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 hover:border-brand-cyan/30 transition-all text-xs sm:text-sm"
              >
                <MapPin className="w-4 h-4 text-brand-cyan" />
                <span>Explore Station Map</span>
              </button>
              <button
                onClick={() => setCurrentPage('trips')}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 hover:border-brand-cyan/30 transition-all text-xs sm:text-sm"
              >
                <Route className="w-4 h-4 text-emerald-400" />
                <span>EV Trip Planner</span>
              </button>
              <button
                onClick={() => setCurrentPage('comparison')}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 hover:border-brand-cyan/30 transition-all text-xs sm:text-sm"
              >
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span>Cost Comparison</span>
              </button>
              <button
                onClick={() => setCurrentPage('assistant')}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-cyan/20 to-purple-500/20 border border-brand-cyan/40 text-brand-cyan font-semibold hover:bg-brand-cyan/20 transition-all text-xs sm:text-sm shadow-cyan-glow"
              >
                <Bot className="w-4 h-4 text-brand-cyan" />
                <span>AI Assistant</span>
              </button>
            </div>
          </div>

          {/* STAGE B: Scroll-Bound Urban Telemetry HUD (Illuminates as user scrolls) */}
          <div 
            className="w-full max-w-3xl mx-auto space-y-4 transition-all duration-300 pointer-events-auto"
            style={{ 
              opacity: phase2Opacity,
              transform: `translateY(${Math.max(0, (1 - scrollProgress) * 50)}px)`,
              display: scrollProgress < 0.25 ? 'none' : 'block'
            }}
          >
            <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 border border-brand-cyan/40 backdrop-blur-xl">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand-cyan/20 border border-brand-cyan/40 flex items-center justify-center text-brand-cyan">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Urban Departure & Kinetic Energy Recovery
                    </h3>
                    <p className="text-xs text-slate-400">Synchronized frame-by-frame with scroll velocity</p>
                  </div>
                </div>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  ● Telemetry Live
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono">
                <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5">
                  <span className="text-[10px] text-slate-400 block uppercase">Urban Speed</span>
                  <span className="text-2xl font-black text-white">{Math.round(20 + scrollProgress * 45)}</span>
                  <span className="text-[10px] text-slate-400"> km/h</span>
                </div>
                <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5">
                  <span className="text-[10px] text-slate-400 block uppercase">Regen Power</span>
                  <span className="text-2xl font-black text-emerald-400">+{Math.round(10 + scrollProgress * 22)}</span>
                  <span className="text-[10px] text-slate-400"> kW</span>
                </div>
                <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5">
                  <span className="text-[10px] text-slate-400 block uppercase">Battery Reserve</span>
                  <span className="text-2xl font-black text-brand-cyan">{currentSoC}%</span>
                  <span className="text-[10px] text-slate-400"> (~{usableRangeKm} km)</span>
                </div>
                <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5">
                  <span className="text-[10px] text-slate-400 block uppercase">Nearest FastHub</span>
                  <span className="text-2xl font-black text-purple-400">3.8</span>
                  <span className="text-[10px] text-slate-400"> km</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <Navigation className="w-3.5 h-3.5 text-brand-cyan" />
                  <span>Outbound corridor: Outer Ring Road (ORR) junction clear</span>
                </div>
                <span className="text-brand-cyan">Scroll to continue trip →</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Scroll Cue */}
        <div className="relative z-10 w-full pb-6 text-center text-slate-400 text-xs font-mono flex items-center justify-center space-x-2">
          <span>Scroll down to control vehicle animation</span>
          <ChevronDown className="w-4 h-4 text-brand-cyan animate-bounce" />
        </div>

      </div>
    </section>
  );
}

