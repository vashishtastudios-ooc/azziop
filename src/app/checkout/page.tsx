'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { AuthenticatedShell } from '~/components/AuthenticatedShell';
import { CheckoutPage } from '~/components/pages/CheckoutPage';

function CheckoutFallback() {
  return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
    </div>
  );
}

export default function CheckoutRoute() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      const params = new URLSearchParams(window.location.search);
      router.replace(`/login?callbackUrl=${encodeURIComponent(`/checkout?${params.toString()}`)}`);
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <Suspense fallback={<CheckoutFallback />}>
      <AuthenticatedShell>
        <CheckoutPage />
      </AuthenticatedShell>
    </Suspense>
  );
}
