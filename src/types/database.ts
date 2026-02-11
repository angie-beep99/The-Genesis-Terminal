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
  month: string;
  money_invested: number;
  total_leads: number;
  qualified_leads: number;
  revenue_pipeline: number;
  revenue_closed: number;
  prev_money_invested: number;
  prev_leads: number;
  prev_qualified: number;
  prev_revenue_pipeline: number;
  prev_revenue_closed: number;
}

export interface ChannelData {
  id: string;
  client_id: string;
  month: string;
  channel: 'google_ads' | 'meta' | 'bing' | 'tiktok';
  spend: number;
  leads: number;
  trend_note: string;
}

export interface DailyPerformance {
  id: string;
  client_id: string;
  date: string;
  spend: number;
  leads: number;
}

export interface Lead {
  id: string;
  client_id: string;
  name: string;
  company: string;
  source: 'google_ads' | 'meta' | 'bing' | 'tiktok' | 'seo' | 'organic' | 'referral';
  status: 'new' | 'in_conversation' | 'won' | 'lost';
  value: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface PipelineSummary {
  id: string;
  client_id: string;
  month: string;
  new_leads: number;
  in_conversation: number;
  won: number;
  lost: number;
}

export interface Insight {
  id: string;
  client_id: string;
  month: string;
  insight_text: string;
  display_order: number;
}

export type ChannelName = 'google_ads' | 'meta' | 'bing' | 'tiktok';
export type LeadSource = 'google_ads' | 'meta' | 'bing' | 'tiktok' | 'seo' | 'organic' | 'referral';
export type LeadStatus = 'new' | 'in_conversation' | 'won' | 'lost';

export const CHANNEL_LABELS: Record<ChannelName, string> = {
  google_ads: 'Google Ads',
  meta: 'Meta',
  bing: 'Bing',
  tiktok: 'TikTok',
};

export const SOURCE_LABELS: Record<LeadSource, string> = {
  google_ads: 'Google Ads',
  meta: 'Meta',
  bing: 'Bing',
  tiktok: 'TikTok',
  seo: 'SEO',
  organic: 'Organic',
  referral: 'Referral',
};

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  in_conversation: 'In Conversation',
  won: 'Won',
  lost: 'Lost',
};
