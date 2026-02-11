"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lead, LeadStatus } from "@/types/database";
import {
  channelLabel,
  formatCurrency,
  statusColor,
  statusLabel,
} from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface LeadsTableProps {
  leads: Lead[];
  onLeadUpdated?: () => void;
}

const allStatuses: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "converted",
  "churned",
];

export function LeadsTable({ leads, onLeadUpdated }: LeadsTableProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newStatus, setNewStatus] = useState<LeadStatus>("new");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  function openLead(lead: Lead) {
    setSelectedLead(lead);
    setNewStatus(lead.status);
    setNotes(lead.notes || "");
  }

  async function handleSave() {
    if (!selectedLead) return;
    setSaving(true);

    const supabase = createClient();
    await supabase
      .from("leads")
      .update({ status: newStatus, notes })
      .eq("id", selectedLead.id);

    setSaving(false);
    setSelectedLead(null);
    onLeadUpdated?.();
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="card"
      >
        <h3 className="text-sm font-medium text-genesis-muted mb-4">
          Recent Leads
        </h3>

        {leads.length === 0 ? (
          <p className="text-genesis-muted text-sm">No leads yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-genesis-border">
                  <th className="text-left py-3 px-2 text-genesis-muted font-medium">
                    Lead
                  </th>
                  <th className="text-left py-3 px-2 text-genesis-muted font-medium">
                    Company
                  </th>
                  <th className="text-left py-3 px-2 text-genesis-muted font-medium">
                    Source
                  </th>
                  <th className="text-left py-3 px-2 text-genesis-muted font-medium">
                    Status
                  </th>
                  <th className="text-right py-3 px-2 text-genesis-muted font-medium">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => openLead(lead)}
                    className="border-b border-genesis-border/50 hover:bg-genesis-border/20 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-2 text-genesis-text">
                      {lead.lead_name}
                    </td>
                    <td className="py-3 px-2 text-genesis-muted">
                      {lead.company}
                    </td>
                    <td className="py-3 px-2 text-genesis-muted">
                      {channelLabel(lead.source)}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${statusColor(lead.status)}`}
                      >
                        {statusLabel(lead.status)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right text-genesis-text">
                      {formatCurrency(Number(lead.value))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Lead Detail Slide-out Panel */}
      <AnimatePresence>
        {selectedLead && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setSelectedLead(null)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-genesis-card border-l border-genesis-border z-50 p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-genesis-text">
                  Lead Details
                </h3>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="text-genesis-muted hover:text-genesis-text transition-colors text-xl"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="label">Name</p>
                  <p className="text-genesis-text">{selectedLead.lead_name}</p>
                </div>
                <div>
                  <p className="label">Company</p>
                  <p className="text-genesis-text">{selectedLead.company}</p>
                </div>
                <div>
                  <p className="label">Source</p>
                  <p className="text-genesis-text">
                    {channelLabel(selectedLead.source)}
                  </p>
                </div>
                <div>
                  <p className="label">Value</p>
                  <p className="text-genesis-text">
                    {formatCurrency(Number(selectedLead.value))}
                  </p>
                </div>

                <hr className="border-genesis-border" />

                <div>
                  <label htmlFor="status" className="label">
                    Status
                  </label>
                  <select
                    id="status"
                    value={newStatus}
                    onChange={(e) =>
                      setNewStatus(e.target.value as LeadStatus)
                    }
                    className="input"
                  >
                    {allStatuses.map((s) => (
                      <option key={s} value={s}>
                        {statusLabel(s)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="notes" className="label">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input min-h-[100px] resize-y"
                    placeholder="Add notes about this lead..."
                  />
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary w-full"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
