'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

const navItems = [
  {
    label: 'Overview',
    href: '/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    label: 'Channels',
    href: '/dashboard/channels',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    label: 'Leads',
    href: '/dashboard/leads',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    label: 'Reports',
    href: '/dashboard/reports',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    label: 'Inbox',
    href: '/dashboard/inbox',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
    badge: true,
  },
];

const bottomItems = [
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

interface SidebarProps {
  unreadMessages?: number;
}

export default function Sidebar({ unreadMessages = 0 }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, company, signOut } = useAuth();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'GT';

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed left-0 top-0 h-full bg-genesis-bg border-r border-genesis-border z-40 transition-all duration-200',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-genesis-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-genesis-gold/10 flex items-center justify-center flex-shrink-0">
              <span className="text-genesis-gold font-semibold text-sm">GT</span>
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="overflow-hidden"
                >
                  <p className="text-sm font-semibold text-genesis-text whitespace-nowrap">Genesis Terminal</p>
                  <p className="text-[11px] text-genesis-muted truncate max-w-[160px]">
                    {company?.company_name || 'Loading...'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 relative',
                isActive(item.href)
                  ? 'bg-genesis-card text-genesis-gold'
                  : 'text-genesis-secondary hover:text-genesis-text hover:bg-genesis-card/50'
              )}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {item.badge && unreadMessages > 0 && (
                <span className={cn(
                  'absolute bg-genesis-negative text-white text-[10px] font-bold rounded-full flex items-center justify-center',
                  collapsed ? 'top-1 right-1 w-4 h-4' : 'right-3 w-5 h-5'
                )}>
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-genesis-border px-2 py-4 space-y-1">
          {bottomItems.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                isActive(item.href)
                  ? 'bg-genesis-card text-genesis-gold'
                  : 'text-genesis-secondary hover:text-genesis-text hover:bg-genesis-card/50'
              )}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}

          {/* User */}
          <div className={cn('flex items-center gap-3 px-3 py-2', collapsed && 'justify-center')}>
            <div className="w-8 h-8 rounded-full bg-genesis-card border border-genesis-border flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-genesis-secondary">{initials}</span>
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="min-w-0"
                >
                  <p className="text-sm text-genesis-text truncate">{user?.full_name}</p>
                  <button onClick={signOut} className="text-[11px] text-genesis-muted hover:text-genesis-secondary transition-colors">
                    Log out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-genesis-bg border-t border-genesis-border z-40 flex items-center justify-around h-16 px-2 safe-area-bottom">
        {navItems.slice(0, 4).map((item) => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className={cn(
              'flex flex-col items-center gap-1 py-1 px-3 min-w-[56px] transition-colors',
              isActive(item.href) ? 'text-genesis-gold' : 'text-genesis-muted'
            )}
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
        {/* More button for mobile */}
        <button
          onClick={() => router.push('/dashboard/settings')}
          className={cn(
            'flex flex-col items-center gap-1 py-1 px-3 min-w-[56px] transition-colors relative',
            (isActive('/dashboard/settings') || isActive('/dashboard/inbox'))
              ? 'text-genesis-gold'
              : 'text-genesis-muted'
          )}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
          <span className="text-[10px] font-medium">More</span>
          {unreadMessages > 0 && (
            <span className="absolute top-0 right-2 w-4 h-4 bg-genesis-negative text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
        </button>
      </nav>
    </>
  );
}
