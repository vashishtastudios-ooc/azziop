'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import { api } from '~/trpc/react';

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const utils = api.useUtils();
  const { data, isLoading } = api.admin.getUserDetail.useQuery({ userId });
  const [refundCount, setRefundCount] = useState('1');
  const refund = api.admin.refundImages.useMutation({
    onSuccess: () => utils.admin.getUserDetail.invalidate({ userId }),
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading user…
      </div>
    );
  }

  const { user, campaigns, ledger, costs } = data;

  return (
    <div>
      <Link href="/admin/users" className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> All users
      </Link>
      <h1 className="text-2xl font-display font-bold">{user.name}</h1>
      <p className="text-sm text-neutral-500 mb-6">
        {user.email ?? '—'} · {user.planId} · {user.creditBalance.toLocaleString()} credits
        {user.isAdmin ? ' · admin' : ''}
      </p>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 mb-6">
        <h2 className="font-display font-semibold mb-2">Refund failed images</h2>
        <p className="text-xs text-neutral-500 mb-3">
          Credits {costs.image} per image. Use this when a batch charged but produced nothing useful.
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            className="app-input w-24 py-1.5 text-sm"
            type="number"
            min={1}
            value={refundCount}
            onChange={(e) => setRefundCount(e.target.value)}
          />
          <button
            type="button"
            disabled={refund.isPending || !Number(refundCount)}
            onClick={() =>
              refund.mutate({ userId, imageCount: Number(refundCount), note: 'admin support refund' })
            }
            className="px-3 py-2 rounded-xl bg-[#FAD400] text-sm font-semibold"
          >
            Refund
          </button>
          {refund.isSuccess && (
            <span className="text-xs text-emerald-600">Refunded {refund.data.amount} credits.</span>
          )}
        </div>
      </section>

      <h2 className="font-display font-semibold mb-3">Recent campaigns</h2>
      <div className="space-y-4 mb-8">
        {campaigns.length === 0 && <p className="text-sm text-neutral-500">No campaigns yet.</p>}
        {campaigns.map((c) => (
          <div key={c.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="font-medium">{c.title}</p>
            <p className="text-[11px] text-neutral-400 mb-3">{new Date(c.createdAt).toLocaleString()}</p>
            <div className="space-y-2">
              {c.creatives.map((cr) => (
                <div key={cr.id} className="rounded-xl bg-neutral-50 p-3">
                  <p className="text-sm font-medium">{cr.headline}</p>
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{cr.imageIntent}</p>
                  {cr.imagePrompt?.prompt && (
                    <p className="text-[11px] font-mono text-neutral-400 mt-2 line-clamp-3">
                      {cr.imagePrompt.prompt}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <h2 className="font-display font-semibold mb-3">Credit ledger</h2>
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-neutral-500 border-b">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Balance</th>
            </tr>
          </thead>
          <tbody>
            {ledger.map((row) => (
              <tr key={row.id} className="border-t border-neutral-100">
                <td className="px-4 py-2 text-xs whitespace-nowrap">
                  {new Date(row.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-2 text-xs">{row.reason}</td>
                <td className={`px-4 py-2 font-mono ${row.amount < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {row.amount > 0 ? '+' : ''}
                  {row.amount}
                </td>
                <td className="px-4 py-2 font-mono">{row.balanceAfter}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
