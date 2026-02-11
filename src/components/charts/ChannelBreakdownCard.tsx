"use client";

import { motion } from "framer-motion";
import { ChannelBreakdown } from "@/types/database";
import { channelLabel, formatCurrency } from "@/lib/utils";

interface ChannelBreakdownCardProps {
  data: ChannelBreakdown[];
}

export function ChannelBreakdownCard({ data }: ChannelBreakdownCardProps) {
  const maxSpend = Math.max(...data.map((d) => Number(d.spend)), 1);
  const topChannel = data.reduce(
    (top, curr) => (Number(curr.leads) > Number(top.leads) ? curr : top),
    data[0]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="card"
    >
      <h3 className="text-sm font-medium text-genesis-muted mb-6">
        Channel Breakdown
      </h3>

      {data.length === 0 ? (
        <div className="text-genesis-muted text-sm">No channel data</div>
      ) : (
        <div className="space-y-4">
          {data.map((channel) => (
            <div key={channel.id}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-genesis-text">
                    {channelLabel(channel.channel)}
                  </span>
                  {topChannel && channel.channel === topChannel.channel && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-genesis-gold/20 text-genesis-gold">
                      TOP
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-genesis-muted">
                    {formatCurrency(Number(channel.spend))}
                  </span>
                  <span className="text-genesis-text font-medium">
                    {channel.leads} leads
                  </span>
                </div>
              </div>
              <div className="h-2 bg-genesis-bg rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(Number(channel.spend) / maxSpend) * 100}%`,
                  }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="h-full bg-genesis-gold/40 rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
