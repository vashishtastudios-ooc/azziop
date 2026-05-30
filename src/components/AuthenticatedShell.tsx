'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useRef, useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { FolderOpen, Dna, Target, LogOut, ChevronDown, Sparkles, Menu, X, CalendarClock, CreditCard, Coins } from 'lucide-react';
import { usePipelineStore } from '@/store/pipeline';
import type { WebsiteData } from '@/types';
import { api } from '~/trpc/react';
import { UserAvatar } from '~/components/UserAvatar';

function resolveWorkspaceBrandName(
  websiteData: Pick<WebsiteData, 'brandName' | 'title'> | null | undefined,
  projectUrl?: string | null,
): string | null {
  const brand = websiteData?.brandName?.trim();
  if (brand) return brand;
  const title = websiteData?.title?.trim();
  if (title) return title;
  if (projectUrl) {
    try {
      const u = new URL(projectUrl.startsWith('http') ? projectUrl : `https://${projectUrl}`);
      const host = u.hostname.replace(/^www\./i, '');
      if (host) return host;
    } catch {
      /* ignore */
    }
  }
  return null;
}

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

function normalizePath(path: string) {
  return path.replace(/\/+$/, '') || '/';
}

export function AuthenticatedShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();

  const { data: profile } = api.user.me.useQuery(undefined, {
    enabled: status === 'authenticated',
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const projectId = searchParams.get('projectId');
  const storeProjectId = usePipelineStore((s) => s.projectId);
  const storeWebsiteData = usePipelineStore((s) => s.websiteData);

  const { data: projectDetails } = api.project.getDetails.useQuery(
    { projectId: projectId! },
    {
      enabled: Boolean(projectId),
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  );

  const workspaceBrandLine = useMemo(() => {
    if (!projectId) return null;
    if (storeProjectId === projectId && storeWebsiteData) {
      const fromStore = resolveWorkspaceBrandName(storeWebsiteData, storeWebsiteData.url);
      if (fromStore) return fromStore;
    }
    if (projectDetails) {
      const wd = projectDetails.websiteData as WebsiteData | null | undefined;
      return resolveWorkspaceBrandName(wd, projectDetails.url);
    }
    return null;
  }, [projectId, storeProjectId, storeWebsiteData, projectDetails]);

  const items: NavItem[] = useMemo(
    () => [
      { label: 'Projects', href: '/projects', icon: FolderOpen },
      { label: 'Brand DNA', href: projectId ? `/brand-dna?projectId=${projectId}` : '/brand-dna', icon: Dna },
      { label: 'Campaigns', href: projectId ? `/campaigns?projectId=${projectId}` : '/campaigns', icon: Target },
      {
        label: 'Schedule',
        href: projectId ? `/schedule?projectId=${projectId}` : '/schedule',
        icon: CalendarClock,
      },
      { label: 'Pricing', href: '/pricing', icon: CreditCard },
    ],
    [projectId],
  );

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const userName = profile?.name ?? session?.user?.name ?? 'User';
  const userSecondary =
    profile?.email ?? session?.user?.email ?? session?.user?.mobile ?? '';
  const avatarUrl =
    profile?.avatarUrl ?? session?.user?.image ?? null;

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut({ redirect: false });
    router.push('/');
    router.refresh();
  };

  const Sidebar = (
    <aside className="h-full bg-surface-900/80 backdrop-blur-xl border-r border-surface-800/60">
      <div className="h-16 px-4 border-b border-surface-800/60 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white text-sm font-semibold leading-none truncate" title={workspaceBrandLine ?? 'Azziop'}>
            {workspaceBrandLine ?? 'Azziop'}
          </p>
          <p className="text-surface-500 text-[11px] mt-1">Workspace</p>
        </div>
      </div>

      <nav className="p-3 space-y-1.5">
        {items.map(({ label, href, icon: Icon }) => {
          const active =
            normalizePath(pathname) === normalizePath(href.split('?')[0] || href);
          return (
            <Link
              key={label}
              href={href}
              onClick={() => setMobileSidebarOpen(false)}
              className={[
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200',
                active
                  ? 'bg-indigo-500/15 border-indigo-500/35 text-white shadow-lg shadow-indigo-500/10'
                  : 'bg-transparent border-transparent text-surface-400 hover:text-white hover:bg-surface-800/60 hover:border-surface-700',
              ].join(' ')}
            >
              <Icon className={['w-4 h-4', active ? 'text-indigo-300' : 'text-surface-500 group-hover:text-surface-300'].join(' ')} />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          );
        })}
        <div className="px-3 pt-2 mt-2 border-t border-surface-800/60">
          <Link
            href={projectId ? `/schedule?projectId=${projectId}` : '/schedule'}
            onClick={() => setMobileSidebarOpen(false)}
            className="flex w-full items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-pink-600/90 to-violet-600/90 hover:from-pink-500 hover:to-violet-500 border border-white/10 shadow-lg shadow-violet-500/10 transition-all"
          >
            <CalendarClock className="w-4 h-4 shrink-0" />
            Schedule Instagram post
          </Link>
          {!projectId && (
            <p className="text-[10px] text-surface-500 mt-2 px-1 text-center leading-snug">
              Select a project to attach your workspace
            </p>
          )}
        </div>
      </nav>
    </aside>
  );

  return (
    <div className="min-h-screen bg-surface-950">
      <header className="fixed top-0 left-0 right-0 h-16 z-40 border-b border-surface-800/60 bg-surface-900/75 backdrop-blur-xl">
        <div className="h-full px-4 lg:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800/70"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <p className="text-surface-300 text-sm hidden sm:block truncate max-w-[260px]">
              {workspaceBrandLine ? `${workspaceBrandLine} workspace` : 'Logged-in Workspace'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/credits"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-200 bg-amber-500/15 border border-amber-400/30 hover:bg-amber-500/25 transition-colors"
              title="View credit activity"
            >
              <Coins className="w-3.5 h-3.5" />
              {typeof profile?.creditBalance === 'number'
                ? profile.creditBalance.toLocaleString()
                : '—'}
              <span className="hidden sm:inline">credits</span>
            </Link>

            <Link
              href="/pricing"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-200 bg-indigo-500/15 border border-indigo-400/30 hover:bg-indigo-500/25 transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Upgrade
            </Link>

            <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="group flex items-center gap-2 px-2.5 py-2 rounded-2xl border border-surface-700/70 bg-surface-800/60 hover:bg-surface-800/85 hover:border-surface-600 transition-all shadow-sm hover:shadow-lg hover:shadow-black/20"
              aria-label="Open account menu"
            >
              <UserAvatar name={userName} avatarUrl={avatarUrl} />
              <ChevronDown className={['w-4 h-4 text-surface-500 group-hover:text-surface-300 transition-transform', menuOpen ? 'rotate-180' : ''].join(' ')} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.14 }}
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-surface-700/60 bg-surface-800/95 backdrop-blur-xl shadow-xl shadow-black/30 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-surface-700/60">
                    <p className="text-sm font-medium text-white truncate">{userName}</p>
                    <p className="text-xs text-surface-400 truncate mt-1">{userSecondary || 'Signed in'}</p>
                  </div>

                  <Link
                    href="/pricing"
                    onClick={() => setMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-300 hover:text-white hover:bg-surface-700/50 transition-colors border-b border-surface-700/40"
                  >
                    <CreditCard className="w-4 h-4" />
                    Pricing & Billing
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <div className="hidden lg:block fixed top-16 left-0 bottom-0 w-64 z-30">{Sidebar}</div>

      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/55 z-40"
              aria-label="Close navigation backdrop"
            />
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 25, stiffness: 260 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 w-72 z-50"
            >
              <div className="absolute right-3 top-3 z-10">
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-2 rounded-lg text-surface-300 hover:text-white bg-surface-800/80"
                  aria-label="Close navigation"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {Sidebar}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="pt-16 lg:pl-64">{children}</main>
    </div>
  );
}
