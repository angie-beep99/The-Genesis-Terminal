'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Channel } from '@/types/database';
import { CHANNEL_LABELS, CHANNEL_COLORS } from '@/types/database';
import { formatCurrency } from '@/lib/utils';

interface ChannelSummaryProps {
  channels: Channel[];
}

export default function ChannelSummary({ channels }: ChannelSummaryProps) {
  if (!channels.length) return null;

  // Sort by best CPL first (lowest CPL is best)
  const sorted = [...channels].sort((a, b) => a.cost_per_lead - b.cost_per_lead);
  const totalSpend = sorted.reduce((sum, ch) => sum + ch.spend, 0);
  const topPerformerIdx = 0;
  const bottomPerformerIdx = sorted.length - 1;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const item = {
    hidden: { opacity: 0, x: -8 },
    show: { opacity: 1, x: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      className="bg-genesis-card border border-genesis-border rounded-card p-6 flex flex-col"
    >
      <h3 className="text-sm font-medium text-genesis-text mb-6">Channels</h3>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex-1 space-y-4"
      >
        {sorted.map((channel, idx) => {
          const spendShare = totalSpend > 0 ? (channel.spend / totalSpend) * 100 : 0;
          const colorDot = CHANNEL_COLORS[channel.channel_name] || '#71717A';
          const label = CHANNEL_LABELS[channel.channel_name] || channel.channel_name;

          return (
            <motion.div key={channel.id} variants={item} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: colorDot }}
                  />
                  <span className="text-sm text-genesis-text">{label}</span>
                  {idx === topPerformerIdx && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-genesis-gold/15 text-genesis-gold">
                      TOP
                    </span>
                  )}
                  {sorted.length > 1 && idx === bottomPerformerIdx && (
                    <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-genesis-muted/15 text-genesis-muted">
                      REVIEWING
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-right">
                  <span className="text-xs text-genesis-muted tabular-nums hidden sm:inline">
                    {formatCurrency(channel.spend)} &middot; {channel.leads} leads
                  </span>
                  <span className="text-sm font-medium text-genesis-text tabular-nums w-16 text-right">
                    {formatCurrency(channel.cost_per_lead)}
                  </span>
                </div>
              </div>

              {/* Progress bar showing share of total spend */}
              <div className="ml-[18px] h-1.5 bg-genesis-border rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${spendShare}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.08, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: colorDot, opacity: 0.6 }}
                />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="mt-6 pt-4 border-t border-genesis-border">
        <Link
          href="/dashboard/channels"
          className="text-xs font-medium text-genesis-gold hover:text-genesis-gold-hover transition-colors"
        >
          View channels &rarr;
        </Link>
      </div>
    </motion.div>
  );
}
