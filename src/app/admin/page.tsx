'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-browser';

export default function AdminLoginPage() {
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
      setError('Invalid credentials');
      setLoading(false);
      return;
    }

    // Verify admin status
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Authentication failed');
      setLoading(false);
      return;
    }

    const { data: adminData } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', user.email)
      .single();

    if (!adminData) {
      await supabase.auth.signOut();
      setError('Access denied. Admin only.');
      setLoading(false);
      return;
    }

    router.push('/admin/clients');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-genesis-bg flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-semibold tracking-tight text-genesis-text">
            Genesis Terminal
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-genesis-gold" />
            <p className="text-genesis-muted text-sm">Admin Access</p>
          </div>
        </div>

        <div className="bg-genesis-card border border-genesis-border rounded-card p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-genesis-muted uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-genesis-bg border border-genesis-border rounded-xl px-4 py-3 text-genesis-text text-sm placeholder:text-genesis-muted/50 transition-colors"
                placeholder="admin@genesispartners.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-genesis-muted uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-genesis-bg border border-genesis-border rounded-xl px-4 py-3 text-genesis-text text-sm placeholder:text-genesis-muted/50 transition-colors"
                placeholder="Enter admin password"
                required
              />
            </div>

            {error && (
              <p className="text-genesis-negative text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-genesis-gold hover:bg-genesis-gold/90 text-genesis-bg font-medium rounded-xl px-4 py-3 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
