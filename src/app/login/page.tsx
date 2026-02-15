'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-browser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Invalid email or password');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-genesis-bg flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-xl bg-genesis-gold/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-genesis-gold font-semibold text-lg">GT</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-genesis-text">
            Genesis Terminal
          </h1>
          <p className="text-genesis-secondary text-sm mt-2">
            Sign in to your growth intelligence platform
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-genesis-card border border-genesis-border rounded-card p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[11px] font-medium text-genesis-muted uppercase tracking-[0.05em] mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-genesis-bg border border-genesis-border rounded-lg px-4 py-3 text-genesis-text text-sm placeholder:text-genesis-muted/50 transition-colors"
                placeholder="you@company.com"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-genesis-muted uppercase tracking-[0.05em] mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-genesis-bg border border-genesis-border rounded-lg px-4 py-3 text-genesis-text text-sm placeholder:text-genesis-muted/50 transition-colors"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <p className="text-genesis-negative text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-genesis-gold hover:bg-genesis-gold-hover text-genesis-bg font-medium rounded-lg px-4 py-3 text-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-genesis-muted/50 text-xs mt-8">
          Genesis Partners &middot; Growth Intelligence
        </p>
      </div>
    </div>
  );
}
