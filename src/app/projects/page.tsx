'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  Clock3,
  FolderOpen,
  Loader2,
  Plus,
  Sparkles,
  BarChart3,
  ExternalLink,
  Trash2,
} from 'lucide-react';

import { AuthenticatedShell } from '../../components/AuthenticatedShell';
import { MarketingPageBackdrop } from '~/components/marketing/MarketingPageBackdrop';
import { APP_BTN_PRIMARY, APP_CARD } from '~/lib/marketingTheme';
import { api } from '../../trpc/react';

function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'complete') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (normalized === 'failed') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-[#FAD400]/15 text-neutral-800 border-[#FAD400]/40';
}

export default function ProjectsPage() {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { status: sessionStatus } = useSession();
  const router = useRouter();

  const {
    data: projects,
    isLoading: isLoadingProjects,
    refetch: refetchProjects,
  } = api.project.list.useQuery(undefined, {
    enabled: sessionStatus === 'authenticated',
    refetchOnWindowFocus: false,
  });
  const deleteProjectMutation = api.project.delete.useMutation();

  const sortedProjects = useMemo(
    () =>
      [...(projects ?? [])].sort(
        (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      ),
    [projects],
  );

  const hasProjects = sortedProjects.length > 0;
  const completeCount = sortedProjects.filter(
    (project) => project.status.toLowerCase() === 'complete',
  ).length;

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!url.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/layer1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const result = await response.json();
      if (!result.success || !result.data?.projectId) {
        throw new Error(result.error ?? 'Unable to analyze URL');
      }
      await refetchProjects();
      router.push(`/brand-dna?projectId=${result.data.projectId}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteProject = async (projectId: string, projectUrl: string) => {
    if (deletingProjectId) return;
    const confirmed = window.confirm(`Delete project for ${projectUrl}? This cannot be undone.`);
    if (!confirmed) return;

    setError(null);
    setDeletingProjectId(projectId);
    try {
      await deleteProjectMutation.mutateAsync({ projectId });
      await refetchProjects();
      setSuccessMessage('Project deleted successfully');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to delete project');
    } finally {
      setDeletingProjectId(null);
    }
  };

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 2800);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#FAD400]" />
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated') return null;

  return (
    <AuthenticatedShell>
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="fixed top-20 right-4 z-50 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm px-4 py-2.5 shadow-lg"
        >
          {successMessage}
        </motion.div>
      )}
      <section className="relative overflow-hidden pt-8 pb-12 px-4 lg:px-8">
        <MarketingPageBackdrop />

        <div className="relative max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-[#FAD400] mb-2">
              Your Brand Projects
            </h1>
            <p className="text-neutral-600 font-light">
              Continue existing work or spin up a new analysis in one click.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
          >
            {[
              { label: 'Projects', value: sortedProjects.length },
              { label: 'Completed', value: completeCount },
              {
                label: 'Campaign Sets',
                value: sortedProjects.reduce((acc, p) => acc + p.campaignSetCount, 0),
              },
              {
                label: 'Campaigns',
                value: sortedProjects.reduce((acc, p) => acc + p.campaignCount, 0),
              },
            ].map((stat) => (
              <div key={stat.label} className={`px-4 py-3 ${APP_CARD}`}>
                <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                  {stat.label}
                </p>
                <p className="text-xl font-display font-bold text-neutral-900 mt-1">{stat.value}</p>
              </div>
            ))}
          </motion.div>

          <div className="grid lg:grid-cols-[1.3fr_0.95fr] gap-6">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className={`p-5 ${APP_CARD}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-semibold text-neutral-900 flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-[#FAD400]" /> Existing Projects
                </h2>
                <span className="text-xs font-mono text-neutral-500">{sortedProjects.length} total</span>
              </div>
              {isLoadingProjects ? (
                <div className="h-40 flex items-center justify-center text-neutral-500">
                  <Loader2 className="w-5 h-5 animate-spin text-[#FAD400]" />
                </div>
              ) : !hasProjects ? (
                <div className="rounded-xl border border-dashed border-neutral-300 p-6 text-center bg-neutral-50/80">
                  <p className="text-neutral-700 mb-2 font-light">No projects yet</p>
                  <p className="text-xs text-neutral-500 font-light">
                    Analyze your first website to create one.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {sortedProjects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => router.push(`/brand-dna?projectId=${project.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(`/brand-dna?projectId=${project.id}`);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className={`group w-full text-left p-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${APP_CARD}`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-medium text-neutral-900 truncate max-w-[76%] group-hover:text-[#FAD400] transition-colors">
                          {project.url}
                        </p>
                        <div className="flex items-center gap-2">
                          <span
                            className={[
                              'text-[10px] font-mono uppercase tracking-wide px-2 py-1 rounded-full border',
                              statusTone(project.status),
                            ].join(' ')}
                          >
                            {project.status}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleDeleteProject(project.id, project.url);
                            }}
                            disabled={deletingProjectId === project.id}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Delete project"
                            aria-label={`Delete project ${project.url}`}
                          >
                            {deletingProjectId === project.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-neutral-600 flex items-center gap-2 mb-2 font-light">
                        <Clock3 className="w-3.5 h-3.5" /> Updated {formatDate(project.updatedAt)}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-mono">
                        <span>{project.hasBrandDNA ? 'Brand DNA ready' : 'Brand DNA pending'}</span>
                        <span>•</span>
                        <span>{project.campaignSetCount} sets</span>
                        <span>•</span>
                        <span>{project.campaignCount} campaigns</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className={`p-5 lg:sticky lg:top-20 h-fit ${APP_CARD}`}
            >
              <h2 className="text-lg font-display font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#FAD400]" /> Enter your website
              </h2>

              <form onSubmit={handleAnalyze} className="space-y-3">
                <label className="block">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1.5 block">
                    Website URL
                  </span>
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="app-input"
                    disabled={isAnalyzing}
                  />
                </label>

                <button
                  type="submit"
                  disabled={isAnalyzing || !url.trim()}
                  className={`w-full ${APP_BTN_PRIMARY} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Analyzing
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Analyze Website
                    </>
                  )}
                </button>

                {error && (
                  <p className="text-xs text-rose-700 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                    {error}
                  </p>
                )}
              </form>

              <div className="mt-4 pt-4 border-t border-neutral-200 space-y-2 text-xs text-neutral-500 font-light">
                <p className="flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5 text-[#FAD400]" />
                  We extract visual DNA and structure brand insights automatically.
                </p>
                <p className="flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5 text-[#FAD400]" />
                  Start from any website and continue from Brand DNA to Campaigns.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </AuthenticatedShell>
  );
}
