'use client';

import { useAuthStore } from '@/store/auth.store';
import {
    FiBarChart,
    FiBell,
    FiChevronDown,
    FiChevronLeft,
    FiChevronRight,
    FiCreditCard,
    FiDollarSign,
    FiFileText,
    FiGift,
    FiHome,
    FiKey,
    FiLayers,
    FiLogOut,
    FiMenu,
    FiQrCode,
    FiSearch,
    FiSettings,
    FiShield,
    FiStar,
    FiUser,
    FiUsers,
    FiWallet,
    FiX,
} from '@/utils/icons';
import { usePathname, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface NavItem {
    label: string;
    icon: React.ReactNode;
    path: string;
    roles?: string[];
    badge?: number;
    section?: string;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

interface TooltipState {
    label: string;
    top: number;
    left: number;
}

const DRAWER_WIDTH = 240;
const DRAWER_WIDTH_COLLAPSED = 72;

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [tooltip, setTooltip] = useState<TooltipState | null>(null);
    const [suspendedModalVisible, setSuspendedModalVisible] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const role = user?.role || 'CUSTOMER';
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const navRef = useRef<HTMLElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        if (userMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [userMenuOpen]);

    // Preserve sidebar scroll position across navigations
    useEffect(() => {
        const saved = sessionStorage.getItem('sidebarScroll');
        if (saved && navRef.current) {
            navRef.current.scrollTop = parseInt(saved, 10);
        }
    }, [pathname]);

    useEffect(() => {
        const nav = navRef.current;
        if (!nav) return;
        const onScroll = () => sessionStorage.setItem('sidebarScroll', String(nav.scrollTop));
        nav.addEventListener('scroll', onScroll, { passive: true });
        return () => nav.removeEventListener('scroll', onScroll);
    }, []);

    // Save sidebar state to localStorage
    useEffect(() => {
        const saved = localStorage.getItem('sidebarCollapsed');
        if (saved !== null) {
            setSidebarCollapsed(JSON.parse(saved));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
    }, [sidebarCollapsed]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        setUserMenuOpen(false);
        await logout();
        router.push('/login');
    };

    // Detect suspended account and log out
    useEffect(() => {
        if (user?.status === 'SUSPENDED') {
            setSuspendedModalVisible(true);
        }
    }, [user?.status]);

    const handleSuspendedLogout = async () => {
        setSuspendedModalVisible(false);
        setIsLoggingOut(true);
        await logout();
        router.push('/login');
    };

    // Show tooltip at the element's position
    const showTooltip = useCallback((e: React.MouseEvent<HTMLElement>, label: string) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({
            label,
            top: rect.top + rect.height / 2,
            left: rect.right + 12,
        });
    }, []);

    const hideTooltip = useCallback(() => {
        setTooltip(null);
    }, []);

    // Define navigation items based on role with sections
    const getNavSections = (): NavSection[] => {
        switch (role) {
            case 'CUSTOMER':
                return [
                    {
                        title: 'Main',
                        items: [
                            { label: 'Dashboard', icon: <FiHome />, path: '/dashboard' },
                            { label: 'Wallet', icon: <FiWallet />, path: '/dashboard/wallet' },
                            { label: 'Transactions', icon: <FiCreditCard />, path: '/dashboard/transactions' },
                        ],
                    },
                    {
                        title: 'Rewards',
                        items: [
                            { label: 'Rewards', icon: <FiGift />, path: '/dashboard/rewards' },
                            { label: 'Loyalty', icon: <FiStar />, path: '/dashboard/loyalty' },
                            { label: 'QR Pay', icon: <FiQrCode />, path: '/dashboard/qr-pay' },
                        ],
                    },
                ];

            case 'ADMIN':
            case 'SUPER_ADMIN':
                return [
                    {
                        title: 'Overview',
                        items: [
                            { label: 'Dashboard', icon: <FiHome />, path: '/dashboard' },
                            { label: 'Reports', icon: <FiBarChart />, path: '/dashboard/reports' },
                            { label: 'Audit Logs', icon: <FiFileText />, path: '/dashboard/audit' },
                        ],
                    },
                    {
                        title: 'Management',
                        items: [
                            { label: 'Users', icon: <FiUsers />, path: '/dashboard/users' },
                            { label: 'Transactions', icon: <FiCreditCard />, path: '/dashboard/transactions' },
                            { label: 'Wallets', icon: <FiWallet />, path: '/dashboard/wallets' },
                            { label: 'Roles', icon: <FiLayers />, path: '/dashboard/roles' },
                            { label: 'Permissions', icon: <FiKey />, path: '/dashboard/permissions' },
                        ],
                    },
                    {
                        title: 'Loyalty & Rewards',
                        items: [
                            { label: 'Rewards', icon: <FiGift />, path: '/dashboard/rewards' },
                        ],
                    },
                    {
                        title: 'Support',
                        items: [
                            { label: 'Disputes', icon: <FiShield />, path: '/dashboard/disputes' },
                            { label: 'Refunds', icon: <FiDollarSign />, path: '/dashboard/refunds' },
                        ],
                    },
                ];

            case 'CASHIER':
                return [
                    {
                        title: 'Main',
                        items: [
                            { label: 'Dashboard', icon: <FiHome />, path: '/dashboard' },
                            { label: 'QR Scanner', icon: <FiQrCode />, path: '/dashboard/qr-scanner' },
                            { label: 'Transactions', icon: <FiCreditCard />, path: '/dashboard/transactions' },
                        ],
                    },
                ];

            case 'FINANCE_MANAGER':
                return [
                    {
                        title: 'Overview',
                        items: [
                            { label: 'Dashboard', icon: <FiHome />, path: '/dashboard' },
                            { label: 'Reports', icon: <FiBarChart />, path: '/dashboard/reports' },
                        ],
                    },
                    {
                        title: 'Finance',
                        items: [
                            { label: 'Transactions', icon: <FiCreditCard />, path: '/dashboard/transactions' },
                            { label: 'Wallets', icon: <FiWallet />, path: '/dashboard/wallets' },
                            { label: 'Rewards', icon: <FiGift />, path: '/dashboard/rewards' },
                        ],
                    },
                    {
                        title: 'Support',
                        items: [
                            { label: 'Disputes', icon: <FiShield />, path: '/dashboard/disputes' },
                            { label: 'Refunds', icon: <FiDollarSign />, path: '/dashboard/refunds' },
                        ],
                    },
                ];

            case 'LOYALTY_MANAGER':
                return [
                    {
                        title: 'Overview',
                        items: [
                            { label: 'Dashboard', icon: <FiHome />, path: '/dashboard' },
                            { label: 'Reports', icon: <FiBarChart />, path: '/dashboard/reports' },
                        ],
                    },
                    {
                        title: 'Loyalty',
                        items: [
                            { label: 'Users', icon: <FiUsers />, path: '/dashboard/users' },
                            { label: 'Loyalty Tiers', icon: <FiStar />, path: '/dashboard/loyalty-tiers' },
                            { label: 'Rewards', icon: <FiGift />, path: '/dashboard/rewards' },
                            { label: 'Reward Config', icon: <FiSettings />, path: '/dashboard/reward-config' },
                        ],
                    },
                ];

            case 'CUSTOMER_SUPPORT':
                return [
                    {
                        title: 'Main',
                        items: [
                            { label: 'Dashboard', icon: <FiHome />, path: '/dashboard' },
                            { label: 'Users', icon: <FiUsers />, path: '/dashboard/users' },
                            { label: 'Transactions', icon: <FiCreditCard />, path: '/dashboard/transactions' },
                        ],
                    },
                    {
                        title: 'Support',
                        items: [
                            { label: 'Disputes', icon: <FiShield />, path: '/dashboard/disputes' },
                            { label: 'Refunds', icon: <FiDollarSign />, path: '/dashboard/refunds' },
                        ],
                    },
                ];

            default:
                return [
                    {
                        title: 'Main',
                        items: [
                            { label: 'Dashboard', icon: <FiHome />, path: '/dashboard' },
                        ],
                    },
                ];
        }
    };

    const navSections = getNavSections();
    const allNavItems = navSections.flatMap((section) => section.items);

    // Proper active state detection - exact match for /dashboard, startsWith for others
    const isItemActive = (itemPath: string): boolean => {
        if (!pathname) return false;
        if (itemPath === '/dashboard') {
            return pathname === '/dashboard';
        }
        return pathname === itemPath || pathname.startsWith(itemPath + '/');
    };

    const currentPageLabel = allNavItems.find(
        (item) => isItemActive(item.path)
    )?.label || 'Dashboard';

    const isCollapsed = sidebarCollapsed && !mobileOpen;

    const getInitials = () => {
        const first = user?.firstName?.[0] || '';
        const last = user?.lastName?.[0] || '';
        return (first + last).toUpperCase() || 'U';
    };

    return (
        <div className="flex min-h-screen bg-gray-50/50">
            {/* Mobile sidebar backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Fixed tooltip - rendered at root level, outside all overflow containers */}
            {isCollapsed && tooltip && (
                <div
                    className="fixed pointer-events-none z-[9999] px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-xl border border-white/10 whitespace-nowrap"
                    style={{
                        top: tooltip.top,
                        left: tooltip.left,
                        transform: 'translateY(-50%)',
                    }}
                >
                    {tooltip.label}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[5px] w-2.5 h-2.5 bg-gray-900 rotate-45 border-l border-b border-white/10" />
                </div>
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed top-0 left-0 h-full z-50
          transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
                style={{ width: mobileOpen ? DRAWER_WIDTH : (sidebarCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH) }}
            >
                <div className="flex flex-col h-full bg-white border-r border-gray-100 relative" style={{ boxShadow: '4px 0 24px rgba(0,0,0,0.06)' }}>

                    {/* Logo/Header */}
                    <div className="relative h-[72px] flex items-center border-b border-gray-100/80" style={{ padding: isCollapsed ? '0 12px' : '0 20px' }}>
                        <div className={`flex items-center gap-3 transition-all duration-300 ${isCollapsed ? 'w-full justify-center' : ''}`}>
                            <div className="relative flex-shrink-0 w-10 h-10">
                                <div className="relative w-full h-full bg-gradient-to-br from-primary to-primary-lighter rounded-xl flex items-center justify-center shadow-md shadow-primary/25">
                                    <span className="text-lg font-black text-white tracking-tight">A</span>
                                </div>
                            </div>

                            {!isCollapsed && (
                                <div className="overflow-hidden">
                                    <h1 className="text-[17px] font-bold text-gray-900 whitespace-nowrap tracking-tight">
                                        ASR Loyalty
                                    </h1>
                                    {user && (
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                            <p className="text-[11px] text-gray-400 whitespace-nowrap font-medium">
                                                {role.replace(/_/g, ' ')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Collapse toggle button */}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="hidden lg:flex absolute -right-4 top-[36px] -translate-y-1/2 w-8 h-8 bg-white text-gray-400 rounded-full shadow-md items-center justify-center hover:bg-primary hover:text-white transition-all duration-200 z-[60] border border-gray-200 hover:border-primary"
                    >
                        {sidebarCollapsed ? <FiChevronRight className="w-4 h-4" /> : <FiChevronLeft className="w-4 h-4" />}
                    </button>

                    {/* Navigation */}
                    <nav ref={navRef} className="flex-1 overflow-y-auto overflow-x-hidden py-5 sidebar-scrollbar">
                        {!user ? (
                            <div className="space-y-2 px-3">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="h-9 bg-gray-100 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-5" style={{ padding: isCollapsed ? '0 8px' : '0 12px' }}>
                                {navSections.map((section) => (
                                    <div key={section.title}>
                                        {/* Section Title */}
                                        <div className="mb-1.5" style={{ padding: isCollapsed ? '0' : '0 8px' }}>
                                            {isCollapsed ? (
                                                <div className="flex justify-center py-1">
                                                    <div className="w-6 h-px bg-gray-200" />
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.12em]">
                                                    {section.title}
                                                </span>
                                            )}
                                        </div>

                                        {/* Section Items */}
                                        <ul className="space-y-0.5">
                                            {section.items.map((item) => {
                                                const isActive = isItemActive(item.path);
                                                return (
                                                    <li key={item.path}>
                                                        <button
                                                            onClick={() => {
                                                                router.push(item.path);
                                                                setMobileOpen(false);
                                                            }}
                                                            onMouseEnter={(e) => isCollapsed && showTooltip(e, item.label)}
                                                            onMouseLeave={hideTooltip}
                                                            className={`
                                                                    w-full flex items-center rounded-xl
                                                                    transition-all duration-150 relative
                                                                    ${isCollapsed
                                                                    ? 'justify-center py-2.5 px-0'
                                                                    : 'gap-3 px-3 py-2.5'
                                                                }
                                                                    ${isActive
                                                                    ? 'text-primary'
                                                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                                                }
                                                            `}
                                                        >
                                                            {/* Active background */}
                                                            {isActive && (
                                                                <div className="absolute inset-0 bg-primary/8 rounded-xl" />
                                                            )}

                                                            {/* Active left indicator */}
                                                            {isActive && (
                                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                                                            )}

                                                            {/* Icon */}
                                                            <span className={`relative flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150
                                                            ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'}
                                                            `}>
                                                                <span className="text-[17px] leading-none">{item.icon}</span>
                                                            </span>

                                                            {/* Label */}
                                                            {!isCollapsed && (
                                                                <span className="relative font-medium text-[13px] whitespace-nowrap">
                                                                    {item.label}
                                                                </span>
                                                            )}

                                                            {/* Badge */}
                                                            {item.badge && !isCollapsed && (
                                                                <span className="relative ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                                                                    {item.badge}
                                                                </span>
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

            {/* Main content */}
            <div
                className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[240px]'}`}
            >
                {/* Top bar / Header */}
                <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-gray-200/80 z-30 h-[72px]">
                    <div className="flex items-center justify-between h-full px-4 lg:px-8">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setMobileOpen(!mobileOpen)}
                                className="lg:hidden p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
                            >
                                {mobileOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
                            </button>
                            <div>
                                <h2 className="text-lg lg:text-xl font-bold text-gray-900">{currentPageLabel}</h2>
                                <p className="text-xs text-gray-400 hidden sm:block font-medium">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 lg:gap-3">
                            <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors hidden lg:flex">
                                <FiSearch className="w-5 h-5 text-gray-500" />
                            </button>

                            <button
                                onClick={() => router.push('/dashboard/notifications')}
                                className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <FiBell className="w-5 h-5 text-gray-500" />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
                            </button>

                            <div className="hidden lg:block w-px h-8 bg-gray-200 mx-1" />

                            <div className="relative" ref={userMenuRef}>
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-2 p-1.5 lg:p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    <div className="relative">
                                        <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-primary to-primary-lighter rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md shadow-primary/20">
                                            {getInitials()}
                                        </div>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
                                    </div>
                                    <div className="hidden lg:flex lg:items-center lg:gap-1.5 text-left">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 leading-tight">
                                                {user?.firstName} {user?.lastName}
                                            </p>
                                            <p className="text-[11px] text-gray-400 font-medium">{user ? role.replace(/_/g, ' ') : ''}</p>
                                        </div>
                                        <FiChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>

                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-[36] overflow-hidden animate-slide-down">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-bold text-gray-900">
                                                {user?.firstName} {user?.lastName}
                                            </p>
                                            <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
                                        </div>
                                        <div className="py-1">
                                            <button
                                                onClick={() => {
                                                    router.push('/dashboard/profile');
                                                    setUserMenuOpen(false);
                                                }}
                                                className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                                            >
                                                <FiUser className="w-4 h-4" />
                                                Profile
                                            </button>
                                            <button
                                                onClick={() => {
                                                    router.push('/dashboard/notifications');
                                                    setUserMenuOpen(false);
                                                }}
                                                className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                                            >
                                                <FiBell className="w-4 h-4" />
                                                Notifications
                                            </button>
                                            <button
                                                onClick={() => {
                                                    router.push('/dashboard/settings');
                                                    setUserMenuOpen(false);
                                                }}
                                                className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                                            >
                                                <FiSettings className="w-4 h-4" />
                                                Settings
                                            </button>
                                        </div>
                                        <div className="border-t border-gray-100 pt-1">
                                            <button
                                                onClick={handleLogout}
                                                className="w-full px-4 py-2.5 text-left hover:bg-red-50 text-red-500 hover:text-red-600 flex items-center gap-3 text-sm transition-colors"
                                            >
                                                <FiLogOut className="w-4 h-4" />
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">{children}</main>
            </div>

            {/* Account Suspended Modal */}
            {suspendedModalVisible && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiShield className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Suspended</h2>
                        <p className="text-gray-500 mb-6">
                            Your account has been suspended. Please contact the administrator for more information.
                        </p>
                        <button
                            onClick={handleSuspendedLogout}
                            className="w-full px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            )}

            {/* Full-screen overlay during logout — prevents flash of wrong role */}
            {isLoggingOut && (
                <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                        <p className="text-sm text-gray-500 font-medium">Signing out...</p>
                    </div>
                </div>
            )}

            <style jsx global>{`
        .sidebar-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .sidebar-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.08);
          border-radius: 4px;
        }
        .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.3);
        }
        @media (max-width: 1023px) {
          .lg\\:ml-0 {
            margin-left: 0 !important;
          }
        }
      `}</style>
        </div>
    );
}
