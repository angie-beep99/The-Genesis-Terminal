import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createSupabaseBrowser() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // During build/prerender, return a mock that won't crash
    if (typeof window === 'undefined') {
      return {} as ReturnType<typeof createBrowserClient>;
    }
    throw new Error('Missing Supabase environment variables');
  }

  client = createBrowserClient(url, key);
  return client;
}
