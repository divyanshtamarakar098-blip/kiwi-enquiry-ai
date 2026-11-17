import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDashboard from '../components/AdminDashboard';
import { login, logout, isAuthenticated, fetchSettings } from '../api';
import {
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Lock,
} from 'lucide-react';

export default function AdminPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated());
  const [showLogin, setShowLogin] = useState(!isAuthenticated());
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [engineStatus, setEngineStatus] = useState(null);

  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
    setShowLogin(!isAuthenticated());
    if (isAuthenticated()) {
      fetchSettings()
        .then(setEngineStatus)
        .catch(() => {});
    }

    const handleUnauthorized = () => {
      setIsLoggedIn(false);
      setShowLogin(true);
      setEngineStatus(null);
      setLoginError('Session expired. Please sign in again.');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      await login(password);
      setIsLoggedIn(true);
      setShowLogin(false);
      setPassword('');
      fetchSettings().then(setEngineStatus).catch(() => {});
    } catch (err) {
      if (err.message === 'RATE_LIMITED') {
        setLoginError('Too many login attempts. Please try again later.');
      } else {
        setLoginError('Invalid password');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    setShowLogin(true);
    setEngineStatus(null);
    navigate('/admin');
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-100">
        <div className="w-full max-w-md p-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-[#7c3aed] mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Admin Login</h2>
            <p className="text-slate-600">
              Sign in to access the Kiwi Connect Digital management portal.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Admin Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter admin password"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] text-sm transition bg-slate-50/50 focus:bg-white"
                />
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#ec4899] hover:from-[#6d28d9] hover:to-[#db2777] text-white font-bold text-sm shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group cursor-pointer"
              >
                {loginLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    <span>Sign in</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 font-sans relative overflow-x-hidden">
      {/* Decorative header shapes */}
      <div className="absolute top-0 right-0 pointer-events-none z-0 overflow-hidden opacity-90 hidden sm:block">
        <div className="flex items-start gap-3 -mt-6 -mr-8">
          <div className="w-16 h-28 bg-[#ec4899] rounded-b-full shadow-lg opacity-85 transform rotate-6" />
          <div className="w-16 h-36 bg-[#8b5cf6] rounded-b-full shadow-lg opacity-90 transform -rotate-3" />
          <div className="w-16 h-24 bg-[#3b82f6] rounded-b-full shadow-lg opacity-80" />
          <div className="w-16 h-32 bg-[#f97316] rounded-b-full shadow-lg opacity-85 transform rotate-12" />
        </div>
      </div>

      {/* Admin Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-lg tracking-tight">
              <ShieldCheck className="w-5 h-5 text-[#7c3aed]" />
              <span>Admin Portal</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <button
              type="button"
              onClick={() => fetchSettings().then(setEngineStatus).catch(() => {})}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-xs font-bold transition cursor-pointer"
              title="Refresh engine status"
            >
              <span className={`w-2 h-2 rounded-full ${engineStatus?.has_gemini_key ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
              <span>{engineStatus?.engine || 'NLP Engine'}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs transition cursor-pointer"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10">
        <AdminDashboard />
      </main>
    </div>
  );
}
