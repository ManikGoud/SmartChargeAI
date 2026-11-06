import React, { useState, useEffect } from 'react';
import {
  Zap,
  User,
  Building2,
  ShieldAlert,
  KeyRound,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * LoginPage
 * SmartChargeAI Authentication Page
 * Features full-screen 'login page.png' background (100vw x 100vh)
 * with a modern, vertically centered, left-aligned translucent glass login panel.
 * Supports switchable Customer (Green), Station Owner (Cyan), and Admin (Gold) RBAC modules.
 *
 * @param {{
 *   onNavigate: (path: string) => void;
 * }} props
 */
export function LoginPage({ onNavigate }) {
  const {
    user,
    role,
    isAuthenticated,
    login,
    loginWithGoogle,
    loading
  } = useAuth();

  const [activeTab, setActiveTab] = useState('customer'); // 'customer' | 'station_owner' | 'admin'
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // If already authenticated, redirect to their role's dashboard immediately
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'station_owner') {
        onNavigate('/owner/dashboard');
      } else if (user.role === 'admin') {
        onNavigate('/admin/dashboard');
      } else {
        onNavigate('/customer/home');
      }
    }
  }, [isAuthenticated, user, onNavigate]);

  // Reset inputs when switching tabs
  useEffect(() => {
    setErrorMsg('');
    setSuccessMsg('');
    setUserId('');
    setPassword('');
  }, [activeTab]);

  const roleMeta = {
    customer: {
      roleKey: 'customer',
      title: 'EV Customer Portal',
      subtitle: 'Driver intelligence, vehicle telemetry & smart routing',
      idLabel: 'Customer ID',
      idPlaceholder: 'e.g. CUST-1001',
      demoId: 'CUST-1001',
      demoPass: 'SmartCustomer#2026',
      themeBadge: 'bg-emerald-500/10 text-[#00FF66] border-emerald-500/30',
      accentColor: 'text-[#00FF66]',
      accentBorder: 'border-[#00FF66]/40',
      accentGlow: 'shadow-[0_0_20px_rgba(0,255,102,0.25)]',
      btnBg: 'bg-[#00FF66] hover:bg-[#00FF66]/90 text-slate-950 font-bold shadow-[0_0_25px_rgba(0,255,102,0.3)]',
      activeTabBg: 'bg-emerald-500/20 text-[#00FF66] border-emerald-400/50 shadow-sm',
      targetPath: '/customer/home'
    },
    station_owner: {
      roleKey: 'station_owner',
      title: 'Station Owner Console',
      subtitle: 'Plaza administration, dynamic tariffs & bay controls',
      idLabel: 'Owner ID',
      idPlaceholder: 'e.g. OWNER-501',
      demoId: 'OWNER-501',
      demoPass: 'StationOwner#2026',
      themeBadge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      accentColor: 'text-cyan-400',
      accentBorder: 'border-cyan-400/40',
      accentGlow: 'shadow-[0_0_20px_rgba(0,240,255,0.25)]',
      btnBg: 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold shadow-[0_0_25px_rgba(0,240,255,0.3)]',
      activeTabBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-400/50 shadow-sm',
      targetPath: '/owner/dashboard'
    },
    admin: {
      roleKey: 'admin',
      title: 'Command Center',
      subtitle: 'Enterprise platform governance & audit stream',
      idLabel: 'Admin ID',
      idPlaceholder: 'e.g. ADMIN-001',
      demoId: 'ADMIN-001',
      demoPass: 'SuperAdmin#2026',
      themeBadge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      accentColor: 'text-amber-400',
      accentBorder: 'border-amber-400/40',
      accentGlow: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
      btnBg: 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold shadow-[0_0_25px_rgba(245,158,11,0.3)]',
      activeTabBg: 'bg-amber-500/20 text-amber-400 border-amber-400/50 shadow-sm',
      targetPath: '/admin/dashboard'
    }
  };

  const currentMeta = roleMeta[activeTab] || roleMeta.customer;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!userId.trim()) {
      setErrorMsg(`Please enter your ${currentMeta.idLabel}.`);
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Please enter your account password.');
      return;
    }

    const res = await login(userId.trim().toUpperCase(), password, activeTab);
    if (res.success && res.user) {
      setSuccessMsg(`Authenticated as ${res.user.full_name}! Redirecting...`);
      setTimeout(() => {
        if (res.user.role === 'station_owner') {
          onNavigate('/owner/dashboard');
        } else if (res.user.role === 'admin') {
          onNavigate('/admin/dashboard');
        } else {
          onNavigate('/customer/home');
        }
      }, 500);
    } else {
      setErrorMsg(res.error || 'Authentication failed. Please verify your credentials.');
    }
  };

  const handleDemoAutofill = async () => {
    setErrorMsg('');
    setUserId(currentMeta.demoId);
    setPassword(currentMeta.demoPass);

    const res = await login(currentMeta.demoId, currentMeta.demoPass, activeTab);
    if (res.success && res.user) {
      setSuccessMsg(`Welcome, ${res.user.full_name}! Redirecting to ${currentMeta.title}...`);
      setTimeout(() => {
        onNavigate(currentMeta.targetPath);
      }, 500);
    } else {
      setErrorMsg(res.error || 'Demo login failed');
    }
  };

  const handleGoogleDemoLogin = async () => {
    setErrorMsg('');
    const res = await loginWithGoogle({
      name: 'Rahul Sharma (Google EV)',
      email: 'rahul.ev@gmail.com'
    });
    if (res.success && res.user) {
      setSuccessMsg(`Signed in via Demo Google OAuth as ${res.user.user_id}!`);
      setTimeout(() => {
        onNavigate('/customer/home');
      }, 500);
    } else {
      setErrorMsg(res.error || 'Demo Google login failed');
    }
  };

  return (
    <div 
      className="relative w-full min-h-screen overflow-x-hidden flex items-center justify-center lg:justify-start p-4 sm:p-6 lg:p-10 xl:pl-20 bg-[#070A10]"
      style={{
        backgroundImage: "url('/login page.png'), url('/login-page.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Subtle darkening gradient on left edge for optimal text contrast while preserving background */}
      <div 
        className="absolute inset-0 pointer-events-none bg-gradient-to-r from-black/40 via-transparent to-transparent hidden lg:block" 
      />

      {/* Modern Left-Side Login Panel */}
      <div className="relative z-10 w-full max-w-md lg:max-w-[430px] my-auto">
                  <div
                    className="rounded-3xl p-6 sm:p-8 backdrop-blur-2xl border transition-all duration-300"
                    style={{
                      backgroundColor: 'rgba(7, 10, 16, 0.78)',
                      borderColor: activeTab === 'customer'
                        ? 'rgba(0, 255, 102, 0.28)'
                        : activeTab === 'station_owner'
                          ? 'rgba(0, 240, 255, 0.28)'
                          : 'rgba(245, 158, 11, 0.28)',
                      boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 35px -5px rgba(0, 0, 0, 0.5)'
                    }}
                  >
                    {/* Panel Header */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00FF66] via-cyan-400 to-blue-600 flex items-center justify-center shadow-md">
                          <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
                        </div>
                        <div>
                          <span className="text-base font-extrabold tracking-tight text-white">
                            SmartCharge<span className="text-cyan-400">AI</span>
                          </span>
                        </div>
                      </div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-300 border border-white/10 px-2 py-0.5 rounded-full bg-white/5">
                          Secure Access
                        </span>
                    </div>

                      {/* 3 Role Selection Tabs */}
                      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-black/60 border border-white/10 mb-5">
                        <button
                          type="button"
                          onClick={() => setActiveTab('customer')}
                          className={`flex items-center justify-center space-x-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${activeTab === 'customer'
                              ? 'bg-emerald-500/20 text-[#00FF66] border border-emerald-400/50 shadow-sm'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                            }`}
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>Customer</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab('station_owner')}
                          className={`flex items-center justify-center space-x-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${activeTab === 'station_owner'
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/50 shadow-sm'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                            }`}
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Owner</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab('admin')}
                          className={`flex items-center justify-center space-x-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${activeTab === 'admin'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-400/50 shadow-sm'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                            }`}
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Admin</span>
                        </button>
                      </div>

                        {/* Active Tab Heading */}
                        <div className="mb-5 pb-3 border-b border-white/10 flex items-center justify-between">
                          <div>
                            <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                              <span>{currentMeta.title}</span>
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {currentMeta.subtitle}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-bold border ${currentMeta.themeBadge}`}>
                            {currentMeta.roleKey.replace('_', ' ')}
                          </span>
                        </div>

                        {/* 1-Click Instant Demo Login Shortcut */}
                        <div className="mb-5">
                          <button
                            type="button"
                            onClick={handleDemoAutofill}
                            disabled={loading}
                            className="w-full py-2 px-3.5 rounded-xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30 text-xs font-mono text-slate-200 flex items-center justify-between transition-all group"
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <Zap className={`w-3.5 h-3.5 ${currentMeta.accentColor} shrink-0 animate-pulse`} />
                              <span className="truncate">Quick Demo Login: <strong className="text-white">{currentMeta.demoId}</strong></span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0 ml-1" />
                          </button>
                        </div>

                              {/* Error and Success Feedback Alerts */}
                              {errorMsg && (
                                <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center space-x-2.5 text-rose-300 text-xs animate-in fade-in">
                                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                                  <span>{errorMsg}</span>
                                </div>
                              )}
                              {successMsg && (
                                <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center space-x-2.5 text-emerald-300 text-xs animate-in fade-in">
                                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                                  <span>{successMsg}</span>
                                </div>
                              )}

                              {/* Form (ID + Password ONLY) */}
                              <form onSubmit={handleSubmit} className="space-y-3.5">
                                <div>
                                  <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                    <span>{currentMeta.idLabel} (ID ONLY)</span>
                                    <span className="text-[10px] text-slate-500">NO EMAIL</span>
                                  </label>
                                  <div className="relative">
                                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                      type="text"
                                      value={userId}
                                      onChange={(e) => setUserId(e.target.value.toUpperCase())}
                                      placeholder={currentMeta.idPlaceholder}
                                      className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
                                      autoComplete="off"
                                    />
                                  </div>
                                </div>

                                  <div>
                                    <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                                      Password
                                    </label>
                                    <div className="relative">
                                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                      <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••••••"
                                        className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
                                      />
                                    </div>
                                  </div>

                                    <button
                                      type="submit"
                                      disabled={loading}
                                      className={`w-full py-3 rounded-xl text-xs uppercase tracking-wider font-mono transition-all flex items-center justify-center space-x-2 mt-2 ${currentMeta.btnBg} ${loading ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    >
                                      <Lock className="w-3.5 h-3.5" />
                                      <span>{loading ? 'Authenticating...' : `Sign in to ${currentMeta.title}`}</span>
                                    </button>
                                  </form>

                                  {/* Customer Alternative Option: Demo Google Sign-In */}
                                  {activeTab === 'customer' && (
                                    <div className="mt-5 pt-4 border-t border-white/10 space-y-2.5">
                                      <div className="text-center text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                                        Alternative Access
                                      </div>
                                      <button
                                        type="button"
                                        onClick={handleGoogleDemoLogin}
                                        disabled={loading}
                                        className="w-full py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2.5 transition-all"
                                      >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                                          <path
                                            fill="#4285F4"
                                            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                                          />
                                          <path
                                            fill="#34A853"
                                            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                                          />
                                          <path
                                            fill="#FBBC05"
                                            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
                                          />
                                          <path
                                            fill="#EA4335"
                                            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                                          />
                                        </svg>
                                        <span>Continue with Google (Demo Login)</span>
                                      </button>
                                    </div>
                                  )}

                                {/* Security guarantee line */}
                                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500">
                                  <span className="flex items-center space-x-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Role-Enforced RBAC</span>
                                  </span>
                                  <span>FastAPI & SQLite</span>
                                </div>
                            </div>
                        </div>
                      </div>
                      );
}
