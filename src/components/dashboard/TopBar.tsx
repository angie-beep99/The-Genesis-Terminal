'use client';

import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-browser';

interface TopBarProps {
  companyName: string;
  contactName: string;
}

export default function TopBar({ companyName, contactName }: TopBarProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  const initials = contactName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-genesis-bg/80 backdrop-blur-xl border-b border-genesis-border">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-[60px] flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-semibold tracking-tight text-genesis-text">
            Genesis Terminal
          </span>
          <div className="flex items-center gap-1.5 ml-2">
            <div className="w-1.5 h-1.5 rounded-full bg-genesis-gold animate-pulse-slow" />
            <span className="text-[11px] text-genesis-muted">Live</span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-genesis-text">{companyName}</p>
            <p className="text-[11px] text-genesis-muted">{today}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-9 h-9 rounded-full bg-genesis-card border border-genesis-border flex items-center justify-center text-xs font-medium text-genesis-gold hover:bg-genesis-border transition-colors"
            title="Sign out"
          >
            {initials}
          </button>
        </div>
      </div>
    </header>
  );
}
