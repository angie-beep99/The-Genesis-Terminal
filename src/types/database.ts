// =====================
// Core Types
// =====================

export interface Company {
  id: string;
  company_name: string;
  industry: string | null;
  website_url: string | null;
  logo_url: string | null;
  partnership_start: string | null;
  ownership_date: string | null;
  monthly_investment: number | null;
  status: 'active' | 'onboarding' | 'churned';
  created_at: string;
}

export interface User {
  id: string;
  company_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url: string | null;
  is_admin: boolean;
  has_completed_onboarding: boolean;
  last_login: string | null;
  created_at: string;
}

export type UserRole = 'admin' | 'owner' | 'company_admin' | 'member' | 'view_only';

// =====================
// Metrics & Performance
// =====================

export interface MonthlyMetrics {
  id: string;
  company_id: string;
  period_start: string;
  money_invested: number;
  total_leads: number;
  qualified_leads: number;
  cost_per_lead: number;
  revenue_pipeline: number;
  revenue_closed: number;
  prev_money_invested: number;
  prev_total_leads: number;
  prev_qualified_leads: number;
  prev_cost_per_lead: number;
  prev_revenue_pipeline: number;
  prev_revenue_closed: number;
  created_at: string;
}

export interface DailyPerformance {
  id: string;
  company_id: string;
  date: string;
  spend: number;
  leads: number;
}

export interface Channel {
  id: string;
  company_id: string;
  period_start: string;
  channel_name: string;
  spend: number;
  leads: number;
  cost_per_lead: number;
  trend_note: string;
  display_order: number;
}

export interface Campaign {
  id: string;
  company_id: string;
  channel_name: string;
  campaign_name: string;
  spend: number;
  leads: number;
  cost_per_lead: number;
  status: 'active' | 'paused' | 'testing';
  period_start: string | null;
}

// =====================
// Leads & Pipeline
// =====================

export interface Lead {
  id: string;
  company_id: string;
  lead_name: string;
  company_name_lead: string;
  source: LeadSource | null;
  campaign: string | null;
  status: LeadStatus;
  value: number;
  assigned_to: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  user_id: string | null;
  note_text: string;
  created_at: string;
  user?: User;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  user_id: string | null;
  activity_type: 'status_change' | 'note_added' | 'value_changed' | 'created' | 'assigned';
  description: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  user?: User;
}

// =====================
// Insights & Reports
// =====================

export interface Insight {
  id: string;
  company_id: string;
  insight_text: string;
  context: InsightContext;
  display_order: number;
  posted_date: string;
  created_at: string;
}

export type InsightContext = 'overview' | 'google_ads' | 'meta' | 'bing' | 'tiktok';

export interface Report {
  id: string;
  company_id: string;
  title: string;
  report_type: 'monthly' | 'quarterly' | 'channel' | 'custom';
  period_start: string | null;
  period_end: string | null;
  content_url: string | null;
  content_html: string | null;
  share_token: string | null;
  share_expires: string | null;
  is_visible: boolean;
  created_at: string;
}

// =====================
// Inbox & Messaging
// =====================

export interface InboxThread {
  id: string;
  company_id: string;
  subject: string;
  category: ThreadCategory;
  is_read: boolean;
  last_message_at: string;
  created_at: string;
  messages?: InboxMessage[];
  latest_message?: InboxMessage;
}

export type ThreadCategory = 'update' | 'question' | 'report' | 'action_required';

export interface InboxMessage {
  id: string;
  thread_id: string;
  sender_id: string | null;
  sender_type: 'client' | 'genesis_team';
  message_text: string;
  attachment_url: string | null;
  attachment_name: string | null;
  created_at: string;
  sender?: User;
}

// =====================
// Notifications
// =====================

export interface Notification {
  id: string;
  user_id: string;
  company_id: string | null;
  type: NotificationType;
  title: string;
  description: string | null;
  is_read: boolean;
  link_to: string | null;
  created_at: string;
}

export type NotificationType = 'new_lead' | 'status_change' | 'new_message' | 'report_available' | 'weekly_summary' | 'budget_alert' | 'insight_posted';

export interface NotificationPreference {
  id: string;
  user_id: string;
  notification_type: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
}

// =====================
// Enums & Labels
// =====================

export type ChannelName = 'google_ads' | 'meta' | 'bing' | 'tiktok';
export type LeadSource = 'google_ads' | 'meta' | 'bing' | 'tiktok' | 'seo' | 'organic' | 'referral';
export type LeadStatus = 'new' | 'in_conversation' | 'won' | 'lost';

export const CHANNEL_LABELS: Record<string, string> = {
  google_ads: 'Google Ads',
  meta: 'Meta',
  bing: 'Bing',
  tiktok: 'TikTok',
  seo: 'SEO',
};

export const CHANNEL_COLORS: Record<string, string> = {
  google_ads: '#3B82F6',
  meta: '#8B5CF6',
  bing: '#14B8A6',
  tiktok: '#EC4899',
  seo: '#F59E0B',
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

export const STATUS_COLORS: Record<LeadStatus, { bg: string; text: string }> = {
  new: { bg: 'bg-genesis-secondary/20', text: 'text-genesis-text' },
  in_conversation: { bg: 'bg-genesis-info/20', text: 'text-genesis-info' },
  won: { bg: 'bg-genesis-gold/20', text: 'text-genesis-gold' },
  lost: { bg: 'bg-genesis-negative/20', text: 'text-genesis-negative' },
};

export const THREAD_CATEGORY_LABELS: Record<ThreadCategory, string> = {
  update: 'Update',
  question: 'Question',
  report: 'Report',
  action_required: 'Action Required',
};

export const THREAD_CATEGORY_COLORS: Record<ThreadCategory, string> = {
  update: 'text-genesis-gold bg-genesis-gold/10',
  question: 'text-genesis-info bg-genesis-info/10',
  report: 'text-genesis-secondary bg-genesis-secondary/10',
  action_required: 'text-genesis-negative bg-genesis-negative/10 border border-genesis-negative/30',
};

export const REPORT_TYPE_LABELS: Record<string, string> = {
  monthly: 'Monthly Performance Report',
  quarterly: 'Quarter in Review',
  channel: 'Channel Comparison Report',
  custom: 'Custom Report',
};
