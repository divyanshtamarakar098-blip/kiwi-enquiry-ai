import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Zap,
  Sparkles,
  Bot,
  User,
  Phone,
  Mail,
  FileText,
} from 'lucide-react';
import { submitEnquiry } from '../api';

const SAMPLE_ENQUIRIES = [
  {
    name: 'Aarav Patel',
    phone: '+91 98260 12345',
    email: 'aarav@indoreclothing.com',
    message:
      'I own a clothing store in Indore. I need an e-commerce website where customers can browse products, place orders and make online payments. My budget is around Rs 50,000.',
    label: 'Indore Clothing Store',
    tag: 'Assignment Test Case',
    tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    budget: '₹50,000',
    category: 'E-commerce',
  },
  {
    name: 'Dr. Sameer Joshi',
    phone: '+91 98930 45678',
    email: 'sameer@indorehealth.org',
    message:
      'We run a diagnostic clinic network across MP. We need an AI-powered patient triage and WhatsApp appointment booking system that integrates with our internal clinic software. Need it ready in 6 weeks.',
    label: 'Healthcare AI Automation',
    tag: 'High Priority',
    tagColor: 'bg-rose-100 text-rose-800 border-rose-200',
    budget: '₹3,50,000',
    category: 'AI Software',
  },
  {
    name: 'Pooja Agrawal',
    phone: '+91 94250 89123',
    email: 'pooja@agrawaljewels.in',
    message:
      'We want digital marketing and SEO services for our luxury jewellery brand in Indore to rank on Google and run targeted Instagram ad campaigns.',
    label: 'Luxury Retail SEO & Ads',
    tag: 'Marketing',
    tagColor: 'bg-purple-100 text-purple-800 border-purple-200',
    budget: '₹35,000/mo',
    category: 'Digital Marketing',
  },
];

export default function EnquiryForm({ onEnquiryCreated, onViewDashboard }) {
  const [formData, setFormData] = useState({
    customer_name: '',
    phone_number: '',
    email: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleQuickFill = (sample) => {
    setFormData({
      customer_name: sample.name,
      phone_number: sample.phone,
      email: sample.email,
      message: sample.message,
    });
    setSubmitted(false);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await submitEnquiry(formData);
      setSubmitted(true);
      if (onEnquiryCreated) onEnquiryCreated(data);
    } catch (err) {
      setError(err.message || 'Something went wrong while submitting.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      customer_name: '',
      phone_number: '',
      email: '',
      message: '',
    });
    setSubmitted(false);
    setError(null);
  };

  const content = submitted ? (
    <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/90 text-center max-w-md mx-auto">
      <div className="p-4 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center justify-center mb-6">
        <CheckCircle2 className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-extrabold text-slate-900 mb-3">
        Thank you, your enquiry has been received
      </h2>
      <p className="text-slate-600 text-sm sm:text-base mb-8 leading-relaxed">
        Our team will review it and contact you shortly.
      </p>
      <button
        type="button"
        onClick={handleReset}
        className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#ec4899] hover:from-[#6d28d9] hover:to-[#db2777] text-white font-bold text-sm shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <ArrowRight className="w-4 h-4" />
        <span>Submit another enquiry</span>
      </button>
    </div>
  ) : (
    <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/90 relative overflow-hidden w-full max-w-2xl mx-auto">
      {/* Subtle top brand bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#7c3aed] via-[#ec4899] to-[#f97316]" />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
            New Enquiry Submission
          </h2>
          <p className="text-xs text-slate-500">
            All fields are analyzed by Google Gemini AI
          </p>
        </div>
        <div className="p-2.5 rounded-2xl bg-purple-50 text-[#7c3aed]">
          <Bot className="w-5 h-5" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            Customer Full Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="customer_name"
            required
            value={formData.customer_name}
            onChange={handleChange}
            placeholder="e.g. Aarav Patel"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-[#7c3aed] text-xs sm:text-sm transition bg-slate-50/50 focus:bg-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="phone_number"
              required
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="e.g. +91 98260 12345"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-[#7c3aed] text-xs sm:text-sm transition bg-slate-50/50 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. aarav@indoreclothing.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-[#7c3aed] text-xs sm:text-sm transition bg-slate-50/50 focus:bg-white"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Enquiry Message <span className="text-rose-500">*</span>
            </label>
            <span className="text-[10px] text-slate-400">
              {formData.message.length} characters
            </span>
          </div>
          <textarea
            name="message"
            required
            rows={5}
            value={formData.message}
            onChange={handleChange}
            placeholder="Describe project requirements, preferred technology, goals, city location, timeline, and estimated budget..."
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-[#7c3aed] text-xs sm:text-sm transition bg-slate-50/50 focus:bg-white leading-relaxed"
          />
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#ec4899] hover:from-[#6d28d9] hover:to-[#db2777] text-white font-bold text-sm shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/35 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group cursor-pointer"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>AI Analyzing Message & Categorizing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span>Submit & Trigger AI Workflow</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6">
      {/* Creative Hero Banner */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-100 via-pink-50 to-orange-100 border border-purple-200 text-[#7c3aed] text-xs font-bold uppercase tracking-wider mb-4 shadow-xs">
          <Zap className="w-3.5 h-3.5 text-[#f97316]" />
          <span>Intelligent Workflow Engine &bull; Kiwi Connect Digital</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Automate Customer Enquiries with{' '}
          <span className="bg-gradient-to-r from-[#7c3aed] via-[#ec4899] to-[#f97316] bg-clip-text text-transparent">
            Gemini AI
          </span>
        </h1>
        <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
          Submit any client project requirement. Our AI pipeline instantly extracts budget, location, and urgency,
          categorizes the service, scores the lead, and drafts a ready-to-send customer reply.
        </p>

        {/* 1-Click Interactive Test Cases Cards */}
        <div className="mt-6 text-left">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
            Click any test case to pre-fill the form:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SAMPLE_ENQUIRIES.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickFill(sample)}
                className="group p-3.5 bg-white/80 hover:bg-white rounded-2xl border border-slate-200 hover:border-purple-300 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${sample.tagColor}`}>
                      {sample.tag}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">{sample.budget}</span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs group-hover:text-[#7c3aed] transition">
                    {sample.label}
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                    {sample.message}
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 group-hover:text-[#7c3aed] font-medium">
                  <span>Auto-fill details</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content: Single-column centered form */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 items-start justify-center">
        {content}
      </div>
    </div>
  );
}
