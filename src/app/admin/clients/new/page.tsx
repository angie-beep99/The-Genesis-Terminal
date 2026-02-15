'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewClientPage() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [monthlyInvestment, setMonthlyInvestment] = useState('');
  const [partnershipStart, setPartnershipStart] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/create-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          industry: industry || null,
          websiteUrl: websiteUrl || null,
          contactName,
          email,
          password,
          monthlyInvestment: monthlyInvestment
            ? parseFloat(monthlyInvestment)
            : null,
          partnershipStart: partnershipStart || null,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Failed to create client');
        setLoading(false);
        return;
      }

      router.push('/admin/clients');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-genesis-bg border border-genesis-border rounded-lg px-4 py-2.5 text-genesis-text text-sm placeholder:text-genesis-muted/50 focus:outline-none focus:border-genesis-gold/50 transition-colors';

  return (
    <div className="min-h-screen bg-genesis-bg">
      {/* Header */}
      <header className="border-b border-genesis-border bg-genesis-bg/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-[60px] flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/clients')}
            className="text-sm text-genesis-muted hover:text-genesis-text transition-colors"
          >
            &larr; Back to Clients
          </button>
          <span className="text-genesis-border">/</span>
          <span className="text-[15px] font-semibold text-genesis-text">
            Add New Client
          </span>
        </div>
      </header>

      <main className="max-w-[640px] mx-auto px-4 sm:px-6 py-8">
        <div className="bg-genesis-card border border-genesis-border rounded-card p-6 sm:p-8">
          <form onSubmit={handleCreate} className="space-y-6">
            {/* Company Info Section */}
            <div>
              <h3 className="text-sm font-semibold text-genesis-text mb-4">
                Company Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-genesis-muted uppercase tracking-wider mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className={inputClass}
                    placeholder="Smith & Associates Law Firm"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-genesis-muted uppercase tracking-wider mb-2">
                      Industry
                    </label>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className={inputClass}
                      placeholder="Legal, Medical, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-genesis-muted uppercase tracking-wider mb-2">
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className={inputClass}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-genesis-border" />

            {/* Contact Section */}
            <div>
              <h3 className="text-sm font-semibold text-genesis-text mb-4">
                Primary Contact &amp; Login
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-genesis-muted uppercase tracking-wider mb-2">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className={inputClass}
                    placeholder="John Smith"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-genesis-muted uppercase tracking-wider mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="john@smithlaw.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-genesis-muted uppercase tracking-wider mb-2">
                    Password *
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    placeholder="Create a password for the client"
                    required
                    minLength={6}
                  />
                  <p className="text-[11px] text-genesis-muted mt-1.5">
                    Share this with the client so they can log in to their
                    dashboard
                  </p>
                </div>
              </div>
            </div>

            <hr className="border-genesis-border" />

            {/* Partnership Section */}
            <div>
              <h3 className="text-sm font-semibold text-genesis-text mb-4">
                Partnership Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-genesis-muted uppercase tracking-wider mb-2">
                    Monthly Investment ($)
                  </label>
                  <input
                    type="number"
                    value={monthlyInvestment}
                    onChange={(e) => setMonthlyInvestment(e.target.value)}
                    className={inputClass}
                    placeholder="5000"
                    min="0"
                    step="100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-genesis-muted uppercase tracking-wider mb-2">
                    Partnership Start Date
                  </label>
                  <input
                    type="date"
                    value={partnershipStart}
                    onChange={(e) => setPartnershipStart(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-genesis-negative/10 border border-genesis-negative/30 rounded-lg px-4 py-2.5">
                <p className="text-genesis-negative text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-genesis-gold hover:bg-genesis-gold-hover text-genesis-bg font-medium rounded-lg px-4 py-2.5 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Client Account...' : 'Create Client Account'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
