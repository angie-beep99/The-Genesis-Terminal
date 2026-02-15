'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-genesis-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-genesis-gold/10 flex items-center justify-center">
          <span className="text-genesis-gold font-semibold">GT</span>
        </div>
        <div className="w-3 h-3 rounded-full bg-genesis-gold animate-pulse-slow" />
      </div>
    </div>
  );
}
