'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '~/trpc/react';

export default function AdminModelsPage() {
  const utils = api.useUtils();
  const { data, isLoading } = api.admin.getModels.useQuery();
  const update = api.admin.updateModels.useMutation({
    onSuccess: async () => {
      await utils.admin.getModels.invalidate();
      await utils.admin.overview.invalidate();
    },
  });

  const [textModel, setTextModel] = useState<string | null>(null);
  const [imageModel, setImageModel] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<string | null>(null);
  const [customText, setCustomText] = useState('');
  const [customImage, setCustomImage] = useState('');

  if (isLoading || !data) {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading models…
      </div>
    );
  }

  const currentText = textModel ?? data.settings.textModel;
  const currentImage = imageModel ?? data.settings.imageModel;
  const currentSize = imageSize ?? data.settings.imageSize;

  const save = (patch: {
    textModel?: string;
    imageModel?: string;
    imageSize?: '512' | '1K' | '2K' | '4K';
    generationPaused?: boolean;
  }) => {
    update.mutate(patch);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-display font-bold text-neutral-900 mb-1">AI models</h1>
      <p className="text-sm text-neutral-500 mb-8">
        Changes apply within ~10 seconds. Env defaults remain the fallback if a field is cleared.
      </p>

      {update.error && (
        <p className="mb-4 text-sm text-red-600">{update.error.message}</p>
      )}
      {update.isSuccess && (
        <p className="mb-4 text-sm text-emerald-600">Saved.</p>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 mb-4">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-display font-semibold">Image generation</h2>
            <p className="text-xs text-neutral-500">Kill switch — pauses Layer 5 without a deploy.</p>
          </div>
          <button
            type="button"
            disabled={update.isPending}
            onClick={() => save({ generationPaused: !data.settings.generationPaused })}
            className={[
              'px-3 py-1.5 rounded-lg text-xs font-semibold border',
              data.settings.generationPaused
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700',
            ].join(' ')}
          >
            {data.settings.generationPaused ? 'Paused — click to resume' : 'Live — click to pause'}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 mb-4 space-y-4">
        <h2 className="font-display font-semibold">Text model (Layers 1–4)</h2>
        <p className="text-xs text-neutral-500">
          Env fallback: <code className="font-mono">{data.envFallback.textModel}</code>
        </p>
        <select
          className="app-input"
          value={
            (data.textModelOptions as readonly string[]).includes(currentText)
              ? currentText
              : '__custom__'
          }
          onChange={(e) => {
            if (e.target.value === '__custom__') {
              setTextModel(customText || currentText);
              return;
            }
            setTextModel(e.target.value);
            save({ textModel: e.target.value });
          }}
        >
          {data.textModelOptions.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
          <option value="__custom__">Custom OpenRouter slug…</option>
        </select>
        {!(data.textModelOptions as readonly string[]).includes(currentText) && (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const next = customText.trim() || currentText;
              setTextModel(next);
              save({ textModel: next });
            }}
          >
            <input
              className="app-input flex-1"
              placeholder="provider/model-id"
              defaultValue={currentText}
              onChange={(e) => setCustomText(e.target.value)}
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-[#FAD400] text-sm font-semibold"
              disabled={update.isPending}
            >
              Save
            </button>
          </form>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 mb-4 space-y-4">
        <h2 className="font-display font-semibold">Image model (Layer 5)</h2>
        <p className="text-xs text-neutral-500">
          Env fallback: <code className="font-mono">{data.envFallback.imageModel}</code>
        </p>
        <select
          className="app-input"
          value={
            (data.imageModelOptions as readonly string[]).includes(currentImage)
              ? currentImage
              : '__custom__'
          }
          onChange={(e) => {
            if (e.target.value === '__custom__') {
              setImageModel(customImage || currentImage);
              return;
            }
            setImageModel(e.target.value);
            save({ imageModel: e.target.value });
          }}
        >
          {data.imageModelOptions.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
          <option value="__custom__">Custom OpenRouter slug…</option>
        </select>
        {!(data.imageModelOptions as readonly string[]).includes(currentImage) && (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const next = customImage.trim() || currentImage;
              setImageModel(next);
              save({ imageModel: next });
            }}
          >
            <input
              className="app-input flex-1"
              placeholder="provider/model-id"
              defaultValue={currentImage}
              onChange={(e) => setCustomImage(e.target.value)}
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-[#FAD400] text-sm font-semibold"
              disabled={update.isPending}
            >
              Save
            </button>
          </form>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Image size</label>
          <div className="flex flex-wrap gap-2">
            {data.imageSizeOptions.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => {
                  setImageSize(size);
                  save({ imageSize: size as '512' | '1K' | '2K' | '4K' });
                }}
                className={[
                  'px-3 py-1.5 rounded-lg text-xs font-semibold border',
                  currentSize === size
                    ? 'bg-[#FAD400]/30 border-[#FAD400] text-neutral-900'
                    : 'bg-white border-neutral-200 text-neutral-600',
                ].join(' ')}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
