'use client';

import { Loader2 } from 'lucide-react';
import { api } from '~/trpc/react';

const LABELS: Record<string, { title: string; hint: string }> = {
  generateImages: {
    title: 'Generate AI images',
    hint: 'Layer 5 / Generate AI Images button',
  },
  cloneCreative: {
    title: 'Clone & Copy',
    hint: 'Clone a reference creative into the brand',
  },
  productInfographic: {
    title: 'Product infographic',
    hint: 'Product URL infographic flow',
  },
  scheduling: {
    title: 'Social scheduling',
    hint: 'Schedule page and creating new posts',
  },
};

export default function AdminFlagsPage() {
  const utils = api.useUtils();
  const { data, isLoading } = api.admin.getFlags.useQuery();
  const update = api.admin.updateFlags.useMutation({
    onSuccess: () => {
      void utils.admin.getFlags.invalidate();
      void utils.user.productConfig.invalidate();
    },
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading flags…
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-display font-bold mb-1">Feature flags</h1>
      <p className="text-sm text-neutral-500 mb-8">
        Turn product surfaces off without a deploy. APIs reject disabled features too.
      </p>

      <div className="space-y-3">
        {(Object.keys(LABELS) as Array<keyof typeof data>).map((key) => (
          <div
            key={key}
            className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white px-4 py-3"
          >
            <div>
              <p className="font-medium text-sm">{LABELS[key]?.title}</p>
              <p className="text-xs text-neutral-500">{LABELS[key]?.hint}</p>
            </div>
            <button
              type="button"
              disabled={update.isPending}
              onClick={() => update.mutate({ [key]: !data[key] })}
              className={[
                'px-3 py-1.5 rounded-lg text-xs font-semibold border',
                data[key]
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-neutral-100 border-neutral-200 text-neutral-500',
              ].join(' ')}
            >
              {data[key] ? 'On' : 'Off'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
