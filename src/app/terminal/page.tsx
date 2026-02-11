"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/ui/TopBar";
import { MetricCard } from "@/components/ui/MetricCard";
import { PerformanceChart } from "@/components/charts/PerformanceChart";
import { ChannelBreakdownCard } from "@/components/charts/ChannelBreakdownCard";
import { PipelineFunnel } from "@/components/dashboard/PipelineFunnel";
import { LeadsTable } from "@/components/dashboard/LeadsTable";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type {
  Client,
  MonthlyMetrics,
  DailyPerformance,
  ChannelBreakdown,
  PipelineSummary,
  Lead,
} from "@/types/database";

export default function TerminalPage() {
  const supabase = createClient();
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [metrics, setMetrics] = useState<MonthlyMetrics | null>(null);
  const [dailyData, setDailyData] = useState<DailyPerformance[]>([]);
  const [channels, setChannels] = useState<ChannelBreakdown[]>([]);
  const [pipeline, setPipeline] = useState<PipelineSummary | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // Get user profile to find client_id
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("client_id")
      .eq("id", user.id)
      .single();

    if (!profile?.client_id) {
      setLoading(false);
      return;
    }

    const clientId = profile.client_id;

    // Fetch all data in parallel
    const [
      clientRes,
      metricsRes,
      dailyRes,
      channelRes,
      pipelineRes,
      leadsRes,
    ] = await Promise.all([
      supabase.from("clients").select("*").eq("id", clientId).single(),
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

    setClient(clientRes.data);
    setMetrics(metricsRes.data);
    setDailyData(dailyRes.data || []);

    // Get unique channels for the latest period
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
  }, [supabase, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-genesis-muted">Loading Terminal...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <TopBar companyName={client?.company_name || "Client"} />
        <button
          onClick={handleSignOut}
          className="text-xs text-genesis-muted hover:text-genesis-text transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Row 1: Key Metrics */}
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

      {/* Row 2: Chart + Channel Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        <div className="lg:col-span-3">
          <PerformanceChart data={dailyData} />
        </div>
        <div className="lg:col-span-2">
          <ChannelBreakdownCard data={channels} />
        </div>
      </div>

      {/* Row 3: Pipeline */}
      <div className="mb-6">
        <PipelineFunnel data={pipeline} />
      </div>

      {/* Row 4 & 5: Leads Table + Status Update */}
      <LeadsTable leads={leads} onLeadUpdated={loadData} />
    </div>
  );
}
