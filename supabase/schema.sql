-- Genesis Terminal Database Schema
-- Full Product Build

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- CORE TABLES
-- =====================

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  industry TEXT,
  website_url TEXT,
  logo_url TEXT,
  partnership_start DATE,
  ownership_date DATE,
  monthly_investment DECIMAL(12,2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'onboarding', 'churned')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'owner', 'company_admin', 'member', 'view_only')),
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT false,
  has_completed_onboarding BOOLEAN DEFAULT false,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monthly metrics
CREATE TABLE monthly_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  period_start DATE NOT NULL,
  money_invested DECIMAL(12,2) DEFAULT 0,
  total_leads INTEGER DEFAULT 0,
  qualified_leads INTEGER DEFAULT 0,
  cost_per_lead DECIMAL(12,2) DEFAULT 0,
  revenue_pipeline DECIMAL(12,2) DEFAULT 0,
  revenue_closed DECIMAL(12,2) DEFAULT 0,
  prev_money_invested DECIMAL(12,2) DEFAULT 0,
  prev_total_leads INTEGER DEFAULT 0,
  prev_qualified_leads INTEGER DEFAULT 0,
  prev_cost_per_lead DECIMAL(12,2) DEFAULT 0,
  prev_revenue_pipeline DECIMAL(12,2) DEFAULT 0,
  prev_revenue_closed DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, period_start)
);

-- Daily performance
CREATE TABLE daily_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  spend DECIMAL(12,2) DEFAULT 0,
  leads INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, date)
);

-- Channels
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  period_start DATE NOT NULL,
  channel_name TEXT NOT NULL,
  spend DECIMAL(12,2) DEFAULT 0,
  leads INTEGER DEFAULT 0,
  cost_per_lead DECIMAL(12,2) DEFAULT 0,
  trend_note TEXT DEFAULT '',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, period_start, channel_name)
);

-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  channel_name TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  spend DECIMAL(12,2) DEFAULT 0,
  leads INTEGER DEFAULT 0,
  cost_per_lead DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'testing')),
  period_start DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  lead_name TEXT NOT NULL,
  company_name_lead TEXT DEFAULT '',
  source TEXT CHECK (source IN ('google_ads', 'meta', 'bing', 'tiktok', 'seo', 'organic', 'referral')),
  campaign TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_conversation', 'won', 'lost')),
  value DECIMAL(12,2) DEFAULT 0,
  assigned_to UUID REFERENCES users(id),
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead notes
CREATE TABLE lead_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id),
  note_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead activity
CREATE TABLE lead_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id),
  activity_type TEXT NOT NULL CHECK (activity_type IN ('status_change', 'note_added', 'value_changed', 'created', 'assigned')),
  description TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insights
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  insight_text TEXT NOT NULL,
  context TEXT DEFAULT 'overview' CHECK (context IN ('overview', 'google_ads', 'meta', 'bing', 'tiktok')),
  display_order INTEGER DEFAULT 0,
  posted_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  report_type TEXT CHECK (report_type IN ('monthly', 'quarterly', 'channel', 'custom')),
  period_start DATE,
  period_end DATE,
  content_url TEXT,
  content_html TEXT,
  share_token TEXT UNIQUE,
  share_expires TIMESTAMPTZ,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inbox threads
CREATE TABLE inbox_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  category TEXT DEFAULT 'update' CHECK (category IN ('update', 'question', 'report', 'action_required')),
  is_read BOOLEAN DEFAULT false,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inbox messages
CREATE TABLE inbox_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES inbox_threads(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'genesis_team')),
  message_text TEXT NOT NULL,
  attachment_url TEXT,
  attachment_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id),
  type TEXT NOT NULL CHECK (type IN ('new_lead', 'status_change', 'new_message', 'report_available', 'weekly_summary', 'budget_alert', 'insight_posted')),
  title TEXT NOT NULL,
  description TEXT,
  is_read BOOLEAN DEFAULT false,
  link_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  notification_type TEXT NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  UNIQUE(user_id, notification_type)
);

-- Admin users table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- ROW LEVEL SECURITY
-- =====================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT company_id FROM users WHERE id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM users WHERE id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Companies policies
CREATE POLICY "Admins full access to companies" ON companies FOR ALL USING (is_admin());
CREATE POLICY "Users view own company" ON companies FOR SELECT USING (id = get_user_company_id());

-- Users policies
CREATE POLICY "Admins full access to users" ON users FOR ALL USING (is_admin());
CREATE POLICY "Users view own company members" ON users FOR SELECT USING (company_id = get_user_company_id());
CREATE POLICY "Users update own record" ON users FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Monthly metrics policies
CREATE POLICY "Admins full access to monthly_metrics" ON monthly_metrics FOR ALL USING (is_admin());
CREATE POLICY "Users view own company metrics" ON monthly_metrics FOR SELECT USING (company_id = get_user_company_id());

-- Daily performance policies
CREATE POLICY "Admins full access to daily_performance" ON daily_performance FOR ALL USING (is_admin());
CREATE POLICY "Users view own company daily" ON daily_performance FOR SELECT USING (company_id = get_user_company_id());

