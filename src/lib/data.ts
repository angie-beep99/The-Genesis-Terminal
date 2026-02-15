import { createSupabaseBrowser } from './supabase-browser';
import { getMonthString } from './utils';
import type {
  Company,
  User,
  MonthlyMetrics,
  DailyPerformance,
  Channel,
  Campaign,
  Lead,
  LeadNote,
  LeadActivity,
  Insight,
  Report,
  InboxThread,
  InboxMessage,
  Notification,
  NotificationPreference,
} from '@/types/database';

function getClient() {
  return createSupabaseBrowser();
}

// =====================
// User & Company
// =====================

export async function getCurrentUser(): Promise<User | null> {
  const supabase = getClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return data;
}

export async function getCompany(companyId: string): Promise<Company | null> {
  const supabase = getClient();
  const { data } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();

  return data;
}

export async function getCompanyMembers(companyId: string): Promise<User[]> {
  const supabase = getClient();
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: true });

  return data || [];
}

// =====================
// Metrics
// =====================

export async function getMonthlyMetrics(companyId: string, periodStart?: string): Promise<MonthlyMetrics | null> {
  const supabase = getClient();
  const period = periodStart || getMonthString();

  const { data } = await supabase
    .from('monthly_metrics')
    .select('*')
    .eq('company_id', companyId)
    .eq('period_start', period)
    .single();

  return data;
}

export async function getDailyPerformance(companyId: string, days: number = 90): Promise<DailyPerformance[]> {
  const supabase = getClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const { data } = await supabase
    .from('daily_performance')
    .select('*')
    .eq('company_id', companyId)
    .gte('date', cutoffStr)
    .order('date', { ascending: true });

  return data || [];
}

// =====================
// Channels & Campaigns
// =====================

export async function getChannels(companyId: string, periodStart?: string): Promise<Channel[]> {
  const supabase = getClient();
  const period = periodStart || getMonthString();

  const { data } = await supabase
    .from('channels')
    .select('*')
    .eq('company_id', companyId)
    .eq('period_start', period)
    .order('spend', { ascending: false });

  return data || [];
}

export async function getCampaigns(companyId: string, channelName?: string): Promise<Campaign[]> {
  const supabase = getClient();
  let query = supabase
    .from('campaigns')
    .select('*')
    .eq('company_id', companyId);

  if (channelName) {
    query = query.eq('channel_name', channelName);
  }

  const { data } = await query.order('spend', { ascending: false });
  return data || [];
}

// =====================
// Leads
// =====================

export async function getLeads(companyId: string, options?: {
  status?: string;
  search?: string;
  limit?: number;
  sort?: 'newest' | 'value' | 'source';
}): Promise<Lead[]> {
  const supabase = getClient();
  let query = supabase
    .from('leads')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_archived', false);

  if (options?.status && options.status !== 'all') {
    query = query.eq('status', options.status);
  }

  if (options?.search) {
    query = query.or(`lead_name.ilike.%${options.search}%,company_name_lead.ilike.%${options.search}%`);
  }

  if (options?.sort === 'value') {
    query = query.order('value', { ascending: false });
  } else if (options?.sort === 'source') {
    query = query.order('source', { ascending: true });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data } = await query;
  return data || [];
}

export async function updateLeadStatus(leadId: string, status: string): Promise<void> {
  const supabase = getClient();
  await supabase
    .from('leads')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', leadId);
}

export async function updateLeadValue(leadId: string, value: number): Promise<void> {
  const supabase = getClient();
  await supabase
    .from('leads')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('id', leadId);
}

export async function getLeadNotes(leadId: string): Promise<LeadNote[]> {
  const supabase = getClient();
  const { data } = await supabase
    .from('lead_notes')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  return data || [];
}

export async function addLeadNote(leadId: string, noteText: string): Promise<LeadNote | null> {
  const supabase = getClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data } = await supabase
    .from('lead_notes')
    .insert({ lead_id: leadId, user_id: user?.id, note_text: noteText })
    .select()
    .single();

  return data;
}

export async function getLeadActivity(leadId: string): Promise<LeadActivity[]> {
  const supabase = getClient();
  const { data } = await supabase
    .from('lead_activity')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: true });

  return data || [];
}

// =====================
// Insights
// =====================

export async function getInsights(companyId: string, context?: string): Promise<Insight[]> {
  const supabase = getClient();
  let query = supabase
    .from('insights')
    .select('*')
    .eq('company_id', companyId);

  if (context) {
    query = query.eq('context', context);
  }

  const { data } = await query.order('display_order', { ascending: true });
  return data || [];
}

// =====================
// Reports
// =====================

export async function getReports(companyId: string): Promise<Report[]> {
  const supabase = getClient();
  const { data } = await supabase
    .from('reports')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_visible', true)
    .order('created_at', { ascending: false });

  return data || [];
}

export async function getReportById(reportId: string): Promise<Report | null> {
  const supabase = getClient();
  const { data } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();

  return data;
}

// =====================
// Inbox
// =====================

export async function getInboxThreads(companyId: string): Promise<InboxThread[]> {
  const supabase = getClient();
  const { data } = await supabase
    .from('inbox_threads')
    .select('*')
    .eq('company_id', companyId)
    .order('last_message_at', { ascending: false });

  return data || [];
}

export async function getThreadMessages(threadId: string): Promise<InboxMessage[]> {
  const supabase = getClient();
  const { data } = await supabase
    .from('inbox_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  return data || [];
}

export async function sendMessage(threadId: string, messageText: string, senderType: 'client' | 'genesis_team'): Promise<InboxMessage | null> {
  const supabase = getClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data } = await supabase
    .from('inbox_messages')
    .insert({
      thread_id: threadId,
      sender_id: user?.id,
      sender_type: senderType,
      message_text: messageText,
    })
    .select()
    .single();

  await supabase
    .from('inbox_threads')
    .update({ last_message_at: new Date().toISOString(), is_read: false })
    .eq('id', threadId);

  return data;
}

export async function markThreadRead(threadId: string): Promise<void> {
  const supabase = getClient();
  await supabase
    .from('inbox_threads')
    .update({ is_read: true })
    .eq('id', threadId);
}

export async function getUnreadThreadCount(companyId: string): Promise<number> {
  const supabase = getClient();
  const { count } = await supabase
    .from('inbox_threads')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('is_read', false);

  return count || 0;
}

// =====================
// Notifications
// =====================

export async function getNotifications(userId: string, limit: number = 20): Promise<Notification[]> {
  const supabase = getClient();
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return data || [];
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = getClient();
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  return count || 0;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const supabase = getClient();
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const supabase = getClient();
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
}

export async function getNotificationPreferences(userId: string): Promise<NotificationPreference[]> {
  const supabase = getClient();
  const { data } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId);

  return data || [];
}

// =====================
// Admin functions
// =====================

export async function getAllCompanies(): Promise<Company[]> {
  const supabase = getClient();
  const { data } = await supabase
    .from('companies')
    .select('*')
    .order('company_name', { ascending: true });

  return data || [];
}
