'use client';

import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '~/trpc/react';

const LAYERS = [
  { id: 'layer1', label: 'Layer 1 — Brand DNA' },
  { id: 'layer2', label: 'Layer 2 — Campaigns' },
  { id: 'layer3', label: 'Layer 3 — Creatives' },
  { id: 'layer4', label: 'Layer 4 — Image prompts' },
] as const;

export default function AdminPromptsPage() {
  const utils = api.useUtils();
  const [layer, setLayer] = useState<(typeof LAYERS)[number]['id']>('layer3');
  const { data, isLoading } = api.admin.getPrompt.useQuery({ layer });
  const [draft, setDraft] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const save = api.admin.savePrompt.useMutation({
    onSuccess: () => {
      setNote('');
      void utils.admin.getPrompt.invalidate({ layer });
    },
  });
  const activate = api.admin.activatePrompt.useMutation({
    onSuccess: () => utils.admin.getPrompt.invalidate({ layer }),
  });
  const restore = api.admin.restorePromptDefault.useMutation({
    onSuccess: () => {
      setDraft(null);
      void utils.admin.getPrompt.invalidate({ layer });
    },
  });

  const body = draft ?? data?.activeBody ?? '';
  const dirty = useMemo(
    () => Boolean(data && draft !== null && draft !== data.activeBody),
    [data, draft],
  );

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-1">Prompts</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Edit the base system prompt per layer. Saving creates a new version you can roll back.
        Industry vocabulary is still injected in code after this text.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {LAYERS.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => {
              setLayer(l.id);
              setDraft(null);
            }}
            className={[
              'px-3 py-1.5 rounded-lg text-xs font-semibold border',
              layer === l.id ? 'bg-[#FAD400]/30 border-[#FAD400]' : 'border-neutral-200 bg-white',
            ].join(' ')}
          >
            {l.label}
          </button>
        ))}
      </div>

      {isLoading || !data ? (
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading prompt…
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {save.error && <p className="text-sm text-red-600">{save.error.message}</p>}
            <textarea
              className="app-input min-h-[420px] font-mono text-xs leading-relaxed"
              value={body}
              onChange={(e) => setDraft(e.target.value)}
            />
            <input
              className="app-input text-sm"
              placeholder="Optional note (e.g. tighter anti-luxury rule)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!dirty || save.isPending}
                onClick={() => save.mutate({ layer, body, note: note || undefined })}
                className="px-4 py-2 rounded-xl bg-[#FAD400] text-sm font-semibold disabled:opacity-50"
              >
                {save.isPending ? 'Saving…' : 'Save as new version'}
              </button>
              <button
                type="button"
                disabled={restore.isPending}
                onClick={() => restore.mutate({ layer })}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-sm font-semibold"
              >
                Restore code default
              </button>
            </div>
            <p className="text-xs text-neutral-400">
              {data.usingCodeDefault ? 'Currently using the code default.' : 'Currently using an admin override.'}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-display font-semibold mb-3">Versions</h2>
            <div className="space-y-2 max-h-[560px] overflow-auto">
              {data.versions.length === 0 && (
                <p className="text-xs text-neutral-500">No saved versions yet.</p>
              )}
              {data.versions.map((v) => (
                <div key={v.id} className="rounded-xl border border-neutral-200 bg-white p-3">
                  <p className="text-[11px] text-neutral-400">
                    {new Date(v.createdAt).toLocaleString()}
                    {v.isActive ? ' · active' : ''}
                  </p>
                  {v.note && <p className="text-xs font-medium mt-1">{v.note}</p>}
                  <p className="text-[11px] text-neutral-500 mt-1 line-clamp-3">{v.preview}</p>
                  {!v.isActive && (
                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold underline"
                      onClick={() => activate.mutate({ id: v.id })}
                    >
                      Roll back to this
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
