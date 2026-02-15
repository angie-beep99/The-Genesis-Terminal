'use client';

import { useAuth } from '@/lib/auth-context';
import {
  getLeads,
  updateLeadStatus,
  updateLeadValue,
  getLeadNotes,
  addLeadNote,
  getLeadActivity,
} from '@/lib/data';
import type { Lead, LeadNote, LeadActivity, LeadStatus } from '@/types/database';
import { STATUS_LABELS, STATUS_COLORS, SOURCE_LABELS } from '@/types/database';
import { formatCurrency, timeAgo } from '@/lib/utils';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';

// =====================
// Constants
// =====================

const STATUSES: LeadStatus[] = ['new', 'in_conversation', 'won', 'lost'];

const FILTER_OPTIONS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'In Conversation', value: 'in_conversation' },
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
];

const SORT_OPTIONS: { label: string; value: 'newest' | 'value' | 'source' }[] = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Highest Value', value: 'value' },
  { label: 'Source', value: 'source' },
];

// =====================
// Helper: Days since a date
// =====================

function daysSince(dateString: string): number {
  const now = new Date();
  const date = new Date(dateString);
  return Math.floor((now.getTime() - date.getTime()) / 86400000);
}

// =====================
// Helper: Format date
// =====================

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// =====================
// Activity Icon Component
// =====================

