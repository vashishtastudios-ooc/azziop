'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { api } from '~/trpc/react';
import { usePipelineStore } from '@/store/pipeline';

export default function DashboardPage() {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const setUserPlan = usePipelineStore((state) => state.setUserPlan);
  const [billingInfo, setBillingInfo] = useState<{
    creditBalance: number;
    monthlyCredits: number;
    planId: string;
  } | null>(null);

  const { data: projects, isLoading: isLoadingProjects } = api.project.list.useQuery(
    undefined,
    { enabled: sessionStatus === 'authenticated', refetchOnWindowFocus: false },
  );
  useEffect(() => {
    const loadBilling = async () => {
      try {
        const res = await fetch('/api/billing/portal');
        if (!res.ok) return;
        const json = await res.json();
        const planId = json?.data?.planId;
        if (json?.data) {
          setBillingInfo(json.data);
        }
        if (
          planId === 'free' ||
          planId === 'starter' ||
          planId === 'pro' ||
          planId === 'agency'
        ) {
          setUserPlan(planId);
        }
      } catch {
        // no-op
      }
    };
    if (sessionStatus === 'authenticated') {
      void loadBilling();
    }
  }, [sessionStatus, setUserPlan]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.replace('/login');
      return;
    }

    if (sessionStatus !== 'authenticated' || isLoadingProjects) return;

    if (projects && projects.length > 0) {
      const latestProjectId = projects[0].id;
      router.replace(`/campaigns?projectId=${latestProjectId}`);
    } else {
      router.replace('/projects');
    }
  }, [sessionStatus, projects, isLoadingProjects, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950">
      <div className="w-full max-w-md text-center px-4">
        <Loader2 className="mx-auto mb-3 w-8 h-8 animate-spin text-[var(--hero-blue)]" />
        <p className="text-sm text-surface-400">Loading your dashboard...</p>
        {billingInfo && (
          <div className="mt-6 rounded-xl border border-surface-800 bg-surface-900/70 p-4 text-left">
            <p className="mb-3 text-xs uppercase tracking-wide text-surface-500">
              {billingInfo.planId} plan
            </p>
            <p className="mb-1 text-sm text-white font-semibold">
              {billingInfo.creditBalance.toLocaleString()} credits available
            </p>
            <div className="mb-2 h-2 rounded bg-surface-800">
              <div
                className="h-2 rounded bg-amber-500"
                style={{
                  width: `${Math.min(
                    100,
                    billingInfo.monthlyCredits
                      ? (billingInfo.creditBalance / billingInfo.monthlyCredits) * 100
                      : 0
                  )}%`,
                }}
              />
            </div>
            <p className="text-xs text-surface-400">
              {billingInfo.monthlyCredits.toLocaleString()} credits / cycle on this plan
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
