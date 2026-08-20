'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { api } from '~/trpc/react';

export default function AdminSchedulerPage() {
  const { data, isLoading } = api.admin.schedulerHealth.useQuery();

  if (isLoading || !data) {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading scheduler…
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-1">Scheduler</h1>
      <p className="text-sm text-neutral-500 mb-8">Post queue health across all users.</p>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Stat label="Scheduled" value={data.scheduled} />
        <Stat label="Published" value={data.published} />
        <Stat label="Failed" value={data.failed} />
      </div>

      <h2 className="font-display font-semibold mb-3">Recent failures</h2>
      {data.failedRows.length === 0 ? (
        <p className="text-sm text-neutral-500">No failed posts.</p>
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-neutral-500 border-b">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">Error</th>
                <th className="px-4 py-3">User</th>
              </tr>
            </thead>
            <tbody>
              {data.failedRows.map((row) => (
                <tr key={row.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3 whitespace-nowrap text-xs">
                    {new Date(row.scheduledAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{row.platform}</td>
                  <td className="px-4 py-3 text-xs text-red-600 max-w-md">
                    {row.errorMessage ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${row.userId}`} className="underline text-xs">
                      Open user
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <p className="text-3xl font-display font-bold">{value}</p>
      <p className="text-sm text-neutral-500 mt-1">{label}</p>
    </div>
  );
}
