"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PipelineSummary } from "@/types/database";

interface PipelineTabProps {
  clientId: string;
}

export function PipelineTab({ clientId }: PipelineTabProps) {
  const supabase = createClient();
  const [entries, setEntries] = useState<PipelineSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoCalc, setAutoCalc] = useState(false);
  const [calcResult, setCalcResult] = useState<Record<string, number> | null>(
    null
  );
  const [form, setForm] = useState({
    period_start: "",
    period_end: "",
    new_leads: "",
    contacted: "",
    qualified: "",
    proposal_sent: "",
    converted: "",
    churned: "",
  });

  async function loadEntries() {
    const { data } = await supabase
      .from("pipeline_summary")
      .select("*")
      .eq("client_id", clientId)
      .order("period_end", { ascending: false });
    setEntries(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function calculateFromLeads() {
    setAutoCalc(true);
    const { data: leads } = await supabase
      .from("leads")
      .select("status")
      .eq("client_id", clientId);

    if (!leads) {
      setAutoCalc(false);
      return;
    }

    const counts: Record<string, number> = {
      new: 0,
      contacted: 0,
      qualified: 0,
      proposal: 0,
      converted: 0,
      churned: 0,
    };

    leads.forEach((l) => {
      counts[l.status] = (counts[l.status] || 0) + 1;
    });

    setCalcResult(counts);
    setForm({
      ...form,
      new_leads: String(counts.new),
      contacted: String(counts.contacted),
      qualified: String(counts.qualified),
      proposal_sent: String(counts.proposal),
      converted: String(counts.converted),
      churned: String(counts.churned),
    });
    setShowForm(true);
    setAutoCalc(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    await fetch("/api/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "pipeline_summary",
        data: {
          client_id: clientId,
          period_start: form.period_start,
          period_end: form.period_end,
          new_leads: parseInt(form.new_leads) || 0,
          contacted: parseInt(form.contacted) || 0,
          qualified: parseInt(form.qualified) || 0,
          proposal_sent: parseInt(form.proposal_sent) || 0,
          converted: parseInt(form.converted) || 0,
          churned: parseInt(form.churned) || 0,
        },
      }),
    });

    setSaving(false);
    setForm({
      period_start: "",
      period_end: "",
      new_leads: "",
      contacted: "",
      qualified: "",
      proposal_sent: "",
      converted: "",
      churned: "",
    });
    setShowForm(false);
    setCalcResult(null);
    await loadEntries();
  }

  if (loading) return <div className="text-genesis-muted text-sm">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-genesis-text">
          Pipeline Summary
        </h3>
        <div className="flex gap-2">
          <button
            onClick={calculateFromLeads}
            disabled={autoCalc}
            className="btn-secondary text-sm"
          >
            {autoCalc ? "Calculating..." : "Auto-Calculate from Leads"}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-secondary text-sm"
          >
            {showForm ? "Cancel" : "Add Period"}
          </button>
        </div>
      </div>

      {calcResult && (
        <div className="card mb-4 bg-genesis-gold/5 border-genesis-gold/20">
          <p className="text-xs text-genesis-gold mb-1">
            Auto-calculated from leads table:
          </p>
          <p className="text-xs text-genesis-muted">
            New: {calcResult.new} | Contacted: {calcResult.contacted} |
            Qualified: {calcResult.qualified} | Proposal: {calcResult.proposal}{" "}
            | Converted: {calcResult.converted} | Churned: {calcResult.churned}
          </p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Period Start</label>
              <input
                type="date"
                className="input"
                value={form.period_start}
                onChange={(e) =>
                  setForm({ ...form, period_start: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="label">Period End</label>
              <input
                type="date"
                className="input"
                value={form.period_end}
                onChange={(e) =>
                  setForm({ ...form, period_end: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="label">New Leads</label>
              <input
                type="number"
                className="input"
                value={form.new_leads}
                onChange={(e) =>
                  setForm({ ...form, new_leads: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Contacted</label>
              <input
                type="number"
                className="input"
                value={form.contacted}
                onChange={(e) =>
                  setForm({ ...form, contacted: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Qualified</label>
              <input
                type="number"
                className="input"
                value={form.qualified}
                onChange={(e) =>
                  setForm({ ...form, qualified: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Proposal Sent</label>
              <input
                type="number"
                className="input"
                value={form.proposal_sent}
                onChange={(e) =>
                  setForm({ ...form, proposal_sent: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Converted</label>
              <input
                type="number"
                className="input"
                value={form.converted}
                onChange={(e) =>
                  setForm({ ...form, converted: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Churned</label>
              <input
                type="number"
                className="input"
                value={form.churned}
                onChange={(e) => setForm({ ...form, churned: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Add Pipeline"}
          </button>
        </form>
      )}

      {entries.length === 0 ? (
        <div className="text-genesis-muted text-sm">
          No pipeline summary data yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-genesis-border">
                <th className="text-left py-2 px-2 text-genesis-muted font-medium">
                  Period
                </th>
                <th className="text-right py-2 px-2 text-genesis-muted font-medium">
                  New
                </th>
                <th className="text-right py-2 px-2 text-genesis-muted font-medium">
                  Contacted
                </th>
                <th className="text-right py-2 px-2 text-genesis-muted font-medium">
                  Qualified
                </th>
                <th className="text-right py-2 px-2 text-genesis-muted font-medium">
                  Proposal
                </th>
                <th className="text-right py-2 px-2 text-genesis-muted font-medium">
                  Converted
                </th>
                <th className="text-right py-2 px-2 text-genesis-muted font-medium">
                  Churned
                </th>
                <th className="text-right py-2 px-2 text-genesis-muted font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-genesis-border/50"
                >
                  <td className="py-2 px-2 text-genesis-text">
                    {entry.period_start} — {entry.period_end}
                  </td>
                  <td className="py-2 px-2 text-right text-genesis-text">
                    {entry.new_leads}
                  </td>
                  <td className="py-2 px-2 text-right text-genesis-text">
                    {entry.contacted}
                  </td>
                  <td className="py-2 px-2 text-right text-genesis-text">
                    {entry.qualified}
                  </td>
                  <td className="py-2 px-2 text-right text-genesis-text">
                    {entry.proposal_sent}
                  </td>
                  <td className="py-2 px-2 text-right text-genesis-positive">
                    {entry.converted}
                  </td>
                  <td className="py-2 px-2 text-right text-genesis-negative">
                    {entry.churned}
                  </td>
                  <td className="py-2 px-2 text-right">
                    <button
                      onClick={async () => {
                        await fetch(
                          `/api/metrics?table=pipeline_summary&id=${entry.id}`,
                          { method: "DELETE" }
                        );
                        await loadEntries();
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
