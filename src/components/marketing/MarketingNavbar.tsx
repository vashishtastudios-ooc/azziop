'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Menu, X, LogOut, User, ChevronDown } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '~/trpc/react';
import { UserAvatar } from '~/components/UserAvatar';

const navLinks = [
  { label: 'About', href: '/about' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'FAQ', href: '/faq' },
];

function NavLink({
  href,
  label,
  active,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`marketing-nav-link relative px-3 py-2 text-sm font-light transition-colors ${
        active ? 'text-neutral-900' : 'text-neutral-600 hover:text-neutral-900'
      }`}
    >
      {label}
    </button>
  );
}

export function MarketingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const { data: profile } = api.user.me.useQuery(undefined, {
    enabled: status === 'authenticated',
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setScrolled(!entry?.isIntersecting),
      { threshold: 0, rootMargin: '-1px 0px 0px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isLoggedIn = status === 'authenticated' && session?.user;
  const userName = profile?.name ?? session?.user?.name ?? 'User';
  const avatarUrl = profile?.avatarUrl ?? session?.user?.image ?? null;
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleNav = (href: string) => {
    router.push(href);
    setMobileOpen(false);
  };

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await signOut({ redirect: false });
    router.push('/');
    router.refresh();
  };

  return (
    <>
      <div ref={sentinelRef} className="absolute top-0 h-px w-full pointer-events-none" aria-hidden />
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-[border-color,box-shadow] duration-300 ${
          scrolled
            ? 'border-b border-neutral-200/90 shadow-sm shadow-neutral-900/5'
            : 'border-b border-transparent'
        }`}
        style={{
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          backgroundColor: 'rgba(255, 255, 255, 0.82)',
        }}
      >
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              type="button"
              onClick={() => handleNav('/')}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#FAD400] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4 text-neutral-900" />
              </div>
              <span className="font-display font-bold text-neutral-900 text-lg hidden sm:block">
                Azziop
              </span>
              <motion.span
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2.2, repeat: Infinity }}
                className="hidden sm:inline-flex px-2 py-0.5 rounded-md bg-neutral-900 text-[#FAD400] text-[10px] font-mono font-bold tracking-wider"
              >
                BETA
              </motion.span>
            </button>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ label, href }) => (
                <NavLink
                  key={href}
                  href={href}
                  label={label}
                  active={pathname === href}
                  onClick={() => handleNav(href)}
                />
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              {isLoggedIn ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-neutral-100 transition-colors"
                  >
                    {avatarUrl ? (
                      <UserAvatar name={userName} avatarUrl={avatarUrl} className="w-8 h-8" rounded="full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-neutral-900 text-[#FAD400] text-xs font-bold flex items-center justify-center">
                        {userInitials}
                      </div>
                    )}
                    <span className="text-sm font-medium text-neutral-700 max-w-[100px] truncate">{userName}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-neutral-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute right-0 mt-2 w-52 rounded-xl bg-white border border-neutral-200 shadow-xl py-1"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            router.push('/dashboard');
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50"
                        >
                          <User className="w-4 h-4" />
                          Dashboard
                        </button>
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => router.push('/login')}
                    className="px-4 py-2 text-sm font-light text-neutral-600 hover:text-neutral-900"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/register')}
                    className="px-5 py-2.5 text-sm font-display font-semibold rounded-xl bg-[#FAD400] text-neutral-900 marketing-cta-glow hover:-translate-y-0.5 transition-transform"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-neutral-100 bg-white/95 backdrop-blur-xl"
            >
              <div className="px-4 py-4 space-y-1">
                {navLinks.map(({ label, href }) => (
                  <button
                    key={href}
                    type="button"
                    onClick={() => handleNav(href)}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    {label}
                  </button>
                ))}
                {!isLoggedIn && (
                  <div className="pt-3 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        router.push('/login');
                      }}
                      className="w-full py-3 text-sm font-medium text-neutral-600"
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        router.push('/register');
                      }}
                      className="w-full py-3 rounded-xl bg-[#FAD400] text-neutral-900 font-display font-semibold marketing-cta-glow"
                    >
                      Get Started
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
