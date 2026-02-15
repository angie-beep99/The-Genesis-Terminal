'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Lead } from '@/types/database';
import { SOURCE_LABELS } from '@/types/database';
import { timeAgo } from '@/lib/utils';

interface RecentActivityProps {
  leads: Lead[];
}

interface ActivityEvent {
  id: string;
  icon: 'new' | 'won' | 'lost' | 'conversation';
  description: string;
  timestamp: string;
}

function getActivityIcon(type: ActivityEvent['icon']) {
  switch (type) {
    case 'new':
      return (
        <div className="w-6 h-6 rounded-full bg-genesis-text/10 flex items-center justify-center flex-shrink-0">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 2.5V9.5M2.5 6H9.5" stroke="#EAEAEA" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      );
    case 'won':
      return (
        <div className="w-6 h-6 rounded-full bg-genesis-gold/10 flex items-center justify-center flex-shrink-0">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6.5L5 9L9.5 3" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      );
    case 'lost':
      return (
        <div className="w-6 h-6 rounded-full bg-genesis-negative/10 flex items-center justify-center flex-shrink-0">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3.5 3.5L8.5 8.5M8.5 3.5L3.5 8.5" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      );
    case 'conversation':
      return (
        <div className="w-6 h-6 rounded-full bg-genesis-info/10 flex items-center justify-center flex-shrink-0">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 3.5C2 2.94772 2.44772 2.5 3 2.5H9C9.55228 2.5 10 2.94772 10 3.5V7.5C10 8.05228 9.55228 8.5 9 8.5H5L3 10V8.5H3C2.44772 8.5 2 8.05228 2 7.5V3.5Z" stroke="#3B82F6" strokeWidth="1.2" />
          </svg>
        </div>
      );
  }
}

export default function RecentActivity({ leads }: RecentActivityProps) {
  const events = useMemo<ActivityEvent[]>(() => {
    const items: ActivityEvent[] = [];

    leads.forEach((lead) => {
      const sourceName = lead.source ? (SOURCE_LABELS[lead.source] || lead.source) : 'Unknown';

      // Created event
      items.push({
        id: `${lead.id}-created`,
        icon: 'new',
        description: `New lead: ${lead.lead_name} from ${sourceName}`,
        timestamp: lead.created_at,
      });

      // If status is not 'new', add a status change event
      if (lead.status === 'won') {
        items.push({
          id: `${lead.id}-won`,
          icon: 'won',
          description: `${lead.lead_name} marked as Won`,
          timestamp: lead.updated_at,
        });
      } else if (lead.status === 'lost') {
        items.push({
          id: `${lead.id}-lost`,
          icon: 'lost',
          description: `${lead.lead_name} marked as Lost`,
          timestamp: lead.updated_at,
        });
      } else if (lead.status === 'in_conversation') {
        items.push({
          id: `${lead.id}-conversation`,
          icon: 'conversation',
          description: `${lead.lead_name} moved to In Conversation`,
          timestamp: lead.updated_at,
        });
      }
    });

    // Sort by most recent first, take 8
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return items.slice(0, 8);
  }, [leads]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 },
    },
  };

  const item = {
    hidden: { opacity: 0, x: -6 },
    show: { opacity: 1, x: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.45 }}
      className="bg-genesis-card border border-genesis-border rounded-card p-6 flex flex-col"
    >
      <h3 className="text-sm font-medium text-genesis-text mb-6">Recent Activity</h3>

      {events.length === 0 ? (
        <p className="text-sm text-genesis-muted flex-1 flex items-center justify-center">
          No recent activity to show.
        </p>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex-1 space-y-3"
        >
          {events.map((event) => (
            <motion.div
              key={event.id}
              variants={item}
              className="flex items-start gap-3"
            >
              {getActivityIcon(event.icon)}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-genesis-text truncate leading-relaxed">
                  {event.description}
                </p>
              </div>
              <span className="text-[11px] text-genesis-muted whitespace-nowrap flex-shrink-0">
                {timeAgo(event.timestamp)}
              </span>
            </motion.div>
          ))}
        </motion.div>
      )}

      <div className="mt-6 pt-4 border-t border-genesis-border">
        <Link
          href="/dashboard/leads"
          className="text-xs font-medium text-genesis-gold hover:text-genesis-gold-hover transition-colors"
        >
          View all activity &rarr;
        </Link>
      </div>
    </motion.div>
  );
}
