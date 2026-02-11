import { type Channel, type LeadSource, type LeadStatus } from "@/types/database";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function channelLabel(channel: Channel | LeadSource): string {
  const labels: Record<string, string> = {
    google_ads: "Google Ads",
    meta: "Meta",
    bing: "Bing",
    tiktok: "TikTok",
    seo: "SEO",
    organic: "Organic",
  };
  return labels[channel] || channel;
}

export function statusColor(status: LeadStatus): string {
  const colors: Record<LeadStatus, string> = {
    new: "bg-genesis-muted/30 text-genesis-muted",
    contacted: "bg-blue-500/20 text-blue-400",
    qualified: "bg-genesis-gold/20 text-genesis-gold",
    proposal: "bg-purple-500/20 text-purple-400",
    converted: "bg-genesis-positive/20 text-genesis-positive",
    churned: "bg-genesis-negative/20 text-genesis-negative",
  };
  return colors[status];
}

export function statusLabel(status: LeadStatus): string {
  const labels: Record<LeadStatus, string> = {
    new: "New",
    contacted: "Contacted",
    qualified: "Qualified",
    proposal: "Proposal",
    converted: "Converted",
    churned: "Churned",
  };
  return labels[status];
}

export function getDateRange(days: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
