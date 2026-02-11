'use client';

import { motion } from 'framer-motion';
import type { Insight } from '@/types/database';

interface InsightsProps {
  insights: Insight[];
}

export default function Insights({ insights }: InsightsProps) {
  if (!insights.length) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-genesis-text">What&apos;s Happening</h2>
      </div>

      <div className="space-y-3">
        {insights.map((insight, i) => (
          <motion.div
            key={insight.id || i}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="bg-genesis-card border border-genesis-border rounded-card p-5 sm:p-6 border-l-2 border-l-genesis-gold"
          >
            <p className="text-sm text-genesis-text/90 leading-relaxed">
              {insight.insight_text}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
