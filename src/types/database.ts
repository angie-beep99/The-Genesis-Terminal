export type Channel = "google_ads" | "meta" | "bing" | "tiktok";
export type LeadSource = Channel | "seo" | "organic";
export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "converted"
  | "churned";

export interface Client {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  created_at: string;
}

export interface MonthlyMetrics {
  id: string;
  client_id: string;
  period_start: string;
  period_end: string;
  total_spend: number;
  total_leads: number;
  qualified_leads: number;
  cost_per_acquisition: number;
  spend_change_pct: number;
  leads_change_pct: number;
  qualified_change_pct: number;
  cpa_change_pct: number;
  created_at: string;
}

export interface DailyPerformance {
  id: string;
  client_id: string;
  date: string;
  spend: number;
  leads: number;
  channel: Channel;
}

export interface ChannelBreakdown {
  id: string;
  client_id: string;
  period_start: string;
  period_end: string;
  channel: Channel;
  spend: number;
  leads: number;
}

export interface Lead {
  id: string;
  client_id: string;
  lead_name: string;
  company: string;
  source: LeadSource;
  status: LeadStatus;
  value: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PipelineSummary {
  id: string;
  client_id: string;
  period_start: string;
  period_end: string;
  new_leads: number;
  contacted: number;
  qualified: number;
  proposal_sent: number;
  converted: number;
  churned: number;
}

export type UserRole = "admin" | "client";

export interface UserProfile {
  id: string;
  role: UserRole;
  client_id: string | null;
  email: string;
}
