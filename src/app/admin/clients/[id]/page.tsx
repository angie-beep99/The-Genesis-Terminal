'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { getMonthString } from '@/lib/utils';
import type {
  Company,
  MonthlyMetrics,
  Channel,
  DailyPerformance,
  Lead,
  Insight,
  ChannelName,
  LeadSource,
  LeadStatus,
  InsightContext,
} from '@/types/database';
import { CHANNEL_LABELS, SOURCE_LABELS, STATUS_LABELS } from '@/types/database';

type Tab = 'metrics' | 'channels' | 'daily' | 'leads' | 'insights';

const TABS: { key: Tab; label: string }[] = [
  { key: 'metrics', label: 'Key Metrics' },
  { key: 'channels', label: 'Channels' },
  { key: 'daily', label: 'Daily' },
  { key: 'leads', label: 'Leads' },
  { key: 'insights', label: 'Insights' },
];

export default function ClientManagePage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;
  const supabase = createSupabaseBrowser();

  const [company, setCompany] = useState<Company | null>(null);
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
    prev_total_leads: 0,
    prev_qualified_leads: 0,
    prev_revenue_pipeline: 0,
    prev_revenue_closed: 0,
  });
  const [metricsId, setMetricsId] = useState<string | null>(null);

  // Channels state
  const [channels, setChannels] = useState<Partial<Channel>[]>([]);

  // Daily performance state
  const [dailyRows, setDailyRows] = useState<Partial<DailyPerformance>[]>([]);

  // Leads state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [newLead, setNewLead] = useState({
    lead_name: '',
    company_name_lead: '',
    source: 'google_ads' as LeadSource,
    status: 'new' as LeadStatus,
    value: 0,
  });

  // Insights state
  const [insights, setInsights] = useState<Partial<Insight>[]>([]);

  const periodStart = getMonthString();

  const loadData = useCallback(async () => {
    const { data: companyData } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (!companyData) {
      router.push('/admin/clients');
      return;
    }
    setCompany(companyData);

    // Load all tab data in parallel
    const [metricsRes, channelsRes, dailyRes, leadsRes, insightsRes] = await Promise.all([
      supabase.from('monthly_metrics').select('*').eq('company_id', companyId).eq('period_start', periodStart).single(),
      supabase.from('channels').select('*').eq('company_id', companyId).eq('period_start', periodStart).order('spend', { ascending: false }),
      supabase.from('daily_performance').select('*').eq('company_id', companyId).order('date', { ascending: false }).limit(90),
      supabase.from('leads').select('*').eq('company_id', companyId).eq('is_archived', false).order('created_at', { ascending: false }),
      supabase.from('insights').select('*').eq('company_id', companyId).order('display_order', { ascending: true }),
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
          company_id: companyId,
          period_start: periodStart,
          channel_name: ch,
          spend: 0,
          leads: 0,
          trend_note: '',
        }))
      );
    }

    if (dailyRes.data) setDailyRows(dailyRes.data);
    if (leadsRes.data) setLeads(leadsRes.data);

    if (insightsRes.data && insightsRes.data.length > 0) {
      setInsights(insightsRes.data);
    } else {
      setInsights([
        { company_id: companyId, insight_text: '', context: 'overview' as InsightContext, display_order: 0 },
        { company_id: companyId, insight_text: '', context: 'overview' as InsightContext, display_order: 1 },
        { company_id: companyId, insight_text: '', context: 'overview' as InsightContext, display_order: 2 },
      ]);
    }

    setLoading(false);
  }, [companyId, periodStart, router, supabase]);

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
    const payload = { ...metrics, company_id: companyId, period_start: periodStart };

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
        company_id: companyId,
        period_start: periodStart,
        channel_name: ch.channel_name,
        spend: ch.spend || 0,
        leads: ch.leads || 0,
        trend_note: ch.trend_note || '',
      };

      if (ch.id) {
        await supabase.from('channels').update(payload).eq('id', ch.id);
      } else {
        const { data } = await supabase.from('channels').upsert(payload, { onConflict: 'company_id,period_start,channel_name' }).select().single();
        if (data) {
          setChannels((prev) => prev.map((c) => (c.channel_name === ch.channel_name ? { ...c, id: data.id } : c)));
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
      .upsert({ company_id: companyId, date: today, spend: 0, leads: 0 }, { onConflict: 'company_id,date' })
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
    if (!newLead.lead_name) return;
    setSaving(true);
    const { data } = await supabase
      .from('leads')
      .insert({ ...newLead, company_id: companyId })
      .select()
      .single();
    if (data) {
      setLeads((prev) => [data, ...prev]);
      setNewLead({ lead_name: '', company_name_lead: '', source: 'google_ads', status: 'new', value: 0 });
    }
    setSaving(false);
    showMessage('Lead added');
  };

  const archiveLead = async (id: string) => {
    await supabase.from('leads').update({ is_archived: true }).eq('id', id);
    setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  const saveInsights = async () => {
    setSaving(true);
    // Delete existing overview insights for this company and re-insert
    await supabase.from('insights').delete().eq('company_id', companyId).eq('context', 'overview');

    const validInsights = insights.filter((i) => i.insight_text?.trim());
    if (validInsights.length > 0) {
      await supabase.from('insights').insert(
        validInsights.map((i, idx) => ({
          company_id: companyId,
          insight_text: i.insight_text!,
          context: (i.context || 'overview') as InsightContext,
          display_order: idx,
          posted_date: new Date().toISOString().split('T')[0],
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
              {company?.company_name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {message && (
              <span className="text-xs text-genesis-positive animate-fade-in">{message}</span>
            )}
            <button
              onClick={() => window.open(`/dashboard?preview=${companyId}`, '_blank')}
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
                  <input type="number" value={metrics.prev_total_leads || ''} onChange={(e) => setMetrics({ ...metrics, prev_total_leads: parseInt(e.target.value) || 0 })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-genesis-muted uppercase tracking-wider mb-2">Qualified Leads</label>
                  <input type="number" value={metrics.prev_qualified_leads || ''} onChange={(e) => setMetrics({ ...metrics, prev_qualified_leads: parseInt(e.target.value) || 0 })} className={inputClass} />
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
                <div key={ch.channel_name || idx} className="p-5 bg-genesis-bg rounded-xl border border-genesis-border">
                  <p className="text-sm font-medium text-genesis-text mb-4">
                    {CHANNEL_LABELS[ch.channel_name as ChannelName] || ch.channel_name}
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
                  <label className="block text-xs text-genesis-muted uppercase tracking-wider mb-2">Lead Name</label>
                  <input type="text" value={newLead.lead_name} onChange={(e) => setNewLead({ ...newLead, lead_name: e.target.value })} className={inputClass} placeholder="Lead name" />
                </div>
                <div>
                  <label className="block text-xs text-genesis-muted uppercase tracking-wider mb-2">Company</label>
                  <input type="text" value={newLead.company_name_lead} onChange={(e) => setNewLead({ ...newLead, company_name_lead: e.target.value })} className={inputClass} placeholder="Company name" />
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
                <div className="sm:col-span-2">
                  <button onClick={addLead} disabled={saving || !newLead.lead_name} className="bg-genesis-gold hover:bg-genesis-gold/90 text-genesis-bg font-medium rounded-xl px-6 py-3 text-sm transition-all disabled:opacity-50">
                    {saving ? 'Adding...' : 'Add Lead'}
                  </button>
                </div>
              </div>

              <h3 className="text-base font-semibold text-genesis-text">Existing Leads ({leads.length})</h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {leads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-4 bg-genesis-bg rounded-xl border border-genesis-border">
                    <div>
                      <p className="text-sm font-medium text-genesis-text">{lead.lead_name}</p>
                      <p className="text-xs text-genesis-muted">
                        {lead.source ? SOURCE_LABELS[lead.source] : 'Unknown'} &middot; {STATUS_LABELS[lead.status]} &middot; ${lead.value.toLocaleString()}
                      </p>
                    </div>
                    <button onClick={() => archiveLead(lead.id)} className="text-xs text-genesis-negative/70 hover:text-genesis-negative transition-colors">
                      Archive
                    </button>
                  </div>
                ))}
              </div>
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
                      { company_id: companyId, insight_text: '', context: 'overview' as InsightContext, display_order: prev.length },
                    ])
                  }
                  className="text-sm text-genesis-gold hover:underline"
                >
                  + Add Insight
                </button>
              </div>

              {insights.map((insight, idx) => (
                <div key={idx} className="relative">
                  <div className="mb-2">
                    <select
                      value={insight.context || 'overview'}
                      onChange={(e) => {
                        setInsights((prev) =>
                          prev.map((ins, i) => (i === idx ? { ...ins, context: e.target.value as InsightContext } : ins))
                        );
                      }}
                      className="bg-genesis-bg border border-genesis-border rounded-lg px-3 py-1.5 text-genesis-text text-xs"
                    >
                      <option value="overview">Overview</option>
                      <option value="google_ads">Google Ads</option>
                      <option value="meta">Meta</option>
                      <option value="bing">Bing</option>
                      <option value="tiktok">TikTok</option>
                    </select>
                  </div>
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
