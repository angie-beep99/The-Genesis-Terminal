import { createSupabaseBrowser } from './supabase-browser';
import { getMonthString } from './utils';
import type {
  Client,
  MonthlyMetrics,
  ChannelData,
  DailyPerformance,
  Lead,
  PipelineSummary,
  Insight,
} from '@/types/database';

function getClient() {
  return createSupabaseBrowser();
}

export async function getClientProfile(): Promise<Client | null> {
  const supabase = getClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return data;
}

export async function getMonthlyMetrics(clientId: string, month?: string): Promise<MonthlyMetrics | null> {
  const supabase = getClient();
  const m = month || getMonthString();

  const { data } = await supabase
    .from('monthly_metrics')
    .select('*')
    .eq('client_id', clientId)
    .eq('month', m)
    .single();

  return data;
}

export async function getChannelData(clientId: string, month?: string): Promise<ChannelData[]> {
  const supabase = getClient();
  const m = month || getMonthString();

  const { data } = await supabase
    .from('channel_data')
    .select('*')
    .eq('client_id', clientId)
    .eq('month', m)
    .order('spend', { ascending: false });

  return data || [];
}

export async function getDailyPerformance(clientId: string, days: number = 90): Promise<DailyPerformance[]> {
  const supabase = getClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const { data } = await supabase
    .from('daily_performance')
    .select('*')
    .eq('client_id', clientId)
    .gte('date', cutoffStr)
    .order('date', { ascending: true });

  return data || [];
}

export async function getLeads(clientId: string, limit: number = 20): Promise<Lead[]> {
  const supabase = getClient();
  const { data } = await supabase
    .from('leads')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return data || [];
}

export async function getPipelineSummary(clientId: string, month?: string): Promise<PipelineSummary | null> {
  const supabase = getClient();
  const m = month || getMonthString();

  const { data } = await supabase
    .from('pipeline_summary')
    .select('*')
    .eq('client_id', clientId)
    .eq('month', m)
    .single();

  return data;
}

export async function getInsights(clientId: string, month?: string): Promise<Insight[]> {
  const supabase = getClient();
  const m = month || getMonthString();

  const { data } = await supabase
    .from('insights')
    .select('*')
    .eq('client_id', clientId)
    .eq('month', m)
    .order('display_order', { ascending: true });

  return data || [];
}

// Admin functions

export async function getAllClients(): Promise<Client[]> {
  const supabase = getClient();
  const { data } = await supabase
    .from('clients')
    .select('*')
    .order('company_name', { ascending: true });

  return data || [];
}

export async function getClientById(clientId: string): Promise<Client | null> {
  const supabase = getClient();
  const { data } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  return data;
}
