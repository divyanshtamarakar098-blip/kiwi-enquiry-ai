import React from 'react';
import EnquiryForm from '../components/EnquiryForm';

export default function CustomerPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 font-sans selection:bg-purple-200 selection:text-purple-900 relative overflow-x-hidden">
      {/* Decorative header shapes */}
      <div className="absolute top-0 right-0 pointer-events-none z-0 overflow-hidden opacity-90 hidden sm:block">
        <div className="flex items-start gap-3 -mt-6 -mr-8">
          <div className="w-16 h-28 bg-[#ec4899] rounded-b-full shadow-lg opacity-85 transform rotate-6" />
          <div className="w-16 h-36 bg-[#8b5cf6] rounded-b-full shadow-lg opacity-90 transform -rotate-3" />
          <div className="w-16 h-24 bg-[#3b82f6] rounded-b-full shadow-lg opacity-80" />
          <div className="w-16 h-32 bg-[#f97316] rounded-b-full shadow-lg opacity-85 transform rotate-12" />
        </div>
      </div>

      <main className="flex-1 relative z-10">
        <EnquiryForm />
      </main>

      <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-md py-8 mt-16 text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <span className="w-8 h-8 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#ec4899] flex items-center justify-center text-white text-xs font-bold">
              KC
            </span>
            <span>Kiwi Connect Digital &bull; AI Workflow Automation System</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <p className="text-slate-400 text-[11px]">
              FastAPI &bull; SQLite (SQLAlchemy) &bull; Google Gemini API &bull; React & Tailwind CSS
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
