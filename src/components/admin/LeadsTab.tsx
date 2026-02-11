"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Lead, LeadSource, LeadStatus } from "@/types/database";
import {
  channelLabel,
  formatCurrency,
  statusColor,
  statusLabel,
} from "@/lib/utils";

interface LeadsTabProps {
  clientId: string;
}

const allSources: LeadSource[] = [
  "google_ads",
  "meta",
  "bing",
  "tiktok",
  "seo",
  "organic",
];
const allStatuses: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "converted",
  "churned",
];

export function LeadsTab({ clientId }: LeadsTabProps) {
  const supabase = createClient();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    lead_name: "",
    company: "",
    source: "google_ads" as LeadSource,
    status: "new" as LeadStatus,
    value: "",
    notes: "",
  });

  async function loadLeads() {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    setLeads(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  function resetForm() {
    setForm({
      lead_name: "",
      company: "",
      source: "google_ads",
      status: "new",
      value: "",
      notes: "",
    });
    setEditingId(null);
    setShowForm(false);
  }

  function editLead(lead: Lead) {
    setForm({
      lead_name: lead.lead_name,
      company: lead.company,
      source: lead.source,
      status: lead.status,
      value: String(lead.value),
      notes: lead.notes || "",
    });
    setEditingId(lead.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      client_id: clientId,
      lead_name: form.lead_name,
      company: form.company,
      source: form.source,
      status: form.status,
      value: parseFloat(form.value) || 0,
      notes: form.notes || null,
    };

    if (editingId) {
      await fetch("/api/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...payload }),
      });
    } else {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setSaving(false);
    resetForm();
    await loadLeads();
  }

  async function handleBulkImport() {
    setSaving(true);
    const lines = csvText.trim().split("\n");
    const leadsData = lines
      .map((line) => {
        const [lead_name, company, source, status, value] = line
          .split(",")
          .map((s) => s.trim());
        if (!lead_name || !company || !source) return null;
        return {
          client_id: clientId,
          lead_name,
          company,
          source,
          status: status || "new",
          value: parseFloat(value) || 0,
        };
      })
      .filter(Boolean);

    await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadsData),
    });

    setSaving(false);
    setCsvText("");
    setBulkMode(false);
    await loadLeads();
  }

  if (loading) return <div className="text-genesis-muted text-sm">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-genesis-text">Leads</h3>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setBulkMode(!bulkMode);
              setShowForm(false);
            }}
            className="btn-secondary text-sm"
          >
            {bulkMode ? "Cancel" : "Bulk Import"}
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
              setBulkMode(false);
            }}
            className="btn-secondary text-sm"
          >
            {showForm ? "Cancel" : "Add Lead"}
          </button>
        </div>
      </div>

      {bulkMode && (
        <div className="card mb-4 space-y-3">
          <p className="text-xs text-genesis-muted">
            Paste CSV: name, company, source, status, value (one per line)
          </p>
          <textarea
            className="input min-h-[120px] font-mono text-xs"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="John Smith, Acme Corp, google_ads, new, 5000&#10;Jane Doe, Tech Inc, meta, qualified, 12000"
          />
          <button
            onClick={handleBulkImport}
            disabled={saving || !csvText.trim()}
            className="btn-primary text-sm"
          >
            {saving ? "Importing..." : "Import Leads"}
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Lead Name</label>
              <input
                className="input"
                value={form.lead_name}
                onChange={(e) =>
                  setForm({ ...form, lead_name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="label">Company</label>
              <input
                className="input"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Source</label>
              <select
                className="input"
                value={form.source}
                onChange={(e) =>
                  setForm({ ...form, source: e.target.value as LeadSource })
                }
              >
                {allSources.map((s) => (
                  <option key={s} value={s}>
                    {channelLabel(s)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as LeadStatus })
                }
              >
                {allStatuses.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Value ($)</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Notes</label>
              <input
                className="input"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Update Lead" : "Add Lead"}
          </button>
        </form>
      )}

      {leads.length === 0 ? (
        <div className="text-genesis-muted text-sm">No leads yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-genesis-border">
                <th className="text-left py-2 px-2 text-genesis-muted font-medium">
                  Name
                </th>
                <th className="text-left py-2 px-2 text-genesis-muted font-medium">
                  Company
                </th>
                <th className="text-left py-2 px-2 text-genesis-muted font-medium">
                  Source
                </th>
                <th className="text-left py-2 px-2 text-genesis-muted font-medium">
                  Status
                </th>
                <th className="text-right py-2 px-2 text-genesis-muted font-medium">
                  Value
                </th>
                <th className="text-right py-2 px-2 text-genesis-muted font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-genesis-border/50"
                >
                  <td className="py-2 px-2 text-genesis-text">
                    {lead.lead_name}
                  </td>
                  <td className="py-2 px-2 text-genesis-muted">
                    {lead.company}
                  </td>
                  <td className="py-2 px-2 text-genesis-muted">
                    {channelLabel(lead.source)}
                  </td>
                  <td className="py-2 px-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${statusColor(lead.status)}`}
                    >
                      {statusLabel(lead.status)}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right text-genesis-text">
                    {formatCurrency(Number(lead.value))}
                  </td>
                  <td className="py-2 px-2 text-right">
                    <button
                      onClick={() => editLead(lead)}
                      className="text-genesis-gold text-xs hover:underline mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        await fetch(`/api/leads?id=${lead.id}`, {
                          method: "DELETE",
                        });
                        await loadLeads();
                      }}
                      className="text-genesis-negative text-xs hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
