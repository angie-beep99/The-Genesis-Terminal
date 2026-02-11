'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { getMonthString } from '@/lib/utils';
import type {
  Client,
  MonthlyMetrics,
  ChannelData,
  DailyPerformance,
  Lead,
  PipelineSummary,
  Insight,
  ChannelName,
  LeadSource,
  LeadStatus,
} from '@/types/database';
import { CHANNEL_LABELS, SOURCE_LABELS, STATUS_LABELS } from '@/types/database';

type Tab = 'metrics' | 'channels' | 'daily' | 'leads' | 'pipeline' | 'insights';

const TABS: { key: Tab; label: string }[] = [
  { key: 'metrics', label: 'Key Metrics' },
  { key: 'channels', label: 'Channels' },
  { key: 'daily', label: 'Daily' },
  { key: 'leads', label: 'Leads' },
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'insights', label: 'Insights' },
];

export default function ClientManagePage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const supabase = createSupabaseBrowser();

  const [client, setClient] = useState<Client | null>(null);
  const [tab, setTab] = useState<Tab>('metrics');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Metrics state
  const [metrics, setMetrics] = useState<Partial<MonthlyMetrics>>({
    money_invested: 0,
    total_leads: 0,
    qualified_leads: 0,
    revenue_pipeline: 0,
    revenue_closed: 0,
    prev_money_invested: 0,
    prev_leads: 0,
    prev_qualified: 0,
    prev_revenue_pipeline: 0,
    prev_revenue_closed: 0,
  });
  const [metricsId, setMetricsId] = useState<string | null>(null);

  // Channels state
  const [channels, setChannels] = useState<Partial<ChannelData>[]>([]);

  // Daily performance state
  const [dailyRows, setDailyRows] = useState<Partial<DailyPerformance>[]>([]);

  // Leads state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [newLead, setNewLead] = useState({
    name: '',
    company: '',
    source: 'google_ads' as LeadSource,
    status: 'new' as LeadStatus,
    value: 0,
    notes: '',
  });

  // Pipeline state
  const [pipeline, setPipeline] = useState<Partial<PipelineSummary>>({
    new_leads: 0,
    in_conversation: 0,
    won: 0,
    lost: 0,
  });
  const [pipelineId, setPipelineId] = useState<string | null>(null);

  // Insights state
  const [insights, setInsights] = useState<Partial<Insight>[]>([]);

  const month = getMonthString();

  const loadData = useCallback(async () => {
    const { data: clientData } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (!clientData) {
      router.push('/admin/clients');
      return;
    }
    setClient(clientData);

    // Load all tab data in parallel
    const [metricsRes, channelsRes, dailyRes, leadsRes, pipelineRes, insightsRes] = await Promise.all([
      supabase.from('monthly_metrics').select('*').eq('client_id', clientId).eq('month', month).single(),
      supabase.from('channel_data').select('*').eq('client_id', clientId).eq('month', month).order('spend', { ascending: false }),
      supabase.from('daily_performance').select('*').eq('client_id', clientId).order('date', { ascending: false }).limit(90),
      supabase.from('leads').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      supabase.from('pipeline_summary').select('*').eq('client_id', clientId).eq('month', month).single(),
      supabase.from('insights').select('*').eq('client_id', clientId).eq('month', month).order('display_order', { ascending: true }),
    ]);

    if (metricsRes.data) {
      setMetrics(metricsRes.data);
      setMetricsId(metricsRes.data.id);
    }

    if (channelsRes.data && channelsRes.data.length > 0) {
      setChannels(channelsRes.data);
    } else {
      // Initialize with default channels
      setChannels(
        (['google_ads', 'meta', 'bing', 'tiktok'] as ChannelName[]).map((ch) => ({
          client_id: clientId,
          month,
          channel: ch,
          spend: 0,
          leads: 0,
          trend_note: '',
        }))
      );
    }

    if (dailyRes.data) setDailyRows(dailyRes.data);
    if (leadsRes.data) setLeads(leadsRes.data);

    if (pipelineRes.data) {
      setPipeline(pipelineRes.data);
      setPipelineId(pipelineRes.data.id);
    }

    if (insightsRes.data && insightsRes.data.length > 0) {
      setInsights(insightsRes.data);
    } else {
      setInsights([
        { client_id: clientId, month, insight_text: '', display_order: 0 },
        { client_id: clientId, month, insight_text: '', display_order: 1 },
        { client_id: clientId, month, insight_text: '', display_order: 2 },
      ]);
    }

    setLoading(false);
  }, [clientId, month, router, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  // Save functions for each tab
  const saveMetrics = async () => {
    setSaving(true);
    const payload = { ...metrics, client_id: clientId, month };

    if (metricsId) {
      await supabase.from('monthly_metrics').update(payload).eq('id', metricsId);
    } else {
      const { data } = await supabase.from('monthly_metrics').insert(payload).select().single();
      if (data) setMetricsId(data.id);
    }
    setSaving(false);
    showMessage('Metrics saved');
  };

  const saveChannels = async () => {
    setSaving(true);
    for (const ch of channels) {
      const payload = {
        client_id: clientId,
        month,
        channel: ch.channel,
        spend: ch.spend || 0,
        leads: ch.leads || 0,
        trend_note: ch.trend_note || '',
      };

      if (ch.id) {
        await supabase.from('channel_data').update(payload).eq('id', ch.id);
      } else {
        const { data } = await supabase.from('channel_data').upsert(payload, { onConflict: 'client_id,month,channel' }).select().single();
        if (data) {
          setChannels((prev) => prev.map((c) => (c.channel === ch.channel ? { ...c, id: data.id } : c)));
        }
      }
    }
    setSaving(false);
    showMessage('Channel data saved');
  };

  const addDailyRow = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('daily_performance')
      .upsert({ client_id: clientId, date: today, spend: 0, leads: 0 }, { onConflict: 'client_id,date' })
      .select()
      .single();
    if (data) {
      setDailyRows((prev) => [data, ...prev]);
    }
  };

  const updateDailyRow = async (id: string, field: string, value: number) => {
    await supabase.from('daily_performance').update({ [field]: value }).eq('id', id);
    setDailyRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const addLead = async () => {
    if (!newLead.name) return;
    setSaving(true);
    const { data } = await supabase
      .from('leads')
      .insert({ ...newLead, client_id: clientId })
      .select()
      .single();
    if (data) {
      setLeads((prev) => [data, ...prev]);
      setNewLead({ name: '', company: '', source: 'google_ads', status: 'new', value: 0, notes: '' });
    }
    setSaving(false);
    showMessage('Lead added');
  };

  const deleteLead = async (id: string) => {
    await supabase.from('leads').delete().eq('id', id);
    setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  const savePipeline = async () => {
    setSaving(true);
    const payload = { ...pipeline, client_id: clientId, month };

    if (pipelineId) {
      await supabase.from('pipeline_summary').update(payload).eq('id', pipelineId);
    } else {
      const { data } = await supabase.from('pipeline_summary').insert(payload).select().single();
      if (data) setPipelineId(data.id);
    }
    setSaving(false);
    showMessage('Pipeline saved');
  };

  const saveInsights = async () => {
    setSaving(true);
    // Delete existing and re-insert
    await supabase.from('insights').delete().eq('client_id', clientId).eq('month', month);

    const validInsights = insights.filter((i) => i.insight_text?.trim());
    if (validInsights.length > 0) {
      await supabase.from('insights').insert(
        validInsights.map((i, idx) => ({
          client_id: clientId,
          month,
          insight_text: i.insight_text!,
          display_order: idx,
        }))
      );
    }
    setSaving(false);
    showMessage('Insights saved');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-genesis-bg flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-genesis-gold animate-pulse-slow" />
      </div>
    );
  }

  const inputClass = 'w-full bg-genesis-bg border border-genesis-border rounded-xl px-4 py-3 text-genesis-text text-sm';

  return (
    <div className="min-h-screen bg-genesis-bg">
      {/* Header */}
      <header className="border-b border-genesis-border bg-genesis-bg/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/clients')}
              className="text-sm text-genesis-muted hover:text-genesis-text transition-colors"
            >
              &larr; Clients
            </button>
            <span className="text-genesis-border">/</span>
            <span className="text-[15px] font-semibold text-genesis-text">
              {client?.company_name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {message && (
              <span className="text-xs text-genesis-positive animate-fade-in">{message}</span>
            )}
            <button
              onClick={() => window.open(`/dashboard?preview=${clientId}`, '_blank')}
              className="text-xs text-genesis-gold border border-genesis-gold/30 rounded-lg px-3 py-1.5 hover:bg-genesis-gold/10 transition-all"
            >
              View as Client
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
        {/* Tab navigation */}
        <div className="flex gap-1 mb-8 overflow-x-auto pb-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                tab === t.key
                  ? 'bg-genesis-gold text-genesis-bg'
                  : 'text-genesis-muted hover:text-genesis-text hover:bg-genesis-card'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-genesis-card border border-genesis-border rounded-card p-6 sm:p-8">
          {/* ==================== METRICS TAB ==================== */}
          {tab === 'metrics' && (
            <div className="space-y-6">
              <h3 className="text-base font-semibold text-genesis-text mb-4">This Month</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-genesis-muted uppercase tracking-wider mb-2">Money Invested ($)</label>
                  <input type="number" value={metrics.money_invested || ''} onChange={(e) => setMetrics({ ...metrics, money_invested: parseFloat(e.target.value) || 0 })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-genesis-muted uppercase tracking-wider mb-2">Total Leads</label>
                  <input type="number" value={metrics.total_leads || ''} onChange={(e) => setMetrics({ ...metrics, total_leads: parseInt(e.target.value) || 0 })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-genesis-muted uppercase tracking-wider mb-2">Qualified Leads</label>
                  <input type="number" value={metrics.qualified_leads || ''} onChange={(e) => setMetrics({ ...metrics, qualified_leads: parseInt(e.target.value) || 0 })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-genesis-muted uppercase tracking-wider mb-2">Revenue Pipeline ($)</label>
                  <input type="number" value={metrics.revenue_pipeline || ''} onChange={(e) => setMetrics({ ...metrics, revenue_pipeline: parseFloat(e.target.value) || 0 })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-genesis-muted uppercase tracking-wider mb-2">Revenue Closed ($)</label>
                  <input type="number" value={metrics.revenue_closed || ''} onChange={(e) => setMetrics({ ...metrics, revenue_closed: parseFloat(e.target.value) || 0 })} className={inputClass} />
                </div>
              </div>

              <hr className="border-genesis-border" />
              <h3 className="text-base font-semibold text-genesis-text mb-4">Last Month (for comparison)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-genesis-muted uppercase tracking-wider mb-2">Money Invested ($)</label>
                  <input type="number" value={metrics.prev_money_invested || ''} onChange={(e) => setMetrics({ ...metrics, prev_money_invested: parseFloat(e.target.value) || 0 })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-genesis-muted uppercase tracking-wider mb-2">Total Leads</label>
                  <input type="number" value={metrics.prev_leads || ''} onChange={(e) => setMetrics({ ...metrics, prev_leads: parseInt(e.target.value) || 0 })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-genesis-muted uppercase tracking-wider mb-2">Qualified Leads</label>
                  <input type="number" value={metrics.prev_qualified || ''} onChange={(e) => setMetrics({ ...metrics, prev_qualified: parseInt(e.target.value) || 0 })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-genesis-muted uppercase tracking-wider mb-2">Revenue Pipeline ($)</label>
                  <input type="number" value={metrics.prev_revenue_pipeline || ''} onChange={(e) => setMetrics({ ...metrics, prev_revenue_pipeline: parseFloat(e.target.value) || 0 })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-genesis-muted uppercase tracking-wider mb-2">Revenue Closed ($)</label>
                  <input type="number" value={metrics.prev_revenue_closed || ''} onChange={(e) => setMetrics({ ...metrics, prev_revenue_closed: parseFloat(e.target.value) || 0 })} className={inputClass} />
                </div>
              </div>

              <button onClick={saveMetrics} disabled={saving} className="bg-genesis-gold hover:bg-genesis-gold/90 text-genesis-bg font-medium rounded-xl px-6 py-3 text-sm transition-all disabled:opacity-50 mt-4">
                {saving ? 'Saving...' : 'Save Metrics'}
              </button>
            </div>
          )}

          {/* ==================== CHANNELS TAB ==================== */}
          {tab === 'channels' && (
            <div className="space-y-6">
              {channels.map((ch, idx) => (
                <div key={ch.channel || idx} className="p-5 bg-genesis-bg rounded-xl border border-genesis-border">
                  <p className="text-sm font-medium text-genesis-text mb-4">
                    {CHANNEL_LABELS[ch.channel as ChannelName] || ch.channel}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-genesis-muted uppercase tracking-wider mb-2">Spend ($)</label>
                      <input
                        type="number"
                        value={ch.spend || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setChannels((prev) => prev.map((c, i) => (i === idx ? { ...c, spend: val } : c)));
                        }}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-genesis-muted uppercase tracking-wider mb-2">Leads</label>
                      <input
                        type="number"
                        value={ch.leads || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setChannels((prev) => prev.map((c, i) => (i === idx ? { ...c, leads: val } : c)));
                        }}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-genesis-muted uppercase tracking-wider mb-2">Trend Note</label>
                      <input
                        type="text"
                        value={ch.trend_note || ''}
                        onChange={(e) => {
                          setChannels((prev) => prev.map((c, i) => (i === idx ? { ...c, trend_note: e.target.value } : c)));
                        }}
                        className={inputClass}
                        placeholder="Best performer, Stable, Under review..."
                      />
                    </div>
                  </div>
                  {ch.spend && ch.leads ? (
                    <p className="text-xs text-genesis-muted mt-3">
                      Cost per lead: <span className="text-genesis-gold">${(ch.spend / ch.leads).toFixed(0)}</span>
                    </p>
                  ) : null}
                </div>
              ))}

              <button onClick={saveChannels} disabled={saving} className="bg-genesis-gold hover:bg-genesis-gold/90 text-genesis-bg font-medium rounded-xl px-6 py-3 text-sm transition-all disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Channel Data'}
              </button>
            </div>
          )}

          {/* ==================== DAILY TAB ==================== */}
          {tab === 'daily' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-genesis-text">Daily Performance</h3>
                <button onClick={addDailyRow} className="text-sm text-genesis-gold hover:underline">
                  + Add Today
                </button>
              </div>

              {dailyRows.length === 0 ? (
                <p className="text-sm text-genesis-muted py-8 text-center">No daily data yet. Click &ldquo;+ Add Today&rdquo; to start.</p>
              ) : (
                <div className="space-y-2">
                  {dailyRows.slice(0, 30).map((row) => (
                    <div key={row.id} className="grid grid-cols-3 gap-3 items-center p-3 bg-genesis-bg rounded-xl border border-genesis-border">
                      <div>
                        <p className="text-xs text-genesis-muted mb-1">Date</p>
                        <p className="text-sm text-genesis-text">{row.date}</p>
                      </div>
                      <div>
                        <p className="text-xs text-genesis-muted mb-1">Spend ($)</p>
                        <input
                          type="number"
                          value={row.spend || ''}
                          onChange={(e) => updateDailyRow(row.id!, 'spend', parseFloat(e.target.value) || 0)}
                          className="w-full bg-genesis-card border border-genesis-border rounded-lg px-3 py-2 text-genesis-text text-sm"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-genesis-muted mb-1">Leads</p>
                        <input
                          type="number"
                          value={row.leads || ''}
                          onChange={(e) => updateDailyRow(row.id!, 'leads', parseInt(e.target.value) || 0)}
                          className="w-full bg-genesis-card border border-genesis-border rounded-lg px-3 py-2 text-genesis-text text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== LEADS TAB ==================== */}
          {tab === 'leads' && (
            <div className="space-y-6">
              <h3 className="text-base font-semibold text-genesis-text mb-4">Add Lead</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-genesis-bg rounded-xl border border-genesis-border">
                <div>
                  <label className="block text-xs text-genesis-muted uppercase tracking-wider mb-2">Name</label>
                  <input type="text" value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} className={inputClass} placeholder="Lead name" />
                </div>
                <div>
                  <label className="block text-xs text-genesis-muted uppercase tracking-wider mb-2">Company</label>
                  <input type="text" value={newLead.company} onChange={(e) => setNewLead({ ...newLead, company: e.target.value })} className={inputClass} placeholder="Company name" />
                </div>
                <div>
                  <label className="block text-xs text-genesis-muted uppercase tracking-wider mb-2">Source</label>
                  <select value={newLead.source} onChange={(e) => setNewLead({ ...newLead, source: e.target.value as LeadSource })} className={inputClass}>
                    {Object.entries(SOURCE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-genesis-muted uppercase tracking-wider mb-2">Status</label>
                  <select value={newLead.status} onChange={(e) => setNewLead({ ...newLead, status: e.target.value as LeadStatus })} className={inputClass}>
                    {Object.entries(STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-genesis-muted uppercase tracking-wider mb-2">Value ($)</label>
                  <input type="number" value={newLead.value || ''} onChange={(e) => setNewLead({ ...newLead, value: parseFloat(e.target.value) || 0 })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-genesis-muted uppercase tracking-wider mb-2">Notes</label>
                  <input type="text" value={newLead.notes} onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })} className={inputClass} placeholder="Optional notes" />
                </div>
                <div className="sm:col-span-2">
                  <button onClick={addLead} disabled={saving || !newLead.name} className="bg-genesis-gold hover:bg-genesis-gold/90 text-genesis-bg font-medium rounded-xl px-6 py-3 text-sm transition-all disabled:opacity-50">
                    {saving ? 'Adding...' : 'Add Lead'}
                  </button>
                </div>
              </div>

              <h3 className="text-base font-semibold text-genesis-text">Existing Leads ({leads.length})</h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {leads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-4 bg-genesis-bg rounded-xl border border-genesis-border">
                    <div>
                      <p className="text-sm font-medium text-genesis-text">{lead.name}</p>
                      <p className="text-xs text-genesis-muted">
                        {SOURCE_LABELS[lead.source]} &middot; {STATUS_LABELS[lead.status]} &middot; ${lead.value.toLocaleString()}
                      </p>
                    </div>
                    <button onClick={() => deleteLead(lead.id)} className="text-xs text-genesis-negative/70 hover:text-genesis-negative transition-colors">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== PIPELINE TAB ==================== */}
          {tab === 'pipeline' && (
            <div className="space-y-6">
              <h3 className="text-base font-semibold text-genesis-text mb-4">Pipeline Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-genesis-muted uppercase tracking-wider mb-2">New Leads</label>
                  <input type="number" value={pipeline.new_leads || ''} onChange={(e) => setPipeline({ ...pipeline, new_leads: parseInt(e.target.value) || 0 })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-genesis-muted uppercase tracking-wider mb-2">In Conversation</label>
                  <input type="number" value={pipeline.in_conversation || ''} onChange={(e) => setPipeline({ ...pipeline, in_conversation: parseInt(e.target.value) || 0 })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-genesis-muted uppercase tracking-wider mb-2">Won</label>
                  <input type="number" value={pipeline.won || ''} onChange={(e) => setPipeline({ ...pipeline, won: parseInt(e.target.value) || 0 })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-genesis-muted uppercase tracking-wider mb-2">Lost</label>
                  <input type="number" value={pipeline.lost || ''} onChange={(e) => setPipeline({ ...pipeline, lost: parseInt(e.target.value) || 0 })} className={inputClass} />
                </div>
              </div>

              <button onClick={savePipeline} disabled={saving} className="bg-genesis-gold hover:bg-genesis-gold/90 text-genesis-bg font-medium rounded-xl px-6 py-3 text-sm transition-all disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Pipeline'}
              </button>
            </div>
          )}

          {/* ==================== INSIGHTS TAB ==================== */}
          {tab === 'insights' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-genesis-text">Insights</h3>
                  <p className="text-xs text-genesis-muted mt-1">Write plain English updates for your client. No jargon.</p>
                </div>
                <button
                  onClick={() =>
                    setInsights((prev) => [
                      ...prev,
                      { client_id: clientId, month, insight_text: '', display_order: prev.length },
                    ])
                  }
                  className="text-sm text-genesis-gold hover:underline"
                >
                  + Add Insight
                </button>
              </div>

              {insights.map((insight, idx) => (
                <div key={idx} className="relative">
                  <textarea
                    value={insight.insight_text || ''}
                    onChange={(e) => {
                      setInsights((prev) =>
                        prev.map((ins, i) => (i === idx ? { ...ins, insight_text: e.target.value } : ins))
                      );
                    }}
                    className={`${inputClass} min-h-[100px] resize-none`}
                    placeholder={`Insight ${idx + 1}: Write like you're explaining to a friend...`}
                  />
                  {insights.length > 1 && (
                    <button
                      onClick={() => setInsights((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-2 right-2 text-xs text-genesis-muted hover:text-genesis-negative transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}

              <button onClick={saveInsights} disabled={saving} className="bg-genesis-gold hover:bg-genesis-gold/90 text-genesis-bg font-medium rounded-xl px-6 py-3 text-sm transition-all disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Insights'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
