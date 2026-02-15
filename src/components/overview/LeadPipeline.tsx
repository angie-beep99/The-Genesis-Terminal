'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Lead, LeadStatus } from '@/types/database';

interface LeadPipelineProps {
  leads: Lead[];
}

interface StageConfig {
  status: LeadStatus;
  label: string;
  colorClass: string;
  countColorClass: string;
}

const STAGES: StageConfig[] = [
  { status: 'new', label: 'New', colorClass: 'bg-genesis-text/10', countColorClass: 'text-genesis-text' },
  { status: 'in_conversation', label: 'In Conversation', colorClass: 'bg-genesis-info/10', countColorClass: 'text-genesis-info' },
  { status: 'won', label: 'Won', colorClass: 'bg-genesis-gold/10', countColorClass: 'text-genesis-gold' },
  { status: 'lost', label: 'Lost', colorClass: 'bg-genesis-negative/10', countColorClass: 'text-genesis-negative' },
];

export default function LeadPipeline({ leads }: LeadPipelineProps) {
  const counts = useMemo(() => {
    const map: Record<string, number> = { new: 0, in_conversation: 0, won: 0, lost: 0 };
    leads.forEach((lead) => {
      if (map[lead.status] !== undefined) {
        map[lead.status]++;
      }
    });
    return map;
  }, [leads]);

  const totalProcessed = counts.won + counts.lost;
  const conversionRate = totalProcessed > 0
    ? ((counts.won / totalProcessed) * 100).toFixed(1)
    : '0.0';

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="bg-genesis-card border border-genesis-border rounded-card p-6"
    >
      <h3 className="text-sm font-medium text-genesis-text mb-6">Lead Pipeline</h3>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {STAGES.map((stage) => (
          <motion.div key={stage.status} variants={item}>
            <Link
              href={`/dashboard/leads?status=${stage.status}`}
              className={`block rounded-lg p-4 ${stage.colorClass} hover:ring-1 hover:ring-genesis-border transition-all cursor-pointer`}
            >
              <span className="text-[11px] uppercase tracking-wider text-genesis-muted font-medium">
                {stage.label}
              </span>
              <p className={`text-2xl font-semibold tabular-nums mt-1 ${stage.countColorClass}`}>
                {counts[stage.status]}
              </p>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-5 pt-4 border-t border-genesis-border flex items-center justify-between">
        <p className="text-xs text-genesis-secondary">
          Conversion rate:{' '}
          <span className="text-genesis-gold font-medium">{conversionRate}%</span>
          <span className="text-genesis-muted ml-1">
            ({counts.won} won / {totalProcessed} resolved)
          </span>
        </p>
      </div>
    </motion.div>
  );
}
