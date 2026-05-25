'use client';

import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  CalendarClock,
  Instagram,
  Facebook,
  Loader2,
  Check,
  X,
  Trash2,
  Image as ImageIcon,
  Link2,
  Send,
} from 'lucide-react';
import { api } from '~/trpc/react';
import type { GeneratedImage } from '@/types';

function formatLocalDatetimeValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseHashtagInput(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((s) => s.replace(/^#+/, '').trim())
    .filter(Boolean);
}

export function SchedulePage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') ?? undefined;
  const oauthConnected = searchParams.get('connected');
  const oauthError = searchParams.get('error');

  const [campaignId, setCampaignId] = useState<string>('');
  const [selectedCreativeIndex, setSelectedCreativeIndex] = useState<number | null>(null);
  const [platform, setPlatform] = useState<'instagram' | 'facebook'>('instagram');
  const [caption, setCaption] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [firstComment, setFirstComment] = useState('');
  const [scheduledAt, setScheduledAt] = useState(() =>
    formatLocalDatetimeValue(new Date(Date.now() + 60 * 60 * 1000)),
  );

  const utils = api.useUtils();

  const { data: projectDetails, isLoading: loadingProject } = api.project.getDetails.useQuery(
    { projectId: projectId! },
    { enabled: Boolean(projectId), staleTime: 30_000 },
  );

  const { data: creativeBundle, isLoading: loadingCreatives } = api.creative.getLatestProjectCreatives.useQuery(
    { projectId: projectId!, campaignId: campaignId || undefined },
    { enabled: Boolean(projectId) && Boolean(campaignId), staleTime: 15_000 },
  );

  const { data: scheduledPosts, isLoading: loadingList } = api.scheduler.listByProject.useQuery(
    { projectId: projectId! },
    { enabled: Boolean(projectId), staleTime: 10_000 },
  );
  const { data: instagramConnection } = api.scheduler.instagramConnection.useQuery();

  const createPost = api.scheduler.create.useMutation({
    onSuccess: () => {
      void utils.scheduler.listByProject.invalidate({ projectId: projectId! });
      setCaption('');
      setHashtagInput('');
      setFirstComment('');
      setSelectedCreativeIndex(null);
    },
  });

  const cancelPost = api.scheduler.cancel.useMutation({
    onSuccess: () => void utils.scheduler.listByProject.invalidate({ projectId: projectId! }),
  });

  const deletePost = api.scheduler.delete.useMutation({
    onSuccess: () => void utils.scheduler.listByProject.invalidate({ projectId: projectId! }),
  });
  const publishNow = api.scheduler.publishNow.useMutation({
    onSuccess: () => void utils.scheduler.listByProject.invalidate({ projectId: projectId! }),
  });
  const publishDue = api.scheduler.publishDue.useMutation({
    onSuccess: () => void utils.scheduler.listByProject.invalidate({ projectId: projectId! }),
  });
  const disconnectInstagram = api.scheduler.disconnectInstagram.useMutation({
    onSuccess: () => {
      void utils.scheduler.instagramConnection.invalidate();
    },
  });

  const campaigns = projectDetails?.campaigns ?? [];

  useEffect(() => {
    setCampaignId('');
    setSelectedCreativeIndex(null);
  }, [projectId]);

  useEffect(() => {
    if (!projectDetails?.campaigns?.length) return;
    const list = projectDetails.campaigns as { id: string }[];
    setCampaignId((prev) => {
      if (prev && list.some((c) => c.id === prev)) return prev;
      return list[0]!.id;
    });
  }, [projectId, projectDetails?.id, projectDetails?.campaigns]);

  const creatives = creativeBundle?.creatives ?? [];
  const generatedImages: GeneratedImage[] = creativeBundle?.generatedImages ?? [];
  const creativeIds = creativeBundle?.creativeIds ?? [];

  const imageByIndex = useMemo(() => {
    const m = new Map<number, string>();
    for (const g of generatedImages) {
      if (g.imageUrl) m.set(g.creativeIndex, g.imageUrl);
    }
    return m;
  }, [generatedImages]);

  const selectedImageUrl =
    selectedCreativeIndex !== null ? imageByIndex.get(selectedCreativeIndex) ?? null : null;

  useEffect(() => {
    if (!instagramConnection?.connected) return;
    void publishDue.mutateAsync();
    const id = setInterval(() => {
      void publishDue.mutateAsync();
    }, 45_000);
    return () => clearInterval(id);
  }, [instagramConnection?.connected]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !campaignId || selectedCreativeIndex === null || !selectedImageUrl) return;
    const creativeId = creativeIds[selectedCreativeIndex];
    if (!creativeId) return;

    const hashtags = parseHashtagInput(hashtagInput);
    const at = new Date(scheduledAt);
    createPost.mutate({
      projectId,
      campaignId,
      creativeId,
      platform,
      imageUrl: selectedImageUrl,
      caption: caption.trim(),
      hashtags,
      firstComment: firstComment.trim() || null,
      scheduledAt: at,
    });
  };

  if (!projectId) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4 max-w-2xl mx-auto">
        <div className="rounded-2xl border border-surface-800 bg-surface-900/50 p-8 text-center">
          <CalendarClock className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2">Schedule Instagram posts</h1>
          <p className="text-surface-400 text-sm mb-6">
            Open a project from <span className="text-surface-300">Projects</span>, then use{' '}
            <span className="text-surface-300">Schedule</span> in the sidebar to attach this workspace.
          </p>
          <a
            href="/projects"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium"
          >
            <Link2 className="w-4 h-4" />
            Go to Projects
          </a>
        </div>
      </div>
    );
  }

  if (loadingProject && !projectDetails) {
    return (
      <div className="min-h-screen pt-24 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  const upcoming =
    scheduledPosts?.filter((p) => p.status === 'scheduled' && new Date(p.scheduledAt) >= new Date()) ?? [];
  const pastOrCancelled =
    scheduledPosts?.filter((p) => p.status !== 'scheduled' || new Date(p.scheduledAt) < new Date()) ?? [];

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500/20 to-violet-500/20 border border-pink-500/20 flex items-center justify-center">
              <Instagram className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-white">Post scheduler</h1>
              <p className="text-surface-400 text-sm">
                Instagram — pick a creative, write your caption, set date &amp; time
              </p>
            </div>
          </div>
          {oauthConnected === 'instagram' && (
            <p className="text-xs text-emerald-300 mb-3">
              Instagram account connected successfully.
            </p>
          )}
          {oauthError && (
            <p className="text-xs text-red-400 mb-3">
              Instagram connect error: {oauthError}
            </p>
          )}
          <div className="rounded-xl border border-surface-800 bg-surface-900/50 p-3 flex flex-wrap items-center gap-3">
            {instagramConnection?.connected ? (
              <>
                <Instagram className="w-4 h-4 text-pink-400" />
                <p className="text-sm text-emerald-300">
                  Instagram: @{instagramConnection.instagramUsername ?? 'business'}
                </p>
                {instagramConnection.facebookConnected && (
                  <>
                    <span className="text-surface-600">·</span>
                    <Facebook className="w-4 h-4 text-blue-400" />
                    <p className="text-sm text-emerald-300">Facebook Page connected</p>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => disconnectInstagram.mutate()}
                  className="px-3 py-1.5 text-xs rounded-lg border border-surface-700 text-surface-300 hover:text-white hover:bg-surface-800 transition-colors"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <>
                <Instagram className="w-4 h-4 text-pink-400" />
                <a
                  href={projectId ? `/api/instagram/connect?projectId=${projectId}` : '/api/instagram/connect'}
                  className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-pink-600 to-violet-600 text-white font-medium hover:from-pink-500 hover:to-violet-500"
                >
                  Connect Instagram &amp; Facebook
                </a>
              </>
            )}
            <p className="text-[11px] text-surface-500">
              Auto-publishes due scheduled posts when connected.
            </p>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8">
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-3 space-y-5 rounded-2xl border border-surface-800 bg-surface-900/40 p-6"
          >
            <div>
              <label className="block text-xs font-medium text-surface-400 mb-2">Platform</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPlatform('instagram')}
                  className={[
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
                    platform === 'instagram'
                      ? 'border-pink-500 bg-pink-500/10 text-pink-300'
                      : 'border-surface-700 text-surface-400 hover:border-surface-500',
                  ].join(' ')}
                >
                  <Instagram className="w-4 h-4" />
                  Instagram
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform('facebook')}
                  className={[
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
                    platform === 'facebook'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                      : 'border-surface-700 text-surface-400 hover:border-surface-500',
                  ].join(' ')}
                >
                  <Facebook className="w-4 h-4" />
                  Facebook
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-400 mb-2">Campaign</label>
              <select
                value={campaignId}
                onChange={(e) => {
                  setCampaignId(e.target.value);
                  setSelectedCreativeIndex(null);
                }}
                className="w-full rounded-xl border border-surface-700 bg-surface-950 px-4 py-3 text-sm text-white"
              >
                <option value="">Select campaign</option>
                {campaigns.map((c: { id: string; title: string }) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            {campaignId && (
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-2">
                  Creative (generated image)
                </label>
                {loadingCreatives ? (
                  <Loader2 className="w-6 h-6 animate-spin text-surface-500" />
                ) : creatives.length === 0 ? (
                  <p className="text-sm text-surface-500">No creatives in this campaign.</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {creatives.map((cr, idx) => {
                      const url = imageByIndex.get(idx);
                      const selected = selectedCreativeIndex === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => url && setSelectedCreativeIndex(idx)}
                          disabled={!url}
                          className={[
                            'relative aspect-square rounded-xl overflow-hidden border-2 transition-all',
                            selected ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-surface-700',
                            url ? 'cursor-pointer hover:border-indigo-400/60' : 'opacity-40 cursor-not-allowed',
                          ].join(' ')}
                        >
                          {url ? (
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-surface-800 flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-surface-600" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-surface-400 mb-2">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={5}
                maxLength={2200}
                placeholder="Write the main caption for your Instagram post..."
                className="w-full rounded-xl border border-surface-700 bg-surface-950 px-4 py-3 text-sm text-white placeholder-surface-500 resize-y min-h-[120px]"
              />
              <p className="text-[11px] text-surface-500 mt-1">{caption.length} / 2200</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-400 mb-2">Hashtags</label>
              <input
                type="text"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                placeholder="#perfume #luxury or comma / space separated"
                className="w-full rounded-xl border border-surface-700 bg-surface-950 px-4 py-3 text-sm text-white placeholder-surface-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-400 mb-2">
                First comment <span className="text-surface-600">(optional)</span>
              </label>
              <textarea
                value={firstComment}
                onChange={(e) => setFirstComment(e.target.value)}
                rows={2}
                maxLength={2200}
                placeholder="Often used for links or extra hashtags"
                className="w-full rounded-xl border border-surface-700 bg-surface-950 px-4 py-3 text-sm text-white placeholder-surface-500 resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-400 mb-2">Date &amp; time</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-xl border border-surface-700 bg-surface-950 px-4 py-3 text-sm text-white"
              />
            </div>

            <button
              type="submit"
              disabled={
                createPost.isPending ||
                !campaignId ||
                selectedCreativeIndex === null ||
                !selectedImageUrl ||
                !caption.trim()
              }
              className={[
                'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all',
                platform === 'facebook'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400'
                  : 'bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500',
              ].join(' ')}
            >
              {createPost.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Schedule post
                </>
              )}
            </button>

            <p className="text-[11px] text-surface-500 leading-relaxed">
              When Instagram is connected, due posts auto-publish. If publish fails, open the entry in
              the list and use <span className="text-surface-300">Publish now</span> after fixing account or
              image accessibility issues.
            </p>
          </form>

          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-surface-800 bg-surface-900/40 p-5">
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-indigo-400" />
                Upcoming
              </h2>
              {loadingList ? (
                <Loader2 className="w-6 h-6 animate-spin text-surface-500" />
              ) : upcoming.length === 0 ? (
                <p className="text-sm text-surface-500">No scheduled posts yet.</p>
              ) : (
                <ul className="space-y-3">
                  {upcoming.map((p) => (
                    <li
                      key={p.id}
                      className="rounded-xl border border-surface-700/80 bg-surface-950/80 p-3 flex gap-3"
                    >
                      <img
                        src={p.imageUrl}
                        alt=""
                        className="w-14 h-14 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {p.platform === 'facebook' ? (
                            <Facebook className="w-3 h-3 text-blue-400" />
                          ) : (
                            <Instagram className="w-3 h-3 text-pink-400" />
                          )}
                          <p className="text-xs text-surface-400 truncate">{p.campaign.title}</p>
                        </div>
                        <p className="text-sm text-white font-medium truncate">{p.creative.headline}</p>
                        <p className="text-[11px] text-indigo-300 mt-1">
                          {new Date(p.scheduledAt).toLocaleString()}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {p.status !== 'published' && (
                            <button
                              type="button"
                              onClick={() => publishNow.mutate({ id: p.id })}
                              className="text-[11px] text-surface-300 hover:text-emerald-300 flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" /> Publish now
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => cancelPost.mutate({ id: p.id })}
                            className="text-[11px] text-surface-400 hover:text-amber-400 flex items-center gap-1"
                          >
                            <X className="w-3 h-3" /> Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Delete this scheduled post?')) deletePost.mutate({ id: p.id });
                            }}
                            className="text-[11px] text-surface-400 hover:text-red-400 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {pastOrCancelled.length > 0 && (
              <div className="rounded-2xl border border-surface-800/60 bg-surface-900/20 p-5 opacity-90">
                <h2 className="text-xs font-medium text-surface-500 mb-2">Past / cancelled</h2>
                <ul className="text-xs text-surface-500 space-y-1">
                  {pastOrCancelled.slice(0, 8).map((p) => (
                    <li key={p.id} className="rounded-lg bg-surface-950/50 px-2 py-1.5">
                      <div className="flex justify-between gap-2">
                        <span className="truncate">{p.creative.headline}</span>
                        <span className="shrink-0 text-surface-600">{p.status}</span>
                      </div>
                      {p.errorMessage ? (
                        <p className="mt-1 text-[10px] text-red-400/90 line-clamp-2">{p.errorMessage}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
