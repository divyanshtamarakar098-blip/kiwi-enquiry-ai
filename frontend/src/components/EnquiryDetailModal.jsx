import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Clock,
  MapPin,
  IndianRupee,
  Phone,
  Mail,
  User,
  RefreshCw,
  Save,
  Layers,
  Flame,
  Check,
  Zap,
  HelpCircle,
  MessageSquare,
  Trash2,
  ExternalLink,
  Send,
} from 'lucide-react';
import { updateEnquiryStatus, updateEnquiryResponse, reanalyzeEnquiryWithAI, deleteEnquiry } from '../api';
import { formatIST } from '../utils/formatDate';

const STATUS_OPTIONS = ['New', 'In Progress', 'Converted', 'Closed', 'AI Pending'];

export default function EnquiryDetailModal({ enquiry, onClose, onUpdated, onDeleted }) {
  if (!enquiry) return null;

  const [currentEnquiry, setCurrentEnquiry] = useState(enquiry);
  const [editedText, setEditedText] = useState(enquiry.edited_response || enquiry.suggested_response || '');
  const [savingResponse, setSavingResponse] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [copied, setCopied] = useState(false);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Lock page scrolling while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const showNotification = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const updated = await updateEnquiryStatus(currentEnquiry.id, newStatus);
      setCurrentEnquiry(updated);
      if (onUpdated) onUpdated(updated);
      showNotification(`Status updated to "${newStatus}"`);
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveResponse = async () => {
    setSavingResponse(true);
    try {
      const updated = await updateEnquiryResponse(currentEnquiry.id, editedText);
      setCurrentEnquiry(updated);
      if (onUpdated) onUpdated(updated);
      showNotification('Customized response saved successfully!');
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setSavingResponse(false);
    }
  };

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      const updated = await reanalyzeEnquiryWithAI(currentEnquiry.id);
      setCurrentEnquiry(updated);
      setEditedText(updated.edited_response || updated.suggested_response || '');
      if (onUpdated) onUpdated(updated);
      showNotification('AI analysis refreshed successfully!');
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setReanalyzing(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteEnquiry(currentEnquiry.id);
      showNotification('Enquiry deleted successfully.', 'success');
      setShowDeleteConfirm(false);
      if (onDeleted) onDeleted(currentEnquiry.id);
      if (onClose) onClose();
    } catch (err) {
      showNotification(err.message, 'error');
      setShowDeleteConfirm(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const normalizePhone = (phone) => {
    let digits = String(phone || '').replace(/\D/g, '');
    if (digits.startsWith('0')) digits = digits.slice(1);
    if (digits.length === 10) digits = '91' + digits;
    return digits;
  };

  const getReplyBody = () => editedText || currentEnquiry.suggested_response || '';

  const handleContactAction = async (openUrl) => {
    if (currentEnquiry.status === 'New') {
      try {
        const updated = await updateEnquiryStatus(currentEnquiry.id, 'In Progress');
        setCurrentEnquiry(updated);
        if (onUpdated) onUpdated(updated);
        showNotification('Status updated to "In Progress"');
      } catch (err) {
        showNotification(err.message, 'error');
      }
    }
    openUrl();
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent('Regarding your enquiry - Kiwi Connect Digital');
    const body = encodeURIComponent(getReplyBody());
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(currentEnquiry.email)}&su=${subject}&body=${body}`;
    window.open(url, '_blank', 'noopener');
  };

  const handleSendMailto = () => {
    const subject = encodeURIComponent('Regarding your enquiry - Kiwi Connect Digital');
    const body = encodeURIComponent(getReplyBody());
    const url = `mailto:${encodeURIComponent(currentEnquiry.email)}?subject=${subject}&body=${body}`;
    window.open(url, '_blank', 'noopener');
  };

  const handleSendWhatsApp = () => {
    const phone = normalizePhone(currentEnquiry.phone_number);
    const text = encodeURIComponent(getReplyBody());
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank', 'noopener');
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] relative">
        {/* Top brand gradient line */}
        <div className="h-1.5 bg-gradient-to-r from-[#7c3aed] via-[#ec4899] to-[#f97316]" />

        {/* Modal Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 text-[#7c3aed] rounded-2xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl">
                  Enquiry #{currentEnquiry.id} &bull; {currentEnquiry.customer_name}
                </h3>
                {currentEnquiry.is_duplicate && (
                  <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                    Duplicate Contact
                  </span>
                )}
              </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submitted on {formatIST(currentEnquiry.created_at)}
                </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification Toast */}
        {feedback && (
          <div className={`px-6 py-2.5 text-xs font-bold flex items-center gap-2 ${
            feedback.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-800'
          }`}>
            {feedback.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            {feedback.msg}
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm">
          {/* Quick Action Bar (Status Selector & AI Re-run) */}
          <div className="p-4 bg-gradient-to-r from-purple-50/60 to-slate-50 rounded-2xl border border-purple-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Workflow Status:
              </span>
              <select
                value={currentEnquiry.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updatingStatus}
                className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] shadow-xs cursor-pointer"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleReanalyze}
              disabled={reanalyzing}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-white hover:bg-purple-50 text-slate-700 hover:text-[#7c3aed] border border-slate-300 flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#7c3aed] ${reanalyzing ? 'animate-spin' : ''}`} />
              <span>{reanalyzing ? 'Analyzing with Gemini...' : 'Re-run AI Analysis'}</span>
            </button>
          </div>

          {/* Section A: Customer Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Contact Details
              </span>
              <div className="flex items-center gap-2 text-xs text-slate-800">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold">{currentEnquiry.customer_name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentEnquiry.phone_number}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <a href={`mailto:${currentEnquiry.email}`} className="text-[#7c3aed] hover:underline font-medium">
                  {currentEnquiry.email}
                </a>
              </div>
            </div>

            <div className="md:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                Original Customer Message
              </span>
              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                "{currentEnquiry.message}"
              </p>
            </div>
          </div>

          {/* Section B & C: AI Analysis Breakdown */}
          <div className="border border-purple-200/90 rounded-2xl p-5 bg-purple-50/20 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#7c3aed]" />
                  AI Analysis & Parameter Extraction
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Lead Score:</span>
                  <span className="text-xs font-black text-white bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-2.5 py-0.5 rounded-full shadow-xs">
                    {currentEnquiry.lead_score}/100
                  </span>
                </div>
                {currentEnquiry.ai_engine && (
                  <>
                    <span className="text-xs font-bold text-slate-500 block">Engine:</span>
                    <span
                      className={
                        currentEnquiry.ai_engine === 'rules-fallback'
                          ? 'font-bold block px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200'
                          : 'font-bold block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }
                    >
                      Analyzed by {currentEnquiry.ai_engine}
                    </span>
                  </>
                )}
                {currentEnquiry.status === "AI Pending" && currentEnquiry.ai_error && (
                  <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs text-rose-800 mb-2">
                    <span className="font-bold">AI analysis failed — using heuristic fallback.</span>{" "}
                    <span>{currentEnquiry.ai_error}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs mb-2">
                <span className="text-xs font-bold text-slate-500 block">Service Type:</span>
                <span className="font-bold text-slate-900 block">{currentEnquiry.service_type || '—'}</span>
                <span className="text-xs font-bold text-slate-500 block">Urgency:</span>
                <span className={`font-bold block ${
                  currentEnquiry.urgency === 'High'
                    ? 'text-rose-600'
                    : currentEnquiry.urgency === 'Medium'
                    ? 'text-amber-600'
                    : 'text-blue-600'
                }`}>
                  {currentEnquiry.urgency || 'Low'}
                </span>
              </div>

              {/* Metadata Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Category</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{currentEnquiry.category}</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Priority</span>
                  <span className={`font-bold flex items-center gap-1 mt-0.5 ${
                    currentEnquiry.priority === 'High' ? 'text-rose-600' : 'text-amber-600'
                  }`}>
                    <Flame className="w-3.5 h-3.5" /> {currentEnquiry.priority}
                  </span>
                  {currentEnquiry.priority_reason && (
                    <span className="text-[9px] text-slate-500 block mt-0.5">{currentEnquiry.priority_reason}</span>
                  )}
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Budget</span>
                  <span className="font-bold text-emerald-700 mt-0.5 block">{currentEnquiry.budget || 'Not specified'}</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Location</span>
                  <span className="font-bold text-blue-700 mt-0.5 block">{currentEnquiry.location || 'Not specified'}</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                  <span className="font-bold text-slate-900 mt-0.5 block capitalize">{currentEnquiry.status}</span>
                </div>
              </div>

            {/* Executive Summary */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Executive Requirements Summary
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {currentEnquiry.summary}
              </p>
            </div>

            {/* Requirements & Missing Info Lists */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Extracted Requirements
                </span>
                <ul className="space-y-1.5">
                  {currentEnquiry.requirements?.length > 0 ? (
                    currentEnquiry.requirements.map((r, i) => (
                      <li key={i} className="text-xs text-slate-700 bg-emerald-50/40 p-2 rounded-lg border border-emerald-100">
                        • {r}
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-slate-400 italic">None specified</li>
                  )}
                </ul>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-amber-700 block mb-2 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-600" /> Missing Information Needed
                </span>
                <ul className="space-y-1.5">
                  {currentEnquiry.missing_info?.length > 0 ? (
                    currentEnquiry.missing_info.map((m, i) => (
                      <li key={i} className="text-xs text-amber-950 bg-amber-50/50 p-2 rounded-lg border border-amber-200">
                        ? {m}
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-slate-400 italic">No missing information detected</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-indigo-700 block mb-2 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-600" /> Recommended Next Steps
              </span>
              <ul className="space-y-1.5">
                {currentEnquiry.next_steps?.length > 0 ? (
                  currentEnquiry.next_steps.map((step, i) => (
                    <li key={i} className="text-xs text-slate-700 bg-indigo-50/40 p-2 rounded-lg border border-indigo-100">
                      {i + 1}. {step}
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-slate-400 italic">No next steps defined</li>
                )}
              </ul>
            </div>

            {/* Follow-up Questions */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-purple-700 block mb-2 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-purple-600" /> Follow-up Questions for Customer
              </span>
              <ul className="space-y-1.5">
                {currentEnquiry.follow_up_questions?.length > 0 ? (
                  currentEnquiry.follow_up_questions.map((q, i) => (
                    <li key={i} className="text-xs text-slate-700 bg-purple-50/40 p-2 rounded-lg border border-purple-100">
                      ? {q}
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-slate-400 italic">No follow-up questions defined</li>
                )}
              </ul>
            </div>
          </div>

          {/* Section D: AI-Generated Customer Response (Review & Edit) */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-100 text-[#7c3aed]">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Customer Reply (Review & Customize)
                </h4>
                {currentEnquiry.edited_response && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full">
                    Admin Edited
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(editedText)}
                  className="text-xs font-bold text-[#7c3aed] hover:text-purple-800 flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied!' : 'Copy Reply'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleContactAction(handleSendEmail)}
                  className="text-xs font-bold text-[#7c3aed] hover:text-purple-800 flex items-center gap-1 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send via Email</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleContactAction(handleSendWhatsApp)}
                  className="text-xs font-bold text-[#25d366] hover:text-[#128c7e] flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send via WhatsApp</span>
                </button>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleContactAction(handleSendMailto);
                  }}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-700 underline hover:underline cursor-pointer flex items-center gap-1 mt-0.5"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Use default mail app</span>
                </a>
              </div>
              <p className="text-[10px] text-slate-400 italic mt-1">
                Opens your own email or WhatsApp with the message prefilled. Nothing is sent automatically.
              </p>
            </div>

            <p className="text-xs text-slate-500">
              The AI drafted this reply representing Kiwi Connect Digital. Review and edit the message below before sending.
            </p>

            <textarea
              rows={6}
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full p-4 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] bg-slate-50 whitespace-pre-wrap leading-relaxed text-slate-800"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditedText(currentEnquiry.suggested_response)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Reset to AI Draft
              </button>
              <button
                type="button"
                onClick={handleSaveResponse}
                disabled={savingResponse}
                className="px-4 py-2 text-xs font-bold bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl flex items-center gap-1.5 shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingResponse ? 'Saving...' : 'Save Customized Response'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 sm:px-8 py-3.5 border-t border-slate-200 bg-slate-50/80 flex justify-end">
          <button
            type="button"
            onClick={handleDeleteClick}
            className="px-5 py-2 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 rounded-xl transition shadow-xs cursor-pointer mr-3"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[101] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-4">
              <h3 className="font-extrabold text-slate-900 text-lg mb-2">
                Delete this enquiry permanently?
              </h3>
              <p className="text-slate-600 text-sm mb-6">
                This action cannot be undone. All data for <strong>{currentEnquiry.customer_name}</strong> will be removed.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition shadow-sm cursor-pointer"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
