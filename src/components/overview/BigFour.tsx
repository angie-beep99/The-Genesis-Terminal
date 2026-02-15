'use client';

import { motion } from 'framer-motion';
import type { MonthlyMetrics } from '@/types/database';
import { useAnimatedCounter } from '@/lib/hooks';
import { formatPercent, calcPercentChange } from '@/lib/utils';

interface BigFourProps {
  metrics: MonthlyMetrics | null;
}

interface MetricCardProps {
  label: string;
  value: number;
  prevValue: number;
  prefix?: string;
  invertChange?: boolean;
  highlight?: boolean;
  index: number;
}

function MetricCard({ label, value, prevValue, prefix = '', invertChange = false, highlight = false, index }: MetricCardProps) {
  const displayValue = useAnimatedCounter(value, 1200, prefix);
  const change = calcPercentChange(value, prevValue);
  const isPositive = invertChange ? change <= 0 : change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="bg-genesis-card border border-genesis-border rounded-card p-6 flex flex-col gap-3"
    >
      <span className="text-[11px] font-medium uppercase tracking-wider text-genesis-muted">
        {label}
      </span>

      <span
        className={`text-[32px] sm:text-[36px] lg:text-[40px] font-semibold tabular-nums leading-none ${
          highlight ? 'text-genesis-gold' : 'text-genesis-text'
        }`}
      >
        {displayValue}
      </span>

      <div className="flex items-center gap-2">
        {change !== 0 && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              isPositive
                ? 'bg-genesis-positive/10 text-genesis-positive'
                : 'bg-genesis-negative/10 text-genesis-negative'
            }`}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              className={!isPositive ? 'rotate-180' : ''}
            >
              <path d="M5 2L8.5 6.5H1.5L5 2Z" fill="currentColor" />
            </svg>
            {formatPercent(change)}
          </span>
        )}
        <span className="text-[11px] text-genesis-muted">vs last period</span>
      </div>

      {/* Sparkline placeholder */}
      <div className="mt-auto pt-2">
        <div className="h-[24px] w-full flex items-end gap-[2px]">
          {Array.from({ length: 12 }).map((_, i) => {
            const height = 30 + Math.random() * 70;
            return (
              <div
                key={i}
                className={`flex-1 rounded-[1px] ${highlight ? 'bg-genesis-gold/20' : 'bg-genesis-border'}`}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export default function BigFour({ metrics }: BigFourProps) {
  if (!metrics) return null;

  const cards = [
    {
      label: 'Money Invested',
      value: metrics.money_invested,
      prevValue: metrics.prev_money_invested,
      prefix: '$',
    },
    {
      label: 'Leads Generated',
      value: metrics.total_leads,
      prevValue: metrics.prev_total_leads,
      prefix: '',
    },
    {
      label: 'Cost Per Lead',
      value: metrics.cost_per_lead,
      prevValue: metrics.prev_cost_per_lead,
      prefix: '$',
      invertChange: true,
    },
    {
      label: 'Revenue Influenced',
      value: metrics.revenue_pipeline,
      prevValue: metrics.prev_revenue_pipeline,
      prefix: '$',
      highlight: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <MetricCard
          key={card.label}
          index={i}
          label={card.label}
          value={card.value}
          prevValue={card.prevValue}
          prefix={card.prefix}
          invertChange={card.invertChange}
          highlight={card.highlight}
        />
      ))}
    </div>
  );
}
