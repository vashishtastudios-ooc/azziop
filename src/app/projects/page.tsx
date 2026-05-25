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
  if (normalized === 'complete') return 'bg-emerald-500/10 text-emerald-300 border-emerald-400/30';
  if (normalized === 'failed') return 'bg-rose-500/10 text-rose-300 border-rose-400/30';
  return 'bg-indigo-500/10 text-indigo-300 border-indigo-400/30';
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
  const completeCount = sortedProjects.filter((project) => project.status.toLowerCase() === 'complete').length;

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
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--hero-blue)]" />
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
          className="fixed top-20 right-4 z-50 rounded-xl border border-emerald-500/40 bg-emerald-500/15 text-emerald-200 text-sm px-4 py-2.5 shadow-lg backdrop-blur"
        >
          {successMessage}
        </motion.div>
      )}
      <section className="relative overflow-hidden pt-8 pb-12 px-4 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.22),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.14),transparent_35%)]" />

        <div className="relative max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">Your Brand Projects</h1>
            <p className="text-surface-400">Continue existing work or spin up a new analysis in one click.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
          >
            <div className="rounded-xl border border-surface-800/80 bg-surface-900/50 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-surface-500">Projects</p>
              <p className="text-xl font-semibold text-white mt-1">{sortedProjects.length}</p>
            </div>
            <div className="rounded-xl border border-surface-800/80 bg-surface-900/50 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-surface-500">Completed</p>
              <p className="text-xl font-semibold text-white mt-1">{completeCount}</p>
            </div>
            <div className="rounded-xl border border-surface-800/80 bg-surface-900/50 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-surface-500">Campaign Sets</p>
              <p className="text-xl font-semibold text-white mt-1">
                {sortedProjects.reduce((acc, project) => acc + project.campaignSetCount, 0)}
              </p>
            </div>
            <div className="rounded-xl border border-surface-800/80 bg-surface-900/50 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-surface-500">Campaigns</p>
              <p className="text-xl font-semibold text-white mt-1">
                {sortedProjects.reduce((acc, project) => acc + project.campaignCount, 0)}
              </p>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-[1.3fr_0.95fr] gap-6">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="rounded-2xl border border-surface-800/80 bg-surface-900/50 backdrop-blur-xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-indigo-300" /> Existing Projects
                </h2>
                <span className="text-xs text-surface-500">{sortedProjects.length} total</span>
              </div>
              {isLoadingProjects ? (
                <div className="h-40 flex items-center justify-center text-surface-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : !hasProjects ? (
                <div className="rounded-xl border border-dashed border-surface-700 p-6 text-center">
                  <p className="text-surface-300 mb-2">No projects yet</p>
                  <p className="text-xs text-surface-500">Analyze your first website to create one.</p>
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
                      className="group w-full text-left rounded-xl border border-surface-700/70 bg-surface-800/45 hover:border-indigo-400/45 transition-all duration-200 p-4 hover:-translate-y-0.5 cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-medium text-white truncate max-w-[76%] group-hover:text-indigo-200 transition-colors">
                          {project.url}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={['text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border', statusTone(project.status)].join(' ')}>
                            {project.status}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleDeleteProject(project.id, project.url);
                            }}
                            disabled={deletingProjectId === project.id}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-rose-500/35 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                      <div className="text-xs text-surface-400 flex items-center gap-2 mb-2">
                        <Clock3 className="w-3.5 h-3.5" /> Updated {formatDate(project.updatedAt)}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-surface-500">
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
              className="rounded-2xl border border-surface-800/80 bg-surface-900/55 backdrop-blur-xl p-5 lg:sticky lg:top-20 h-fit"
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-300" /> Enter your website
              </h2>

              <form onSubmit={handleAnalyze} className="space-y-3">
                <label className="block">
                  <span className="text-xs text-surface-500 mb-1.5 block">Website URL</span>
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 bg-surface-800/80 border border-surface-700 rounded-xl text-surface-100 placeholder:text-surface-500 focus:outline-none focus:border-indigo-500"
                    disabled={isAnalyzing}
                  />
                </label>

                <button
                  type="submit"
                  disabled={isAnalyzing || !url.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                  <p className="text-xs text-rose-400 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2">{error}</p>
                )}
              </form>

              <div className="mt-4 pt-4 border-t border-surface-800/80 space-y-2 text-xs text-surface-500">
                <p className="flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5 text-surface-400" />
                  We extract visual DNA and structure brand insights automatically.
                </p>
                <p className="flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5 text-surface-400" />
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
