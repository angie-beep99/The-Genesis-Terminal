"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DailyPerformance, Channel } from "@/types/database";
import { channelLabel, formatCurrency } from "@/lib/utils";

interface DailyPerformanceTabProps {
  clientId: string;
}

const channels: Channel[] = ["google_ads", "meta", "bing", "tiktok"];

export function DailyPerformanceTab({ clientId }: DailyPerformanceTabProps) {
  const supabase = createClient();
  const [entries, setEntries] = useState<DailyPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [form, setForm] = useState({
    date: "",
    spend: "",
    leads: "",
    channel: "google_ads" as Channel,
  });

  async function loadEntries() {
    const { data } = await supabase
      .from("daily_performance")
      .select("*")
      .eq("client_id", clientId)
      .order("date", { ascending: false })
      .limit(50);
    setEntries(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    await fetch("/api/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "daily_performance",
        data: {
          client_id: clientId,
          date: form.date,
          spend: parseFloat(form.spend) || 0,
          leads: parseInt(form.leads) || 0,
          channel: form.channel,
        },
      }),
    });

    setSaving(false);
    setForm({ date: "", spend: "", leads: "", channel: "google_ads" });
    setShowForm(false);
    await loadEntries();
  }

  async function handleBulkImport() {
    setSaving(true);
    const lines = csvText.trim().split("\n");
    const rows = lines
      .map((line) => {
        const [date, spend, leads, channel] = line.split(",").map((s) => s.trim());
        if (!date || !spend || !leads || !channel) return null;
        return {
          client_id: clientId,
          date,
          spend: parseFloat(spend) || 0,
          leads: parseInt(leads) || 0,
          channel,
        };
      })
      .filter(Boolean);

    for (const row of rows) {
      await fetch("/api/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "daily_performance", data: row }),
      });
    }

    setSaving(false);
    setCsvText("");
    setBulkMode(false);
    await loadEntries();
  }

  if (loading) return <div className="text-genesis-muted text-sm">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-genesis-text">
          Daily Performance
        </h3>
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
              setShowForm(!showForm);
              setBulkMode(false);
            }}
            className="btn-secondary text-sm"
          >
            {showForm ? "Cancel" : "Add Day"}
          </button>
        </div>
      </div>

      {bulkMode && (
        <div className="card mb-4 space-y-3">
          <p className="text-xs text-genesis-muted">
            Paste CSV: date, spend, leads, channel (one per line)
          </p>
          <textarea
            className="input min-h-[120px] font-mono text-xs"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="2024-01-15, 1500.00, 25, google_ads&#10;2024-01-15, 800.00, 12, meta"
          />
          <button
            onClick={handleBulkImport}
            disabled={saving || !csvText.trim()}
            className="btn-primary text-sm"
          >
            {saving ? "Importing..." : "Import"}
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Spend ($)</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.spend}
                onChange={(e) => setForm({ ...form, spend: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Leads</label>
              <input
                type="number"
                className="input"
                value={form.leads}
                onChange={(e) => setForm({ ...form, leads: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Channel</label>
              <select
                className="input"
                value={form.channel}
                onChange={(e) =>
                  setForm({ ...form, channel: e.target.value as Channel })
                }
              >
                {channels.map((ch) => (
                  <option key={ch} value={ch}>
                    {channelLabel(ch)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Adding..." : "Add Entry"}
          </button>
        </form>
      )}

      {entries.length === 0 ? (
        <div className="text-genesis-muted text-sm">
          No daily performance data yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-genesis-border">
                <th className="text-left py-2 px-2 text-genesis-muted font-medium">
                  Date
                </th>
                <th className="text-left py-2 px-2 text-genesis-muted font-medium">
                  Channel
                </th>
                <th className="text-right py-2 px-2 text-genesis-muted font-medium">
                  Spend
                </th>
                <th className="text-right py-2 px-2 text-genesis-muted font-medium">
                  Leads
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
                  <td className="py-2 px-2 text-genesis-text">{entry.date}</td>
                  <td className="py-2 px-2 text-genesis-muted">
                    {channelLabel(entry.channel)}
                  </td>
                  <td className="py-2 px-2 text-right text-genesis-text">
                    {formatCurrency(Number(entry.spend))}
                  </td>
                  <td className="py-2 px-2 text-right text-genesis-text">
                    {entry.leads}
                  </td>
                  <td className="py-2 px-2 text-right">
                    <button
                      onClick={async () => {
                        await fetch(
                          `/api/metrics?table=daily_performance&id=${entry.id}`,
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
