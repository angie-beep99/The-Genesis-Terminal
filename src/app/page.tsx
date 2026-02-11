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
      <div className="animate-pulse-slow w-3 h-3 rounded-full bg-genesis-gold" />
    </div>
  );
}
