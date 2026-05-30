'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

import { AuthenticatedShell } from '../../components/AuthenticatedShell';
import { BrandDNAPage as BrandDNAEditor } from '../../components/pages/BrandDNAPage';
import { api } from '../../trpc/react';
import { usePipelineStore } from '../../store/pipeline';
import type { BrandDNA, WebsiteData } from '../../types';

function BrandDNARoutePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status: sessionStatus } = useSession();

  const projectIdFromQuery = searchParams.get('projectId') ?? undefined;

  const setWebsiteData = usePipelineStore((state) => state.setWebsiteData);
  const setBrandDNA = usePipelineStore((state) => state.setBrandDNA);
  const setWebsiteExtras = usePipelineStore((state) => state.setWebsiteExtras);

  const {
    data: project,
    isLoading: isLoadingProject,
  } = api.project.getDetails.useQuery(
    { projectId: projectIdFromQuery },
    {
      enabled: sessionStatus === 'authenticated',
      refetchOnWindowFocus: false,
    },
  );

  useEffect(() => {
    if (!project?.id || !project.websiteData || !project.brandDNA) return;

    const websiteData = project.websiteData as WebsiteData;
    const brandDNA = project.brandDNA as BrandDNA;

    setWebsiteData(websiteData);
    setBrandDNA(brandDNA);

    setWebsiteExtras({
      colors: websiteData.colors || [],
      fonts: websiteData.fonts || [],
      logo: websiteData.logo || websiteData.images?.[0] || undefined,
      tagline: websiteData.tagline || websiteData.heroText || undefined,
      aboutSection: websiteData.aboutSection || undefined,
      heroText: websiteData.heroText || undefined,
    });

    usePipelineStore.setState({
      projectId: project.id,
      campaigns: project.campaigns.map((campaign: {
        title: string;
        goal: 'awareness' | 'consideration' | 'conversion';
        strategicAngle: string;
        narrativeHook: string;
        audiencePainPoint: string;
        emotionalLever: 'aspiration' | 'fear' | 'belonging' | 'curiosity' | 'pride' | 'relief' | 'urgency' | 'trust';
        ctaStyle: 'soft' | 'medium' | 'strong';
        visualDirection: string;
        bestPlatforms: ('instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'pinterest' | 'twitter')[];
      }) => ({
        title: campaign.title,
        goal: campaign.goal,
        strategicAngle: campaign.strategicAngle,
        narrativeHook: campaign.narrativeHook,
        audiencePainPoint: campaign.audiencePainPoint,
        emotionalLever: campaign.emotionalLever,
        ctaStyle: campaign.ctaStyle,
        visualDirection: campaign.visualDirection,
        bestPlatforms: campaign.bestPlatforms,
      })),
    } as never);
  }, [project, setBrandDNA, setWebsiteData, setWebsiteExtras]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    }
  }, [sessionStatus, router]);

  if (sessionStatus === 'loading' || isLoadingProject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#FAD400]" />
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    return null;
  }

  if (!project?.id || !project.websiteData || !project.brandDNA) {
    return (
      <AuthenticatedShell>
        <div className="min-h-screen pt-8 px-4 lg:px-8">
          <div className="max-w-3xl mx-auto card p-8 text-center">
            <h1 className="text-2xl font-display font-bold text-[#FAD400] mb-2">No Brand Data Found</h1>
            <p className="text-neutral-600 mb-6 font-light">Create or open a project first to view Brand DNA.</p>
            <button
              type="button"
              onClick={() => router.push('/projects')}
              className="px-5 py-2.5 rounded-xl bg-[#FAD400] text-neutral-900 font-display font-semibold marketing-cta-glow hover:brightness-95"
            >
              Go To Projects
            </button>
          </div>
        </div>
      </AuthenticatedShell>
    );
  }

  return (
    <AuthenticatedShell>
      {(project.campaignCount ?? 0) > 0 && (
        <div className="pt-4 px-4">
          <div className="max-w-7xl mx-auto mb-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center justify-between gap-4">
            <p className="text-xs md:text-sm text-emerald-800 font-light">
              Existing campaigns found for this project: {project.campaignSetCount} sets, {project.campaignCount} campaigns.
            </p>
            <button
              onClick={() => router.push(`/campaigns?projectId=${project.id}`)}
              className="text-xs md:text-sm px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-display font-semibold"
            >
              View Campaigns
            </button>
          </div>
        </div>
      )}
      <BrandDNAEditor />
    </AuthenticatedShell>
  );
}

function BrandDNARoutePageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950">
      <Loader2 className="w-8 h-8 animate-spin text-[var(--hero-blue)]" />
    </div>
  );
}

export default function BrandDNARoutePage() {
  return (
    <Suspense fallback={<BrandDNARoutePageFallback />}>
      <BrandDNARoutePageContent />
    </Suspense>
  );
}
