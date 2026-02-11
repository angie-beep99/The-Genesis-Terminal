"use client";

import { useEffect, useState } from "react";

interface TopBarProps {
  companyName: string;
}

export function TopBar({ companyName }: TopBarProps) {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold text-genesis-text tracking-tight">
          Genesis Terminal
        </h1>
        <div className="flex items-center gap-1.5 bg-genesis-positive/10 px-2.5 py-1 rounded-full">
          <div className="w-2 h-2 bg-genesis-positive rounded-full pulse-dot" />
          <span className="text-genesis-positive text-xs font-medium">Live</span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm text-genesis-muted">
        <span>{time}</span>
        <span className="text-genesis-text font-medium">{companyName}</span>
      </div>
    </div>
  );
}
