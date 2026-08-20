'use client';

import Link from 'next/link';
import { Cpu, Users, PauseCircle, PlayCircle } from 'lucide-react';
import { api } from '~/trpc/react';

export default function AdminOverviewPage() {
  const { data, isLoading } = api.admin.overview.useQuery();

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-neutral-900 mb-1">Overview</h1>
      <p className="text-sm text-neutral-500 mb-8">Runtime controls that used to require a deploy.</p>

      {isLoading || !data ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/users"
            className="rounded-2xl border border-neutral-200 bg-white p-5 hover:border-[#FAD400]/50 transition-colors"
          >
            <Users className="w-5 h-5 text-neutral-400 mb-3" />
            <p className="text-3xl font-display font-bold">{data.userCount}</p>
            <p className="text-sm text-neutral-500 mt-1">Users ({data.adminCount} admins in DB)</p>
          </Link>

          <Link
            href="/admin/models"
            className="rounded-2xl border border-neutral-200 bg-white p-5 hover:border-[#FAD400]/50 transition-colors"
          >
            <Cpu className="w-5 h-5 text-neutral-400 mb-3" />
            <p className="text-sm font-mono text-neutral-800 truncate">{data.settings.textModel}</p>
            <p className="text-xs text-neutral-500 mt-2 truncate">Image: {data.settings.imageModel}</p>
            <p className="text-xs text-neutral-500">Size: {data.settings.imageSize}</p>
          </Link>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            {data.settings.generationPaused ? (
              <PauseCircle className="w-5 h-5 text-red-500 mb-3" />
            ) : (
              <PlayCircle className="w-5 h-5 text-emerald-500 mb-3" />
            )}
            <p className="font-display font-semibold">
              {data.settings.generationPaused ? 'Generation paused' : 'Generation live'}
            </p>
            <p className="text-sm text-neutral-500 mt-1">
              {data.settings.generationPaused
                ? 'Users cannot generate images until you resume it.'
                : 'Image generation is accepting requests.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
