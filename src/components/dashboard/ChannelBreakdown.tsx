'use client';

import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';
import type { ChannelData } from '@/types/database';
import { CHANNEL_LABELS } from '@/types/database';

interface ChannelBreakdownProps {
  channels: ChannelData[];
}

export default function ChannelBreakdown({ channels }: ChannelBreakdownProps) {
  if (!channels.length) return null;

  const maxSpend = Math.max(...channels.map((c) => c.spend));
  const sortedChannels = [...channels].sort((a, b) => {
    const cplA = a.leads > 0 ? a.spend / a.leads : Infinity;
    const cplB = b.leads > 0 ? b.spend / b.leads : Infinity;
    return cplA - cplB;
  });

  const bestChannel = sortedChannels[0];
  const worstChannel = sortedChannels[sortedChannels.length - 1];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-genesis-text">Where Your Money Goes</h2>
        <p className="text-sm text-genesis-muted mt-1">Spend and results by channel</p>
      </div>

      <div className="space-y-3">
        {channels.map((channel, index) => {
          const costPerLead = channel.leads > 0 ? channel.spend / channel.leads : 0;
          const spendPercent = maxSpend > 0 ? (channel.spend / maxSpend) * 100 : 0;
          const isBest = channel.channel === bestChannel?.channel;
          const isWorst = channel.channel === worstChannel?.channel && channels.length > 1;
          const trendNote = channel.trend_note || (isBest ? 'Best performer' : isWorst ? 'Under review' : 'Stable');

          const isTrendPositive = trendNote.toLowerCase().includes('best') || trendNote.toLowerCase().includes('improvement') || trendNote.toLowerCase().includes('improv');
          const isTrendNegative = trendNote.toLowerCase().includes('review') || trendNote.toLowerCase().includes('under');

          return (
            <motion.div
              key={channel.id || channel.channel}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="bg-genesis-card border border-genesis-border rounded-card p-5 sm:p-6 relative overflow-hidden"
            >
              {/* Background spend bar */}
              <div
                className="absolute inset-y-0 left-0 bg-white/[0.02] transition-all duration-700"
                style={{ width: `${spendPercent}%` }}
              />

              <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0">
                {/* Channel name */}
                <div className="sm:w-[140px] flex items-center gap-2">
                  <span className="text-sm font-medium text-genesis-text">
                    {CHANNEL_LABELS[channel.channel] || channel.channel}
                  </span>
                  {isBest && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-genesis-gold bg-genesis-gold/10 px-2 py-0.5 rounded-full">
                      Top
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex-1 flex flex-wrap items-center gap-x-8 gap-y-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-genesis-muted mb-0.5">Spent</p>
                    <p className="text-sm font-semibold text-genesis-text">{formatCurrency(channel.spend)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-genesis-muted mb-0.5">Leads</p>
                    <p className="text-sm font-semibold text-genesis-text">{channel.leads}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-genesis-muted mb-0.5">Cost Per Lead</p>
                    <p className={`text-sm font-semibold ${
                      isBest ? 'text-genesis-gold' : isWorst ? 'text-genesis-negative' : 'text-genesis-text'
                    }`}>
                      {formatCurrency(costPerLead)}
                    </p>
                  </div>
                  <div className="sm:ml-auto">
                    <span className={`text-xs ${
                      isTrendPositive
                        ? 'text-genesis-gold'
                        : isTrendNegative
                        ? 'text-genesis-muted'
                        : 'text-genesis-muted'
                    }`}>
                      {isTrendPositive && '↑ '}{isTrendNegative && '↓ '}{!isTrendPositive && !isTrendNegative && '→ '}
                      {trendNote}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
