"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import { motion } from "framer-motion";
import { DailyPerformance } from "@/types/database";
import { formatCurrency } from "@/lib/utils";

interface PerformanceChartProps {
  data: DailyPerformance[];
}

type TimeRange = "7D" | "30D" | "90D";

export function PerformanceChart({ data }: PerformanceChartProps) {
  const [range, setRange] = useState<TimeRange>("30D");

  const filteredData = useMemo(() => {
    const days = range === "7D" ? 7 : range === "30D" ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    // Aggregate by date (sum across channels)
    const grouped: Record<string, { spend: number; leads: number }> = {};
    data
      .filter((d) => new Date(d.date) >= cutoff)
      .forEach((d) => {
        if (!grouped[d.date]) {
          grouped[d.date] = { spend: 0, leads: 0 };
        }
        grouped[d.date].spend += Number(d.spend);
        grouped[d.date].leads += Number(d.leads);
      });

    return Object.entries(grouped)
      .map(([date, values]) => ({
        date,
        spend: values.spend,
        leads: values.leads,
        label: new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data, range]);

  const bestDay = useMemo(() => {
    if (filteredData.length === 0) return null;
    return filteredData.reduce((best, curr) =>
      curr.leads > best.leads ? curr : best
    );
  }, [filteredData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="card"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-medium text-genesis-muted">
          Performance Overview
        </h3>
        <div className="flex gap-1 bg-genesis-bg rounded-lg p-1">
          {(["7D", "30D", "90D"] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                range === r
                  ? "bg-genesis-card text-genesis-text"
                  : "text-genesis-muted hover:text-genesis-text"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-genesis-muted text-sm">
          No data for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={filteredData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1A1A1A"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              stroke="#6B6B6B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="spend"
              stroke="#6B6B6B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              yAxisId="leads"
              orientation="right"
              stroke="#6B6B6B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#111111",
                border: "1px solid #1A1A1A",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#E8E8E8" }}
              formatter={(value, name) => [
                name === "spend" ? formatCurrency(value as number) : value,
                name === "spend" ? "Spend" : "Leads",
              ]}
            />
            <Line
              yAxisId="spend"
              type="monotone"
              dataKey="spend"
              stroke="#6B6B6B"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#6B6B6B" }}
            />
            <Line
              yAxisId="leads"
              type="monotone"
              dataKey="leads"
              stroke="#C9A96E"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#C9A96E" }}
            />
            {bestDay && (
              <ReferenceDot
                yAxisId="leads"
                x={bestDay.label}
                y={bestDay.leads}
                r={5}
                fill="#C9A96E"
                stroke="#C9A96E"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      )}

      <div className="flex items-center gap-6 mt-4 text-xs text-genesis-muted">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-genesis-muted rounded" />
          Spend
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-genesis-gold rounded" />
          Leads
        </div>
        {bestDay && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-genesis-gold rounded-full" />
            Best Day
          </div>
        )}
      </div>
    </motion.div>
  );
}
