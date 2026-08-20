'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Search } from 'lucide-react';
import { api } from '~/trpc/react';

export default function AdminUsersPage() {
  const utils = api.useUtils();
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [skip, setSkip] = useState(0);
  const take = 25;

  const { data, isLoading } = api.admin.listUsers.useQuery({
    query: submitted || undefined,
    skip,
    take,
  });
  const { data: plans } = api.admin.planOptions.useQuery();

  const grant = api.admin.grantCredits.useMutation({
    onSuccess: () => utils.admin.listUsers.invalidate(),
  });
  const deduct = api.admin.deductCredits.useMutation({
    onSuccess: () => utils.admin.listUsers.invalidate(),
  });
  const setPlan = api.admin.setPlan.useMutation({
    onSuccess: () => utils.admin.listUsers.invalidate(),
  });
  const setRole = api.admin.setRole.useMutation({
    onSuccess: () => utils.admin.listUsers.invalidate(),
  });

  const [amounts, setAmounts] = useState<Record<string, string>>({});

  const busy = grant.isPending || deduct.isPending || setPlan.isPending || setRole.isPending;
  const error =
    grant.error?.message ||
    deduct.error?.message ||
    setPlan.error?.message ||
    setRole.error?.message;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-neutral-900 mb-1">Users</h1>
      <p className="text-sm text-neutral-500 mb-6">Search, grant credits, and change plans.</p>

      <form
        className="flex gap-2 mb-6"
        onSubmit={(e) => {
          e.preventDefault();
          setSkip(0);
          setSubmitted(query.trim());
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            className="app-input pl-10"
            placeholder="Search email, name, or mobile"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button type="submit" className="px-4 py-2 rounded-xl bg-[#FAD400] text-sm font-semibold">
          Search
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {isLoading || !data ? (
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading users…
        </div>
      ) : (
        <>
          <p className="text-xs text-neutral-500 mb-3">{data.total} accounts</p>
          <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-100">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Credits</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.id} className="border-t border-neutral-100 align-top">
                    <td className="px-4 py-3">
                      <Link href={`/admin/users/${u.id}`} className="font-medium text-neutral-900 hover:underline">
                        {u.name}
                      </Link>
                      <p className="text-xs text-neutral-500">{u.email ?? '—'}</p>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        {u.isAdmin ? 'Admin' : 'User'}
                        {u.mobile && !u.mobile.startsWith('google:') ? ` · ${u.mobile}` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="app-input py-1.5 text-xs"
                        value={u.planId}
                        disabled={busy}
                        onChange={(e) =>
                          setPlan.mutate({
                            userId: u.id,
                            planId: e.target.value as 'free' | 'starter' | 'pro' | 'agency',
                          })
                        }
                      >
                        {(plans ?? [{ id: u.planId, name: u.planId }]).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 font-mono">{u.creditBalance.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          className="app-input py-1.5 w-24 text-xs"
                          type="number"
                          min={1}
                          placeholder="amount"
                          value={amounts[u.id] ?? ''}
                          onChange={(e) =>
                            setAmounts((prev) => ({ ...prev, [u.id]: e.target.value }))
                          }
                        />
                        <button
                          type="button"
                          disabled={busy || !Number(amounts[u.id])}
                          onClick={() =>
                            grant.mutate({
                              userId: u.id,
                              amount: Number(amounts[u.id]),
                            })
                          }
                          className="px-2 py-1 rounded-lg text-xs font-semibold bg-[#FAD400]"
                        >
                          Grant
                        </button>
                        <button
                          type="button"
                          disabled={busy || !Number(amounts[u.id])}
                          onClick={() =>
                            deduct.mutate({
                              userId: u.id,
                              amount: Number(amounts[u.id]),
                            })
                          }
                          className="px-2 py-1 rounded-lg text-xs font-semibold border border-neutral-200"
                        >
                          Deduct
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            setRole.mutate({
                              userId: u.id,
                              role: u.isAdmin ? 'user' : 'admin',
                            })
                          }
                          className="px-2 py-1 rounded-lg text-xs font-semibold border border-neutral-200"
                        >
                          {u.isAdmin ? 'Remove admin' : 'Make admin'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 text-sm">
            <button
              type="button"
              disabled={skip === 0}
              onClick={() => setSkip(Math.max(0, skip - take))}
              className="text-neutral-600 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-neutral-400 text-xs">
              {skip + 1}–{Math.min(skip + take, data.total)} of {data.total}
            </span>
            <button
              type="button"
              disabled={skip + take >= data.total}
              onClick={() => setSkip(skip + take)}
              className="text-neutral-600 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
