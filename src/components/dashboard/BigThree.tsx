'use client';

import { motion } from 'framer-motion';
import { useAnimatedCounter } from '@/lib/hooks';
import { formatPercent } from '@/lib/utils';
import type { MonthlyMetrics } from '@/types/database';

interface BigThreeProps {
  metrics: MonthlyMetrics | null;
}

function BigCard({
  label,
  value,
  prefix,
  subtitle,
  percentChange,
  prevLabel,
  highlight,
  delay,
}: {
  label: string;
  value: number;
  prefix?: string;
  subtitle: string;
  percentChange: number;
  prevLabel: string;
  highlight?: boolean;
  delay: number;
}) {
  const displayValue = useAnimatedCounter(value, 1400, prefix || '');
  const isPositive = percentChange >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className="bg-genesis-card border border-genesis-border rounded-card p-8 sm:p-10"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-genesis-muted mb-3">
        {label}
      </p>
      <p
        className={`text-4xl sm:text-5xl lg:text-[56px] font-bold tracking-tight leading-none mb-2 ${
          highlight ? 'text-genesis-gold' : 'text-white'
        }`}
      >
        {displayValue}
      </p>
      <p className="text-sm text-genesis-muted mb-4">{subtitle}</p>

      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
            isPositive
              ? 'text-genesis-positive bg-genesis-positive/10'
              : 'text-genesis-negative bg-genesis-negative/10'
          }`}
        >
          {isPositive ? '↑' : '↓'} {formatPercent(percentChange)} vs last month
        </span>
      </div>
      <p className="text-[11px] text-genesis-muted/60 mt-2">{prevLabel}</p>
    </motion.div>
  );
}

export default function BigThree({ metrics }: BigThreeProps) {
  if (!metrics) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-genesis-card border border-genesis-border rounded-card p-8 sm:p-10 animate-pulse"
          >
            <div className="h-3 w-24 bg-genesis-border rounded mb-4" />
            <div className="h-12 w-40 bg-genesis-border rounded mb-3" />
            <div className="h-4 w-32 bg-genesis-border rounded" />
          </div>
        ))}
      </div>
    );
  }

  const moneyChange =
    metrics.prev_money_invested > 0
      ? ((metrics.money_invested - metrics.prev_money_invested) / metrics.prev_money_invested) * 100
      : 0;

  const leadsChange =
    metrics.prev_qualified > 0
      ? ((metrics.qualified_leads - metrics.prev_qualified) / metrics.prev_qualified) * 100
      : 0;

  const totalRevenue = metrics.revenue_pipeline + metrics.revenue_closed;
  const prevTotalRevenue = metrics.prev_revenue_pipeline + metrics.prev_revenue_closed;
  const revenueChange =
    prevTotalRevenue > 0
      ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100
      : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
      <BigCard
        label="Money Invested"
        value={metrics.money_invested}
        prefix="$"
        subtitle="this month"
        percentChange={moneyChange}
        prevLabel={`Last month: $${metrics.prev_money_invested.toLocaleString()}`}
        delay={0}
      />
      <BigCard
        label="Leads Generated"
        value={metrics.qualified_leads}
        subtitle="qualified leads this month"
        percentChange={leadsChange}
        prevLabel={`Total leads: ${metrics.total_leads.toLocaleString()} · Qualified: ${metrics.qualified_leads.toLocaleString()}`}
        delay={0.1}
      />
      <BigCard
        label="Revenue Influenced"
        value={totalRevenue}
        prefix="$"
        subtitle="in pipeline this month"
        percentChange={revenueChange}
        prevLabel={`Closed: $${metrics.revenue_closed.toLocaleString()} · Pipeline: $${metrics.revenue_pipeline.toLocaleString()}`}
        highlight
        delay={0.2}
      />
    </div>
  );
}
