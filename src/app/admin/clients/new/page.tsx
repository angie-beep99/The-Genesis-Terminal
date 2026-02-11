'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
export default function NewClientPage() {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create auth user via the API route
      const res = await fetch('/api/admin/create-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, contactName, email, password }),
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
      setError('Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-genesis-bg">
      <header className="border-b border-genesis-border bg-genesis-bg/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-[60px] flex items-center">
          <button
            onClick={() => router.back()}
            className="text-sm text-genesis-muted hover:text-genesis-text transition-colors mr-4"
          >
            &larr; Back
          </button>
          <span className="text-[15px] font-semibold text-genesis-text">Add New Client</span>
        </div>
      </header>

      <main className="max-w-[600px] mx-auto px-4 sm:px-6 py-8">
        <div className="bg-genesis-card border border-genesis-border rounded-card p-6 sm:p-8">
          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-genesis-muted uppercase tracking-wider mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-genesis-bg border border-genesis-border rounded-xl px-4 py-3 text-genesis-text text-sm"
                placeholder="Smith & Associates Law Firm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-genesis-muted uppercase tracking-wider mb-2">
                Contact Name
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full bg-genesis-bg border border-genesis-border rounded-xl px-4 py-3 text-genesis-text text-sm"
                placeholder="John Smith"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-genesis-muted uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-genesis-bg border border-genesis-border rounded-xl px-4 py-3 text-genesis-text text-sm"
                placeholder="john@smithlaw.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-genesis-muted uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-genesis-bg border border-genesis-border rounded-xl px-4 py-3 text-genesis-text text-sm"
                placeholder="Create a password for the client"
                required
                minLength={6}
              />
              <p className="text-[11px] text-genesis-muted mt-1">Share this with the client so they can log in</p>
            </div>

            {error && <p className="text-genesis-negative text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-genesis-gold hover:bg-genesis-gold/90 text-genesis-bg font-medium rounded-xl px-4 py-3 text-sm transition-all disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Client Account'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
