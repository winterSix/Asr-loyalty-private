'use client';

import { useAuthStore } from '@/store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { disputeService } from '@/services/dispute.service';
import { refundService } from '@/services/refund.service';
import {
    FiBarChart, FiBell, FiChevronDown, FiChevronLeft, FiChevronRight,
    FiCreditCard, FiDollarSign, FiFileText, FiGift, FiHome, FiKey,
    FiArrowRight, FiLayers, FiLogOut, FiMenu, FiMoon, FiMonitor, FiQrCode, FiSearch,
    FiSettings, FiShield, FiStar, FiSun, FiUser, FiUsers, FiWallet, FiX,
} from '@/utils/icons';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { adminService } from '@/services/admin.service';

interface NavItem  { label: string; icon: React.ReactNode; path: string; badge?: number; }
interface NavSection { title: string; items: NavItem[]; }
interface Tip { label: string; top: number; left: number; }

const W  = 240;
const WC = 72;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [mobileOpen,    setMobileOpen]    = useState(false);
    const [collapsed,     setCollapsed]     = useState(false);
    const [userMenu,      setUserMenu]      = useState(false);
    const [themeMenu,     setThemeMenu]     = useState(false);
    const [tip,           setTip]           = useState<Tip | null>(null);
    const [suspended,     setSuspended]     = useState(false);
    const [loggingOut,    setLoggingOut]    = useState(false);
    const [mounted,       setMounted]       = useState(false);
    const [searchOpen,    setSearchOpen]    = useState(false);
    const [searchQuery,   setSearchQuery]   = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchIndex,   setSearchIndex]   = useState(0);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const router   = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const { theme, setTheme } = useTheme();
    const role    = user?.role || 'CUSTOMER';
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

    const navRef      = useRef<HTMLElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const themeRef    = useRef<HTMLDivElement>(null);

    useEffect(() => { setMounted(true); }, []);
    // ── Global Search ──────────────────────────────────────────────
    const NAV_SHORTCUTS = [
        { label: 'Dashboard',       path: '/dashboard',                  icon: 'home' },
        { label: 'Users',           path: '/dashboard/users',            icon: 'users' },
        { label: 'Transactions',    path: '/dashboard/transactions',     icon: 'credit' },
        { label: 'Wallets',         path: '/dashboard/wallets',          icon: 'wallet' },
        { label: 'Reports',         path: '/dashboard/reports',          icon: 'chart' },
        { label: 'Disputes',        path: '/dashboard/disputes',         icon: 'shield' },
        { label: 'Refunds',         path: '/dashboard/refunds',          icon: 'dollar' },
        { label: 'Rewards',         path: '/dashboard/rewards',          icon: 'gift' },
        { label: 'Audit Logs',      path: '/dashboard/audit',            icon: 'file' },
        { label: 'Settings',        path: '/dashboard/settings',         icon: 'settings' },
        { label: 'Notifications',   path: '/dashboard/notifications',    icon: 'bell' },
        { label: 'Roles',           path: '/dashboard/roles',            icon: 'layers' },
        { label: 'Permissions',     path: '/dashboard/permissions',      icon: 'key' },
        { label: 'Profile',         path: '/dashboard/profile',          icon: 'user' },
    ];

    // Ctrl+K / Cmd+K to open search
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(true);
            }
            if (e.key === 'Escape') setSearchOpen(false);
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    // Focus input when modal opens
    useEffect(() => {
        if (searchOpen) {
            setSearchQuery('');
            setSearchResults([]);
            setSearchIndex(0);
            setTimeout(() => searchInputRef.current?.focus(), 50);
        }
    }, [searchOpen]);

    // Debounced user search
    useEffect(() => {
        if (!searchQuery.trim() || searchQuery.length < 2) { setSearchResults([]); return; }
        const t = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const res = await adminService.getUsers({ search: searchQuery.trim(), limit: 6, page: 1 });
                setSearchResults(res.data || []);
            } catch { setSearchResults([]); }
            finally { setSearchLoading(false); }
        }, 300);
        return () => clearTimeout(t);
    }, [searchQuery]);

    const filteredShortcuts = searchQuery.trim()
        ? NAV_SHORTCUTS.filter(s => s.label.toLowerCase().includes(searchQuery.toLowerCase()))
        : NAV_SHORTCUTS;

    const handleSearchNavigate = (path: string) => {
        router.push(path);
        setSearchOpen(false);
        setSearchQuery('');
    };

    const allSearchItems = [
        ...filteredShortcuts.map(s => ({ type: 'nav', ...s })),
        ...searchResults.map(u => ({ type: 'user', label: `${u.firstName} ${u.lastName}`, sub: u.email, path: `/dashboard/users/${u.id}` })),
    ];

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSearchIndex(i => Math.min(i + 1, allSearchItems.length - 1)); }
        if (e.key === 'ArrowUp')   { e.preventDefault(); setSearchIndex(i => Math.max(i - 1, 0)); }
        if (e.key === 'Enter' && allSearchItems[searchIndex]) handleSearchNavigate(allSearchItems[searchIndex].path);
    };


    const { data: dDisputes } = useQuery({
        queryKey: ['disputes', 'pending-count'],
        queryFn:  () => disputeService.getDisputes({ status: 'OPEN', page: 1, limit: 1 }),
        enabled: isAdmin, staleTime: 60000, retry: 1,
    });
    const { data: dRefunds } = useQuery({
        queryKey: ['refunds', 'pending-count'],
        queryFn:  () => refundService.getRefunds({ status: 'PENDING', page: 1, limit: 1 }),
        enabled: isAdmin, staleTime: 60000, retry: 1,
    });
    const dCount = dDisputes?.total ?? 0;
    const rCount = dRefunds?.total  ?? 0;

    // Close menus on outside click
    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenu(false);
            if (themeRef.current    && !themeRef.current.contains(e.target as Node))    setThemeMenu(false);
        };
        if (userMenu || themeMenu) document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [userMenu, themeMenu]);

    // Restore sidebar scroll
    useEffect(() => {
        const s = sessionStorage.getItem('sidebarScroll');
        if (s && navRef.current) navRef.current.scrollTop = +s;
    }, [pathname]);
    useEffect(() => {
        const el = navRef.current;
        if (!el) return;
        const fn = () => sessionStorage.setItem('sidebarScroll', String(el.scrollTop));
        el.addEventListener('scroll', fn, { passive: true });
        return () => el.removeEventListener('scroll', fn);
    }, []);

    // Persist collapse
    useEffect(() => {
        const s = localStorage.getItem('sidebarCollapsed');
        if (s !== null) setCollapsed(JSON.parse(s));
    }, []);
    useEffect(() => { localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed)); }, [collapsed]);

    const handleLogout = async () => { setLoggingOut(true); setUserMenu(false); await logout(); router.push('/login'); };
    useEffect(() => { if (user?.status === 'SUSPENDED') setSuspended(true); }, [user?.status]);
    const handleSuspendedLogout = async () => { setSuspended(false); setLoggingOut(true); await logout(); router.push('/login'); };

    const showTip = useCallback((e: React.MouseEvent<HTMLElement>, label: string) => {
        const r = e.currentTarget.getBoundingClientRect();
        setTip({ label, top: r.top + r.height / 2, left: r.right + 12 });
    }, []);
    const hideTip = useCallback(() => setTip(null), []);

    const getSections = (): NavSection[] => {
        switch (role) {
            case 'CUSTOMER': return [
                { title: 'Main', items: [
                    { label: 'Dashboard',    icon: <FiHome />,       path: '/dashboard' },
                    { label: 'Wallet',       icon: <FiWallet />,     path: '/dashboard/wallet' },
                    { label: 'Transactions', icon: <FiCreditCard />, path: '/dashboard/transactions' },
                ]},
                { title: 'Rewards', items: [
                    { label: 'Rewards', icon: <FiGift />,   path: '/dashboard/rewards' },
                    { label: 'Loyalty', icon: <FiStar />,   path: '/dashboard/loyalty' },
                    { label: 'QR Pay',  icon: <FiQrCode />, path: '/dashboard/qr-pay' },
                ]},
            ];
            case 'ADMIN':
            case 'SUPER_ADMIN': return [
                { title: 'Overview', items: [
                    { label: 'Dashboard',  icon: <FiHome />,     path: '/dashboard' },
                    { label: 'Reports',    icon: <FiBarChart />, path: '/dashboard/reports' },
                    { label: 'Audit Logs', icon: <FiFileText />, path: '/dashboard/audit' },
                ]},
                { title: 'Management', items: [
                    { label: 'Users',        icon: <FiUsers />,      path: '/dashboard/users' },
                    { label: 'Transactions', icon: <FiCreditCard />, path: '/dashboard/transactions' },
                    { label: 'Wallets',      icon: <FiWallet />,     path: '/dashboard/wallets' },
                    { label: 'Roles',        icon: <FiLayers />,     path: '/dashboard/roles' },
                    { label: 'Permissions',  icon: <FiKey />,        path: '/dashboard/permissions' },
                ]},
                { title: 'Loyalty & Rewards', items: [
                    { label: 'Rewards', icon: <FiGift />, path: '/dashboard/rewards' },
                ]},
                { title: 'Support', items: [
                    { label: 'Disputes',      icon: <FiShield />,    path: '/dashboard/disputes',      badge: dCount > 0 ? dCount : undefined },
                    { label: 'Refunds',       icon: <FiDollarSign />,path: '/dashboard/refunds',       badge: rCount > 0 ? rCount : undefined },
                    { label: 'Notifications', icon: <FiBell />,      path: '/dashboard/notifications' },
                ]},
            ];
            case 'CASHIER': return [{ title: 'Main', items: [
                { label: 'Dashboard',    icon: <FiHome />,       path: '/dashboard' },
                { label: 'QR Scanner',  icon: <FiQrCode />,     path: '/dashboard/qr-scanner' },
                { label: 'Transactions',icon: <FiCreditCard />, path: '/dashboard/transactions' },
            ]}];
            case 'FINANCE_MANAGER': return [
                { title: 'Overview', items: [
                    { label: 'Dashboard', icon: <FiHome />,     path: '/dashboard' },
                    { label: 'Reports',   icon: <FiBarChart />, path: '/dashboard/reports' },
                ]},
                { title: 'Finance', items: [
                    { label: 'Transactions', icon: <FiCreditCard />, path: '/dashboard/transactions' },
                    { label: 'Wallets',      icon: <FiWallet />,     path: '/dashboard/wallets' },
                    { label: 'Rewards',      icon: <FiGift />,       path: '/dashboard/rewards' },
                ]},
                { title: 'Support', items: [
                    { label: 'Disputes', icon: <FiShield />,    path: '/dashboard/disputes', badge: dCount > 0 ? dCount : undefined },
                    { label: 'Refunds',  icon: <FiDollarSign />,path: '/dashboard/refunds',  badge: rCount > 0 ? rCount : undefined },
                ]},
            ];
            case 'LOYALTY_MANAGER': return [
                { title: 'Overview', items: [
                    { label: 'Dashboard', icon: <FiHome />,     path: '/dashboard' },
                    { label: 'Reports',   icon: <FiBarChart />, path: '/dashboard/reports' },
                ]},
                { title: 'Loyalty', items: [
                    { label: 'Users',         icon: <FiUsers />,    path: '/dashboard/users' },
                    { label: 'Loyalty Tiers', icon: <FiStar />,     path: '/dashboard/loyalty-tiers' },
                    { label: 'Rewards',       icon: <FiGift />,     path: '/dashboard/rewards' },
                    { label: 'Reward Config', icon: <FiSettings />, path: '/dashboard/reward-config' },
                ]},
            ];
            case 'CUSTOMER_SUPPORT': return [
                { title: 'Main', items: [
                    { label: 'Dashboard',    icon: <FiHome />,       path: '/dashboard' },
                    { label: 'Users',        icon: <FiUsers />,      path: '/dashboard/users' },
                    { label: 'Transactions', icon: <FiCreditCard />, path: '/dashboard/transactions' },
                ]},
                { title: 'Support', items: [
                    { label: 'Disputes', icon: <FiShield />,    path: '/dashboard/disputes', badge: dCount > 0 ? dCount : undefined },
                    { label: 'Refunds',  icon: <FiDollarSign />,path: '/dashboard/refunds',  badge: rCount > 0 ? rCount : undefined },
                ]},
            ];
            default: return [{ title: 'Main', items: [{ label: 'Dashboard', icon: <FiHome />, path: '/dashboard' }] }];
        }
    };

    const sections   = getSections();
    const allItems   = sections.flatMap(s => s.items);
    const isActive   = (p: string) => !pathname ? false : p === '/dashboard' ? pathname === '/dashboard' : pathname === p || pathname.startsWith(p + '/');
    const pageLabel  = allItems.find(i => isActive(i.path))?.label || 'Dashboard';
    const isColl     = collapsed && !mobileOpen;
    const initials   = () => ((user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')).toUpperCase() || 'U';

    const ThemeIcon = () => {
        if (!mounted)            return <FiSun     className="w-[18px] h-[18px] text-gray-400" />;
        if (theme === 'dark')    return <FiSun     className="w-[18px] h-[18px] text-amber-400" />;
        if (theme === 'light')   return <FiMoon    className="w-[18px] h-[18px] text-gray-500 dark:text-[#94A3B8]" />;
        return                          <FiMonitor className="w-[18px] h-[18px] text-gray-500 dark:text-[#94A3B8]" />;
    };

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-[#0F172A] transition-colors duration-300">

            {/* Mobile backdrop */}
            {mobileOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

            {/* Tooltip */}
            {isColl && tip && (
                <div className="fixed pointer-events-none z-[9999] px-3 py-1.5 bg-[#263349] text-[#F1F5F9] text-xs font-medium rounded-lg shadow-xl whitespace-nowrap border border-white/10"
                    style={{ top: tip.top, left: tip.left, transform: 'translateY(-50%)' }}>
                    {tip.label}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[5px] w-2.5 h-2.5 bg-[#263349] rotate-45 border-l border-b border-white/10" />
                </div>
            )}

            {/* ══ SIDEBAR ══════════════════════════════════════════════ */}
            <aside
                className={`fixed top-0 left-0 h-full z-50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
                style={{ width: mobileOpen ? W : (collapsed ? WC : W) }}
            >
                <div className="flex flex-col h-full bg-white dark:bg-[#1E293B] border-r border-gray-100 dark:border-white/10 relative transition-colors duration-300"
                    style={{ boxShadow: '4px 0 24px rgba(0,0,0,0.06)' }}>

                    {/* Logo */}
                    <div className="relative h-[72px] flex items-center border-b border-gray-100 dark:border-white/10"
                        style={{ padding: isColl ? '0 12px' : '0 20px' }}>
                        <div className={`flex items-center gap-3 transition-all duration-300 ${isColl ? 'w-full justify-center' : ''}`}>
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary to-primary-lighter rounded-xl flex items-center justify-center shadow-md shadow-primary/25">
                                <span className="text-lg font-black text-white tracking-tight">A</span>
                            </div>
                            {!isColl && (
                                <div className="overflow-hidden">
                                    <h1 className="text-[17px] font-bold text-gray-900 dark:text-[#F1F5F9] whitespace-nowrap tracking-tight">ASR Loyalty</h1>
                                    {user && (
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                            <p className="text-[11px] text-gray-400 dark:text-[#64748B] whitespace-nowrap font-medium">{role.replace(/_/g, ' ')}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Collapse toggle */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="hidden lg:flex absolute -right-4 top-[36px] -translate-y-1/2 w-8 h-8
                            bg-white dark:bg-[#334155] text-gray-400 dark:text-[#94A3B8]
                            rounded-full shadow-md items-center justify-center border border-gray-200 dark:border-white/10
                            hover:bg-primary hover:text-white hover:border-primary
                            transition-all duration-200 z-[60]"
                    >
                        {collapsed ? <FiChevronRight className="w-4 h-4" /> : <FiChevronLeft className="w-4 h-4" />}
                    </button>

                    {/* Nav */}
                    <nav ref={navRef} className="flex-1 overflow-y-auto overflow-x-hidden py-5 sidebar-scrollbar">
                        {!user ? (
                            <div className="space-y-2 px-3">
                                {[...Array(6)].map((_, i) => <div key={i} className="h-9 bg-gray-100 dark:bg-[#334155] rounded-xl animate-pulse" />)}
                            </div>
                        ) : (
                            <div className="space-y-5" style={{ padding: isColl ? '0 8px' : '0 12px' }}>
                                {sections.map(sec => (
                                    <div key={sec.title}>
                                        {/* Section label */}
                                        <div className="mb-1.5" style={{ padding: isColl ? 0 : '0 8px' }}>
                                            {isColl
                                                ? <div className="flex justify-center py-1"><div className="w-6 h-px bg-gray-200 dark:bg-[#334155]" /></div>
                                                : <span className="text-[10px] font-semibold text-gray-400 dark:text-[#64748B] uppercase tracking-[0.12em]">{sec.title}</span>
                                            }
                                        </div>
                                        {/* Items */}
                                        <ul className="space-y-0.5">
                                            {sec.items.map(item => {
                                                const active = isActive(item.path);
                                                return (
                                                    <li key={item.path}>
                                                        <button
                                                            onClick={() => { router.push(item.path); setMobileOpen(false); }}
                                                            onMouseEnter={e => isColl && showTip(e, item.label)}
                                                            onMouseLeave={hideTip}
                                                            className={`
                                                                w-full flex items-center rounded-xl transition-all duration-150 relative
                                                                ${isColl ? 'justify-center py-2.5 px-0' : 'gap-3 px-3 py-2.5'}
                                                                ${active
                                                                    ? 'text-primary dark:text-indigo-400'
                                                                    : 'text-gray-600 dark:text-[#94A3B8] hover:text-gray-900 dark:hover:text-[#F1F5F9] hover:bg-gray-50 dark:hover:bg-[#2D3F55]'
                                                                }
                                                            `}
                                                        >
                                                            {active && <div className="absolute inset-0 bg-primary/8 dark:bg-indigo-500/[0.12] rounded-xl" />}
                                                            {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary dark:bg-indigo-400 rounded-r-full" />}

                                                            <span className={`relative flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-[17px] leading-none
                                                                ${active ? 'text-primary dark:text-indigo-400' : 'text-gray-400 dark:text-[#64748B]'}`}>
                                                                {item.icon}
                                                            </span>

                                                            {!isColl && <span className="relative font-medium text-[13px] whitespace-nowrap">{item.label}</span>}

                                                            {item.badge !== undefined && item.badge > 0 && !isColl && (
                                                                <span className="relative ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center animate-pulse shadow-sm shadow-red-500/40">
                                                                    {item.badge}
                                                                </span>
                                                            )}
                                                            {item.badge !== undefined && item.badge > 0 && isColl && (
                                                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-500/40" />
                                                            )}
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}
                    </nav>
                </div>
            </aside>

            {/* ══ MAIN ═════════════════════════════════════════════════ */}
            <div className={`flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-[240px]'}`}>

                {/* Header */}
                <header className="sticky top-0 h-[72px] z-30
                    bg-white/90 dark:bg-[#1E293B]/95
                    backdrop-blur-xl
                    border-b border-gray-200/80 dark:border-white/10
                    transition-colors duration-300"
                >
                    <div className="flex items-center justify-between h-full px-4 lg:px-8">

                        {/* Left */}
                        <div className="flex items-center gap-4">
                            <button onClick={() => setMobileOpen(!mobileOpen)}
                                className="lg:hidden p-2.5 rounded-xl text-gray-600 dark:text-[#94A3B8] hover:bg-gray-100 dark:hover:bg-[#2D3F55] transition-colors">
                                {mobileOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
                            </button>
                            <div>
                                <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-[#E5B887]">{pageLabel}</h2>
                                <p className="text-xs text-gray-400 dark:text-[#64748B] hidden sm:block font-medium">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        {/* Right */}
                        <div className="flex items-center gap-1 lg:gap-2">

                            {/* Search */}
                            <button onClick={() => setSearchOpen(true)} className="flex p-2.5 rounded-xl text-gray-500 dark:text-[#94A3B8] hover:bg-gray-100 dark:hover:bg-[#2D3F55] transition-colors">
                                <FiSearch className="w-5 h-5" />
                            </button>

                            {/* Bell */}
                            <button onClick={() => router.push('/dashboard/notifications')}
                                className="relative p-2.5 rounded-xl text-gray-500 dark:text-[#94A3B8] hover:bg-gray-100 dark:hover:bg-[#2D3F55] transition-colors">
                                <FiBell className="w-5 h-5" />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#1E293B] animate-pulse" />
                            </button>

                            {/* Theme toggle */}
                            <div className="relative block" ref={themeRef}>
                                <button onClick={() => setThemeMenu(!themeMenu)}
                                    className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#2D3F55] transition-colors"
                                    title="Change theme">
                                    <ThemeIcon />
                                </button>
                                {themeMenu && (
                                    <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-[#263349] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 py-1.5 z-[36] animate-slide-down overflow-hidden">
                                        {([
                                            { id: 'light',  label: 'Light',  Icon: FiSun },
                                            { id: 'dark',   label: 'Dark',   Icon: FiMoon },
                                            { id: 'system', label: 'System', Icon: FiMonitor },
                                        ] as const).map(({ id, label, Icon }) => (
                                            <button key={id}
                                                onClick={() => { setTheme(id); setThemeMenu(false); }}
                                                className={`w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm transition-colors
                                                    ${theme === id
                                                        ? 'text-primary dark:text-indigo-400 bg-primary/8 dark:bg-indigo-500/[0.12] font-semibold'
                                                        : 'text-gray-600 dark:text-[#CBD5E1] hover:bg-gray-50 dark:hover:bg-[#2D3F55] hover:text-gray-900 dark:hover:text-[#F1F5F9]'
                                                    }`}
                                            >
                                                <Icon className="w-4 h-4" /> {label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="hidden lg:block w-px h-8 bg-gray-200 dark:bg-[#334155] mx-1" />

                            {/* User menu */}
                            <div className="relative" ref={userMenuRef}>
                                <button onClick={() => setUserMenu(!userMenu)}
                                    className="flex items-center gap-2 p-1.5 lg:p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#2D3F55] transition-colors">
                                    <div className="relative">
                                        <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-primary to-primary-lighter rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md shadow-primary/20">
                                            {initials()}
                                        </div>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-[#161b22]" />
                                    </div>
                                    <div className="hidden lg:flex items-center gap-1.5">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-[#F1F5F9] leading-tight">{user?.firstName} {user?.lastName}</p>
                                            <p className="text-[11px] text-gray-400 dark:text-[#64748B] font-medium">{user ? role.replace(/_/g, ' ') : ''}</p>
                                        </div>
                                        <FiChevronDown className={`w-4 h-4 text-gray-400 dark:text-[#64748B] transition-transform duration-200 ${userMenu ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>

                                {userMenu && (
                                    <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#263349] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 py-2 z-[36] animate-slide-down overflow-hidden">
                                        <div className="px-4 py-3 border-b border-gray-100 dark:border-white/10">
                                            <p className="text-sm font-bold text-gray-900 dark:text-[#F1F5F9]">{user?.firstName} {user?.lastName}</p>
                                            <p className="text-xs text-gray-400 dark:text-[#94A3B8] truncate mt-0.5">{user?.email}</p>
                                        </div>
                                        <div className="py-1">
                                            {([
                                                { label: 'Profile',       Icon: FiUser,     path: '/dashboard/profile' },
                                                { label: 'Notifications', Icon: FiBell,     path: '/dashboard/notifications' },
                                                { label: 'Settings',      Icon: FiSettings, path: '/dashboard/settings' },
                                            ]).map(({ label, Icon, path }) => (
                                                <button key={path}
                                                    onClick={() => { router.push(path); setUserMenu(false); }}
                                                    className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm text-gray-600 dark:text-[#CBD5E1] hover:bg-gray-50 dark:hover:bg-[#2D3F55] hover:text-gray-900 dark:hover:text-[#F1F5F9] transition-colors">
                                                    <Icon className="w-4 h-4" /> {label}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="border-t border-gray-100 dark:border-white/10 pt-1">
                                            <button onClick={handleLogout}
                                                className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 transition-colors">
                                                <FiLogOut className="w-4 h-4" /> Logout
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 min-w-0 p-4 lg:p-6 overflow-x-hidden">{children}</main>
            </div>


            {/* GLOBAL SEARCH MODAL */}
            {searchOpen && (
                <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[10vh] px-4"
                    onClick={() => setSearchOpen(false)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div className="relative w-full max-w-xl bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden"
                        onClick={e => e.stopPropagation()}>

                        {/* Input */}
                        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 dark:border-white/10">
                            <FiSearch className="w-5 h-5 text-gray-400 dark:text-[#64748B] flex-shrink-0" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setSearchIndex(0); }}
                                onKeyDown={handleSearchKeyDown}
                                placeholder="Search pages or users..."
                                className="flex-1 bg-transparent text-gray-900 dark:text-[#F1F5F9] placeholder-gray-400 dark:placeholder-[#64748B] text-base outline-none"
                            />
                            {searchLoading && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />}
                            <kbd className="hidden sm:inline text-[10px] bg-gray-100 dark:bg-[#334155] text-gray-400 dark:text-[#64748B] px-1.5 py-0.5 rounded font-mono flex-shrink-0">ESC</kbd>
                        </div>

                        {/* Results */}
                        <div className="max-h-[60vh] overflow-y-auto py-2">
                            {filteredShortcuts.length > 0 && (
                                <div>
                                    <p className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 dark:text-[#64748B] uppercase tracking-wider">
                                        {searchQuery ? 'Pages' : 'Quick Navigation'}
                                    </p>
                                    {filteredShortcuts.map((item, idx) => {
                                        const isSelected = searchIndex === idx;
                                        return (
                                            <button key={item.path}
                                                onClick={() => handleSearchNavigate(item.path)}
                                                onMouseEnter={() => setSearchIndex(idx)}
                                                className={"w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors " + (isSelected ? "bg-primary/10 dark:bg-indigo-500/20" : "hover:bg-gray-50 dark:hover:bg-[#263349]")}>
                                                <div className={"w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 " + (isSelected ? "bg-primary text-white" : "bg-gray-100 dark:bg-[#334155] text-gray-500 dark:text-[#94A3B8]")}>
                                                    <FiArrowRight className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={"text-sm font-medium " + (isSelected ? "text-primary dark:text-indigo-400" : "text-gray-700 dark:text-[#CBD5E1]")}>{item.label}</p>
                                                    <p className="text-xs text-gray-400 dark:text-[#64748B] truncate">{item.path}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {searchResults.length > 0 && (
                                <div className="mt-1">
                                    <p className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 dark:text-[#64748B] uppercase tracking-wider">Users</p>
                                    {searchResults.map((u, idx) => {
                                        const globalIdx = filteredShortcuts.length + idx;
                                        const isSelected = searchIndex === globalIdx;
                                        return (
                                            <button key={u.id}
                                                onClick={() => handleSearchNavigate("/dashboard/users/" + u.id)}
                                                onMouseEnter={() => setSearchIndex(globalIdx)}
                                                className={"w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors " + (isSelected ? "bg-primary/10 dark:bg-indigo-500/20" : "hover:bg-gray-50 dark:hover:bg-[#263349]")}>
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                                                    {u.firstName?.[0]}{u.lastName?.[0]}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={"text-sm font-medium " + (isSelected ? "text-primary dark:text-indigo-400" : "text-gray-700 dark:text-[#CBD5E1]")}>{u.firstName} {u.lastName}</p>
                                                    <p className="text-xs text-gray-400 dark:text-[#64748B] truncate">{u.email} · {u.role}</p>
                                                </div>
                                                <span className={"text-xs px-2 py-0.5 rounded-full flex-shrink-0 " + (u.status === "ACTIVE" ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-[#334155] text-gray-500 dark:text-[#94A3B8]")}>{u.status}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {searchQuery.length >= 2 && !searchLoading && filteredShortcuts.length === 0 && searchResults.length === 0 && (
                                <div className="py-12 text-center">
                                    <FiSearch className="w-10 h-10 text-gray-300 dark:text-[#334155] mx-auto mb-3" />
                                    <p className="text-sm text-gray-500 dark:text-[#64748B]">No results for &ldquo;{searchQuery}&rdquo;</p>
                                </div>
                            )}
                        </div>

                        <div className="px-4 py-2.5 border-t border-gray-100 dark:border-white/10 flex items-center gap-4 text-[11px] text-gray-400 dark:text-[#64748B]">
                            <span className="flex items-center gap-1.5"><kbd className="bg-gray-100 dark:bg-[#334155] px-1.5 py-0.5 rounded font-mono">↑↓</kbd> navigate</span>
                            <span className="flex items-center gap-1.5"><kbd className="bg-gray-100 dark:bg-[#334155] px-1.5 py-0.5 rounded font-mono">↵</kbd> open</span>
                            <span className="flex items-center gap-1.5"><kbd className="bg-gray-100 dark:bg-[#334155] px-1.5 py-0.5 rounded font-mono">ESC</kbd> close</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Suspended modal */}
            {suspended && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-transparent dark:border-white/10 w-full max-w-md p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiShield className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-[#F1F5F9] mb-2">Account Suspended</h2>
                        <p className="text-gray-500 dark:text-[#94A3B8] mb-6">Your account has been suspended. Please contact the administrator.</p>
                        <button onClick={handleSuspendedLogout} className="w-full px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors">
                            Sign Out
                        </button>
                    </div>
                </div>
            )}

            {/* Logout overlay */}
            {loggingOut && (
                <div className="fixed inset-0 bg-white dark:bg-[#0F172A] z-[9999] flex items-center justify-center transition-colors">
                    <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                        <p className="text-sm text-gray-500 dark:text-[#94A3B8] font-medium">Signing out...</p>
                    </div>
                </div>
            )}

            <style jsx global>{`
        .sidebar-scrollbar::-webkit-scrollbar { width: 3px; }
        .sidebar-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 4px; }
        .sidebar-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(148,163,184,0.3); }
        @media (max-width: 1023px) { .lg\\:ml-0 { margin-left: 0 !important; } }
      `}</style>
        </div>
    );
}
