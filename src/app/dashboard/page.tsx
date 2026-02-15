'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import {
  getMonthlyMetrics,
  getDailyPerformance,
  getChannels,
  getLeads,
  getInsights,
} from '@/lib/data';
import BigFour from '@/components/overview/BigFour';
import PerformanceChart from '@/components/overview/PerformanceChart';
import ChannelSummary from '@/components/overview/ChannelSummary';
import LeadPipeline from '@/components/overview/LeadPipeline';
import RecentActivity from '@/components/overview/RecentActivity';
import InsightsSection from '@/components/overview/InsightsSection';
import type {
  MonthlyMetrics,
  DailyPerformance,
  Channel,
  Lead,
  Insight,
} from '@/types/database';

type DateRange = 'this_week' | 'this_month' | 'last_month' | 'last_90';

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  this_week: 'This Week',
  this_month: 'This Month',
  last_month: 'Last Month',
  last_90: 'Last 90 Days',
};

function getGreeting(firstName: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${firstName}`;
  if (hour < 18) return `Good afternoon, ${firstName}`;
  return `Good evening, ${firstName}`;
}

function getPeriodStart(range: DateRange): string {
  const now = new Date();
  let date: Date;

  switch (range) {
    case 'this_week': {
      const day = now.getDay();
      date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
      break;
    }
    case 'this_month':
      date = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'last_month':
      date = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      break;
    case 'last_90':
      date = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      break;
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

function SkeletonCard() {
  return (
    <div className="bg-genesis-card border border-genesis-border rounded-card p-6 animate-pulse">
      <div className="h-3 w-24 bg-genesis-border rounded mb-4" />
      <div className="h-8 w-32 bg-genesis-border rounded mb-3" />
      <div className="h-3 w-20 bg-genesis-border rounded" />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-64 bg-genesis-border rounded animate-pulse" />
        <div className="h-9 w-36 bg-genesis-border rounded animate-pulse" />
      </div>

      {/* BigFour skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Chart + Channel skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-genesis-card border border-genesis-border rounded-card p-6 animate-pulse">
          <div className="h-3 w-24 bg-genesis-border rounded mb-6" />
          <div className="h-[280px] bg-genesis-border/50 rounded" />
        </div>
        <div className="lg:col-span-2 bg-genesis-card border border-genesis-border rounded-card p-6 animate-pulse">
          <div className="h-3 w-20 bg-genesis-border rounded mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 bg-genesis-border/50 rounded" />
            ))}
          </div>
        </div>
      </div>

      {/* Pipeline + Activity skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-genesis-card border border-genesis-border rounded-card p-6 animate-pulse">
          <div className="h-3 w-24 bg-genesis-border rounded mb-6" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-genesis-border/50 rounded" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 bg-genesis-card border border-genesis-border rounded-card p-6 animate-pulse">
          <div className="h-3 w-28 bg-genesis-border rounded mb-6" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 bg-genesis-border/50 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, company } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>('this_month');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<MonthlyMetrics | null>(null);
  const [dailyData, setDailyData] = useState<DailyPerformance[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);

  const firstName = useMemo(() => {
    if (!user?.full_name) return '';
    return user.full_name.split(' ')[0];
  }, [user]);

  const greeting = useMemo(() => getGreeting(firstName), [firstName]);

  useEffect(() => {
    if (!company) return;

    let cancelled = false;

    async function loadData() {
      setLoading(true);
      try {
        const periodStart = getPeriodStart(dateRange);
        const [metricsData, dailyPerfData, channelsData, leadsData, insightsData] =
          await Promise.all([
            getMonthlyMetrics(company!.id, periodStart),
            getDailyPerformance(company!.id, 90),
            getChannels(company!.id, periodStart),
            getLeads(company!.id),
            getInsights(company!.id, 'overview'),
          ]);

        if (cancelled) return;

        setMetrics(metricsData);
        setDailyData(dailyPerfData);
        setChannels(channelsData);
        setLeads(leadsData);
        setInsights(insightsData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [company, dateRange]);

  const hasData = metrics || dailyData.length > 0 || channels.length > 0 || leads.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-xl sm:text-2xl font-semibold text-genesis-text"
        >
          {greeting}
        </motion.h1>

        {/* Date range picker */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-genesis-card border border-genesis-border rounded-lg text-sm text-genesis-text hover:border-genesis-muted transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="2.5" width="12" height="10" rx="1.5" stroke="#71717A" strokeWidth="1.2" />
              <path d="M1 5.5H13" stroke="#71717A" strokeWidth="1.2" />
              <path d="M4 1V3.5" stroke="#71717A" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M10 1V3.5" stroke="#71717A" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            {DATE_RANGE_LABELS[dateRange]}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="ml-1">
              <path d="M2.5 4L5 6.5L7.5 4" stroke="#71717A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-1 w-44 bg-genesis-card border border-genesis-border rounded-lg shadow-xl z-50 py-1">
                {(Object.keys(DATE_RANGE_LABELS) as DateRange[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      setDateRange(key);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      dateRange === key
                        ? 'text-genesis-gold bg-genesis-gold/5'
                        : 'text-genesis-text hover:bg-genesis-card-hover'
                    }`}
                  >
                    {DATE_RANGE_LABELS[key]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && <LoadingSkeleton />}

      {/* Empty state */}
      {!loading && !hasData && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-genesis-card border border-genesis-border rounded-card p-10 text-center"
        >
          <div className="w-12 h-12 rounded-full bg-genesis-gold/10 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#C9A96E" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M2 17L12 22L22 17" stroke="#C9A96E" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="#C9A96E" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-genesis-text mb-2">
            Your Terminal is being set up.
          </h2>
          <p className="text-sm text-genesis-secondary max-w-md mx-auto">
            Your growth team is connecting your channels and configuring your dashboard.
            You&apos;ll see data here within 48 hours.
          </p>
        </motion.div>
      )}

      {/* Dashboard content */}
      {!loading && hasData && (
        <div className="space-y-6">
          {/* Row 1: Big Four */}
          <BigFour metrics={metrics} />

          {/* Row 2: Performance Chart (60%) + Channel Summary (40%) */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3">
              <PerformanceChart dailyData={dailyData} />
            </div>
            <div className="lg:col-span-2">
              <ChannelSummary channels={channels} />
            </div>
          </div>

          {/* Row 3: Lead Pipeline (60%) + Recent Activity (40%) */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3">
              <LeadPipeline leads={leads} />
            </div>
            <div className="lg:col-span-2">
              <RecentActivity leads={leads} />
            </div>
          </div>

          {/* Row 4: Insights */}
          <InsightsSection insights={insights} />
        </div>
      )}
    </div>
  );
}
