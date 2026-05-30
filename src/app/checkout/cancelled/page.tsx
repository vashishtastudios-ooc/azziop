'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { XCircle, ArrowLeft } from 'lucide-react';
import { AuthenticatedShell } from '~/components/AuthenticatedShell';

function CancelledContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  const message =
    reason === 'failed'
      ? 'Your payment did not go through. You can try again from checkout.'
      : reason === 'verify'
        ? 'Payment was received but verification failed. Contact support if you were charged.'
        : 'Checkout was cancelled. No charge was made.';

  return (
    <div className="relative min-h-screen pt-24 pb-20 px-4 flex items-center justify-center">
      <div className="max-w-md w-full text-center rounded-3xl border border-surface-800 bg-surface-900/80 p-10">
        <XCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h1 className="text-2xl font-display font-bold text-white mb-3">Checkout cancelled</h1>
        <p className="text-surface-400 mb-8">{message}</p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-800 hover:bg-surface-700 text-white text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to pricing
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutCancelledRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-24" />}>
      <AuthenticatedShell>
        <CancelledContent />
      </AuthenticatedShell>
    </Suspense>
  );
}
