'use client';

import { useAuth } from '@/lib/auth-context';
import {
  getInboxThreads,
  getThreadMessages,
  sendMessage,
  markThreadRead,
} from '@/lib/data';
import type { InboxThread, InboxMessage } from '@/types/database';
import {
  THREAD_CATEGORY_LABELS,
  THREAD_CATEGORY_COLORS,
} from '@/types/database';
import { timeAgo } from '@/lib/utils';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InboxPage() {
  const { company } = useAuth();
  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<InboxThread | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load threads
  const loadThreads = useCallback(async () => {
    if (!company) return;
    try {
      const data = await getInboxThreads(company.id);
      setThreads(data);
    } catch (err) {
      console.error('Failed to load inbox threads:', err);
    } finally {
      setLoading(false);
    }
  }, [company]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Auto-resize textarea
  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setNewMessage(e.target.value);
      const el = e.target;
      el.style.height = 'auto';
      const lineHeight = 24;
      const maxHeight = lineHeight * 4;
      el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    },
    []
  );

  // Select a thread
  const handleSelectThread = useCallback(
    async (thread: InboxThread) => {
      setSelectedThread(thread);
      setMessages([]);
      try {
        const msgs = await getThreadMessages(thread.id);
        setMessages(msgs);

        if (!thread.is_read) {
          await markThreadRead(thread.id);
          setThreads((prev) =>
            prev.map((t) =>
              t.id === thread.id ? { ...t, is_read: true } : t
            )
          );
        }
      } catch (err) {
        console.error('Failed to load thread messages:', err);
      }
    },
    []
  );

  // Send a message
  const handleSendMessage = useCallback(async () => {
    if (!selectedThread || !newMessage.trim() || sending) return;

    setSending(true);
    try {
      await sendMessage(selectedThread.id, newMessage.trim(), 'client');
      setNewMessage('');

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      // Refresh messages
      const msgs = await getThreadMessages(selectedThread.id);
      setMessages(msgs);

      // Refresh threads to update last_message_at
      await loadThreads();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  }, [selectedThread, newMessage, sending, loadThreads]);

  // Handle Enter key (send on Enter, newline on Shift+Enter)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  // Back button on mobile
  const handleBack = useCallback(() => {
    setSelectedThread(null);
    setMessages([]);
  }, []);

  // Unread count
  const unreadCount = threads.filter((t) => !t.is_read).length;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-genesis-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-genesis-gold animate-pulse-slow" />
          <p className="text-sm text-genesis-muted">Loading inbox...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-60px)] bg-genesis-bg flex overflow-hidden">
      {/* LEFT PANEL - Thread List */}
      <div
        className={`w-full md:w-[320px] md:min-w-[320px] border-r border-genesis-border flex flex-col bg-genesis-bg ${
          selectedThread ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Thread List Header */}
        <div className="px-4 py-5 border-b border-genesis-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-genesis-text">Inbox</h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-genesis-gold text-genesis-bg text-xs font-semibold">
                {unreadCount}
              </span>
            )}
          </div>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <div className="w-12 h-12 rounded-full bg-genesis-card flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-genesis-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
              </div>
              <p className="text-sm text-genesis-secondary leading-relaxed">
                Your inbox is empty. Your growth team will reach out here with
                updates and insights.
              </p>
            </div>
          ) : (
            threads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => handleSelectThread(thread)}
                className={`w-full text-left py-4 px-4 border-b border-genesis-border hover:bg-genesis-card-hover cursor-pointer transition-colors ${
                  selectedThread?.id === thread.id
                    ? 'bg-genesis-card-hover'
                    : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Unread indicator */}
                  <div className="pt-1.5 shrink-0">
                    {!thread.is_read ? (
                      <div className="w-2 h-2 rounded-full bg-genesis-gold" />
                    ) : (
                      <div className="w-2 h-2" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Subject + timestamp row */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span
                        className={`text-sm truncate ${
                          !thread.is_read
                            ? 'font-semibold text-genesis-text'
                            : 'font-normal text-genesis-secondary'
                        }`}
                      >
                        {thread.subject}
                      </span>
                      <span className="text-xs text-genesis-muted whitespace-nowrap shrink-0">
                        {timeAgo(thread.last_message_at)}
                      </span>
                    </div>

                    {/* Category badge */}
                    <div className="mb-1.5">
                      <span
                        className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          THREAD_CATEGORY_COLORS[thread.category]
                        }`}
                      >
                        {THREAD_CATEGORY_LABELS[thread.category]}
                      </span>
                    </div>

                    {/* Last message preview */}
                    {thread.latest_message && (
                      <p className="text-xs text-genesis-muted truncate">
                        {thread.latest_message.message_text}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL - Conversation */}
      <div
        className={`flex-1 flex flex-col bg-genesis-bg ${
          selectedThread ? 'flex' : 'hidden md:flex'
        }`}
      >
        {selectedThread ? (
          <>
            {/* Conversation Header */}
            <div className="px-4 py-4 border-b border-genesis-border flex items-center gap-3 shrink-0">
              {/* Back button - mobile only */}
              <button
                onClick={handleBack}
                className="md:hidden p-1 -ml-1 text-genesis-secondary hover:text-genesis-text transition-colors"
                aria-label="Back to threads"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
              </button>

              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-genesis-text truncate">
                  {selectedThread.subject}
                </h2>
                <span
                  className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-1 ${
                    THREAD_CATEGORY_COLORS[selectedThread.category]
                  }`}
                >
                  {THREAD_CATEGORY_LABELS[selectedThread.category]}
                </span>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((message) => {
                  const isClient = message.sender_type === 'client';
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          isClient
                            ? 'bg-genesis-gold/10 border border-genesis-gold/20'
                            : 'bg-genesis-card'
                        }`}
                      >
                        <p className="text-sm text-genesis-text whitespace-pre-wrap break-words">
                          {message.message_text}
                        </p>

                        {/* Attachment */}
                        {message.attachment_url && (
                          <a
                            href={message.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 mt-2 text-xs text-genesis-gold hover:text-genesis-gold-hover transition-colors"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
                              />
                            </svg>
                            <span>{message.attachment_name || 'Attachment'}</span>
                          </a>
                        )}

                        {/* Timestamp */}
                        <p className="text-[10px] text-genesis-muted mt-2">
                          {timeAgo(message.created_at)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="px-4 py-3 border-t border-genesis-border bg-genesis-card shrink-0">
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 resize-none bg-genesis-bg border border-genesis-border rounded-lg px-3 py-2.5 text-sm text-genesis-text placeholder:text-genesis-muted focus:outline-none focus:border-genesis-gold/40 transition-colors"
                  style={{ maxHeight: '96px' }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="bg-genesis-gold text-genesis-bg rounded-lg p-2 hover:bg-genesis-gold-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                  aria-label="Send message"
                >
                  {sending ? (
                    <svg
                      className="w-5 h-5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* No thread selected - desktop empty state */
          <div className="hidden md:flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center text-center px-6">
              <div className="w-16 h-16 rounded-full bg-genesis-card flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-genesis-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                  />
                </svg>
              </div>
              <p className="text-sm text-genesis-secondary">
                Select a conversation to view messages
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
