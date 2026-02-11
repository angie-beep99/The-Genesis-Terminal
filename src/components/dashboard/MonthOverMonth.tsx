'use client';

import { motion } from 'framer-motion';
import { formatCurrency, formatNumber, formatPercent, calcPercentChange } from '@/lib/utils';
import type { MonthlyMetrics } from '@/types/database';

interface MonthOverMonthProps {
  metrics: MonthlyMetrics | null;
}

export default function MonthOverMonth({ metrics }: MonthOverMonthProps) {
  if (!metrics) return null;

  const totalRevenue = metrics.revenue_pipeline + metrics.revenue_closed;
  const prevTotalRevenue = metrics.prev_revenue_pipeline + metrics.prev_revenue_closed;
  const costPerLead = metrics.qualified_leads > 0 ? metrics.money_invested / metrics.qualified_leads : 0;
  const prevCostPerLead = metrics.prev_qualified > 0 ? metrics.prev_money_invested / metrics.prev_qualified : 0;

  const rows = [
    {
      label: 'Money Invested',
      current: formatCurrency(metrics.money_invested),
      previous: formatCurrency(metrics.prev_money_invested),
      change: calcPercentChange(metrics.money_invested, metrics.prev_money_invested),
      invertColor: true, // higher spend is neutral, not necessarily good
    },
    {
      label: 'Leads Generated',
      current: formatNumber(metrics.qualified_leads),
      previous: formatNumber(metrics.prev_qualified),
      change: calcPercentChange(metrics.qualified_leads, metrics.prev_qualified),
    },
    {
      label: 'Cost Per Lead',
      current: formatCurrency(costPerLead),
      previous: formatCurrency(prevCostPerLead),
      change: calcPercentChange(costPerLead, prevCostPerLead),
      invertColor: false,
      lowerIsBetter: true,
    },
    {
      label: 'Revenue Influenced',
      current: formatCurrency(totalRevenue),
      previous: formatCurrency(prevTotalRevenue),
      change: calcPercentChange(totalRevenue, prevTotalRevenue),
    },
    {
      label: 'Clients Won',
      current: formatNumber(metrics.revenue_closed > 0 ? Math.round(metrics.revenue_closed / 10000) : 0),
      previous: formatNumber(metrics.prev_revenue_closed > 0 ? Math.round(metrics.prev_revenue_closed / 10000) : 0),
      change: calcPercentChange(metrics.revenue_closed, metrics.prev_revenue_closed),
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-genesis-text">Month Over Month</h2>
      </div>

      <div className="bg-genesis-card border border-genesis-border rounded-card overflow-hidden">
        {/* Header */}
        <div className="hidden sm:grid grid-cols-4 gap-4 px-6 py-3 border-b border-genesis-border">
          <p className="text-[10px] uppercase tracking-wider text-genesis-muted">Metric</p>
          <p className="text-[10px] uppercase tracking-wider text-genesis-muted text-right">Last Month</p>
          <p className="text-[10px] uppercase tracking-wider text-genesis-muted text-right">This Month</p>
          <p className="text-[10px] uppercase tracking-wider text-genesis-muted text-right">Change</p>
        </div>

        {/* Rows */}
        <div className="divide-y divide-genesis-border">
          {rows.map((row, i) => {
            const isGood = row.lowerIsBetter ? row.change < 0 : row.change > 0;
            const isStandout = row.lowerIsBetter ? row.change < -5 : row.change > 15;

            return (
              <motion.div
                key={row.label}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 px-5 sm:px-6 py-4"
              >
                <p className="text-sm font-medium text-genesis-text col-span-2 sm:col-span-1">{row.label}</p>
                <p className="text-sm text-genesis-muted text-right">{row.previous}</p>
                <p className="text-sm text-genesis-text font-medium text-right">{row.current}</p>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium ${
                      isGood ? 'text-genesis-positive' : row.change === 0 ? 'text-genesis-muted' : 'text-genesis-negative'
                    }`}
                  >
                    {row.change > 0 ? '↑' : row.change < 0 ? '↓' : '→'}{' '}
                    {formatPercent(row.change)}
                    {isStandout && isGood && ' '}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