function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case 'created':
      return (
        <svg className="w-4 h-4 text-genesis-positive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      );
    case 'status_change':
      return (
        <svg className="w-4 h-4 text-genesis-info" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      );
    case 'note_added':
      return (
        <svg className="w-4 h-4 text-genesis-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case 'value_changed':
      return (
        <svg className="w-4 h-4 text-genesis-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4 text-genesis-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

// =====================
// Main Page Component
// =====================

export default function LeadsPage() {
  const { company } = useAuth();
  const searchParams = useSearchParams();

  // ---------- State ----------
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>(
    searchParams.get('status') || 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'newest' | 'value' | 'source'>('newest');
  const [leadNotes, setLeadNotes] = useState<LeadNote[]>([]);
  const [leadActivity, setLeadActivity] = useState<LeadActivity[]>([]);
  const [noteText, setNoteText] = useState('');
  const [editingValue, setEditingValue] = useState(false);
  const [valueInput, setValueInput] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  // ---------- Fetch Leads ----------
  const fetchLeads = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    try {
      const data = await getLeads(company.id, {
        status: filterStatus,
        search: searchQuery || undefined,
        sort: sortOption,
      });
      setLeads(data);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  }, [company, filterStatus, searchQuery, sortOption]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // ---------- Fetch Lead Details ----------
  const openLeadPanel = useCallback(async (lead: Lead) => {
    setSelectedLead(lead);
    setPanelOpen(true);
    setEditingValue(false);
    setNoteText('');
    try {
      const [notes, activity] = await Promise.all([
        getLeadNotes(lead.id),
        getLeadActivity(lead.id),
      ]);
      setLeadNotes(notes);
      setLeadActivity(activity);
    } catch (err) {
      console.error('Failed to load lead details:', err);
    }
  }, []);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    setTimeout(() => {
      setSelectedLead(null);
      setLeadNotes([]);
      setLeadActivity([]);
    }, 300);
  }, []);

  // ---------- Actions ----------
  const handleStatusChange = useCallback(
    async (leadId: string, newStatus: LeadStatus) => {
      try {
        await updateLeadStatus(leadId, newStatus);
        await fetchLeads();
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead((prev) => (prev ? { ...prev, status: newStatus } : null));
          const activity = await getLeadActivity(leadId);
          setLeadActivity(activity);
        }
      } catch (err) {
        console.error('Failed to update status:', err);
      }
    },
    [fetchLeads, selectedLead]
  );

  const handleValueSave = useCallback(async () => {
    if (!selectedLead) return;
    const numericValue = parseFloat(valueInput);
    if (isNaN(numericValue) || numericValue < 0) return;
    try {
      await updateLeadValue(selectedLead.id, numericValue);
      setSelectedLead((prev) => (prev ? { ...prev, value: numericValue } : null));
      setEditingValue(false);
      await fetchLeads();
      const activity = await getLeadActivity(selectedLead.id);
      setLeadActivity(activity);
    } catch (err) {
      console.error('Failed to update value:', err);
    }
  }, [selectedLead, valueInput, fetchLeads]);

  const handleAddNote = useCallback(async () => {
    if (!selectedLead || !noteText.trim()) return;
    setAddingNote(true);
    try {
      await addLeadNote(selectedLead.id, noteText.trim());
      setNoteText('');
      const [notes, activity] = await Promise.all([
        getLeadNotes(selectedLead.id),
        getLeadActivity(selectedLead.id),
      ]);
      setLeadNotes(notes);
      setLeadActivity(activity);
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setAddingNote(false);
    }
  }, [selectedLead, noteText]);

  // ---------- Drag & Drop ----------
  const handleDragStart = useCallback((e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetStatus: LeadStatus) => {
      e.preventDefault();
      if (!draggedLeadId) return;
      const draggedLead = leads.find((l) => l.id === draggedLeadId);
      if (!draggedLead || draggedLead.status === targetStatus) {
        setDraggedLeadId(null);
        return;
      }
      await handleStatusChange(draggedLeadId, targetStatus);
      setDraggedLeadId(null);
    },
    [draggedLeadId, leads, handleStatusChange]
  );

  // ---------- Stats ----------
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthLeads = leads.filter(
    (l) => new Date(l.created_at) >= monthStart
  );
  const newThisMonth = thisMonthLeads.length;
  const wonThisMonth = leads.filter(
    (l) => l.status === 'won' && new Date(l.updated_at) >= monthStart
  ).length;
  const pipelineValue = leads
    .filter((l) => l.status !== 'lost' && l.status !== 'won')
    .reduce((sum, l) => sum + l.value, 0);
  const totalWithOutcome = leads.filter(
    (l) => l.status === 'won' || l.status === 'lost'
  ).length;
  const conversionRate =
    totalWithOutcome > 0
      ? Math.round(
          (leads.filter((l) => l.status === 'won').length / totalWithOutcome) *
            100
        )
      : 0;

  // ---------- Board grouping ----------
  const boardColumns: Record<LeadStatus, Lead[]> = {
    new: leads.filter((l) => l.status === 'new'),
    in_conversation: leads.filter((l) => l.status === 'in_conversation'),
    won: leads.filter((l) => l.status === 'won'),
    lost: leads.filter((l) => l.status === 'lost'),
  };

  // ---------- Loading state ----------
  if (loading && leads.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-genesis-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-genesis-muted text-sm">Loading leads...</p>
        </div>
      </div>
    );
  }

  // ==============================================
  // RENDER
  // ==============================================
  return (
    <div className="relative flex flex-col h-full min-h-0">
      {/* ============ TOP BAR ============ */}
      <div className="flex flex-col gap-4 px-6 pt-6 pb-4">
        {/* Row 1: Title + Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-genesis-text">Your Leads</h1>
            <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 text-xs font-medium rounded-full bg-genesis-gold/20 text-genesis-gold">
              {leads.length}
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterStatus(opt.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  filterStatus === opt.value
                    ? 'bg-genesis-gold text-genesis-bg'
                    : 'bg-genesis-card text-genesis-secondary hover:bg-genesis-card-hover hover:text-genesis-text'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Search, Sort, View Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-genesis-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-genesis-bg border border-genesis-border rounded-lg text-genesis-text placeholder:text-genesis-muted focus:outline-none focus:border-genesis-gold/50 transition-colors"
            />
          </div>

          {/* Sort */}
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as 'newest' | 'value' | 'source')}
            className="px-3 py-2 text-sm bg-genesis-bg border border-genesis-border rounded-lg text-genesis-text focus:outline-none focus:border-genesis-gold/50 cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* View Toggle - hidden on mobile */}
          <div className="hidden lg:flex items-center border border-genesis-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-genesis-gold text-genesis-bg'
                  : 'bg-genesis-card text-genesis-secondary hover:text-genesis-text'
              }`}
              title="List View"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`p-2 transition-colors ${
                viewMode === 'board'
                  ? 'bg-genesis-gold text-genesis-bg'
                  : 'bg-genesis-card text-genesis-secondary hover:text-genesis-text'
              }`}
              title="Board View"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ============ CONTENT ============ */}
      <div className="flex-1 overflow-auto px-6 pb-20">
        {leads.length === 0 && !loading ? (
          /* ---- Empty State ---- */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <svg
              className="w-16 h-16 text-genesis-muted mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="text-genesis-secondary text-base mb-1">No leads yet.</p>
            <p className="text-genesis-muted text-sm max-w-sm">
              Once your campaigns are live, every lead will appear here automatically.
            </p>
          </div>
        ) : viewMode === 'list' ? (
          /* ============ LIST VIEW ============ */
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-genesis-border">
                    <th className="text-left py-3 px-4 text-xs font-medium text-genesis-muted uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-genesis-muted uppercase tracking-wider">
                      Company
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-genesis-muted uppercase tracking-wider">
                      Source
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-genesis-muted uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-genesis-muted uppercase tracking-wider">
                      Value
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-genesis-muted uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => openLeadPanel(lead)}
                      className="bg-genesis-card hover:bg-genesis-card-hover transition-colors cursor-pointer border-b border-genesis-border/50 last:border-b-0"
                    >
                      <td className="py-3 px-4 text-sm font-medium text-genesis-text">
                        {lead.lead_name}
                      </td>
                      <td className="py-3 px-4 text-sm text-genesis-secondary">
                        {lead.company_name_lead}
                      </td>
                      <td className="py-3 px-4 text-sm text-genesis-secondary">
                        {lead.source ? SOURCE_LABELS[lead.source] : '—'}
                      </td>
                      <td className="py-3 px-4 text-sm text-genesis-secondary">
                        {formatDate(lead.created_at)}
                      </td>
                      <td className="py-3 px-4 text-sm text-genesis-text text-right font-medium">
                        {formatCurrency(lead.value)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[lead.status].bg} ${STATUS_COLORS[lead.status].text}`}
                        >
                          {STATUS_LABELS[lead.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden flex flex-col gap-3">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => openLeadPanel(lead)}
                  className="bg-genesis-card border border-genesis-border rounded-card p-4 cursor-pointer hover:bg-genesis-card-hover transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-genesis-text">{lead.lead_name}</p>
                      <p className="text-xs text-genesis-secondary">{lead.company_name_lead}</p>
                    </div>
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[lead.status].bg} ${STATUS_COLORS[lead.status].text}`}
                    >
                      {STATUS_LABELS[lead.status]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-genesis-muted">
                    <span>{lead.source ? SOURCE_LABELS[lead.source] : '—'}</span>
                    <span className="text-genesis-text font-medium">
                      {formatCurrency(lead.value)}
                    </span>
                  </div>
                  <p className="text-xs text-genesis-muted mt-1">
                    {formatDate(lead.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* ============ BOARD VIEW (Kanban) ============ */
          <div className="grid grid-cols-4 gap-4 min-h-[500px]">
            {STATUSES.map((status) => (
              <div
                key={status}
                className="flex flex-col rounded-card bg-genesis-bg border border-genesis-border"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-genesis-border">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        status === 'new'
                          ? 'bg-genesis-text'
                          : status === 'in_conversation'
                          ? 'bg-genesis-info'
                          : status === 'won'
                          ? 'bg-genesis-gold'
                          : 'bg-genesis-negative'
                      }`}
                    />
                    <span className="text-sm font-medium text-genesis-text">
                      {STATUS_LABELS[status]}
                    </span>
                  </div>
                  <span className="text-xs text-genesis-muted font-medium">
                    {boardColumns[status].length}
                  </span>
                </div>

                {/* Column Body */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {boardColumns[status].map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onClick={() => openLeadPanel(lead)}
                      className={`bg-genesis-card border border-genesis-border rounded-lg p-4 cursor-pointer hover:bg-genesis-card-hover transition-colors select-none ${
                        draggedLeadId === lead.id ? 'opacity-50' : ''
                      }`}
                    >
                      <p className="text-sm font-medium text-genesis-text mb-1">
                        {lead.lead_name}
                      </p>
                      <p className="text-xs text-genesis-secondary mb-2">
                        {lead.company_name_lead}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-genesis-gold">
                          {formatCurrency(lead.value)}
                        </span>
                        {lead.source && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-genesis-bg text-genesis-muted border border-genesis-border">
                            {SOURCE_LABELS[lead.source]}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-genesis-muted mt-2">
                        {daysSince(lead.updated_at)} days in stage
                      </p>
                    </div>
                  ))}
                  {boardColumns[status].length === 0 && (
                    <div className="flex items-center justify-center h-24 text-xs text-genesis-muted">
                      No leads
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============ STATS BAR (sticky bottom) ============ */}
      {leads.length > 0 && (
        <div className="sticky bottom-0 z-10 flex items-center justify-center px-6 py-3 bg-genesis-card border-t border-genesis-border text-xs text-genesis-secondary">
          <span>
            This month: <span className="text-genesis-text font-medium">{newThisMonth}</span> new
            leads &middot;{' '}
            <span className="text-genesis-text font-medium">{wonThisMonth}</span> won &middot;{' '}
            <span className="text-genesis-gold font-medium">
              {formatCurrency(pipelineValue)}
            </span>{' '}
            pipeline &middot;{' '}
            <span className="text-genesis-text font-medium">{conversionRate}%</span> conversion
            rate
          </span>
        </div>
      )}

      {/* ============ LEAD DETAIL PANEL ============ */}
      <AnimatePresence>
        {panelOpen && selectedLead && (
          <>
            {/* Backdrop (mobile) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closePanel}
              className="fixed inset-0 bg-black/50 z-40 lg:bg-black/20"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[420px] lg:w-[480px] bg-genesis-card border-l border-genesis-border overflow-y-auto"
            >
              {/* Panel Header */}
              <div className="sticky top-0 z-10 flex items-start justify-between p-6 pb-4 bg-genesis-card border-b border-genesis-border">
                <div className="flex-1 min-w-0 mr-4">
                  <h2 className="text-lg font-semibold text-genesis-text truncate">
                    {selectedLead.lead_name}
                  </h2>
                  <p className="text-sm text-genesis-muted truncate">
                    {selectedLead.company_name_lead}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span
                      className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[selectedLead.status].bg} ${STATUS_COLORS[selectedLead.status].text}`}
                    >
                      {STATUS_LABELS[selectedLead.status]}
                    </span>
                    <span className="text-genesis-gold font-semibold text-sm">
                      {formatCurrency(selectedLead.value)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={closePanel}
                  className="p-1.5 rounded-lg text-genesis-muted hover:text-genesis-text hover:bg-genesis-bg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* ---- Quick Actions ---- */}
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-genesis-muted uppercase tracking-wider">
                    Quick Actions
                  </h3>

                  {/* Change Status */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-genesis-secondary whitespace-nowrap">
                      Status:
                    </label>
                    <select
                      value={selectedLead.status}
                      onChange={(e) =>
                        handleStatusChange(selectedLead.id, e.target.value as LeadStatus)
                      }
                      className="flex-1 px-3 py-1.5 text-sm bg-genesis-bg border border-genesis-border rounded-lg text-genesis-text focus:outline-none focus:border-genesis-gold/50 cursor-pointer"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Edit Value */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-genesis-secondary whitespace-nowrap">
                      Value:
                    </label>
                    {editingValue ? (
                      <div className="flex items-center gap-2 flex-1">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-genesis-muted">
                            $
                          </span>
                          <input
                            type="number"
                            value={valueInput}
                            onChange={(e) => setValueInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleValueSave();
                              if (e.key === 'Escape') setEditingValue(false);
                            }}
                            className="w-full pl-7 pr-3 py-1.5 text-sm bg-genesis-bg border border-genesis-border rounded-lg text-genesis-text focus:outline-none focus:border-genesis-gold/50"
                            autoFocus
                          />
                        </div>
                        <button
                          onClick={handleValueSave}
                          className="px-3 py-1.5 text-xs font-medium bg-genesis-gold text-genesis-bg rounded-lg hover:bg-genesis-gold-hover transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingValue(false)}
                          className="px-3 py-1.5 text-xs font-medium text-genesis-muted hover:text-genesis-text transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setValueInput(String(selectedLead.value));
                          setEditingValue(true);
                        }}
                        className="text-sm text-genesis-text hover:text-genesis-gold transition-colors"
                      >
                        {formatCurrency(selectedLead.value)}{' '}
                        <span className="text-genesis-muted text-xs">(click to edit)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* ---- Timeline ---- */}
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-genesis-muted uppercase tracking-wider">
                    Timeline
                  </h3>
                  {leadActivity.length > 0 ? (
                    <div className="relative pl-6 space-y-4">
                      {/* Vertical line */}
                      <div className="absolute left-[7px] top-1 bottom-1 w-px bg-genesis-border" />
                      {leadActivity.map((activity) => (
                        <div key={activity.id} className="relative flex items-start gap-3">
                          <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-genesis-bg border border-genesis-border flex items-center justify-center">
                            <ActivityIcon type={activity.activity_type} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-genesis-text">{activity.description}</p>
                            <p className="text-xs text-genesis-muted mt-0.5">
                              {timeAgo(activity.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-genesis-muted">No activity recorded yet.</p>
                  )}
                </div>

                {/* ---- Notes ---- */}
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-genesis-muted uppercase tracking-wider">
                    Notes
                  </h3>
                  <div className="space-y-2">
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add a note..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm bg-genesis-bg border border-genesis-border rounded-lg text-genesis-text placeholder:text-genesis-muted focus:outline-none focus:border-genesis-gold/50 resize-none"
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={!noteText.trim() || addingNote}
                      className="px-4 py-2 text-sm font-medium bg-genesis-gold text-genesis-bg rounded-lg hover:bg-genesis-gold-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addingNote ? 'Adding...' : 'Add Note'}
                    </button>
                  </div>
                  {leadNotes.length > 0 && (
                    <div className="space-y-3 mt-4">
                      {leadNotes.map((note) => (
                        <div
                          key={note.id}
                          className="p-3 bg-genesis-bg rounded-lg border border-genesis-border"
                        >
                          <p className="text-sm text-genesis-text whitespace-pre-wrap">
                            {note.note_text}
                          </p>
                          <p className="text-xs text-genesis-muted mt-2">
                            {timeAgo(note.created_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ---- Lead Details ---- */}
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-genesis-muted uppercase tracking-wider">
                    Lead Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-genesis-bg rounded-lg border border-genesis-border">
                      <p className="text-xs text-genesis-muted mb-0.5">Source</p>
                      <p className="text-sm text-genesis-text font-medium">
                        {selectedLead.source ? SOURCE_LABELS[selectedLead.source] : '—'}
                      </p>
                    </div>
                    <div className="p-3 bg-genesis-bg rounded-lg border border-genesis-border">
                      <p className="text-xs text-genesis-muted mb-0.5">Campaign</p>
                      <p className="text-sm text-genesis-text font-medium">
                        {selectedLead.campaign || '—'}
                      </p>
                    </div>
                    <div className="p-3 bg-genesis-bg rounded-lg border border-genesis-border">
                      <p className="text-xs text-genesis-muted mb-0.5">First Interaction</p>
                      <p className="text-sm text-genesis-text font-medium">
                        {formatDate(selectedLead.created_at)}
                      </p>
                    </div>
                    <div className="p-3 bg-genesis-bg rounded-lg border border-genesis-border">
                      <p className="text-xs text-genesis-muted mb-0.5">Days in Pipeline</p>
                      <p className="text-sm text-genesis-text font-medium">
                        {daysSince(selectedLead.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ---- Archive ---- */}
                <div className="pt-4 border-t border-genesis-border">
                  <button className="text-xs text-genesis-muted hover:text-genesis-negative transition-colors">
                    Archive this lead
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
