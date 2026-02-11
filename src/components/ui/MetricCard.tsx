"use client";

import { motion } from "framer-motion";
import { AnimatedCounter } from "./AnimatedCounter";
import { formatPercent, cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: number;
  change: number;
  format: (value: number) => string;
  invertColor?: boolean;
  delay?: number;
}

export function MetricCard({
  title,
  value,
  change,
  format,
  invertColor = false,
  delay = 0,
}: MetricCardProps) {
  const isPositive = invertColor ? change < 0 : change > 0;
  const changeColor = isPositive
    ? "text-genesis-positive bg-genesis-positive/10"
    : change === 0
      ? "text-genesis-muted bg-genesis-muted/10"
      : "text-genesis-negative bg-genesis-negative/10";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="card"
    >
      <p className="text-genesis-muted text-sm mb-1">{title}</p>
      <div className="flex items-end gap-3">
        <span className="text-2xl font-semibold text-genesis-text">
          <AnimatedCounter value={value} format={format} />
        </span>
        <span
          className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            changeColor
          )}
        >
          {formatPercent(change)}
        </span>
      </div>
    </motion.div>
  );
}
