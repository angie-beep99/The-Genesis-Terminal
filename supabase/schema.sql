-- Genesis Terminal Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- Table: clients
-- ============================================
create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  company_name text not null,
  contact_name text not null,
  contact_email text not null unique,
  created_at timestamptz default now()
);

-- ============================================
-- Table: user_profiles (links auth users to roles)
-- ============================================
create table public.user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text not null check (role in ('admin', 'client')),
  client_id uuid references public.clients(id) on delete set null,
  email text not null,
  created_at timestamptz default now()
);

-- ============================================
-- Table: monthly_metrics
-- ============================================
create table public.monthly_metrics (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  period_start date not null,
  period_end date not null,
  total_spend decimal(12, 2) default 0,
  total_leads integer default 0,
  qualified_leads integer default 0,
  cost_per_acquisition decimal(12, 2) default 0,
  spend_change_pct decimal(6, 2) default 0,
  leads_change_pct decimal(6, 2) default 0,
  qualified_change_pct decimal(6, 2) default 0,
  cpa_change_pct decimal(6, 2) default 0,
  created_at timestamptz default now()
);

-- ============================================
-- Table: daily_performance
-- ============================================
create table public.daily_performance (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  date date not null,
  spend decimal(12, 2) default 0,
  leads integer default 0,
  channel text not null check (channel in ('google_ads', 'meta', 'bing', 'tiktok'))
);

-- ============================================
-- Table: channel_breakdown
-- ============================================
create table public.channel_breakdown (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  period_start date not null,
  period_end date not null,
  channel text not null check (channel in ('google_ads', 'meta', 'bing', 'tiktok')),
  spend decimal(12, 2) default 0,
  leads integer default 0
);

-- ============================================
-- Table: leads
-- ============================================
create table public.leads (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  lead_name text not null,
  company text not null,
  source text not null check (source in ('google_ads', 'meta', 'bing', 'tiktok', 'seo', 'organic')),
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'proposal', 'converted', 'churned')),
  value decimal(12, 2) default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- Table: pipeline_summary
-- ============================================
create table public.pipeline_summary (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  period_start date not null,
  period_end date not null,
  new_leads integer default 0,
  contacted integer default 0,
  qualified integer default 0,
  proposal_sent integer default 0,
  converted integer default 0,
  churned integer default 0
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS on all tables
alter table public.clients enable row level security;
alter table public.user_profiles enable row level security;
alter table public.monthly_metrics enable row level security;
alter table public.daily_performance enable row level security;
alter table public.channel_breakdown enable row level security;
alter table public.leads enable row level security;
alter table public.pipeline_summary enable row level security;

-- Helper function: check if current user is admin
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.user_profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer;

-- Helper function: get current user's client_id
create or replace function public.get_client_id()
returns uuid as $$
  select client_id from public.user_profiles
  where id = auth.uid()
$$ language sql security definer;

-- ============================================
-- RLS Policies: clients
-- ============================================
create policy "Admins can do everything with clients"
  on public.clients for all
  using (public.is_admin());

create policy "Clients can view own record"
  on public.clients for select
  using (id = public.get_client_id());

-- ============================================
-- RLS Policies: user_profiles
-- ============================================
create policy "Users can view own profile"
  on public.user_profiles for select
  using (id = auth.uid());

create policy "Admins can manage all profiles"
  on public.user_profiles for all
  using (public.is_admin());

-- ============================================
-- RLS Policies: monthly_metrics
-- ============================================
create policy "Admins can manage all metrics"
  on public.monthly_metrics for all
  using (public.is_admin());

create policy "Clients can view own metrics"
  on public.monthly_metrics for select
  using (client_id = public.get_client_id());

-- ============================================
-- RLS Policies: daily_performance
-- ============================================
create policy "Admins can manage all daily performance"
  on public.daily_performance for all
  using (public.is_admin());

create policy "Clients can view own daily performance"
  on public.daily_performance for select
  using (client_id = public.get_client_id());

-- ============================================
-- RLS Policies: channel_breakdown
-- ============================================
create policy "Admins can manage all channel breakdowns"
  on public.channel_breakdown for all
  using (public.is_admin());

create policy "Clients can view own channel breakdowns"
  on public.channel_breakdown for select
  using (client_id = public.get_client_id());

-- ============================================
-- RLS Policies: leads
-- ============================================
create policy "Admins can manage all leads"
  on public.leads for all
  using (public.is_admin());

create policy "Clients can view own leads"
  on public.leads for select
  using (client_id = public.get_client_id());

create policy "Clients can update own leads"
  on public.leads for update
  using (client_id = public.get_client_id())
  with check (client_id = public.get_client_id());

-- ============================================
-- RLS Policies: pipeline_summary
-- ============================================
create policy "Admins can manage all pipeline summaries"
  on public.pipeline_summary for all
  using (public.is_admin());

create policy "Clients can view own pipeline summaries"
  on public.pipeline_summary for select
  using (client_id = public.get_client_id());

-- ============================================
-- Indexes for performance
-- ============================================
create index idx_monthly_metrics_client on public.monthly_metrics(client_id);
create index idx_daily_performance_client_date on public.daily_performance(client_id, date);
create index idx_channel_breakdown_client on public.channel_breakdown(client_id);
create index idx_leads_client on public.leads(client_id);
create index idx_leads_status on public.leads(status);
create index idx_pipeline_summary_client on public.pipeline_summary(client_id);
create index idx_user_profiles_client on public.user_profiles(client_id);

-- ============================================
-- Function: auto-update updated_at on leads
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_lead_updated
  before update on public.leads
  for each row execute function public.handle_updated_at();
