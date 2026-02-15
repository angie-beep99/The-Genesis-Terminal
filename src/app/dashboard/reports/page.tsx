'use client';

import { useAuth } from '@/lib/auth-context';
import { getReports, getReportById } from '@/lib/data';
import type { Report } from '@/types/database';
import { REPORT_TYPE_LABELS } from '@/types/database';
import { timeAgo } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

// ---------------------
// Badge colors by type
// ---------------------
const REPORT_TYPE_BADGE: Record<string, { bg: string; text: string }> = {
  monthly: {
    bg: 'bg-genesis-gold/10',
    text: 'text-genesis-gold',
  },
  quarterly: {
    bg: 'bg-genesis-info/10',
    text: 'text-genesis-info',
  },
  channel: {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
  },
  custom: {
    bg: 'bg-genesis-secondary/10',
    text: 'text-genesis-secondary',
  },
};

// ---------------------
// Icon components
// ---------------------
function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
      />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
      />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0-12.814a2.25 2.25 0 1 0 0-2.814m0 2.814v-.001m0 10a2.25 2.25 0 1 0 0 2.814m0-2.814v.001"
      />
    </svg>
  );
}

function PrinterIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z"
      />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  );
}

function ClipboardCheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75"
      />
    </svg>
  );
}

// ---------------------
// Helpers
// ---------------------
function formatDateRange(start: string | null, end: string | null): string {
  if (!start || !end) return '';
  try {
    const s = new Date(start);
    const e = new Date(end);
    return `${format(s, 'MMM d')} - ${format(e, 'MMM d, yyyy')}`;
  } catch {
    return '';
  }
}

// ---------------------
// Toast component
// ---------------------
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-genesis-card border border-genesis-border rounded-lg px-4 py-3 shadow-lg"
    >
      <ClipboardCheckIcon className="w-5 h-5 text-genesis-gold" />
      <span className="text-sm text-genesis-text">{message}</span>
    </motion.div>
  );
}

