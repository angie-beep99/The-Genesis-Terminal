'use client';

import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import type { Insight } from '@/types/database';

interface InsightsSectionProps {
  insights: Insight[];
}

export default function InsightsSection({ insights }: InsightsSectionProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
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
      transition={{ duration: 0.4, delay: 0.5 }}
    >
      <h3 className="text-sm font-medium text-genesis-text mb-4">From Your Growth Team</h3>

      {insights.length === 0 ? (
        <div className="bg-genesis-card border border-genesis-border rounded-card p-6">
          <p className="text-sm text-genesis-muted">
            No insights yet. Your growth team will post updates here.
          </p>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {insights.map((insight) => (
            <motion.div
              key={insight.id}
              variants={item}
              className="bg-genesis-card border border-genesis-border rounded-card p-5 border-l-[3px] border-l-genesis-gold"
            >
              <p className="text-sm text-genesis-text leading-relaxed">
                {insight.insight_text}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-[11px] text-genesis-muted">
                  {format(parseISO(insight.posted_date), 'MMM d, yyyy')}
                </span>
                <span className="text-[11px] text-genesis-muted">&middot;</span>
                <span className="text-[11px] text-genesis-gold font-medium">
                  Genesis Growth Team
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
