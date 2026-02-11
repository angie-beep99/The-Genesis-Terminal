-- Genesis Terminal Database Schema
-- Paid Media Performance Dashboard

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monthly metrics
CREATE TABLE monthly_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  month DATE NOT NULL,
  money_invested DECIMAL(12,2) DEFAULT 0,
  total_leads INTEGER DEFAULT 0,
  qualified_leads INTEGER DEFAULT 0,
  revenue_pipeline DECIMAL(12,2) DEFAULT 0,
  revenue_closed DECIMAL(12,2) DEFAULT 0,
  prev_money_invested DECIMAL(12,2) DEFAULT 0,
  prev_leads INTEGER DEFAULT 0,
  prev_qualified INTEGER DEFAULT 0,
  prev_revenue_pipeline DECIMAL(12,2) DEFAULT 0,
  prev_revenue_closed DECIMAL(12,2) DEFAULT 0,
  UNIQUE(client_id, month)
);

-- Channel data
CREATE TABLE channel_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  month DATE NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('google_ads', 'meta', 'bing', 'tiktok')),
  spend DECIMAL(12,2) DEFAULT 0,
  leads INTEGER DEFAULT 0,
  trend_note TEXT DEFAULT '',
  UNIQUE(client_id, month, channel)
);

-- Daily performance
CREATE TABLE daily_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  spend DECIMAL(12,2) DEFAULT 0,
  leads INTEGER DEFAULT 0,
  UNIQUE(client_id, date)
);

-- Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  company TEXT DEFAULT '',
  source TEXT NOT NULL CHECK (source IN ('google_ads', 'meta', 'bing', 'tiktok', 'seo', 'organic', 'referral')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_conversation', 'won', 'lost')),
  value DECIMAL(12,2) DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pipeline summary
CREATE TABLE pipeline_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  month DATE NOT NULL,
  new_leads INTEGER DEFAULT 0,
  in_conversation INTEGER DEFAULT 0,
  won INTEGER DEFAULT 0,
  lost INTEGER DEFAULT 0,
  UNIQUE(client_id, month)
);

-- Insights
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  month DATE NOT NULL,
  insight_text TEXT NOT NULL,
  display_order INTEGER DEFAULT 0
);

-- Admin users table (to identify admin emails)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE email = auth.jwt() ->> 'email'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Client's own ID lookup
CREATE OR REPLACE FUNCTION get_client_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM clients
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clients policies
CREATE POLICY "Admins can do everything with clients" ON clients
  FOR ALL USING (is_admin());

CREATE POLICY "Clients can view own record" ON clients
  FOR SELECT USING (user_id = auth.uid());

-- Monthly metrics policies
CREATE POLICY "Admins full access to monthly_metrics" ON monthly_metrics
  FOR ALL USING (is_admin());

CREATE POLICY "Clients view own metrics" ON monthly_metrics
  FOR SELECT USING (client_id = get_client_id());

-- Channel data policies
CREATE POLICY "Admins full access to channel_data" ON channel_data
  FOR ALL USING (is_admin());

CREATE POLICY "Clients view own channel_data" ON channel_data
  FOR SELECT USING (client_id = get_client_id());

-- Daily performance policies
CREATE POLICY "Admins full access to daily_performance" ON daily_performance
  FOR ALL USING (is_admin());

CREATE POLICY "Clients view own daily_performance" ON daily_performance
  FOR SELECT USING (client_id = get_client_id());

-- Leads policies
CREATE POLICY "Admins full access to leads" ON leads
  FOR ALL USING (is_admin());

CREATE POLICY "Clients view own leads" ON leads
  FOR SELECT USING (client_id = get_client_id());

CREATE POLICY "Clients can update own lead status" ON leads
  FOR UPDATE USING (client_id = get_client_id())
  WITH CHECK (client_id = get_client_id());

-- Pipeline summary policies
CREATE POLICY "Admins full access to pipeline_summary" ON pipeline_summary
  FOR ALL USING (is_admin());

CREATE POLICY "Clients view own pipeline" ON pipeline_summary
  FOR SELECT USING (client_id = get_client_id());

-- Insights policies
CREATE POLICY "Admins full access to insights" ON insights
  FOR ALL USING (is_admin());

CREATE POLICY "Clients view own insights" ON insights
  FOR SELECT USING (client_id = get_client_id());

-- Admin users policies
CREATE POLICY "Admins can view admin_users" ON admin_users
  FOR SELECT USING (is_admin());

-- Indexes for performance
CREATE INDEX idx_monthly_metrics_client_month ON monthly_metrics(client_id, month);
CREATE INDEX idx_channel_data_client_month ON channel_data(client_id, month);
CREATE INDEX idx_daily_performance_client_date ON daily_performance(client_id, date);
CREATE INDEX idx_leads_client_status ON leads(client_id, status);
CREATE INDEX idx_leads_client_created ON leads(client_id, created_at DESC);
CREATE INDEX idx_pipeline_summary_client_month ON pipeline_summary(client_id, month);
CREATE INDEX idx_insights_client_month ON insights(client_id, month);
