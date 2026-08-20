'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '~/trpc/react';
import type { PlanId } from '~/lib/pricing';

export default function AdminBillingPage() {
  const utils = api.useUtils();
  const { data, isLoading } = api.admin.getBilling.useQuery();
  const update = api.admin.updateBilling.useMutation({
    onSuccess: () => utils.admin.getBilling.invalidate(),
  });
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('free');

  if (isLoading || !data) {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading billing…
      </div>
    );
  }

  const costs = data.runtime.creditCosts;
  const overlay = data.runtime.plans[selectedPlan] ?? {};
  const codePlan = data.codeDefaults.plans.find((p) => p.id === selectedPlan)?.limits;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-display font-bold mb-1">Billing</h1>
      <p className="text-sm text-neutral-500 mb-8">
        Credit prices and plan limits. Razorpay checkout amounts stay in the Razorpay dashboard.
      </p>

      {update.error && <p className="mb-4 text-sm text-red-600">{update.error.message}</p>}
      {update.isSuccess && <p className="mb-4 text-sm text-emerald-600">Saved.</p>}

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 mb-4 space-y-4">
        <h2 className="font-display font-semibold">Credit costs</h2>
        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm">
            <span className="block text-neutral-600 mb-1">Per image</span>
            <input
              className="app-input"
              type="number"
              min={1}
              defaultValue={costs.image}
              key={`image-${costs.image}`}
              onBlur={(e) => {
                const v = Number(e.target.value);
                if (v && v !== costs.image) update.mutate({ creditCosts: { image: v } });
              }}
            />
          </label>
          <label className="text-sm">
            <span className="block text-neutral-600 mb-1">Per campaign</span>
            <input
              className="app-input"
              type="number"
              min={1}
              defaultValue={costs.campaign}
              key={`campaign-${costs.campaign}`}
              onBlur={(e) => {
                const v = Number(e.target.value);
                if (v && v !== costs.campaign) update.mutate({ creditCosts: { campaign: v } });
              }}
            />
          </label>
        </div>
        <p className="text-xs text-neutral-400">
          Code defaults: image {data.codeDefaults.creditCosts.image} · campaign{' '}
          {data.codeDefaults.creditCosts.campaign}
        </p>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
        <h2 className="font-display font-semibold">Plan limits</h2>
        <div className="flex flex-wrap gap-2">
          {data.codeDefaults.plans.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPlan(p.id)}
              className={[
                'px-3 py-1.5 rounded-lg text-xs font-semibold border',
                selectedPlan === p.id
                  ? 'bg-[#FAD400]/30 border-[#FAD400]'
                  : 'border-neutral-200',
              ].join(' ')}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm">
            <span className="block text-neutral-600 mb-1">Monthly credits</span>
            <input
              className="app-input"
              type="number"
              min={0}
              key={`${selectedPlan}-credits-${overlay.monthlyCredits ?? codePlan?.monthlyCredits}`}
              defaultValue={overlay.monthlyCredits ?? codePlan?.monthlyCredits}
              onBlur={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v)) {
                  update.mutate({ planId: selectedPlan, planLimits: { monthlyCredits: v } });
                }
              }}
            />
          </label>
          <label className="text-sm">
            <span className="block text-neutral-600 mb-1">Max projects (empty = unlimited)</span>
            <input
              className="app-input"
              type="number"
              min={1}
              key={`${selectedPlan}-projects-${overlay.projects ?? codePlan?.projects}`}
              defaultValue={overlay.projects ?? codePlan?.projects ?? ''}
              onBlur={(e) => {
                const raw = e.target.value.trim();
                update.mutate({
                  planId: selectedPlan,
                  planLimits: { projects: raw === '' ? null : Number(raw) },
                });
              }}
            />
          </label>
          <label className="text-sm">
            <span className="block text-neutral-600 mb-1">Max AI layer (1–6)</span>
            <input
              className="app-input"
              type="number"
              min={1}
              max={6}
              key={`${selectedPlan}-layers-${overlay.aiLayers ?? codePlan?.aiLayers}`}
              defaultValue={overlay.aiLayers ?? codePlan?.aiLayers ?? 6}
              onBlur={(e) => {
                const v = Number(e.target.value);
                if (v >= 1 && v <= 6) {
                  update.mutate({ planId: selectedPlan, planLimits: { aiLayers: v } });
                }
              }}
            />
          </label>
          <label className="text-sm flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              checked={overlay.scheduling ?? codePlan?.scheduling ?? false}
              onChange={(e) =>
                update.mutate({
                  planId: selectedPlan,
                  planLimits: { scheduling: e.target.checked },
                })
              }
            />
            Scheduling included
          </label>
        </div>
      </section>
    </div>
  );
}
