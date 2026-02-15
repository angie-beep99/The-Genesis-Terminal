'use client';

import { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { useAuth } from '@/lib/auth-context';
import { getCompanyMembers, getNotificationPreferences } from '@/lib/data';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import type { User, NotificationPreference } from '@/types/database';
import { formatCurrency } from '@/lib/utils';

type SettingsTab =
  | 'profile'
  | 'team'
  | 'notifications'
  | 'billing'
  | 'exports'
  | 'integrations';

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'profile', label: 'Company Profile' },
  { id: 'team', label: 'Team Members' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'billing', label: 'Billing' },
  { id: 'exports', label: 'Data & Exports' },
  { id: 'integrations', label: 'Integrations' },
];

const NOTIFICATION_TYPES = [
  { key: 'new_lead', label: 'New lead received' },
  { key: 'status_change', label: 'Lead status changed' },
  { key: 'weekly_summary', label: 'Weekly performance summary' },
  { key: 'report_available', label: 'Monthly report available' },
  { key: 'new_message', label: 'New message from growth team' },
  { key: 'budget_alert', label: 'Budget alert' },
];

const ROLE_DESCRIPTIONS: Record<string, string> = {
  owner: 'Full access. Can manage billing, team, and all settings.',
  company_admin: 'Can manage team members, leads, and view all data.',
  member: 'Can view dashboards, manage leads, and send messages.',
  view_only: 'Read-only access to dashboards and reports.',
};

const INTEGRATIONS = [
  { name: 'HubSpot CRM', icon: 'H' },
  { name: 'Salesforce', icon: 'S' },
  { name: 'Google Ads API', icon: 'G' },
  { name: 'Meta Ads API', icon: 'M' },
  { name: 'Slack', icon: 'Sl' },
  { name: 'Zapier', icon: 'Z' },
];