// ---------------------
// Main Page Component
// ---------------------
export default function ReportsPage() {
  const { company } = useAuth();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [viewingReport, setViewingReport] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load reports
  useEffect(() => {
    async function loadReports() {
      if (!company) return;
      try {
        const data = await getReports(company.id);
        setReports(data);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, [company]);

  // Open report detail
  async function handleViewReport(report: Report) {
    try {
      const full = await getReportById(report.id);
      if (full) {
        setSelectedReport(full);
        setViewingReport(true);
      }
    } catch (err) {
      console.error('Failed to load report:', err);
    }
  }

  // Close report detail
  function handleBack() {
    setViewingReport(false);
    setSelectedReport(null);
  }

  // Share handler
  function handleShare(report: Report) {
    if (report.share_token) {
      const shareUrl = `${window.location.origin}/reports/shared/${report.share_token}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        setToastMessage('Link copied!');
      });
    } else {
      setToastMessage('Share link not available for this report');
    }
  }

  // Print handler
  function handlePrint() {
    window.print();
  }

  // Split reports: recent (first 6) vs history (rest)
  const recentReports = reports.slice(0, 6);
  const historyReports = reports.slice(6);

  // ----- Loading State -----
  if (loading) {
    return (
      <div className="min-h-screen bg-genesis-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-genesis-gold animate-pulse-slow" />
          <p className="text-sm text-genesis-muted">Loading reports...</p>
        </div>
      </div>
    );
  }

  // ----- Empty State -----
  if (!loading && reports.length === 0) {
    return (
      <div className="min-h-screen bg-genesis-bg">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-2xl font-semibold text-genesis-text">Reports</h1>
            <p className="text-sm text-genesis-secondary mt-1">
              Performance reports and exports
            </p>
          </div>

          {/* Empty content */}
          <div className="flex flex-col items-center justify-center py-32">
            <DocumentIcon className="w-16 h-16 text-genesis-muted mb-6" />
            <h2 className="text-lg font-medium text-genesis-text mb-2">
              Your first report will be available at the end of your first month.
            </h2>
            <p className="text-sm text-genesis-secondary max-w-md text-center">
              Reports include performance summaries, channel comparisons, and
              quarterly reviews.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ----- Report Detail View -----
  if (viewingReport && selectedReport) {
    return (
      <div className="min-h-screen bg-genesis-bg">
        <AnimatePresence>
          {toastMessage && (
            <Toast
              message={toastMessage}
              onClose={() => setToastMessage(null)}
            />
          )}
        </AnimatePresence>

        {/* Top bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-40 bg-genesis-bg/80 backdrop-blur-md border-b border-genesis-border"
        >
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="bg-genesis-card border border-genesis-border rounded-lg px-3 py-2 hover:bg-genesis-card-hover transition-colors"
                aria-label="Go back"
              >
                <ArrowLeftIcon className="w-5 h-5 text-genesis-text" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-genesis-text">
                  {selectedReport.title}
                </h1>
                {selectedReport.period_start && selectedReport.period_end && (
                  <p className="text-xs text-genesis-secondary">
                    {formatDateRange(
                      selectedReport.period_start,
                      selectedReport.period_end
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedReport.content_url && (
                <a
                  href={selectedReport.content_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-genesis-card border border-genesis-border rounded-lg px-4 py-2 hover:bg-genesis-card-hover transition-colors text-sm text-genesis-text"
                >
                  <DownloadIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Download PDF</span>
                </a>
              )}
              <button
                onClick={() => handleShare(selectedReport)}
                className="flex items-center gap-2 bg-genesis-card border border-genesis-border rounded-lg px-4 py-2 hover:bg-genesis-card-hover transition-colors text-sm text-genesis-text"
              >
                <ShareIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Share Link</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-genesis-card border border-genesis-border rounded-lg px-4 py-2 hover:bg-genesis-card-hover transition-colors text-sm text-genesis-text"
              >
                <PrinterIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Print</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Report Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        >
          {/* Share expiry info */}
          {selectedReport.share_token && selectedReport.share_expires && (
            <div className="mb-6 flex items-center gap-2 text-xs text-genesis-muted">
              <ShareIcon className="w-3.5 h-3.5" />
              <span>
                Link expires on{' '}
                {format(new Date(selectedReport.share_expires), 'MMM d, yyyy')}
              </span>
            </div>
          )}

          <div className="bg-genesis-card border border-genesis-border rounded-card p-6 sm:p-10">
            {selectedReport.content_html ? (
              <div
                className="prose prose-invert max-w-none
                  prose-headings:text-genesis-text prose-headings:font-semibold
                  prose-p:text-genesis-secondary prose-p:leading-relaxed
                  prose-strong:text-genesis-text
                  prose-a:text-genesis-gold prose-a:no-underline hover:prose-a:underline
                  prose-ul:text-genesis-secondary prose-ol:text-genesis-secondary
                  prose-li:marker:text-genesis-muted
                  prose-hr:border-genesis-border
                  prose-table:border-genesis-border
                  prose-th:text-genesis-text prose-th:border-genesis-border prose-th:px-4 prose-th:py-2
                  prose-td:text-genesis-secondary prose-td:border-genesis-border prose-td:px-4 prose-td:py-2"
                dangerouslySetInnerHTML={{
                  __html: selectedReport.content_html,
                }}
              />
            ) : selectedReport.content_url ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <DownloadIcon className="w-10 h-10 text-genesis-muted" />
                <p className="text-genesis-secondary text-sm">
                  This report is available as a downloadable file.
                </p>
                <a
                  href={selectedReport.content_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-genesis-gold/10 text-genesis-gold border border-genesis-gold/20 rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-genesis-gold/20 transition-colors"
                >
                  <DownloadIcon className="w-4 h-4" />
                  Download Report
                </a>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <DocumentIcon className="w-10 h-10 text-genesis-muted" />
                <p className="text-genesis-secondary text-sm">
                  Report content will be available soon.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // ----- Main Report List View -----
  return (
    <div className="min-h-screen bg-genesis-bg">
      <AnimatePresence>
        {toastMessage && (
          <Toast
            message={toastMessage}
            onClose={() => setToastMessage(null)}
          />
        )}
      </AnimatePresence>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-semibold text-genesis-text">Reports</h1>
          <p className="text-sm text-genesis-secondary mt-1">
            Performance reports and exports
          </p>
        </motion.div>

        {/* Report Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentReports.map((report, index) => {
            const badge = REPORT_TYPE_BADGE[report.report_type] ?? REPORT_TYPE_BADGE.custom;
            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-genesis-card border border-genesis-border rounded-card p-6 relative group hover:border-genesis-muted/50 transition-colors"
              >
                {/* Type icon top-right */}
                <div className="absolute top-5 right-5">
                  <DocumentIcon className="w-5 h-5 text-genesis-muted" />
                </div>

                {/* Type badge */}
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
                >
                  {REPORT_TYPE_LABELS[report.report_type] ?? 'Report'}
                </span>

                {/* Title */}
                <h3 className="text-lg font-medium text-genesis-text mt-3 pr-8">
                  {report.title}
                </h3>

                {/* Date range */}
                {report.period_start && report.period_end && (
                  <p className="text-sm text-genesis-secondary mt-1">
                    {formatDateRange(report.period_start, report.period_end)}
                  </p>
                )}

                {/* Created date */}
                <p className="text-xs text-genesis-muted mt-2">
                  Created {timeAgo(report.created_at)}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-5">
                  <button
                    onClick={() => handleViewReport(report)}
                    className="inline-flex items-center gap-2 bg-genesis-gold/10 text-genesis-gold border border-genesis-gold/20 rounded-lg px-4 py-2 text-sm font-medium hover:bg-genesis-gold/20 transition-colors"
                  >
                    View Report
                  </button>
                  <button
                    onClick={() => handleShare(report)}
                    className="inline-flex items-center gap-2 bg-genesis-card border border-genesis-border rounded-lg px-4 py-2 text-sm text-genesis-secondary hover:bg-genesis-card-hover hover:text-genesis-text transition-colors"
                  >
                    <ShareIcon className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Report History */}
        {historyReports.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12"
          >
            <h2 className="text-lg font-semibold text-genesis-text mb-4">
              Report History
            </h2>

            <div className="bg-genesis-card border border-genesis-border rounded-card overflow-hidden">
              {historyReports.map((report, index) => {
                const badge =
                  REPORT_TYPE_BADGE[report.report_type] ??
                  REPORT_TYPE_BADGE.custom;
                return (
                  <div
                    key={report.id}
                    className={`flex items-center justify-between px-5 py-4 ${
                      index !== historyReports.length - 1
                        ? 'border-b border-genesis-border'
                        : ''
                    } hover:bg-genesis-card-hover transition-colors`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <DocumentIcon className="w-4 h-4 text-genesis-muted flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-genesis-text truncate">
                          {report.title}
                        </p>
                        {report.period_start && report.period_end && (
                          <p className="text-xs text-genesis-muted mt-0.5">
                            {formatDateRange(
                              report.period_start,
                              report.period_end
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                      <span
                        className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
                      >
                        {REPORT_TYPE_LABELS[report.report_type] ?? 'Report'}
                      </span>
                      <span className="text-xs text-genesis-muted whitespace-nowrap">
                        {timeAgo(report.created_at)}
                      </span>
                      <button
                        onClick={() => handleViewReport(report)}
                        className="text-sm text-genesis-gold hover:text-genesis-gold-hover transition-colors whitespace-nowrap"
                      >
                        View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Footer spacing */}
        <div className="h-8" />
      </div>
    </div>
  );
}
