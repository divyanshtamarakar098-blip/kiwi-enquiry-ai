import React, { useState, useEffect } from 'react';
import {
  Inbox,
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
  Download,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Layers,
  Flame,
  ChevronRight,
  Sparkles,
  BarChart3,
  X,
  FileSpreadsheet,
  Building,
  User,
  ShieldCheck,
  Check,
  Trash2,
} from 'lucide-react';
import { fetchEnquiries, fetchStats, updateEnquiryStatus, getCsvExportUrl, deleteEnquiry } from '../api';
import EnquiryDetailModal from './EnquiryDetailModal';

const CATEGORIES = [
  'Website Development',
  'Mobile Application Development',
  'AI Software Development',
  'Digital Marketing',
  'E-commerce Development',
  'Custom Software Development',
  'Other Services',
];

const STATUSES = ['New', 'In Progress', 'Converted', 'Closed', 'AI Pending'];
const PRIORITIES = ['High', 'Medium', 'Low'];

export default function AdminDashboard({ onNewEnquiryClick }) {
  const [stats, setStats] = useState(null);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, enquiriesData] = await Promise.all([
        fetchStats(),
        fetchEnquiries({
          q: searchQuery,
          category: categoryFilter,
          status: statusFilter,
          priority: priorityFilter,
        }),
      ]);
      setStats(statsData);
      setEnquiries(enquiriesData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter, statusFilter, priorityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setStatusFilter('');
    setPriorityFilter('');
  };

  const handleInlineStatusChange = async (enquiryId, newStatus) => {
    try {
      await updateEnquiryStatus(enquiryId, newStatus);
      loadData();
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleDeleteClick = (enquiry) => {
    setDeleteTarget(enquiry);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEnquiry(deleteTarget.id);
      setEnquiries((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      fetchStats().then(setStats);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    } catch (err) {
      alert(`Failed to delete enquiry: ${err.message}`);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  const handleModalUpdated = (updated) => {
    setEnquiries((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    fetchStats().then(setStats);
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7c3aed] font-extrabold text-[10px] uppercase tracking-wider">
              Management Portal
            </span>
            <span className="text-xs text-slate-400 font-semibold">&bull; Kiwi Connect Digital</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Customer Enquiry Dashboard & Workflow
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track lead status, review Gemini AI classifications, and manage customer communications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={getCsvExportUrl({
              status: statusFilter,
              category: categoryFilter,
              priority: priorityFilter,
            })}
            download
            className="px-4 py-2.5 text-xs font-bold rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs hover:shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </a>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2.5 text-slate-600 hover:text-[#7c3aed] bg-white hover:bg-purple-50 border border-slate-300 rounded-xl shadow-xs transition cursor-pointer"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#7c3aed]' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Total */}
          <div className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Leads</span>
              <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                <Inbox className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-slate-900">{stats.total}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Recorded in SQLite</span>
            </div>
          </div>

          {/* New */}
          <div className="bg-white p-5 rounded-3xl shadow-xs border border-emerald-200 bg-gradient-to-br from-emerald-50/40 to-white flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">New</span>
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-emerald-700">{stats.new}</span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">Awaiting initial action</span>
            </div>
          </div>

          {/* High Priority */}
          <div className="bg-white p-5 rounded-3xl shadow-xs border border-rose-200 bg-gradient-to-br from-rose-50/40 to-white flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">High Priority</span>
              <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-rose-700">{stats.high_priority}</span>
              <span className="text-[10px] text-rose-500 block mt-0.5">Urgent & high budget</span>
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-white p-5 rounded-3xl shadow-xs border border-amber-200 bg-gradient-to-br from-amber-50/40 to-white flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">In Progress</span>
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-amber-700">{stats.in_progress}</span>
              <span className="text-[10px] text-amber-600 block mt-0.5">Discovery & quotation</span>
            </div>
          </div>

          {/* Converted */}
          <div className="bg-white p-5 rounded-3xl shadow-xs border border-indigo-200 bg-gradient-to-br from-indigo-50/40 to-white flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">Converted</span>
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-indigo-700">{stats.converted}</span>
              <span className="text-[10px] text-indigo-500 block mt-0.5">Closed deals</span>
            </div>
          </div>

          {/* Average Lead Score */}
          <div className="bg-white p-5 rounded-3xl shadow-xs border border-purple-200 bg-gradient-to-br from-purple-50/40 to-white flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800">Avg Score</span>
              <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-[#7c3aed]">
                {stats.average_lead_score}
                <span className="text-xs text-slate-400 font-normal">/100</span>
              </span>
              <span className="text-[10px] text-purple-600 block mt-0.5">AI lead readiness</span>
            </div>
          </div>
        </div>
      )}

      {/* Category-Wise Distribution Breakdown (Section E Requirement) */}
      {stats && (
        <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-100 text-[#7c3aed]">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                Category-Wise Distribution
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              {stats.total} total enquiries categorized across 7 core services
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {CATEGORIES.map((cat) => {
              const count = stats.category_distribution[cat] || 0;
              const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              const isSelected = categoryFilter === cat;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(isSelected ? '' : cat)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#7c3aed] bg-purple-50 ring-2 ring-purple-300 shadow-sm'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <span className="text-[11px] font-bold text-slate-800 line-clamp-1 block" title={cat}>
                    {cat}
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-xl font-black text-slate-900">{count}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#7c3aed] to-[#ec4899] h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-xs border border-slate-200">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search enquiries by name, email, phone, city, or keywords..."
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] bg-slate-50/50 focus:bg-white"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full md:w-auto text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-auto text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Priority Dropdown */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full md:w-auto text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p} Priority
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="w-full md:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>

          {(searchQuery || categoryFilter || statusFilter || priorityFilter) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-3 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </form>
      </div>

      {/* Enquiries Table */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-6 py-4.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
              Customer Enquiries
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-[#7c3aed] text-xs font-extrabold">
              {enquiries.length}
            </span>
          </div>
          <span className="text-xs text-slate-400">Click any row to open complete AI analysis</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-5">ID</th>
                <th className="py-3.5 px-5">Customer Info</th>
                <th className="py-3.5 px-5">Category</th>
                <th className="py-3.5 px-5">Priority</th>
                <th className="py-3.5 px-5">Workflow Status</th>
                <th className="py-3.5 px-5">Budget / City</th>
                <th className="py-3.5 px-5">Lead Score</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {enquiries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No customer enquiries match your search filter criteria.
                  </td>
                </tr>
              ) : (
                enquiries.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-purple-50/30 cursor-pointer transition"
                    onClick={() => setSelectedEnquiry(item)}
                  >
                    <td className="py-4 px-5 font-bold text-slate-900">#{item.id}</td>

                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                          {getInitials(item.customer_name)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{item.customer_name}</span>
                            {item.duplicate_count > 1 && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-purple-100 text-purple-800 rounded-sm">
                                x{item.duplicate_count}
                              </span>
                            )}
                            {item.duplicate_of_id && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-100 text-amber-800 rounded-sm">
                                DUP
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block">{item.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold text-[11px] border border-slate-200">
                        {item.category}
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex items-center gap-1 font-bold text-[11px] ${
                          item.priority === 'High'
                            ? 'text-rose-600'
                            : item.priority === 'Medium'
                            ? 'text-amber-600'
                            : 'text-slate-500'
                        }`}
                      >
                        <Flame className="w-3.5 h-3.5" />
                        {item.priority}
                      </span>
                    </td>

                    <td className="py-4 px-5" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={item.status}
                        onChange={(e) => handleInlineStatusChange(item.id, e.target.value)}
                        className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl border focus:outline-none transition ${
                          item.status === 'New'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : item.status === 'In Progress'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : item.status === 'Converted'
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                            : item.status === 'Closed'
                            ? 'bg-slate-100 text-slate-600 border-slate-300'
                            : 'bg-rose-50 text-rose-700 border-rose-300'
                        }`}
                      >
                        {STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900">{item.budget || '—'}</div>
                      <div className="text-[11px] text-slate-400">{item.location || '—'}</div>
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-[#7c3aed] text-xs">{item.lead_score}</span>
                        <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full"
                            style={{ width: `${item.lead_score}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEnquiry(item);
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-[#7c3aed] hover:text-white bg-purple-50 hover:bg-[#7c3aed] rounded-xl transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(item);
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 rounded-xl transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Slide-over / Modal */}
      {selectedEnquiry && (
        <EnquiryDetailModal
          enquiry={selectedEnquiry}
          onClose={() => setSelectedEnquiry(null)}
          onUpdated={handleModalUpdated}
          onDeleted={(deletedId) => {
            setSelectedEnquiry(null);
            setEnquiries((prev) => prev.filter((item) => item.id !== deletedId));
            fetchStats().then(setStats);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-4">
            <h3 className="font-extrabold text-slate-900 text-lg mb-2">
              Delete this enquiry permanently?
            </h3>
            <p className="text-slate-600 text-sm mb-6">
              This action cannot be undone. All data for <strong>{deleteTarget.customer_name}</strong> will be removed.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTarget(null);
                }}
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
  );
}
