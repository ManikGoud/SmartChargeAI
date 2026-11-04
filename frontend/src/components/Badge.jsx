import React from 'react';
import clsx from 'clsx';

export function Badge({ children, variant = 'default', size = 'sm', className = '' }) {
  const base = "inline-flex items-center font-mono font-medium rounded-full transition-colors";
  
  const sizes = {
    xs: "px-2 py-0.5 text-[10px]",
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-xs font-semibold",
  };

  const variants = {
    default: "bg-white/5 text-slate-300 border border-white/10",
    cyan: "bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30 shadow-[0_0_12px_rgba(0,240,255,0.15)]",
    blue: "bg-brand-blue/10 text-brand-blue border border-brand-blue/30",
    green: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
    amber: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
    red: "bg-rose-500/10 text-rose-400 border border-rose-500/30",
    demo: "bg-purple-500/10 text-purple-300 border border-purple-500/30 tracking-wider uppercase text-[10px]",
    subtle: "bg-dark-850 text-slate-400 border border-white/5",
  };

  return (
    <span className={clsx(base, sizes[size], variants[variant], className)}>
      {children}
    </span>
  );
}

export function DemoDataBadge({ className = '' }) {
  return (
    <span className={clsx("inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase bg-purple-500/10 text-purple-300 border border-purple-500/30", className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
      <span>DEMO DATA</span>
    </span>
  );
}

