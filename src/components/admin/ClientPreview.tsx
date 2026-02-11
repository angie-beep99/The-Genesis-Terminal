"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { TopBar } from "@/components/ui/TopBar";
import { MetricCard } from "@/components/ui/MetricCard";
import { PerformanceChart } from "@/components/charts/PerformanceChart";
import { ChannelBreakdownCard } from "@/components/charts/ChannelBreakdownCard";
import { PipelineFunnel } from "@/components/dashboard/PipelineFunnel";
import { LeadsTable } from "@/components/dashboard/LeadsTable";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type {
  MonthlyMetrics,
  DailyPerformance,
  ChannelBreakdown,
  PipelineSummary,
  Lead,
} from "@/types/database";

interface ClientPreviewProps {
  clientId: string;
  companyName: string;
}

export function ClientPreview({ clientId, companyName }: ClientPreviewProps) {
  const supabase = createClient();

  const [metrics, setMetrics] = useState<MonthlyMetrics | null>(null);
  const [dailyData, setDailyData] = useState<DailyPerformance[]>([]);
  const [channels, setChannels] = useState<ChannelBreakdown[]>([]);
  const [pipeline, setPipeline] = useState<PipelineSummary | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [metricsRes, dailyRes, channelRes, pipelineRes, leadsRes] =
      await Promise.all([
        supabase
          .from("monthly_metrics")
          .select("*")
          .eq("client_id", clientId)
          .order("period_end", { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from("daily_performance")
          .select("*")
          .eq("client_id", clientId)
          .order("date", { ascending: true }),
        supabase
          .from("channel_breakdown")
          .select("*")
          .eq("client_id", clientId)
          .order("period_end", { ascending: false }),
        supabase
          .from("pipeline_summary")
          .select("*")
          .eq("client_id", clientId)
          .order("period_end", { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from("leads")
          .select("*")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

    setMetrics(metricsRes.data);
    setDailyData(dailyRes.data || []);

    const latestChannels = channelRes.data || [];
    const latestPeriod = latestChannels[0]?.period_end;
    setChannels(
      latestPeriod
        ? latestChannels.filter((c) => c.period_end === latestPeriod)
        : []
    );

    setPipeline(pipelineRes.data);
    setLeads(leadsRes.data || []);
    setLoading(false);
  }, [supabase, clientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="text-genesis-muted text-sm">Loading preview...</div>
    );
  }

  return (
    <div className="bg-genesis-bg rounded-xl border border-genesis-border p-4 md:p-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs bg-genesis-gold/20 text-genesis-gold px-2 py-0.5 rounded-full font-medium">
          Preview Mode
        </span>
      </div>

      <TopBar companyName={companyName} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Total Investment"
          value={Number(metrics?.total_spend) || 0}
          change={Number(metrics?.spend_change_pct) || 0}
          format={formatCurrency}
          delay={0}
        />
        <MetricCard
          title="Total Leads"
          value={metrics?.total_leads || 0}
          change={Number(metrics?.leads_change_pct) || 0}
          format={formatNumber}
          delay={0.1}
        />
        <MetricCard
          title="Qualified Leads"
          value={metrics?.qualified_leads || 0}
          change={Number(metrics?.qualified_change_pct) || 0}
          format={formatNumber}
          delay={0.2}
        />
        <MetricCard
          title="Cost Per Acquisition"
          value={Number(metrics?.cost_per_acquisition) || 0}
          change={Number(metrics?.cpa_change_pct) || 0}
          format={formatCurrency}
          invertColor
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        <div className="lg:col-span-3">
          <PerformanceChart data={dailyData} />
        </div>
        <div className="lg:col-span-2">
          <ChannelBreakdownCard data={channels} />
        </div>
      </div>

      <div className="mb-6">
        <PipelineFunnel data={pipeline} />
      </div>

      <LeadsTable leads={leads} onLeadUpdated={loadData} />
    </div>
  );
}