-- Channels policies
CREATE POLICY "Admins full access to channels" ON channels FOR ALL USING (is_admin());
CREATE POLICY "Users view own company channels" ON channels FOR SELECT USING (company_id = get_user_company_id());

-- Campaigns policies
CREATE POLICY "Admins full access to campaigns" ON campaigns FOR ALL USING (is_admin());
CREATE POLICY "Users view own company campaigns" ON campaigns FOR SELECT USING (company_id = get_user_company_id());

-- Leads policies
CREATE POLICY "Admins full access to leads" ON leads FOR ALL USING (is_admin());
CREATE POLICY "Users view own company leads" ON leads FOR SELECT USING (company_id = get_user_company_id());
CREATE POLICY "Members can insert leads" ON leads FOR INSERT WITH CHECK (company_id = get_user_company_id() AND get_user_role() IN ('owner', 'company_admin', 'member'));
CREATE POLICY "Members can update leads" ON leads FOR UPDATE USING (company_id = get_user_company_id() AND get_user_role() IN ('owner', 'company_admin', 'member'));

-- Lead notes policies
CREATE POLICY "Admins full access to lead_notes" ON lead_notes FOR ALL USING (is_admin());
CREATE POLICY "Users view own company lead notes" ON lead_notes FOR SELECT USING (lead_id IN (SELECT id FROM leads WHERE company_id = get_user_company_id()));
CREATE POLICY "Members can insert lead notes" ON lead_notes FOR INSERT WITH CHECK (lead_id IN (SELECT id FROM leads WHERE company_id = get_user_company_id()) AND get_user_role() IN ('owner', 'company_admin', 'member'));

-- Lead activity policies
CREATE POLICY "Admins full access to lead_activity" ON lead_activity FOR ALL USING (is_admin());
CREATE POLICY "Users view own company lead activity" ON lead_activity FOR SELECT USING (lead_id IN (SELECT id FROM leads WHERE company_id = get_user_company_id()));

-- Insights policies
CREATE POLICY "Admins full access to insights" ON insights FOR ALL USING (is_admin());
CREATE POLICY "Users view own company insights" ON insights FOR SELECT USING (company_id = get_user_company_id());

-- Reports policies
CREATE POLICY "Admins full access to reports" ON reports FOR ALL USING (is_admin());
CREATE POLICY "Users view own company reports" ON reports FOR SELECT USING (company_id = get_user_company_id() AND is_visible = true);

-- Inbox thread policies
CREATE POLICY "Admins full access to inbox_threads" ON inbox_threads FOR ALL USING (is_admin());
CREATE POLICY "Users view own company threads" ON inbox_threads FOR SELECT USING (company_id = get_user_company_id());
CREATE POLICY "Members update thread read status" ON inbox_threads FOR UPDATE USING (company_id = get_user_company_id());

-- Inbox message policies
CREATE POLICY "Admins full access to inbox_messages" ON inbox_messages FOR ALL USING (is_admin());
CREATE POLICY "Users view own company messages" ON inbox_messages FOR SELECT USING (thread_id IN (SELECT id FROM inbox_threads WHERE company_id = get_user_company_id()));
CREATE POLICY "Members can send messages" ON inbox_messages FOR INSERT WITH CHECK (thread_id IN (SELECT id FROM inbox_threads WHERE company_id = get_user_company_id()) AND get_user_role() IN ('owner', 'company_admin', 'member'));

-- Notification policies
CREATE POLICY "Users view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins full access to notifications" ON notifications FOR ALL USING (is_admin());

-- Notification preferences policies
CREATE POLICY "Users manage own preferences" ON notification_preferences FOR ALL USING (user_id = auth.uid());

-- Admin users policies
CREATE POLICY "Admins can view admin_users" ON admin_users FOR SELECT USING (is_admin());

-- =====================
-- INDEXES
-- =====================

CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_monthly_metrics_company_period ON monthly_metrics(company_id, period_start);
CREATE INDEX idx_daily_perf_company_date ON daily_performance(company_id, date);
CREATE INDEX idx_channels_company_period ON channels(company_id, period_start);
CREATE INDEX idx_campaigns_company ON campaigns(company_id);
CREATE INDEX idx_leads_company_status ON leads(company_id, status);
CREATE INDEX idx_leads_company_created ON leads(company_id, created_at DESC);
CREATE INDEX idx_lead_notes_lead ON lead_notes(lead_id);
CREATE INDEX idx_lead_activity_lead ON lead_activity(lead_id, created_at DESC);
CREATE INDEX idx_insights_company ON insights(company_id);
CREATE INDEX idx_reports_company ON reports(company_id);
CREATE INDEX idx_reports_share_token ON reports(share_token);
CREATE INDEX idx_inbox_threads_company ON inbox_threads(company_id, last_message_at DESC);
CREATE INDEX idx_inbox_messages_thread ON inbox_messages(thread_id, created_at);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
