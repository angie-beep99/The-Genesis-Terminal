'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, timeAgo } from '@/lib/utils';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import type { Lead, PipelineSummary, LeadStatus } from '@/types/database';
import { SOURCE_LABELS, STATUS_LABELS } from '@/types/database';

interface LeadsPipelineProps {
  pipeline: PipelineSummary | null;
  leads: Lead[];
  isClient?: boolean;
}

const STATUS_STYLES: Record<LeadStatus, string> = {
  new: 'bg-white/10 text-genesis-muted',
  in_conversation: 'bg-blue-500/10 text-blue-400',
  won: 'bg-genesis-gold/10 text-genesis-gold',
  lost: 'bg-genesis-negative/10 text-genesis-negative/70',
};

function LeadPanel({
  lead,
  onClose,
  onUpdate,
  isClient,
}: {
  lead: Lead;
  onClose: () => void;
  onUpdate: (id: string, status: LeadStatus, notes: string) => void;
  isClient?: boolean;
}) {
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [notes, setNotes] = useState(lead.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(lead.id, status, notes);
    setSaving(false);
    onClose();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, x: '100%' }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
        className="fixed top-0 right-0 bottom-0 w-full max-w-[440px] bg-genesis-bg border-l border-genesis-border z-50 overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold text-genesis-text">Lead Details</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-genesis-card border border-genesis-border flex items-center justify-center text-genesis-muted hover:text-genesis-text transition-colors"
            >
              &times;
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-genesis-muted mb-1">Name</p>
              <p className="text-genesis-text font-medium">{lead.name}</p>
            </div>
            {lead.company && (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-genesis-muted mb-1">Company</p>
                <p className="text-genesis-text">{lead.company}</p>
              </div>
            )}
            <div>
              <p className="text-[11px] uppercase tracking-wider text-genesis-muted mb-1">Source</p>
              <p className="text-genesis-text">{SOURCE_LABELS[lead.source] || lead.source}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-genesis-muted mb-1">Value</p>
              <p className="text-genesis-gold font-semibold">{formatCurrency(lead.value)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-genesis-muted mb-1">Received</p>
              <p className="text-genesis-text text-sm">{timeAgo(lead.created_at)}</p>
            </div>

            <div className="pt-4 border-t border-genesis-border">
              <p className="text-[11px] uppercase tracking-wider text-genesis-muted mb-2">Status</p>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
                disabled={!isClient}
                className="w-full bg-genesis-card border border-genesis-border rounded-xl px-4 py-3 text-genesis-text text-sm disabled:opacity-50"
              >
                <option value="new">New</option>
                <option value="in_conversation">In Conversation</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wider text-genesis-muted mb-2">Notes</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={!isClient}
                className="w-full bg-genesis-card border border-genesis-border rounded-xl px-4 py-3 text-genesis-text text-sm min-h-[120px] resize-none disabled:opacity-50"
                placeholder="Add notes about this lead..."
              />
            </div>

            {isClient && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-genesis-gold hover:bg-genesis-gold/90 text-genesis-bg font-medium rounded-xl px-4 py-3 text-sm transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default function LeadsPipeline({ pipeline, leads, isClient }: LeadsPipelineProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadsList, setLeadsList] = useState<Lead[]>(leads);
  const supabase = createSupabaseBrowser();

  const pipelineCards = [
    { label: 'New', value: pipeline?.new_leads ?? 0, style: 'text-genesis-text' },
    { label: 'In Conversation', value: pipeline?.in_conversation ?? 0, style: 'text-genesis-text' },
    { label: 'Won', value: pipeline?.won ?? 0, style: 'text-genesis-gold' },
    { label: 'Lost', value: pipeline?.lost ?? 0, style: 'text-genesis-negative/70' },
  ];

  const totalConvertible = (pipeline?.new_leads ?? 0) + (pipeline?.in_conversation ?? 0) + (pipeline?.won ?? 0) + (pipeline?.lost ?? 0);
  const conversionRate = totalConvertible > 0 ? ((pipeline?.won ?? 0) / totalConvertible) * 100 : 0;

  const handleUpdateLead = async (id: string, status: LeadStatus, notes: string) => {
    const { error } = await supabase
      .from('leads')
      .update({ status, notes, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setLeadsList((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status, notes, updated_at: new Date().toISOString() } : l))
      );
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-genesis-text">Your Leads</h2>
        <p className="text-sm text-genesis-muted mt-1">Where every lead is right now</p>
      </div>

      {/* Pipeline cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
        {pipelineCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="bg-genesis-card border border-genesis-border rounded-card p-5 text-center"
          >
            <p className={`text-3xl sm:text-4xl font-bold ${card.style}`}>{card.value}</p>
            <p className="text-xs text-genesis-muted mt-2 uppercase tracking-wider">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Conversion rate */}
      {totalConvertible > 0 && (
        <p className="text-sm text-genesis-muted mb-6">
          You&apos;re converting <span className="text-genesis-text font-medium">{conversionRate.toFixed(1)}%</span> of leads into clients
        </p>
      )}

      {/* Recent leads list */}
      {leadsList.length > 0 && (
        <div className="bg-genesis-card border border-genesis-border rounded-card overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-genesis-border">
            <p className="text-sm font-medium text-genesis-text">Recent Leads</p>
          </div>
          <div className="divide-y divide-genesis-border">
            {leadsList.slice(0, 10).map((lead) => (
              <button
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className="w-full px-4 sm:px-5 py-4 flex items-center gap-3 hover:bg-white/[0.02] transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-genesis-text truncate">{lead.name}</p>
                    {lead.company && (
                      <span className="text-xs text-genesis-muted hidden sm:inline">· {lead.company}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-genesis-muted">
                    <span>{SOURCE_LABELS[lead.source] || lead.source}</span>
                    <span>·</span>
                    <span>{timeAgo(lead.created_at)}</span>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLES[lead.status]}`}>
                  {STATUS_LABELS[lead.status]}
                </span>
                <span className="text-sm font-medium text-genesis-gold shrink-0 hidden sm:block">
                  {formatCurrency(lead.value)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Slide-out panel */}
      <AnimatePresence>
        {selectedLead && (
          <LeadPanel
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onUpdate={handleUpdateLead}
            isClient={isClient}
          />
        )}
      </AnimatePresence>
    </motion.section>
  );
}
