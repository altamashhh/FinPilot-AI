import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, Key, Eye, EyeOff, Lock, HelpCircle, Mail } from 'lucide-react';
import { loginUser } from '../services/api';

interface LoginProps {
  onLogin: (email: string, token: string) => void;
  defaultEmail?: string;
  sessionExpiredMsg?: string;
}

export default function Login({ onLogin, defaultEmail = 'demo@wealthai.com', sessionExpiredMsg = '' }: LoginProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(sessionExpiredMsg);

  useEffect(() => {
    if (sessionExpiredMsg) {
      setError(sessionExpiredMsg);
    }
  }, [sessionExpiredMsg]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Corporate email is required.');
      return;
    }
    if (passcode.length < 4) {
      setError('Passcode must be at least 4 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await loginUser(email, passcode);
      if (response && response.access_token) {
        onLogin(email, response.access_token);
      } else {
        setError('Invalid credentials or server response.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreFill = () => {
    setEmail('demo@wealthai.com');
    setPasscode('demo123');
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] dark:bg-[#090b11] flex items-center justify-center p-4 transition-colors duration-200">
      {/* Background radial gradient decor */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-[#00236f]/10 to-transparent dark:from-[#3b82f6]/5 pointer-events-none z-0" />
      
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#00236f] dark:bg-[#3b82f6] text-white shadow-lg animate-pulse">
            <Lock size={20} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#00236f] dark:text-[#4d7ef2] font-sans">
            WealthAI
          </h1>
          <p className="text-[#444651] dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">
            Premium Corporate Wealth Analyzer
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white dark:bg-[#121622] rounded-2xl border border-[#e6e8ea] dark:border-slate-800 p-8 shadow-xl transition-all duration-200">
          <h2 className="text-xl font-bold text-[#191c1e] dark:text-white mb-2">
            Secure Member Sign In
          </h2>
          <p className="text-xs text-[#444651] dark:text-slate-400 mb-6 font-medium">
            Please enter your corporate credentials to synchronize report modules.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Corporate Email Field */}
            <div className="space-y-1">
              <label htmlFor="login-email" className="text-[11px] font-bold text-[#444651] dark:text-slate-400 uppercase tracking-wider block">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  id="login-email"
                  type="email"
                  placeholder="name@company.com"
                  required
                  value={email}
                  disabled={loading}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#c5c5d3] dark:border-slate-700 bg-white dark:bg-[#181d2a] text-sm text-[#191c1e] dark:text-white font-medium focus:border-[#00236f] dark:focus:border-[#3b82f6] focus:ring-1 focus:ring-[#00236f] dark:focus:ring-[#3b82f6] outline-none transition-all"
                />
              </div>
            </div>

            {/* Passcode Field */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label htmlFor="login-passcode" className="text-[11px] font-bold text-[#444651] dark:text-slate-400 uppercase tracking-wider block">
                  Secure Passcode
                </label>
                <button
                  type="button"
                  onClick={() => alert(`Hint: You can sign in with any passcode or click the 'Demo Access' button below.`)}
                  className="text-[10px] text-[#00236f] dark:text-[#4d7ef2] font-semibold hover:underline flex items-center gap-0.5"
                >
                  <HelpCircle size={10} />
                  Forgot passcode?
                </button>
              </div>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  id="login-passcode"
                  type={showPasscode ? 'text' : 'password'}
                  placeholder="Enter passcode"
                  required
                  value={passcode}
                  disabled={loading}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full h-11 pl-10 pr-10 rounded-xl border border-[#c5c5d3] dark:border-slate-700 bg-white dark:bg-[#181d2a] text-sm text-[#191c1e] dark:text-white font-mono focus:border-[#00236f] dark:focus:border-[#3b82f6] focus:ring-1 focus:ring-[#00236f] dark:focus:ring-[#3b82f6] outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-between items-center pt-1 text-xs font-semibold">
              <label className="flex items-center gap-2 cursor-pointer text-[#444651] dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  disabled={loading}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-[#00236f] dark:text-blue-500 focus:ring-0 border-slate-300 dark:border-slate-700"
                />
                Remember workspace
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-[#00236f] hover:bg-opacity-95 dark:bg-[#3b82f6] dark:hover:bg-opacity-95 text-white font-bold text-sm tracking-wide shadow-md flex items-center justify-center gap-2 transition-all active:scale-[98%] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <circle className="opacity-75" fill="currentColor" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="40 100" />
                  </svg>
                  Authenticating Portfolio...
                </>
              ) : (
                <>
                  Log In Securely
                </>
              )}
            </button>
          </form>

          {/* Preset Demo Access helper link */}
          <div className="mt-6 pt-5 border-t border-[#e6e8ea] dark:border-slate-800 text-center">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 block mb-2">DEVELOPMENT / DEMO AREA</span>
            <button
              type="button"
              onClick={handlePreFill}
              className="px-4 py-2 border border-[#c5c5d3] dark:border-slate-700 rounded-lg text-xs font-semibold text-[#00236f] dark:text-[#4d7ef2] hover:bg-[#f2f4f6] dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 mx-auto"
            >
              <Sparkles size={12} />
              Set Demo Workspace Credentials
            </button>
          </div>
        </div>

        {/* Corporate Trust Compliance Badges */}
        <footer className="text-center space-y-2 text-[10px] font-bold uppercase tracking-widest text-[#444651]/70 dark:text-slate-500">
          <div className="flex justify-center items-center gap-3">
            <span className="flex items-center gap-1">
              <Shield size={10} />
              SOC 2 Certified
            </span>
            <span>•</span>
            <span>GDPR Compliant</span>
            <span>•</span>
            <span>256-Bit SSL</span>
          </div>
          <p className="normal-case tracking-normal font-sans opacity-60">
            Authorized corporate accounts only. All access connections are monitored under SEC policy.
          </p>
        </footer>
      </div>
    </div>
  );
}
