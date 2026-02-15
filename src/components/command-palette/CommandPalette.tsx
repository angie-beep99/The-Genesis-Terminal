'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const commands = [
  { id: 'overview', label: 'Go to Overview', category: 'Navigation', path: '/dashboard' },
  { id: 'channels', label: 'Go to Channels', category: 'Navigation', path: '/dashboard/channels' },
  { id: 'leads', label: 'Go to Leads', category: 'Navigation', path: '/dashboard/leads' },
  { id: 'reports', label: 'Go to Reports', category: 'Navigation', path: '/dashboard/reports' },
  { id: 'inbox', label: 'Go to Inbox', category: 'Navigation', path: '/dashboard/inbox' },
  { id: 'settings', label: 'Go to Settings', category: 'Navigation', path: '/dashboard/settings' },
  { id: 'google', label: 'Google Ads Channel', category: 'Channels', path: '/dashboard/channels?tab=google_ads' },
  { id: 'meta', label: 'Meta Channel', category: 'Channels', path: '/dashboard/channels?tab=meta' },
  { id: 'bing', label: 'Bing Channel', category: 'Channels', path: '/dashboard/channels?tab=bing' },
  { id: 'tiktok', label: 'TikTok Channel', category: 'Channels', path: '/dashboard/channels?tab=tiktok' },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const filtered = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, typeof commands>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  const handleOpen = useCallback(() => {
    setOpen(true);
    setSearch('');
    setSelectedIndex(0);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSearch('');
  }, []);

  const handleSelect = useCallback((path: string) => {
    handleClose();
    router.push(path);
  }, [handleClose, router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) {
          handleClose();
        } else {
          handleOpen();
        }
      }
      if (e.key === 'Escape' && open) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleOpen, handleClose]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const handleKeyNav = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      handleSelect(filtered[selectedIndex].path);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg bg-genesis-card border border-genesis-border rounded-card shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-genesis-border">
              <svg className="w-5 h-5 text-genesis-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyNav}
                placeholder="Search commands..."
                className="flex-1 bg-transparent text-genesis-text text-sm placeholder:text-genesis-muted border-0 outline-none"
              />
              <kbd className="text-[10px] text-genesis-muted bg-genesis-bg px-1.5 py-0.5 rounded border border-genesis-border font-mono">ESC</kbd>
            </div>

            <div className="max-h-72 overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-genesis-muted">No results found</p>
                </div>
              ) : (
                Object.entries(grouped).map(([category, items]) => (
                  <div key={category}>
                    <p className="px-4 py-1.5 text-[11px] font-medium text-genesis-muted uppercase tracking-wider">
                      {category}
                    </p>
                    {items.map((cmd) => {
                      const globalIndex = filtered.indexOf(cmd);
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => handleSelect(cmd.path)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${
                            globalIndex === selectedIndex
                              ? 'bg-genesis-gold/10 text-genesis-gold'
                              : 'text-genesis-text hover:bg-genesis-card-hover'
                          }`}
                        >
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                          {cmd.label}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-genesis-border px-4 py-2 flex items-center gap-4 text-[11px] text-genesis-muted">
              <span className="flex items-center gap-1">
                <kbd className="bg-genesis-bg px-1 py-0.5 rounded border border-genesis-border font-mono">↑↓</kbd> Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-genesis-bg px-1 py-0.5 rounded border border-genesis-border font-mono">↵</kbd> Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-genesis-bg px-1 py-0.5 rounded border border-genesis-border font-mono">ESC</kbd> Close
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
