'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import type { DailyPerformance } from '@/types/database';

interface PerformanceChartProps {
  dailyData: DailyPerformance[];
}

type TimeRange = '7' | '30' | '90';

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload || !payload.length) return null;
  const spend = payload.find((p) => p.dataKey === 'spend')?.value || 0;
  const leads = payload.find((p) => p.dataKey === 'leads')?.value || 0;

  return (
    <div className="bg-genesis-card border border-genesis-border rounded-xl px-4 py-3 shadow-xl">
      <p className="text-xs text-genesis-muted mb-1">{label}</p>
      <p className="text-sm text-genesis-text font-medium">{formatCurrency(spend)} spent</p>
      <p className="text-sm text-genesis-gold font-medium">{leads} leads</p>
    </div>
  );
}

export default function PerformanceChart({ dailyData }: PerformanceChartProps) {
  const [range, setRange] = useState<TimeRange>('30');

  const filteredData = useMemo(() => {
    const now = new Date();
    const days = parseInt(range);
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return dailyData
      .filter((d) => new Date(d.date) >= cutoff)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((d) => ({
        ...d,
        dateLabel: new Date(d.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      }));
  }, [dailyData, range]);

  const bestDay = useMemo(() => {
    if (!filteredData.length) return null;
    return filteredData.reduce((best, d) => (d.leads > best.leads ? d : best), filteredData[0]);
  }, [filteredData]);

  const insight = useMemo(() => {
    if (!bestDay) return '';
    const date = new Date(bestDay.date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
    });
    return `Your best performing day was ${date} with ${bestDay.leads} leads.`;
  }, [bestDay]);

  // Determine tick interval based on range
  const tickInterval = range === '7' ? 0 : range === '30' ? 4 : 14;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <h2 className="text-lg font-semibold text-genesis-text">Performance</h2>

        <div className="flex gap-1 bg-genesis-card border border-genesis-border rounded-xl p-1">
          {(['7', '30', '90'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                range === r
                  ? 'bg-genesis-gold text-genesis-bg'
                  : 'text-genesis-muted hover:text-genesis-text'
              }`}
            >
              {r} Days
            </button>
          ))}
        </div>
      </div>

      <div className="bg-genesis-card border border-genesis-border rounded-card p-4 sm:p-6">
        {filteredData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6B6B6B" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#6B6B6B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C9A96E" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#C9A96E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fill: '#6B6B6B', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval={tickInterval}
                />
                <YAxis
                  yAxisId="spend"
                  tick={{ fill: '#6B6B6B', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  yAxisId="leads"
                  orientation="right"
                  tick={{ fill: '#C9A96E', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  yAxisId="spend"
                  type="monotone"
                  dataKey="spend"
                  stroke="#6B6B6B"
                  strokeWidth={1.5}
                  fill="url(#spendGrad)"
                />
                <Area
                  yAxisId="leads"
                  type="monotone"
                  dataKey="leads"
                  stroke="#C9A96E"
                  strokeWidth={2}
                  fill="url(#leadsGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>

            {insight && (
              <p className="text-sm text-genesis-muted mt-4 pt-4 border-t border-genesis-border">
                {insight}
              </p>
            )}
          </>
        ) : (
          <div className="h-[320px] flex items-center justify-center text-genesis-muted text-sm">
            No performance data available yet
          </div>
        )}
      </div>
    </motion.section>
  );
}
