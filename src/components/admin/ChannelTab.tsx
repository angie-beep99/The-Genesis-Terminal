"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChannelBreakdown, Channel } from "@/types/database";
import { channelLabel, formatCurrency } from "@/lib/utils";

interface ChannelTabProps {
  clientId: string;
}

const allChannels: Channel[] = ["google_ads", "meta", "bing", "tiktok"];

export function ChannelTab({ clientId }: ChannelTabProps) {
  const supabase = createClient();
  const [entries, setEntries] = useState<ChannelBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    period_start: "",
    period_end: "",
    channel: "google_ads" as Channel,
    spend: "",
    leads: "",
  });

  async function loadEntries() {
    const { data } = await supabase
      .from("channel_breakdown")
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    await fetch("/api/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "channel_breakdown",
        data: {
          client_id: clientId,
          period_start: form.period_start,
          period_end: form.period_end,
          channel: form.channel,
          spend: parseFloat(form.spend) || 0,
          leads: parseInt(form.leads) || 0,
        },
      }),
    });

    setSaving(false);
    setForm({
      period_start: "",
      period_end: "",
      channel: "google_ads",
      spend: "",
      leads: "",
    });
    setShowForm(false);
    await loadEntries();
  }

  if (loading) return <div className="text-genesis-muted text-sm">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-genesis-text">
          Channel Breakdown
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-secondary text-sm"
        >
          {showForm ? "Cancel" : "Add Channel Data"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
              <label className="label">Channel</label>
              <select
                className="input"
                value={form.channel}
                onChange={(e) =>
                  setForm({ ...form, channel: e.target.value as Channel })
                }
              >
                {allChannels.map((ch) => (
                  <option key={ch} value={ch}>
                    {channelLabel(ch)}
                  </option>
                ))}
              </select>
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
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Add"}
          </button>
        </form>
      )}

      {entries.length === 0 ? (
        <div className="text-genesis-muted text-sm">
          No channel breakdown data yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-genesis-border">
                <th className="text-left py-2 px-2 text-genesis-muted font-medium">
                  Period
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
                  <td className="py-2 px-2 text-genesis-text">
                    {entry.period_start} — {entry.period_end}
                  </td>
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
                          `/api/metrics?table=channel_breakdown&id=${entry.id}`,
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
