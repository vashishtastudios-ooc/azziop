'use client';

import { Suspense } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { EditorPage } from '../../components/pages/EditorPage';
import { Loader2 } from 'lucide-react';
import { AuthenticatedShell } from '../../components/AuthenticatedShell';

function EditorPageFallback() {
  return (
    <div className="min-h-screen pt-20 pb-24 px-4 flex items-center justify-center">
      <div className="text-surface-400">Loading editor...</div>
    </div>
  );
}

export default function Page() {
  const router = useRouter();
  const { status: sessionStatus } = useSession();

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    }
  }, [sessionStatus, router]);

  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--hero-blue)]" />
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    return null;
  }

  return (
    <AuthenticatedShell>
      <Suspense fallback={<EditorPageFallback />}>
        <EditorPage />
      </Suspense>
    </AuthenticatedShell>
  );
}
