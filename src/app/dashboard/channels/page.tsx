'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getChannels, getCampaigns, getInsights, getDailyPerformance } from '@/lib/data';
import type {
  Channel,
  Campaign,
  Insight,
  DailyPerformance,
  ChannelName,
  InsightContext,
} from '@/types/database';
import {
  CHANNEL_LABELS,
  CHANNEL_COLORS,
} from '@/types/database';
import { formatCurrency, formatNumber, cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

type TabKey = 'all' | ChannelName;

interface TabDef {
  key: TabKey;
  label: string;
}

const TABS: TabDef[] = [
  { key: 'all', label: 'All Channels' },
  { key: 'google_ads', label: 'Google Ads' },
  { key: 'meta', label: 'Meta' },
  { key: 'bing', label: 'Bing' },
  { key: 'tiktok', label: 'TikTok' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function channelToInsightContext(name: string): InsightContext {
  return name as InsightContext;
}

function statusBadge(status: Campaign['status']) {
  const map: Record<Campaign['status'], { bg: string; text: string; label: string }> = {
    active: { bg: 'bg-genesis-positive/20', text: 'text-genesis-positive', label: 'Active' },
    paused: { bg: 'bg-genesis-muted/20', text: 'text-genesis-muted', label: 'Paused' },
    testing: { bg: 'bg-genesis-info/20', text: 'text-genesis-info', label: 'Testing' },
  };
  const s = map[status];
  return (
    <span className={cn(s.bg, s.text, 'text-xs font-medium px-2 py-0.5 rounded-full')}>
      {s.label}
    </span>
  );
}

function trendArrow(cpl: number, avgCpl: number) {
  if (avgCpl === 0) return <span className="text-genesis-muted">--</span>;
  const diff = ((cpl - avgCpl) / avgCpl) * 100;
  if (Math.abs(diff) < 2) return <span className="text-genesis-muted">~</span>;
  if (diff < 0) {
    return <span className="text-genesis-positive text-sm">&#9650; {Math.abs(diff).toFixed(1)}%</span>;
  }
  return <span className="text-genesis-negative text-sm">&#9660; {Math.abs(diff).toFixed(1)}%</span>;
}

// ---------------------------------------------------------------------------
// Custom Tooltip for Charts
// ---------------------------------------------------------------------------

interface ChartPayloadItem {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-genesis-card border border-genesis-border rounded-card px-4 py-3 shadow-lg">
      <p className="text-xs text-genesis-muted mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {entry.dataKey === 'spend' ? formatCurrency(entry.value) : formatNumber(entry.value)}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metric Card (BigFour style)
// ---------------------------------------------------------------------------

function MetricCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-genesis-card border border-genesis-border rounded-card p-6 flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wider text-genesis-muted">{label}</span>
      <span className="text-2xl font-semibold text-genesis-text">{value}</span>
      {subtitle && <span className="text-xs text-genesis-secondary">{subtitle}</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// All Channels — expandable row
// ---------------------------------------------------------------------------

function ChannelRow({
  channel,
  campaigns,
  dailyData,
  avgCpl,
}: {
  channel: Channel;
  campaigns: Campaign[];
  dailyData: DailyPerformance[];
  avgCpl: number;
}) {
  const [expanded, setExpanded] = useState(false);

  // Build 30-day chart data from dailyData (already limited at fetch-time to 90 days)
  const chartData = useMemo(() => {
    const last30 = dailyData.slice(-30);
    return last30.map((d) => ({
      date: format(parseISO(d.date), 'MMM d'),
      leads: d.leads,
      spend: d.spend,
    }));
  }, [dailyData]);

  const topCampaigns = campaigns
    .filter((c) => c.channel_name === channel.channel_name)
    .slice(0, 3);

  const bestDay = useMemo(() => {
    if (dailyData.length === 0) return null;
    return dailyData.reduce((best, d) => (d.leads > best.leads ? d : best), dailyData[0]);
  }, [dailyData]);

  const conversionRate = channel.leads > 0 ? '--' : '--';
  const color = CHANNEL_COLORS[channel.channel_name] || '#C9A96E';

  return (
    <div className="bg-genesis-card border border-genesis-border rounded-card overflow-hidden">
      {/* Summary row */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full grid grid-cols-6 items-center gap-4 px-6 py-4 text-left hover:bg-genesis-card-hover transition-colors"
      >
        {/* Channel name */}
        <div className="flex items-center gap-2 col-span-1">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
          <span className="text-sm font-medium text-genesis-text truncate">
            {CHANNEL_LABELS[channel.channel_name] || channel.channel_name}
          </span>
        </div>

        {/* Spend */}
        <span className="text-sm text-genesis-text">{formatCurrency(channel.spend)}</span>

        {/* Leads */}
        <span className="text-sm text-genesis-text">{formatNumber(channel.leads)}</span>

        {/* CPL */}
        <span className="text-sm text-genesis-text">{formatCurrency(channel.cost_per_lead)}</span>

        {/* Conv Rate */}
        <span className="text-sm text-genesis-muted">{conversionRate}</span>

        {/* Trend */}
        <div className="flex items-center justify-between">
          {trendArrow(channel.cost_per_lead, avgCpl)}
          <svg
            className={cn(
              'w-4 h-4 text-genesis-muted transition-transform',
              expanded && 'rotate-180'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-genesis-border px-6 py-5 space-y-5 animate-fade-in">
          {/* 30-day mini chart */}
          {chartData.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wider text-genesis-muted mb-3">30-Day Performance</h4>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id={`grad-${channel.channel_name}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E1E22" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#52525B' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#52525B' }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="leads"
                      name="Leads"
                      stroke={color}
                      fill={`url(#grad-${channel.channel_name})`}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Top Campaigns */}
          {topCampaigns.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wider text-genesis-muted mb-2">Top Campaigns</h4>
              <ul className="space-y-1">
                {topCampaigns.map((c) => (
                  <li key={c.id} className="flex items-center justify-between text-sm py-1">
                    <span className="text-genesis-secondary truncate max-w-[60%]">{c.campaign_name}</span>
                    <span className="text-genesis-text">{formatNumber(c.leads)} leads &middot; {formatCurrency(c.cost_per_lead)} CPL</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Best Day */}
          {bestDay && bestDay.leads > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wider text-genesis-muted mb-1">Best Day</h4>
              <p className="text-sm text-genesis-secondary">
                {format(parseISO(bestDay.date), 'MMMM d, yyyy')} &mdash;{' '}
                <span className="text-genesis-text font-medium">{formatNumber(bestDay.leads)} leads</span>,{' '}
                {formatCurrency(bestDay.spend)} spent
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual Channel View
// ---------------------------------------------------------------------------

function SingleChannelView({
  channelKey,
  channels,
  campaigns,
  insights,
  dailyData,
}: {
  channelKey: ChannelName;
  channels: Channel[];
  campaigns: Campaign[];
  insights: Insight[];
  dailyData: DailyPerformance[];
}) {
  const channel = channels.find((c) => c.channel_name === channelKey);
  const channelCampaigns = campaigns.filter((c) => c.channel_name === channelKey);
  const channelInsights = insights.filter(
    (i) => i.context === channelToInsightContext(channelKey)
  );

  const totalSpend = channel?.spend ?? 0;
  const totalLeads = channel?.leads ?? 0;
  const cpl = channel?.cost_per_lead ?? 0;

  // Average CPL across all campaigns for trend arrows
  const avgCpl =
    channelCampaigns.length > 0
      ? channelCampaigns.reduce((sum, c) => sum + c.cost_per_lead, 0) / channelCampaigns.length
      : 0;

  // Chart data from daily performance (last 30 days)
  const chartData = useMemo(() => {
    const last30 = dailyData.slice(-30);
    return last30.map((d) => ({
      date: format(parseISO(d.date), 'MMM d'),
      leads: d.leads,
      spend: d.spend,
    }));
  }, [dailyData]);

  return (
    <div className="space-y-8">
      {/* Top metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Spend" value={formatCurrency(totalSpend)} />
        <MetricCard label="Total Leads" value={formatNumber(totalLeads)} />
        <MetricCard label="Cost Per Lead" value={formatCurrency(cpl)} />
        <MetricCard label="Conversion Rate" value="--" subtitle="Coming soon" />
      </div>

      {/* Performance Chart */}
      {chartData.length > 0 && (
        <div className="bg-genesis-card border border-genesis-border rounded-card p-6">
          <h3 className="text-sm font-medium text-genesis-text mb-4">
            {CHANNEL_LABELS[channelKey] || channelKey} Performance
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gradGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C9A96E" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#C9A96E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradGray" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#71717A" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#71717A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E1E22" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#52525B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: '#52525B' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#52525B' }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                  tickFormatter={(v: number) => `$${v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="leads"
                  name="Leads"
                  stroke="#C9A96E"
                  fill="url(#gradGold)"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="spend"
                  name="Spend"
                  stroke="#71717A"
                  fill="url(#gradGray)"
                  strokeWidth={1.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Campaign Breakdown */}
      {channelCampaigns.length > 0 && (
        <div className="bg-genesis-card border border-genesis-border rounded-card p-6">
          <h3 className="text-sm font-medium text-genesis-text mb-4">Campaign Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-genesis-muted border-b border-genesis-border">
                  <th className="text-left py-3 pr-4 font-medium">Campaign Name</th>
                  <th className="text-left py-3 pr-4 font-medium">Spend</th>
                  <th className="text-left py-3 pr-4 font-medium">Leads</th>
                  <th className="text-left py-3 pr-4 font-medium">CPL</th>
                  <th className="text-left py-3 pr-4 font-medium">Status</th>
                  <th className="text-left py-3 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {channelCampaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="border-b border-genesis-border/50 last:border-0 hover:bg-genesis-card-hover transition-colors"
                  >
                    <td className="py-3 pr-4 text-genesis-text truncate max-w-[200px]">
                      {campaign.campaign_name}
                    </td>
                    <td className="py-3 pr-4 text-genesis-text">{formatCurrency(campaign.spend)}</td>
                    <td className="py-3 pr-4 text-genesis-text">{formatNumber(campaign.leads)}</td>
                    <td className="py-3 pr-4 text-genesis-text">{formatCurrency(campaign.cost_per_lead)}</td>
                    <td className="py-3 pr-4">{statusBadge(campaign.status)}</td>
                    <td className="py-3">{trendArrow(campaign.cost_per_lead, avgCpl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Observations */}
      {channelInsights.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-genesis-text mb-4">Observations</h3>
          <div className="space-y-3">
            {channelInsights.map((insight) => (
              <div
                key={insight.id}
                className="bg-genesis-card border border-genesis-border rounded-card p-4 border-l-2 border-l-genesis-gold"
              >
                <p className="text-sm text-genesis-secondary leading-relaxed">
                  {insight.insight_text}
                </p>
                <p className="text-xs text-genesis-muted mt-2">
                  {format(parseISO(insight.posted_date), 'MMM d, yyyy')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state for individual channel with no data */}
      {!channel && channelCampaigns.length === 0 && (
        <div className="bg-genesis-card border border-genesis-border rounded-card p-12 text-center">
          <p className="text-genesis-muted text-sm">
            No data available for {CHANNEL_LABELS[channelKey] || channelKey} yet.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function ChannelsPage() {
  const { company, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = (searchParams.get('tab') || 'all') as TabKey;
  const isValidTab = TABS.some((t) => t.key === tabParam);

  const [activeTab, setActiveTab] = useState<TabKey>(isValidTab ? tabParam : 'all');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [dailyData, setDailyData] = useState<DailyPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync activeTab with URL param
  useEffect(() => {
    const param = (searchParams.get('tab') || 'all') as TabKey;
    const valid = TABS.some((t) => t.key === param);
    setActiveTab(valid ? param : 'all');
  }, [searchParams]);

  const handleTabChange = useCallback(
    (key: TabKey) => {
      setActiveTab(key);
      const params = new URLSearchParams(searchParams.toString());
      if (key === 'all') {
        params.delete('tab');
      } else {
        params.set('tab', key);
      }
      const qs = params.toString();
      router.push(qs ? `?${qs}` : '/dashboard/channels', { scroll: false });
    },
    [router, searchParams]
  );

  // Load data
  useEffect(() => {
    if (authLoading || !company) return;

    async function loadData() {
      try {
        const [channelsData, campaignsData, insightsData, dailyPerfData] = await Promise.all([
          getChannels(company!.id),
          getCampaigns(company!.id),
          getInsights(company!.id),
          getDailyPerformance(company!.id, 90),
        ]);

        setChannels(channelsData);
        setCampaigns(campaignsData);
        setInsights(insightsData);
        setDailyData(dailyPerfData);
      } catch (err) {
        console.error('Failed to load channels data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [authLoading, company]);

  // Average CPL across all channels for trend comparison
  const avgCpl = useMemo(() => {
    if (channels.length === 0) return 0;
    return channels.reduce((sum, c) => sum + c.cost_per_lead, 0) / channels.length;
  }, [channels]);

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-genesis-gold animate-pulse-slow" />
          <p className="text-sm text-genesis-muted">Loading channel data...</p>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Empty state
  // -----------------------------------------------------------------------

  const hasData = channels.length > 0 || campaigns.length > 0;

  if (!hasData) {
    return (
      <div className="space-y-6">
        {/* Tab bar even when empty */}
        <div className="border-b border-genesis-border">
          <nav className="flex gap-6 -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={cn(
                  'pb-3 text-sm font-medium transition-colors whitespace-nowrap',
                  activeTab === tab.key
                    ? 'border-b-2 border-genesis-gold text-genesis-gold'
                    : 'text-genesis-muted hover:text-genesis-secondary'
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="bg-genesis-card border border-genesis-border rounded-card p-16 text-center">
          <div className="flex flex-col items-center gap-3">
            <svg
              className="w-10 h-10 text-genesis-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
              />
            </svg>
            <p className="text-genesis-muted text-sm max-w-md">
              No channel data yet. Once your campaigns are live, performance data will appear here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Main render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="border-b border-genesis-border">
        <nav className="flex gap-6 -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={cn(
                'pb-3 text-sm font-medium transition-colors whitespace-nowrap',
                activeTab === tab.key
                  ? 'border-b-2 border-genesis-gold text-genesis-gold'
                  : 'text-genesis-muted hover:text-genesis-secondary'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'all' ? (
        <div className="space-y-4">
          {/* Column headers */}
          <div className="hidden sm:grid grid-cols-6 gap-4 px-6 text-xs uppercase tracking-wider text-genesis-muted">
            <span>Channel</span>
            <span>Spend</span>
            <span>Leads</span>
            <span>CPL</span>
            <span>Conv. Rate</span>
            <span>Trend</span>
          </div>

          {/* Channel rows */}
          {channels.map((channel) => (
            <ChannelRow
              key={channel.id}
              channel={channel}
              campaigns={campaigns}
              dailyData={dailyData}
              avgCpl={avgCpl}
            />
          ))}
        </div>
      ) : (
        <SingleChannelView
          channelKey={activeTab}
          channels={channels}
          campaigns={campaigns}
          insights={insights}
          dailyData={dailyData}
        />
      )}
    </div>
  );
}
