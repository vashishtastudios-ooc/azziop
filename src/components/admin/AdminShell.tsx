'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, Shield, Users, Cpu, ArrowLeft, Coins, ToggleLeft, FileText, CalendarClock } from 'lucide-react';
import { api } from '~/trpc/react';
import { AzziopLogo } from '~/components/branding/AzziopLogo';

const NAV = [
  { href: '/admin', label: 'Overview', icon: Shield, exact: true },
  { href: '/admin/models', label: 'Models', icon: Cpu },
  { href: '/admin/billing', label: 'Billing', icon: Coins },
  { href: '/admin/flags', label: 'Flags', icon: ToggleLeft },
  { href: '/admin/prompts', label: 'Prompts', icon: FileText },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/scheduler', label: 'Scheduler', icon: CalendarClock },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();
  const me = api.user.me.useQuery(undefined, {
    enabled: status === 'authenticated',
    retry: false,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/admin');
    }
  }, [status, router]);

  if (status === 'loading' || (status === 'authenticated' && me.isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#FAD400]" />
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  if (me.isError || !me.data?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="max-w-md text-center rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <Shield className="w-8 h-8 mx-auto mb-3 text-neutral-400" />
          <h1 className="font-display font-bold text-neutral-900 text-xl mb-2">Admin only</h1>
          <p className="text-sm text-neutral-600 font-light mb-6">
            Your account does not have admin access. Add your email to{' '}
            <code className="font-mono text-xs bg-neutral-100 px-1 py-0.5 rounded">ADMIN_EMAILS</code> in
            .env, or have an existing admin promote you.
          </p>
          <Link href="/projects" className="text-sm font-semibold text-neutral-900 underline underline-offset-4">
            Back to workspace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-body font-light">
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AzziopLogo size={28} showWordmark={false} />
            <div>
              <p className="text-sm font-display font-bold leading-none">Admin</p>
              <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 mt-0.5">
                Azziop
              </p>
            </div>
          </div>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Workspace
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <nav className="flex flex-wrap gap-2 mb-8">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-colors',
                  active
                    ? 'bg-[#FAD400]/20 border-[#FAD400]/50 text-neutral-900'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300',
                ].join(' ')}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        {children}
      </div>
    </div>
  );
}
