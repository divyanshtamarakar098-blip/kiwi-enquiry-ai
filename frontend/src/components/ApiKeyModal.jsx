import React, { useState, useEffect } from 'react';
import { X, Key, Check, AlertCircle, ExternalLink, Sparkles } from 'lucide-react';
import { fetchSettings, saveApiKey } from '../api';

export default function ApiKeyModal({ isOpen, onClose, onKeySaved }) {
  if (!isOpen) return null;

  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusInfo, setStatusInfo] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    fetchSettings()
      .then(setStatusInfo)
      .catch(console.error);
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setLoading(true);
    setFeedback(null);
    try {
      const res = await saveApiKey(apiKey.trim());
      setFeedback({ type: 'success', msg: res.message });
      setApiKey('');
      const updated = await fetchSettings();
      setStatusInfo(updated);
      if (onKeySaved) onKeySaved(updated);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative">
        <div className="h-1.5 bg-gradient-to-r from-[#7c3aed] via-[#ec4899] to-[#f97316]" />

        <div className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-100 text-[#7c3aed] rounded-xl">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Google Gemini API Configuration
                </h3>
                <p className="text-xs text-slate-500">
                  Power live AI extraction & categorization
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Engine Status */}
          {statusInfo && (
            <div className="my-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Active Processing Engine
              </span>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${statusInfo.has_gemini_key ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {statusInfo.engine}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  statusInfo.has_gemini_key ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {statusInfo.has_gemini_key ? 'Connected' : 'Intelligent Fallback'}
                </span>
              </div>
            </div>
          )}

          {feedback && (
            <div className={`p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}>
              {feedback.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              <span>{feedback.msg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Paste Gemini API Key
              </label>
              <input
                type="password"
                required
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] text-xs font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Your key is saved locally in your backend <code className="text-slate-600">.env</code> file and never shared.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-[#7c3aed] hover:underline flex items-center gap-1"
              >
                <span>Get free Gemini API Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !apiKey.trim()}
                  className="px-4 py-2 text-xs font-bold bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Saving...' : 'Save & Activate'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
