'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Root Vercel URL always directs to the official School ERP Login Portal
    router.push('/login');
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-300 text-xs">
      Redirecting to School ERP Portal...
    </div>
  );
}
