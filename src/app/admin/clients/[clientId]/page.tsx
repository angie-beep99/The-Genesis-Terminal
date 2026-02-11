"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Client } from "@/types/database";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MetricsTab } from "@/components/admin/MetricsTab";
import { DailyPerformanceTab } from "@/components/admin/DailyPerformanceTab";
import { ChannelTab } from "@/components/admin/ChannelTab";
import { LeadsTab } from "@/components/admin/LeadsTab";
import { PipelineTab } from "@/components/admin/PipelineTab";
import { ClientPreview } from "@/components/admin/ClientPreview";

type Tab = "metrics" | "daily" | "channels" | "leads" | "pipeline";

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const supabase = createClient();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("metrics");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();
      setClient(data);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  if (loading) {
    return <div className="text-genesis-muted text-sm">Loading client...</div>;
  }

  if (!client) {
    return (
      <div>
        <p className="text-genesis-negative mb-4">Client not found.</p>
        <Link href="/admin/clients" className="text-genesis-gold text-sm">
          Back to clients
        </Link>
      </div>
    );
  }

  if (showPreview) {
    return (
      <div>
        <button
          onClick={() => setShowPreview(false)}
          className="btn-secondary text-sm mb-6"
        >
          &larr; Back to Admin View
        </button>
        <ClientPreview clientId={clientId} companyName={client.company_name} />
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "metrics", label: "Overview Metrics" },
    { key: "daily", label: "Daily Performance" },
    { key: "channels", label: "Channel Breakdown" },
    { key: "leads", label: "Leads" },
    { key: "pipeline", label: "Pipeline" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/admin/clients"
            className="text-genesis-muted text-xs hover:text-genesis-text transition-colors"
          >
            &larr; All Clients
          </Link>
          <h1 className="text-xl font-semibold text-genesis-text mt-1">
            {client.company_name}
          </h1>
          <p className="text-sm text-genesis-muted">
            {client.contact_name} — {client.contact_email}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(true)}
            className="btn-secondary text-sm"
          >
            Preview as Client
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto border-b border-genesis-border pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-genesis-gold text-genesis-text"
                : "border-transparent text-genesis-muted hover:text-genesis-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "metrics" && <MetricsTab clientId={clientId} />}
      {activeTab === "daily" && <DailyPerformanceTab clientId={clientId} />}
      {activeTab === "channels" && <ChannelTab clientId={clientId} />}
      {activeTab === "leads" && <LeadsTab clientId={clientId} />}
      {activeTab === "pipeline" && <PipelineTab clientId={clientId} />}
    </div>
  );
}
