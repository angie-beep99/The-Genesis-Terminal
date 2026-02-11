"use client";

import { motion } from "framer-motion";
import { PipelineSummary } from "@/types/database";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { formatNumber } from "@/lib/utils";

interface PipelineFunnelProps {
  data: PipelineSummary | null;
}

interface Stage {
  label: string;
  key: keyof PipelineSummary;
  color: string;
}

const stages: Stage[] = [
  { label: "New", key: "new_leads", color: "bg-genesis-muted/30" },
  { label: "Contacted", key: "contacted", color: "bg-blue-500/30" },
  { label: "Qualified", key: "qualified", color: "bg-genesis-gold/30" },
  { label: "Proposal", key: "proposal_sent", color: "bg-purple-500/30" },
  { label: "Converted", key: "converted", color: "bg-genesis-positive/30" },
  { label: "Churned", key: "churned", color: "bg-genesis-negative/30" },
];

export function PipelineFunnel({ data }: PipelineFunnelProps) {
  if (!data) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="card"
      >
        <h3 className="text-sm font-medium text-genesis-muted mb-6">
          Lead Pipeline
        </h3>
        <p className="text-genesis-muted text-sm">No pipeline data</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="card"
    >
      <h3 className="text-sm font-medium text-genesis-muted mb-6">
        Lead Pipeline
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stages.map((stage, i) => {
          const value = Number(data[stage.key]) || 0;
          const nextStage = stages[i + 1];
          const nextValue = nextStage
            ? Number(data[nextStage.key]) || 0
            : null;
          const conversionRate =
            nextValue !== null && value > 0
              ? ((nextValue / value) * 100).toFixed(0)
              : null;

          return (
            <div key={stage.key} className="relative group">
              <div
                className={`${stage.color} rounded-xl p-4 text-center border border-genesis-border`}
              >
                <div className="text-2xl font-semibold text-genesis-text">
                  <AnimatedCounter value={value} format={formatNumber} />
                </div>
                <div className="text-xs text-genesis-muted mt-1">
                  {stage.label}
                </div>
              </div>
              {conversionRate && (
                <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-genesis-card border border-genesis-border rounded px-2 py-1 text-xs text-genesis-muted whitespace-nowrap z-10">
                  {conversionRate}% → {nextStage.label}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
