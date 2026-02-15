'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { getAllCompanies } from '@/lib/data';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { Company } from '@/types/database';

interface CompanyStats {
  totalLeadsThisMonth: number;
  totalAdSpend: number;
  totalRevenue: number;
  leadsMap: Record<string, number>;
  spendMap: Record<string, number>;
  lastUpdateMap: Record<string, string>;
}

export default function AdminClientsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState<CompanyStats>({
    totalLeadsThisMonth: 0,
    totalAdSpend: 0,
    totalRevenue: 0,
    leadsMap: {},
    spendMap: {},
    lastUpdateMap: {},
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    async function load() {
      const allCompanies = await getAllCompanies();
      setCompanies(allCompanies);

      // Load aggregate stats
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

      const { data: metricsData } = await supabase
        .from('monthly_metrics')
        .select('company_id, money_invested, total_leads, revenue_closed')
        .eq('period_start', monthStart);

      let totalLeads = 0;
      let totalSpend = 0;
      let totalRevenue = 0;
      const leadsMap: Record<string, number> = {};
      const spendMap: Record<string, number> = {};

      if (metricsData) {
        for (const m of metricsData) {
          totalLeads += m.total_leads || 0;
          totalSpend += m.money_invested || 0;
          totalRevenue += m.revenue_closed || 0;
          leadsMap[m.company_id] = m.total_leads || 0;
          spendMap[m.company_id] = m.money_invested || 0;
        }
      }

      // Get last update timestamps from insights or monthly_metrics
      const lastUpdateMap: Record<string, string> = {};
      const { data: insightsData } = await supabase
        .from('insights')
        .select('company_id, created_at')
        .order('created_at', { ascending: false });

      if (insightsData) {
        for (const insight of insightsData) {
          if (!lastUpdateMap[insight.company_id]) {
            lastUpdateMap[insight.company_id] = insight.created_at;
          }
        }
      }

      setStats({
        totalLeadsThisMonth: totalLeads,
        totalAdSpend: totalSpend,
        totalRevenue: totalRevenue,
        leadsMap,
        spendMap,
        lastUpdateMap,
      });

      setLoading(false);
    }
    load();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/admin');
    router.refresh();
  };

  const activeCompanies = useMemo(
    () => companies.filter((c) => c.status === 'active'),
    [companies]
  );

  const statusColors: Record<string, string> = {
    active: 'text-genesis-positive bg-genesis-positive/10',
    onboarding: 'text-genesis-gold bg-genesis-gold/10',
    churned: 'text-genesis-negative bg-genesis-negative/10',
  };

  return (
    <div className="min-h-screen bg-genesis-bg">
      {/* Admin Header */}
      <header className="border-b border-genesis-border bg-genesis-bg/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[15px] font-semibold text-genesis-text">
              Genesis Terminal
            </span>
            <span className="text-xs text-genesis-gold bg-genesis-gold/10 border border-genesis-gold/20 px-2.5 py-0.5 rounded-full font-medium">
              Admin
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs text-genesis-muted hover:text-genesis-text transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-genesis-card border border-genesis-border rounded-card p-5">
            <p className="text-xs text-genesis-muted uppercase tracking-wider mb-1">
              Active Clients
            </p>
            <p className="text-2xl font-semibold text-genesis-text">
              {loading ? '--' : activeCompanies.length}
            </p>
            <p className="text-xs text-genesis-secondary mt-1">
              {companies.length} total
            </p>
          </div>
          <div className="bg-genesis-card border border-genesis-border rounded-card p-5">
            <p className="text-xs text-genesis-muted uppercase tracking-wider mb-1">
              Leads This Month
            </p>
            <p className="text-2xl font-semibold text-genesis-text">
              {loading ? '--' : formatNumber(stats.totalLeadsThisMonth)}
            </p>
            <p className="text-xs text-genesis-secondary mt-1">
              Across all clients
            </p>
          </div>
          <div className="bg-genesis-card border border-genesis-border rounded-card p-5">
            <p className="text-xs text-genesis-muted uppercase tracking-wider mb-1">
              Total Ad Spend
            </p>
            <p className="text-2xl font-semibold text-genesis-text">
              {loading ? '--' : formatCurrency(stats.totalAdSpend)}
            </p>
            <p className="text-xs text-genesis-secondary mt-1">
              Current period
            </p>
          </div>
          <div className="bg-genesis-card border border-genesis-border rounded-card p-5">
            <p className="text-xs text-genesis-muted uppercase tracking-wider mb-1">
              Revenue Influenced
            </p>
            <p className="text-2xl font-semibold text-genesis-gold">
              {loading ? '--' : formatCurrency(stats.totalRevenue)}
            </p>
            <p className="text-xs text-genesis-secondary mt-1">
              Closed this month
            </p>
          </div>
        </div>

        {/* Header Row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-genesis-text">Clients</h1>
            <p className="text-sm text-genesis-muted mt-1">
              Manage client accounts and data
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/clients/new')}
            className="bg-genesis-gold hover:bg-genesis-gold-hover text-genesis-bg font-medium rounded-lg px-5 py-2 text-sm transition-all"
          >
            Add New Client
          </button>
        </div>

        {/* Client Table */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-genesis-card border border-genesis-border rounded-card p-6 animate-pulse"
              >
                <div className="h-4 w-48 bg-genesis-border rounded" />
              </div>
            ))}
          </div>
        ) : companies.length === 0 ? (
          <div className="bg-genesis-card border border-genesis-border rounded-card p-12 text-center">
            <p className="text-genesis-muted">No clients yet</p>
            <button
              onClick={() => router.push('/admin/clients/new')}
              className="text-genesis-gold text-sm mt-2 hover:underline"
            >
              Add your first client
            </button>
          </div>
        ) : (
          <div className="bg-genesis-card border border-genesis-border rounded-card overflow-hidden">
            {/* Table Header */}
            <div className="hidden sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-genesis-border bg-genesis-bg/50">
              <span className="text-xs text-genesis-muted uppercase tracking-wider font-medium">
                Company Name
              </span>
              <span className="text-xs text-genesis-muted uppercase tracking-wider font-medium">
                Status
              </span>
              <span className="text-xs text-genesis-muted uppercase tracking-wider font-medium">
                Monthly Spend
              </span>
              <span className="text-xs text-genesis-muted uppercase tracking-wider font-medium">
                Leads
              </span>
              <span className="text-xs text-genesis-muted uppercase tracking-wider font-medium">
                Last Update
              </span>
              <span className="text-xs text-genesis-muted uppercase tracking-wider font-medium" />
            </div>

            {/* Table Rows */}
            {companies.map((company) => (
              <button
                key={company.id}
                onClick={() => router.push(`/admin/clients/${company.id}`)}
                className="w-full grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 sm:gap-4 px-6 py-4 border-b border-genesis-border last:border-b-0 hover:bg-genesis-card-hover transition-all text-left group"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-genesis-text group-hover:text-genesis-gold transition-colors">
                    {company.company_name}
                  </span>
                  <span className="text-xs text-genesis-muted sm:hidden">
                    {company.industry || 'No industry'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      statusColors[company.status] || 'text-genesis-muted bg-genesis-bg'
                    }`}
                  >
                    {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-genesis-text">
                    {stats.spendMap[company.id]
                      ? formatCurrency(stats.spendMap[company.id])
                      : '--'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-genesis-text">
                    {stats.leadsMap[company.id] != null
                      ? formatNumber(stats.leadsMap[company.id])
                      : '--'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-xs text-genesis-muted">
                    {stats.lastUpdateMap[company.id]
                      ? new Date(stats.lastUpdateMap[company.id]).toLocaleDateString()
                      : '--'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-xs text-genesis-gold opacity-0 group-hover:opacity-100 transition-opacity">
                    Manage &rarr;
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
