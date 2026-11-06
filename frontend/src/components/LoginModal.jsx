import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  ShieldCheck, 
  Building2, 
  Lock, 
  KeyRound, 
  Zap, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * @param {{
 *   isOpen: boolean;
 *   onClose: () => void;
 *   onSuccessRedirect?: (role: string) => void;
 * }} props
 */
export function LoginModal({ isOpen, onClose, onSuccessRedirect }) {
  const { 
    loginTab, 
    setLoginTab, 
    login, 
    loginWithGoogle, 
    loading 
  } = useAuth();

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reset inputs when switching tabs
  useEffect(() => {
    setErrorMsg('');
    setSuccessMsg('');
    setUserId('');
    setPassword('');
  }, [loginTab, isOpen]);

  if (!isOpen) return null;

  const roleMeta = {
    customer: {
      title: 'Customer Portal',
      idLabel: 'Customer ID',
      idPlaceholder: 'e.g. CUST-1001',
      demoId: 'CUST-1001',
      demoPass: 'SmartCustomer#2026',
      accentColor: 'text-cyan-400',
      borderColor: 'border-cyan-500/30',
      glowClass: 'shadow-[0_0_25px_rgba(0,240,255,0.15)]',
      btnClass: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold',
      desc: 'Access your EV garage, real-time battery telemetry, and route savings.'
    },
    station_owner: {
      title: 'Station Owner Console',
      idLabel: 'Owner ID',
      idPlaceholder: 'e.g. OWNER-501',
      demoId: 'OWNER-501',
      demoPass: 'StationOwner#2026',
      accentColor: 'text-[#00FF66]',
      borderColor: 'border-[#00FF66]/30',
      glowClass: 'shadow-[0_0_25px_rgba(0,255,102,0.15)]',
      btnClass: 'bg-[#00FF66] hover:bg-[#00FF66]/90 text-slate-950 font-bold',
      desc: 'Control port availability, dynamic kWh tariffs, and station revenue.'
    },
    admin: {
      title: 'Platform Administrator',
      idLabel: 'Admin ID',
      idPlaceholder: 'e.g. ADMIN-001',
      demoId: 'ADMIN-001',
      demoPass: 'SuperAdmin#2026',
      accentColor: 'text-purple-400',
      borderColor: 'border-purple-500/30',
      glowClass: 'shadow-[0_0_25px_rgba(168,85,247,0.15)]',
      btnClass: 'bg-purple-600 hover:bg-purple-500 text-white font-bold',
      desc: 'System health monitoring, station overrides, user access, and audit logs.'
    }
  };

  const currentMeta = roleMeta[loginTab] || roleMeta.customer;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!userId.trim()) {
      setErrorMsg(`Please enter your ${currentMeta.idLabel}.`);
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Please enter your password.');
      return;
    }

    const res = await login(userId.trim().toUpperCase(), password, loginTab);
    if (res.success) {
      setSuccessMsg(`Authenticated successfully as ${res.user?.full_name}!`);
      setTimeout(() => {
        onClose();
        if (onSuccessRedirect && res.user) {
          onSuccessRedirect(res.user.role);
        }
      }, 700);
    } else {
      setErrorMsg(res.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleDemoAutofill = async () => {
    setErrorMsg('');
    setUserId(currentMeta.demoId);
    setPassword(currentMeta.demoPass);
    
    // Auto-login directly with demo credentials
    const res = await login(currentMeta.demoId, currentMeta.demoPass, loginTab);
    if (res.success) {
      setSuccessMsg(`Welcome, ${res.user?.full_name}!`);
      setTimeout(() => {
        onClose();
        if (onSuccessRedirect && res.user) {
          onSuccessRedirect(res.user.role);
        }
      }, 700);
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
    if (res.success) {
      setSuccessMsg(`Signed in via Demo Google OAuth as ${res.user?.user_id}!`);
      setTimeout(() => {
        onClose();
        if (onSuccessRedirect && res.user) {
          onSuccessRedirect('customer');
        }
      }, 700);
    } else {
      setErrorMsg(res.error || 'Demo Google login failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-dark-950/80 backdrop-blur-md animate-in fade-in">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
      />

      <div className={`relative w-full max-w-lg rounded-3xl bg-[#0B1120] border ${currentMeta.borderColor} ${currentMeta.glowClass} p-6 sm:p-8 z-10 transition-all`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Zap className={`w-5 h-5 ${currentMeta.accentColor}`} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              SmartCharge<span className="text-cyan-400">AI</span> Access Portal
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              3-MODULE ROLE-BASED ACCESS CONTROL
            </p>
          </div>
        </div>

        {/* 3 Role Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-dark-900 border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => setLoginTab('customer')}
            className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              loginTab === 'customer'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Customer</span>
          </button>

          <button
            type="button"
            onClick={() => setLoginTab('station_owner')}
            className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              loginTab === 'station_owner'
                ? 'bg-[#00FF66]/15 text-[#00FF66] border border-[#00FF66]/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Owner</span>
          </button>

          <button
            type="button"
            onClick={() => setLoginTab('admin')}
            className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              loginTab === 'admin'
                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {/* Role Description Card */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 mb-5 flex items-start space-x-3">
          <Sparkles className={`w-4 h-4 mt-0.5 shrink-0 ${currentMeta.accentColor}`} />
          <div>
            <div className={`text-xs font-bold uppercase font-mono tracking-wider ${currentMeta.accentColor}`}>
              {currentMeta.title}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {currentMeta.desc}
            </p>
          </div>
        </div>

        {/* 1-Click Demo Shortcut Banner */}
        <div className="mb-5">
          <button
            type="button"
            onClick={handleDemoAutofill}
            disabled={loading}
            className={`w-full py-2.5 px-4 rounded-xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30 text-xs font-mono text-slate-200 flex items-center justify-between transition-all group`}
          >
            <div className="flex items-center space-x-2">
              <Zap className={`w-3.5 h-3.5 ${currentMeta.accentColor} animate-pulse`} />
              <span>Instant 1-Click Demo Login: <strong className="text-white">{currentMeta.demoId}</strong></span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-2 text-rose-400 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-2 text-emerald-400 text-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main ID + Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full bg-dark-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
                autoComplete="off"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
              Account Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-dark-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl text-xs uppercase tracking-wider font-mono transition-all flex items-center justify-center space-x-2 ${currentMeta.btnClass} ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{loading ? 'Authenticating...' : `Sign In as ${currentMeta.title.replace(' Portal', '').replace(' Console', '')}`}</span>
          </button>
        </form>

        {/* Customer Alternative Option: Demo Google Sign-In */}
        {loginTab === 'customer' && (
          <div className="mt-6 pt-5 border-t border-white/10 space-y-3">
            <div className="text-center text-[11px] font-mono text-slate-500 uppercase tracking-widest">
              Alternative Access
            </div>
            <button
              type="button"
              onClick={handleGoogleDemoLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2.5 transition-all"
            >
              {/* Google G SVG */}
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
              <span>Continue with Google (Demo Google Login)</span>
            </button>
            <p className="text-[10px] text-center text-slate-500 font-mono">
              Note: Clearly labeled as Demo Google Login. No external cloud billing or paid APIs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