export default function SettingsPage() {
  const { user, company } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [members, setMembers] = useState<User[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite form state
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

  // Email digest state
  const [emailDigest, setEmailDigest] = useState(false);

  useEffect(() => {
    async function load() {
      if (!company?.id || !user?.id) return;
      setLoading(true);
      try {
        const [membersData, prefsData] = await Promise.all([
          getCompanyMembers(company.id),
          getNotificationPreferences(user.id),
        ]);
        setMembers(membersData);
        setPreferences(prefsData);
      } catch (err) {
        console.error('Failed to load settings data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [company?.id, user?.id]);

  function getPreference(type: string) {
    return preferences.find((p) => p.notification_type === type);
  }

  async function togglePreference(
    type: string,
    channel: 'email_enabled' | 'in_app_enabled'
  ) {
    const existing = getPreference(type);
    if (!user?.id) return;

    const supabase = createSupabaseBrowser();

    if (existing) {
      const updated = { ...existing, [channel]: !existing[channel] };
      setPreferences((prev) =>
        prev.map((p) => (p.notification_type === type ? updated : p))
      );
      await supabase
        .from('notification_preferences')
        .update({ [channel]: !existing[channel] })
        .eq('id', existing.id);
    } else {
      const newPref: Partial<NotificationPreference> = {
        user_id: user.id,
        notification_type: type,
        email_enabled: channel === 'email_enabled',
        in_app_enabled: channel === 'in_app_enabled',
      };
      setPreferences((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          user_id: user.id,
          notification_type: type,
          email_enabled: channel === 'email_enabled',
          in_app_enabled: channel === 'in_app_enabled',
        },
      ]);
      await supabase.from('notification_preferences').insert(newPref);
    }
  }

  function getRoleBadgeClasses(role: string) {
    switch (role) {
      case 'owner':
        return 'bg-genesis-gold/20 text-genesis-gold';
      case 'admin':
      case 'company_admin':
        return 'bg-genesis-info/20 text-genesis-info';
      case 'member':
        return 'bg-genesis-secondary/20 text-genesis-text';
      case 'view_only':
        return 'bg-genesis-muted/20 text-genesis-muted';
      default:
        return 'bg-genesis-secondary/20 text-genesis-text';
    }
  }

  function getRoleLabel(role: string) {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'admin':
        return 'Admin';
      case 'company_admin':
        return 'Admin';
      case 'member':
        return 'Member';
      case 'view_only':
        return 'View Only';
      default:
        return role;
    }
  }

  function getInitials(name: string) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  function ownershipCountdown() {
    if (!company?.ownership_date) return null;
    const ownershipDate = new Date(company.ownership_date);
    const daysLeft = differenceInDays(ownershipDate, new Date());
    return {
      formatted: format(ownershipDate, 'MMMM d, yyyy'),
      daysLeft: Math.max(0, daysLeft),
    };
  }

  async function handleExport(type: 'leads' | 'performance' | 'channels') {
    if (!company?.id) return;
    const supabase = createSupabaseBrowser();

    let data: Record<string, unknown>[] | null = null;
    let filename = '';

    if (type === 'leads') {
      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });
      data = leads;
      filename = `leads-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    } else if (type === 'performance') {
      const { data: perf } = await supabase
        .from('daily_performance')
        .select('*')
        .eq('company_id', company.id)
        .order('date', { ascending: false });
      data = perf;
      filename = `performance-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    } else if (type === 'channels') {
      const { data: channels } = await supabase
        .from('channels')
        .select('*')
        .eq('company_id', company.id)
        .order('period_start', { ascending: false });
      data = channels;
      filename = `channels-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    }

    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            const str = val === null || val === undefined ? '' : String(val);
            return str.includes(',') ? `"${str}"` : str;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  // ─────────────────────────────────────────────
  // Toggle Switch Component
  // ─────────────────────────────────────────────
  function Toggle({
    enabled,
    onToggle,
  }: {
    enabled: boolean;
    onToggle: () => void;
  }) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
          enabled ? 'bg-genesis-gold' : 'bg-genesis-border'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out mt-0.5 ${
            enabled ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'
          }`}
        />
      </button>
    );
  }

  // ─────────────────────────────────────────────
  // Tab Content Renderers
  // ─────────────────────────────────────────────

  function renderCompanyProfile() {
    const countdown = ownershipCountdown();

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-genesis-text mb-4">
            Company Profile
          </h2>
          <p className="text-sm text-genesis-secondary mb-6">
            Your company information and partnership details.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Name */}
          <div>
            <label className="block text-xs font-medium text-genesis-muted uppercase tracking-wider mb-2">
              Company Name
            </label>
            <input
              type="text"
              readOnly
              value={company?.company_name || ''}
              className="w-full bg-genesis-bg border border-genesis-border rounded-lg px-4 py-3 text-genesis-text cursor-default focus:outline-none"
            />
          </div>

          {/* Industry */}
          <div>
            <label className="block text-xs font-medium text-genesis-muted uppercase tracking-wider mb-2">
              Industry
            </label>
            <input
              type="text"
              readOnly
              value={company?.industry || ''}
              className="w-full bg-genesis-bg border border-genesis-border rounded-lg px-4 py-3 text-genesis-text cursor-default focus:outline-none"
            />
          </div>

          {/* Website URL */}
          <div>
            <label className="block text-xs font-medium text-genesis-muted uppercase tracking-wider mb-2">
              Website URL
            </label>
            <input
              type="text"
              readOnly
              value={company?.website_url || ''}
              className="w-full bg-genesis-bg border border-genesis-border rounded-lg px-4 py-3 text-genesis-text cursor-default focus:outline-none"
            />
          </div>

          {/* Primary Contact */}
          <div>
            <label className="block text-xs font-medium text-genesis-muted uppercase tracking-wider mb-2">
              Primary Contact
            </label>
            <input
              type="text"
              readOnly
              value={user ? `${user.full_name} (${user.email})` : ''}
              className="w-full bg-genesis-bg border border-genesis-border rounded-lg px-4 py-3 text-genesis-text cursor-default focus:outline-none"
            />
          </div>

          {/* Partnership Start Date */}
          <div>
            <label className="block text-xs font-medium text-genesis-muted uppercase tracking-wider mb-2">
              Partnership Start Date
            </label>
            <input
              type="text"
              readOnly
              value={
                company?.partnership_start
                  ? format(new Date(company.partnership_start), 'MMMM d, yyyy')
                  : ''
              }
              className="w-full bg-genesis-bg border border-genesis-border rounded-lg px-4 py-3 text-genesis-text cursor-default focus:outline-none"
            />
          </div>
        </div>

        {/* Terminal Ownership Date */}
        {countdown && (
          <div className="mt-8 bg-genesis-card border border-genesis-border rounded-card p-6">
            <label className="block text-xs font-medium text-genesis-muted uppercase tracking-wider mb-3">
              Terminal Ownership Date
            </label>
            <p className="text-lg font-semibold text-genesis-gold">
              Your Terminal ownership date: {countdown.formatted}
            </p>
            <p className="text-sm text-genesis-muted mt-1">
              {countdown.daysLeft} days remaining
            </p>
          </div>
        )}
      </div>
    );
  }

  function renderTeamMembers() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-genesis-text mb-1">
              Team Members
            </h2>
            <p className="text-sm text-genesis-secondary">
              Manage who has access to your Genesis Terminal.
            </p>
          </div>
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="px-4 py-2 bg-genesis-gold text-genesis-bg text-sm font-medium rounded-lg hover:bg-genesis-gold-hover transition-colors"
          >
            Invite Team Member
          </button>
        </div>

        {/* Invite Form */}
        {showInviteForm && (
          <div className="bg-genesis-card border border-genesis-border rounded-card p-6 space-y-4">
            <h3 className="text-sm font-semibold text-genesis-text">
              Invite a New Team Member
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-genesis-muted uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full bg-genesis-bg border border-genesis-border rounded-lg px-4 py-3 text-genesis-text placeholder:text-genesis-muted focus:outline-none focus:border-genesis-gold"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-genesis-muted uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="jane@company.com"
                  className="w-full bg-genesis-bg border border-genesis-border rounded-lg px-4 py-3 text-genesis-text placeholder:text-genesis-muted focus:outline-none focus:border-genesis-gold"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-genesis-muted uppercase tracking-wider mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-genesis-bg border border-genesis-border rounded-lg px-4 py-3 text-genesis-text focus:outline-none focus:border-genesis-gold"
                >
                  <option value="company_admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="view_only">View Only</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button className="px-4 py-2 bg-genesis-gold text-genesis-bg text-sm font-medium rounded-lg hover:bg-genesis-gold-hover transition-colors">
                Send Invite
              </button>
              <button
                onClick={() => {
                  setShowInviteForm(false);
                  setInviteName('');
                  setInviteEmail('');
                  setInviteRole('member');
                }}
                className="px-4 py-2 text-sm text-genesis-secondary hover:text-genesis-text transition-colors"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-genesis-muted">
              Maximum 10 team members per company.
            </p>
          </div>
        )}

        {/* Members List */}
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="bg-genesis-card border border-genesis-border rounded-card p-4 flex items-center gap-4"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-genesis-gold/20 text-genesis-gold flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {getInitials(member.full_name)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-genesis-text truncate">
                  {member.full_name}
                </p>
                <p className="text-xs text-genesis-secondary truncate">
                  {member.email}
                </p>
              </div>

              {/* Role Badge */}
              <span
                className={`px-2.5 py-1 text-xs font-medium rounded-full flex-shrink-0 ${getRoleBadgeClasses(
                  member.role
                )}`}
              >
                {getRoleLabel(member.role)}
              </span>

              {/* Status */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-genesis-positive" />
                <span className="text-xs text-genesis-secondary">Active</span>
              </div>
            </div>
          ))}
        </div>

        {/* Role Permissions */}
        <div className="bg-genesis-card border border-genesis-border rounded-card p-6 mt-6">
          <h3 className="text-sm font-semibold text-genesis-text mb-4">
            Role Permissions
          </h3>
          <div className="space-y-3">
            {Object.entries(ROLE_DESCRIPTIONS).map(([role, desc]) => (
              <div key={role} className="flex items-start gap-3">
                <span
                  className={`px-2.5 py-1 text-xs font-medium rounded-full flex-shrink-0 mt-0.5 ${getRoleBadgeClasses(
                    role
                  )}`}
                >
                  {getRoleLabel(role)}
                </span>
                <p className="text-sm text-genesis-secondary">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderNotifications() {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-genesis-text mb-1">
            Notifications
          </h2>
          <p className="text-sm text-genesis-secondary mb-6">
            Choose how you want to be notified about activity in your Terminal.
          </p>
        </div>

        {/* Notification Toggles */}
        <div className="bg-genesis-card border border-genesis-border rounded-card overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_80px_80px] gap-4 px-6 py-3 border-b border-genesis-border">
            <span className="text-xs font-medium text-genesis-muted uppercase tracking-wider">
              Notification
            </span>
            <span className="text-xs font-medium text-genesis-muted uppercase tracking-wider text-center">
              Email
            </span>
            <span className="text-xs font-medium text-genesis-muted uppercase tracking-wider text-center">
              In-App
            </span>
          </div>

          {/* Rows */}
          {NOTIFICATION_TYPES.map((notif, i) => {
            const pref = getPreference(notif.key);
            const emailOn = pref?.email_enabled ?? true;
            const inAppOn = pref?.in_app_enabled ?? true;

            return (
              <div
                key={notif.key}
                className={`grid grid-cols-[1fr_80px_80px] gap-4 px-6 py-4 items-center ${
                  i < NOTIFICATION_TYPES.length - 1
                    ? 'border-b border-genesis-border'
                    : ''
                }`}
              >
                <span className="text-sm text-genesis-text">{notif.label}</span>
                <div className="flex justify-center">
                  <Toggle
                    enabled={emailOn}
                    onToggle={() =>
                      togglePreference(notif.key, 'email_enabled')
                    }
                  />
                </div>
                <div className="flex justify-center">
                  <Toggle
                    enabled={inAppOn}
                    onToggle={() =>
                      togglePreference(notif.key, 'in_app_enabled')
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Email Digest */}
        <div className="bg-genesis-card border border-genesis-border rounded-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-genesis-text">
                Email Digest
              </h3>
              <p className="text-xs text-genesis-secondary mt-1">
                Send me a daily summary instead of individual emails
              </p>
            </div>
            <Toggle
              enabled={emailDigest}
              onToggle={() => setEmailDigest(!emailDigest)}
            />
          </div>
        </div>
      </div>
    );
  }

  function renderBilling() {
    const countdown = ownershipCountdown();

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-genesis-text mb-1">
            Billing
          </h2>
          <p className="text-sm text-genesis-secondary mb-6">
            Your partnership billing details and investment summary.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Partnership Status */}
          <div className="bg-genesis-card border border-genesis-border rounded-card p-6">
            <label className="block text-xs font-medium text-genesis-muted uppercase tracking-wider mb-3">
              Partnership Status
            </label>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-genesis-positive/20 text-genesis-positive">
              Active
            </span>
          </div>

          {/* Monthly Investment */}
          <div className="bg-genesis-card border border-genesis-border rounded-card p-6">
            <label className="block text-xs font-medium text-genesis-muted uppercase tracking-wider mb-3">
              Monthly Investment
            </label>
            <p className="text-2xl font-semibold text-genesis-text">
              {company?.monthly_investment
                ? formatCurrency(company.monthly_investment)
                : '--'}
            </p>
          </div>

          {/* Partnership Start */}
          <div className="bg-genesis-card border border-genesis-border rounded-card p-6">
            <label className="block text-xs font-medium text-genesis-muted uppercase tracking-wider mb-3">
              Partnership Start Date
            </label>
            <p className="text-sm text-genesis-text">
              {company?.partnership_start
                ? format(new Date(company.partnership_start), 'MMMM d, yyyy')
                : '--'}
            </p>
          </div>

          {/* Terminal Ownership Date */}
          <div className="bg-genesis-card border border-genesis-border rounded-card p-6">
            <label className="block text-xs font-medium text-genesis-muted uppercase tracking-wider mb-3">
              Terminal Ownership Date
            </label>
            {countdown ? (
              <>
                <p className="text-sm font-semibold text-genesis-gold">
                  {countdown.formatted}
                </p>
                <p className="text-xs text-genesis-muted mt-1">
                  {countdown.daysLeft} days remaining
                </p>
              </>
            ) : (
              <p className="text-sm text-genesis-text">--</p>
            )}
          </div>
        </div>

        {/* Billing Inquiries */}
        <div className="bg-genesis-card border border-genesis-border rounded-card p-6">
          <p className="text-sm text-genesis-secondary">
            For billing inquiries,{' '}
            <a
              href="/dashboard/inbox"
              className="text-genesis-gold hover:text-genesis-gold-hover underline transition-colors"
            >
              message your growth team
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  function renderExports() {
    const exportItems = [
      {
        title: 'Export All Leads',
        description: 'Download all your leads data as a CSV file.',
        action: () => handleExport('leads'),
        isLink: false,
      },
      {
        title: 'Export Performance Data',
        description: 'Download daily performance metrics as a CSV file.',
        action: () => handleExport('performance'),
        isLink: false,
      },
      {
        title: 'Export Channel Data',
        description: 'Download channel breakdown data as a CSV file.',
        action: () => handleExport('channels'),
        isLink: false,
      },
      {
        title: 'Request Full Data Export',
        description:
          'Request a comprehensive export of all your data. We will send it to you via the inbox.',
        action: null,
        isLink: true,
      },
    ];

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-genesis-text mb-1">
            Data & Exports
          </h2>
          <p className="text-sm text-genesis-secondary mb-6">
            Export your data for analysis or record keeping.
          </p>
        </div>

        <div className="space-y-3">
          {exportItems.map((item) => (
            <div
              key={item.title}
              className="bg-genesis-card border border-genesis-border rounded-lg p-4 hover:bg-genesis-card-hover transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-genesis-text">
                    {item.title}
                  </h3>
                  <p className="text-xs text-genesis-secondary mt-1">
                    {item.description}
                  </p>
                </div>
                {item.isLink ? (
                  <a
                    href="/dashboard/inbox"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-genesis-gold hover:text-genesis-gold-hover transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    Request
                  </a>
                ) : (
                  <button
                    onClick={item.action!}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-genesis-gold hover:text-genesis-gold-hover transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Data Retention Notice */}
        <div className="bg-genesis-card border border-genesis-border rounded-card p-6 mt-6">
          <p className="text-xs text-genesis-muted leading-relaxed">
            Your data is stored securely and belongs to your company. All exports
            are generated in real-time from your current data. Data is retained
            for the duration of your partnership and beyond as required by our
            data retention policy.
          </p>
        </div>
      </div>
    );
  }

  function renderIntegrations() {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-genesis-text mb-1">
            Integrations
          </h2>
          <p className="text-sm text-genesis-secondary mb-6">
            Connect your favorite tools to Genesis Terminal.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INTEGRATIONS.map((integration) => (
            <div
              key={integration.name}
              className="bg-genesis-card/50 opacity-60 border border-genesis-border rounded-card p-6 flex flex-col items-center text-center"
            >
              {/* Icon Placeholder */}
              <div className="w-12 h-12 rounded-lg bg-genesis-border flex items-center justify-center text-genesis-muted text-lg font-bold mb-3">
                {integration.icon}
              </div>
              <h3 className="text-sm font-medium text-genesis-text mb-2">
                {integration.name}
              </h3>
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-genesis-muted/20 text-genesis-muted">
                Coming Soon
              </span>
            </div>
          ))}
        </div>

        {/* Request Integration */}
        <div className="bg-genesis-card border border-genesis-border rounded-card p-6 text-center">
          <p className="text-sm text-genesis-secondary">
            Need a specific integration?{' '}
            <a
              href="/dashboard/inbox"
              className="text-genesis-gold hover:text-genesis-gold-hover underline transition-colors"
            >
              Request an integration
            </a>{' '}
            and we will look into it.
          </p>
        </div>
      </div>
    );
  }

  function renderTabContent() {
    switch (activeTab) {
      case 'profile':
        return renderCompanyProfile();
      case 'team':
        return renderTeamMembers();
      case 'notifications':
        return renderNotifications();
      case 'billing':
        return renderBilling();
      case 'exports':
        return renderExports();
      case 'integrations':
        return renderIntegrations();
      default:
        return null;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-genesis-bg p-6 flex items-center justify-center">
        <div className="text-genesis-secondary text-sm">
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-genesis-bg">
      {/* Header */}
      <div className="border-b border-genesis-border px-6 py-6">
        <h1 className="text-2xl font-semibold text-genesis-text">Settings</h1>
        <p className="text-sm text-genesis-secondary mt-1">
          Manage your company, team, and preferences.
        </p>
      </div>

      {/* Mobile Tab Selector */}
      <div className="md:hidden px-6 pt-4">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as SettingsTab)}
          className="w-full bg-genesis-card border border-genesis-border rounded-lg px-4 py-3 text-genesis-text text-sm focus:outline-none focus:border-genesis-gold"
        >
          {TABS.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>

      {/* Mobile Horizontal Scrollable Tabs */}
      <div className="md:hidden overflow-x-auto px-6 pt-3 pb-2">
        <div className="flex gap-1 min-w-max">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors rounded-t-lg ${
                activeTab === tab.id
                  ? 'text-genesis-gold border-b-2 border-genesis-gold'
                  : 'text-genesis-secondary hover:text-genesis-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="flex">
        {/* Desktop Side Tabs */}
        <div className="hidden md:block w-48 flex-shrink-0 border-r border-genesis-border min-h-[calc(100vh-120px)]">
          <nav className="py-4 px-2 space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'text-genesis-gold border-l-2 border-genesis-gold bg-genesis-gold/5'
                    : 'text-genesis-secondary hover:text-genesis-text hover:bg-genesis-card'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 max-w-4xl">{renderTabContent()}</div>
      </div>
    </div>
  );
}
