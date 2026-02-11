"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonthlyMetrics } from "@/types/database";
import { formatCurrency } from "@/lib/utils";

interface MetricsTabProps {
  clientId: string;
}

export function MetricsTab({ clientId }: MetricsTabProps) {
  const supabase = createClient();
  const [metrics, setMetrics] = useState<MonthlyMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    period_start: "",
    period_end: "",
    total_spend: "",
    total_leads: "",
    qualified_leads: "",
    cost_per_acquisition: "",
    spend_change_pct: "",
    leads_change_pct: "",
    qualified_change_pct: "",
    cpa_change_pct: "",
  });

  async function loadMetrics() {
    const { data } = await supabase
      .from("monthly_metrics")
      .select("*")
      .eq("client_id", clientId)
      .order("period_end", { ascending: false });
    setMetrics(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  function resetForm() {
    setForm({
      period_start: "",
      period_end: "",
      total_spend: "",
      total_leads: "",
      qualified_leads: "",
      cost_per_acquisition: "",
      spend_change_pct: "",
      leads_change_pct: "",
      qualified_change_pct: "",
      cpa_change_pct: "",
    });
    setEditingId(null);
    setShowForm(false);
  }

  function editMetric(m: MonthlyMetrics) {
    setForm({
      period_start: m.period_start,
      period_end: m.period_end,
      total_spend: String(m.total_spend),
      total_leads: String(m.total_leads),
      qualified_leads: String(m.qualified_leads),
      cost_per_acquisition: String(m.cost_per_acquisition),
      spend_change_pct: String(m.spend_change_pct),
      leads_change_pct: String(m.leads_change_pct),
      qualified_change_pct: String(m.qualified_change_pct),
      cpa_change_pct: String(m.cpa_change_pct),
    });
    setEditingId(m.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      client_id: clientId,
      period_start: form.period_start,
      period_end: form.period_end,
      total_spend: parseFloat(form.total_spend) || 0,
      total_leads: parseInt(form.total_leads) || 0,
      qualified_leads: parseInt(form.qualified_leads) || 0,
      cost_per_acquisition: parseFloat(form.cost_per_acquisition) || 0,
      spend_change_pct: parseFloat(form.spend_change_pct) || 0,
      leads_change_pct: parseFloat(form.leads_change_pct) || 0,
      qualified_change_pct: parseFloat(form.qualified_change_pct) || 0,
      cpa_change_pct: parseFloat(form.cpa_change_pct) || 0,
    };

    if (editingId) {
      await fetch("/api/metrics", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "monthly_metrics",
          id: editingId,
          data: payload,
        }),
      });
    } else {
      await fetch("/api/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "monthly_metrics", data: payload }),
      });
    }

    setSaving(false);
    resetForm();
    await loadMetrics();
  }

  if (loading) return <div className="text-genesis-muted text-sm">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-genesis-text">
          Monthly Metrics
        </h3>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="btn-secondary text-sm"
        >
          {showForm ? "Cancel" : "Add Period"}
        </button>
      </div>

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
              <label className="label">Total Spend ($)</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.total_spend}
                onChange={(e) =>
                  setForm({ ...form, total_spend: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="label">Total Leads</label>
              <input
                type="number"
                className="input"
                value={form.total_leads}
                onChange={(e) =>
                  setForm({ ...form, total_leads: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="label">Qualified Leads</label>
              <input
                type="number"
                className="input"
                value={form.qualified_leads}
                onChange={(e) =>
                  setForm({ ...form, qualified_leads: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">CPA ($)</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.cost_per_acquisition}
                onChange={(e) =>
                  setForm({ ...form, cost_per_acquisition: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Spend Change %</label>
              <input
                type="number"
                step="0.1"
                className="input"
                value={form.spend_change_pct}
                onChange={(e) =>
                  setForm({ ...form, spend_change_pct: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Leads Change %</label>
              <input
                type="number"
                step="0.1"
                className="input"
                value={form.leads_change_pct}
                onChange={(e) =>
                  setForm({ ...form, leads_change_pct: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Qualified Change %</label>
              <input
                type="number"
                step="0.1"
                className="input"
                value={form.qualified_change_pct}
                onChange={(e) =>
                  setForm({ ...form, qualified_change_pct: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">CPA Change %</label>
              <input
                type="number"
                step="0.1"
                className="input"
                value={form.cpa_change_pct}
                onChange={(e) =>
                  setForm({ ...form, cpa_change_pct: e.target.value })
                }
              />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Update" : "Add Metrics"}
          </button>
        </form>
      )}

      {metrics.length === 0 ? (
        <div className="text-genesis-muted text-sm">No metrics data yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-genesis-border">
                <th className="text-left py-2 px-2 text-genesis-muted font-medium">
                  Period
                </th>
                <th className="text-right py-2 px-2 text-genesis-muted font-medium">
                  Spend
                </th>
                <th className="text-right py-2 px-2 text-genesis-muted font-medium">
                  Leads
                </th>
                <th className="text-right py-2 px-2 text-genesis-muted font-medium">
                  Qualified
                </th>
                <th className="text-right py-2 px-2 text-genesis-muted font-medium">
                  CPA
                </th>
                <th className="text-right py-2 px-2 text-genesis-muted font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-genesis-border/50"
                >
                  <td className="py-2 px-2 text-genesis-text">
                    {m.period_start} — {m.period_end}
                  </td>
                  <td className="py-2 px-2 text-right text-genesis-text">
                    {formatCurrency(Number(m.total_spend))}
                  </td>
                  <td className="py-2 px-2 text-right text-genesis-text">
                    {m.total_leads}
                  </td>
                  <td className="py-2 px-2 text-right text-genesis-text">
                    {m.qualified_leads}
                  </td>
                  <td className="py-2 px-2 text-right text-genesis-text">
                    {formatCurrency(Number(m.cost_per_acquisition))}
                  </td>
                  <td className="py-2 px-2 text-right">
                    <button
                      onClick={() => editMetric(m)}
                      className="text-genesis-gold text-xs hover:underline mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        await fetch(
                          `/api/metrics?table=monthly_metrics&id=${m.id}`,
                          { method: "DELETE" }
                        );
                        await loadMetrics();
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
