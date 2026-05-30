'use client';

import { useState, useRef, useEffect } from 'react';
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

export function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const { data: session, status } = useSession();

    const { data: profile } = api.user.me.useQuery(undefined, {
        enabled: status === 'authenticated',
        staleTime: 60_000,
        refetchOnWindowFocus: false,
    });
    const router = useRouter();
    const pathname = usePathname();

    const isHomeLike = ['/', '/about', '/faq', '/pricing', '/privacy', '/terms'].includes(pathname);

    // Close user menu on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Hide on pipeline pages — they have their own Navigation breadcrumb
    if (!isHomeLike) return null;

    const handleNav = (href: string) => {
        router.push(href);
        setMobileOpen(false);
    };

    const isLoggedIn = status === 'authenticated' && session?.user;
    const userName = profile?.name ?? session?.user?.name ?? 'User';
    const avatarUrl = profile?.avatarUrl ?? session?.user?.image ?? null;
    const userInitials = userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const handleSignOut = async () => {
        setUserMenuOpen(false);
        await signOut({ redirect: false });
        router.push('/');
        router.refresh();
    };

    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed top-0 left-0 right-0 z-50"
        >
            <div className="mx-auto max-w-7xl px-4 lg:px-8">
                <div className="flex items-center justify-between h-16 rounded-b-2xl bg-surface-900/60 backdrop-blur-xl border border-surface-800/50 border-t-0 px-6">

                    {/* Logo */}
                    <button
                        onClick={() => handleNav('/')}
                        className="flex items-center gap-2.5 group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-display font-semibold text-white text-lg hidden sm:block">
                            Azziop
                        </span>
                    </button>

                    {/* Desktop Nav Links */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map(({ label, href }) => (
                            <button
                                key={href}
                                onClick={() => handleNav(href)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${pathname === href
                                    ? 'text-white bg-surface-800/80'
                                    : 'text-surface-400 hover:text-white hover:bg-surface-800/50'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </nav>

                    {/* Desktop Right — Auth Area */}
                    <div className="hidden md:flex items-center gap-3">
                        {isLoggedIn ? (
                            <div className="relative" ref={userMenuRef}>
                                {/* User Button */}
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-surface-800/50 transition-all duration-200 group"
                                >
                                    {avatarUrl ? (
                                        <UserAvatar
                                            name={userName}
                                            avatarUrl={avatarUrl}
                                            className="w-8 h-8"
                                            rounded="full"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-indigo-500/25">
                                            {userInitials}
                                        </div>
                                    )}
                                    <span className="text-sm font-medium text-surface-200 max-w-[120px] truncate">
                                        {userName}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-surface-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                <AnimatePresence>
                                    {userMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 mt-2 w-56 rounded-xl bg-surface-800/95 backdrop-blur-xl border border-surface-700/50 shadow-xl shadow-black/30 overflow-hidden"
                                        >
                                            {/* User Info */}
                                            <div className="px-4 py-3 border-b border-surface-700/50">
                                                <p className="text-sm font-medium text-white truncate">{userName}</p>
                                                <p className="text-xs text-surface-400 truncate mt-0.5">
                                                    {session?.user?.email || session?.user?.mobile || ''}
                                                </p>
                                            </div>

                                            {/* Menu Items */}
                                            <div className="py-1.5">
                                                <button
                                                    onClick={() => {
                                                        setUserMenuOpen(false);
                                                        // Profile page placeholder
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-300 hover:text-white hover:bg-surface-700/50 transition-colors"
                                                >
                                                    <User className="w-4 h-4" />
                                                    My Profile
                                                </button>
                                                <button
                                                    onClick={handleSignOut}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    Sign Out
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => router.push('/login')}
                                    className="px-4 py-2 text-surface-300 hover:text-white text-sm font-medium rounded-lg transition-all duration-200 hover:bg-surface-800/50"
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={() => router.push('/register')}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-indigo-600/25"
                                >
                                    Get Started
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden p-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800/50 transition-colors"
                    >
                        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden mx-4 overflow-hidden"
                    >
                        <div className="bg-surface-900/90 backdrop-blur-xl border border-surface-800/50 border-t-0 rounded-b-2xl p-4 space-y-2">
                            {navLinks.map(({ label, href }) => (
                                <button
                                    key={href}
                                    onClick={() => handleNav(href)}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${pathname === href
                                        ? 'text-white bg-surface-800'
                                        : 'text-surface-400 hover:text-white hover:bg-surface-800/50'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}

                            {/* Mobile Auth */}
                            <div className="border-t border-surface-800/50 pt-3 mt-2">
                                {isLoggedIn ? (
                                    <div className="space-y-2">
                                        {/* User info */}
                                        <div className="flex items-center gap-3 px-4 py-2">
                                            {avatarUrl ? (
                                                <UserAvatar
                                                    name={userName}
                                                    avatarUrl={avatarUrl}
                                                    className="w-9 h-9"
                                                    rounded="full"
                                                />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                                                    {userInitials}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{userName}</p>
                                                <p className="text-xs text-surface-400 truncate">
                                                    {session?.user?.email || session?.user?.mobile || ''}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-xl transition-all duration-200"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => { setMobileOpen(false); router.push('/login'); }}
                                            className="w-full px-4 py-3 text-surface-300 hover:text-white text-sm font-medium rounded-xl transition-all hover:bg-surface-800/50"
                                        >
                                            Sign In
                                        </button>
                                        <button
                                            onClick={() => { setMobileOpen(false); router.push('/register'); }}
                                            className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all duration-200"
                                        >
                                            Get Started
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
}
