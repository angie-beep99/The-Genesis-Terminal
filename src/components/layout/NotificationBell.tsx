'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead } from '@/lib/data';
import { timeAgo } from '@/lib/utils';
import type { Notification } from '@/types/database';

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [notifs, count] = await Promise.all([
        getNotifications(user.id, 10),
        getUnreadNotificationCount(user.id),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_lead':
        return (
          <svg className="w-4 h-4 text-genesis-positive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
          </svg>
        );
      case 'new_message':
        return (
          <svg className="w-4 h-4 text-genesis-info" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        );
      case 'report_available':
        return (
          <svg className="w-4 h-4 text-genesis-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-genesis-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        );
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-genesis-secondary hover:text-genesis-text hover:bg-genesis-card transition-all"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-genesis-negative text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce-subtle">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-genesis-card border border-genesis-border rounded-card shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-genesis-border">
            <h3 className="text-sm font-medium text-genesis-text">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-genesis-gold hover:text-genesis-gold-hover transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-genesis-muted">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => !notif.is_read && handleMarkRead(notif.id)}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-genesis-card-hover transition-colors border-b border-genesis-border/50 last:border-0 ${!notif.is_read ? 'bg-genesis-gold/5' : ''}`}
                >
                  <div className="flex-shrink-0 mt-0.5">{getIcon(notif.type)}</div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${!notif.is_read ? 'text-genesis-text font-medium' : 'text-genesis-secondary'}`}>
                      {notif.title}
                    </p>
                    {notif.description && (
                      <p className="text-xs text-genesis-muted mt-0.5 truncate">{notif.description}</p>
                    )}
                    <p className="text-[11px] text-genesis-muted mt-1">{timeAgo(notif.created_at)}</p>
                  </div>
                  {!notif.is_read && (
                    <div className="w-2 h-2 rounded-full bg-genesis-gold flex-shrink-0 mt-2" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
