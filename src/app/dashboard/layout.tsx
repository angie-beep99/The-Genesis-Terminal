'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import Sidebar from '@/components/layout/Sidebar';
import NotificationBell from '@/components/layout/NotificationBell';
import CommandPalette from '@/components/command-palette/CommandPalette';
import { getUnreadThreadCount } from '@/lib/data';

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, company, loading } = useAuth();
  const router = useRouter();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!company) return;
    const loadUnread = async () => {
      const count = await getUnreadThreadCount(company.id);
      setUnreadMessages(count);
    };
    loadUnread();
    const interval = setInterval(loadUnread, 30000);
    return () => clearInterval(interval);
  }, [company]);

  if (loading) {
    return (
      <div className="min-h-screen bg-genesis-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-genesis-gold animate-pulse-slow" />
          <p className="text-sm text-genesis-muted">Loading your Terminal...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-genesis-bg">
      <Sidebar unreadMessages={unreadMessages} />

      {/* Top bar for notifications */}
      <div className="fixed top-0 right-0 left-0 lg:left-60 h-14 bg-genesis-bg/80 backdrop-blur-md border-b border-genesis-border/50 z-30 flex items-center justify-end px-4 lg:px-6">
        <NotificationBell />
      </div>

      {/* Main content */}
      <main className="lg:ml-60 pt-14 pb-20 lg:pb-8">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </main>

      <CommandPalette />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  );
}
