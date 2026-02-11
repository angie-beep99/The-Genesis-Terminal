'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import type { Client } from '@/types/database';

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .order('company_name', { ascending: true });
      setClients(data || []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/admin');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-genesis-bg">
      {/* Admin Header */}
      <header className="border-b border-genesis-border bg-genesis-bg/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[15px] font-semibold text-genesis-text">Genesis Terminal</span>
            <span className="text-xs text-genesis-gold bg-genesis-gold/10 px-2 py-0.5 rounded-full font-medium">
              Admin
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs text-genesis-muted hover:text-genesis-text transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-genesis-text">Clients</h1>
            <p className="text-sm text-genesis-muted mt-1">Manage client accounts and data</p>
          </div>
          <button
            onClick={() => router.push('/admin/clients/new')}
            className="bg-genesis-gold hover:bg-genesis-gold/90 text-genesis-bg font-medium rounded-xl px-5 py-2.5 text-sm transition-all"
          >
            Add New Client
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-genesis-card border border-genesis-border rounded-card p-6 animate-pulse">
                <div className="h-4 w-48 bg-genesis-border rounded" />
              </div>
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="bg-genesis-card border border-genesis-border rounded-card p-12 text-center">
            <p className="text-genesis-muted">No clients yet</p>
            <button
              onClick={() => router.push('/admin/clients/new')}
              className="text-genesis-gold text-sm mt-2 hover:underline"
            >
              Add your first client
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => router.push(`/admin/clients/${client.id}`)}
                className="w-full bg-genesis-card border border-genesis-border rounded-card p-5 sm:p-6 flex items-center justify-between hover:border-genesis-gold/30 transition-all text-left group"
              >
                <div>
                  <p className="text-sm font-medium text-genesis-text group-hover:text-genesis-gold transition-colors">
                    {client.company_name}
                  </p>
                  <p className="text-xs text-genesis-muted mt-1">
                    {client.contact_name} &middot; {client.contact_email}
                  </p>
                </div>
                <span className="text-genesis-muted text-xs">
                  {new Date(client.created_at).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
