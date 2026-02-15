'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO, subDays } from 'date-fns';
import type { DailyPerformance } from '@/types/database';
import { formatCurrency } from '@/lib/utils';

interface PerformanceChartProps {
  dailyData: DailyPerformance[];
}

type TimeRange = '7D' | '30D' | '90D';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length || !label) return null;

  const spend = payload.find((p) => p.dataKey === 'spend')?.value ?? 0;
  const leads = payload.find((p) => p.dataKey === 'leads')?.value ?? 0;
  const cpl = leads > 0 ? spend / leads : 0;

  return (
    <div className="bg-genesis-card border border-genesis-border rounded-card px-4 py-3 shadow-xl">
      <p className="text-xs text-genesis-muted mb-2">
        {format(parseISO(label), 'MMM d, yyyy')}
      </p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-6">
          <span className="text-xs text-genesis-secondary">Spend</span>
          <span className="text-xs font-medium text-genesis-text tabular-nums">
            {formatCurrency(spend)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-xs text-genesis-secondary">Leads</span>
          <span className="text-xs font-medium text-genesis-gold tabular-nums">
            {leads}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-xs text-genesis-secondary">CPL</span>
          <span className="text-xs font-medium text-genesis-text tabular-nums">
            {formatCurrency(cpl)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function PerformanceChart({ dailyData }: PerformanceChartProps) {
  const [range, setRange] = useState<TimeRange>('30D');

  const filteredData = useMemo(() => {
    const days = range === '7D' ? 7 : range === '30D' ? 30 : 90;
    const cutoff = subDays(new Date(), days);
    return dailyData.filter((d) => parseISO(d.date) >= cutoff);
  }, [dailyData, range]);

  const bestDay = useMemo(() => {
    if (!filteredData.length) return null;
    return filteredData.reduce((best, day) =>
      day.leads > best.leads ? day : best
    );
  }, [filteredData]);

  const ranges: TimeRange[] = ['7D', '30D', '90D'];

  if (!dailyData.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-genesis-card border border-genesis-border rounded-card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-medium text-genesis-text">Performance</h3>
        <div className="flex items-center gap-1 bg-genesis-bg rounded-lg p-1">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                range === r
                  ? 'bg-genesis-gold text-genesis-bg'
                  : 'text-genesis-muted hover:text-genesis-text'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C9A96E" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#C9A96E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1E1E22"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={(val: string) => format(parseISO(val), 'MMM d')}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#52525B', fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="spend"
              orientation="left"
              tickFormatter={(val: number) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#52525B', fontSize: 11 }}
              width={50}
            />
            <YAxis
              yAxisId="leads"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#52525B', fontSize: 11 }}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              yAxisId="leads"
              type="monotone"
              dataKey="leads"
              stroke="#C9A96E"
              strokeWidth={2}
              fill="url(#goldGradient)"
            />
            <Area
              yAxisId="spend"
              type="monotone"
              dataKey="spend"
              stroke="#52525B"
              strokeWidth={1.5}
              fill="none"
              strokeDasharray="4 2"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {bestDay && (
        <p className="mt-4 text-xs text-genesis-secondary">
          Best performing day:{' '}
          <span className="text-genesis-gold font-medium">
            {format(parseISO(bestDay.date), 'EEEE, MMM d')}
          </span>{' '}
          with {bestDay.leads} leads at {formatCurrency(bestDay.spend > 0 && bestDay.leads > 0 ? bestDay.spend / bestDay.leads : 0)} CPL
        </p>
      )}
    </motion.div>
  );
}
