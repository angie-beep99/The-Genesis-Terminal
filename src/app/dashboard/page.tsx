'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/dashboard/TopBar';
import BigThree from '@/components/dashboard/BigThree';
import ChannelBreakdown from '@/components/dashboard/ChannelBreakdown';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import LeadsPipeline from '@/components/dashboard/LeadsPipeline';
import MonthOverMonth from '@/components/dashboard/MonthOverMonth';
import Insights from '@/components/dashboard/Insights';
import {
  getClientProfile,
  getMonthlyMetrics,
  getChannelData,
  getDailyPerformance,
  getLeads,
  getPipelineSummary,
  getInsights,
} from '@/lib/data';
import type {
  Client,
  MonthlyMetrics as MonthlyMetricsType,
  ChannelData as ChannelDataType,
  DailyPerformance as DailyPerformanceType,
  Lead,
  PipelineSummary,
  Insight,
} from '@/types/database';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<Client | null>(null);
  const [metrics, setMetrics] = useState<MonthlyMetricsType | null>(null);
  const [channels, setChannels] = useState<ChannelDataType[]>([]);
  const [dailyData, setDailyData] = useState<DailyPerformanceType[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pipeline, setPipeline] = useState<PipelineSummary | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const clientData = await getClientProfile();
        if (!clientData) {
          router.push('/login');
          return;
        }

        setClient(clientData);

        // Load all data in parallel
        const [metricsData, channelsData, dailyPerfData, leadsData, pipelineData, insightsData] =
          await Promise.all([
            getMonthlyMetrics(clientData.id),
            getChannelData(clientData.id),
            getDailyPerformance(clientData.id),
            getLeads(clientData.id),
            getPipelineSummary(clientData.id),
            getInsights(clientData.id),
          ]);

        setMetrics(metricsData);
        setChannels(channelsData);
        setDailyData(dailyPerfData);
        setLeads(leadsData);
        setPipeline(pipelineData);
        setInsights(insightsData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-genesis-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-genesis-gold animate-pulse-slow" />
          <p className="text-sm text-genesis-muted">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <div className="min-h-screen bg-genesis-bg">
      <TopBar companyName={client.company_name} contactName={client.contact_name} />

      <main className="pt-[60px]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-10 sm:space-y-14">
          {/* Section 1: The Big Three */}
          <section>
            <BigThree metrics={metrics} />
          </section>

          {/* Section 2: Channel Breakdown */}
          {channels.length > 0 && (
            <ChannelBreakdown channels={channels} />
          )}

          {/* Section 3: Performance Chart */}
          {dailyData.length > 0 && (
            <PerformanceChart dailyData={dailyData} />
          )}

          {/* Section 4: Leads Pipeline */}
          <LeadsPipeline pipeline={pipeline} leads={leads} isClient />

          {/* Section 5: Month Over Month */}
          <MonthOverMonth metrics={metrics} />

          {/* Section 6: Insights */}
          {insights.length > 0 && (
            <Insights insights={insights} />
          )}

          {/* Footer spacing */}
          <div className="h-8" />
        </div>
      </main>
    </div>
  );
}
