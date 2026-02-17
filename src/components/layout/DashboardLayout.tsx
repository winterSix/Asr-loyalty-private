'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import {
  FiHome,
  FiWallet,
  FiCreditCard,
  FiGift,
  FiUsers,
  FiSettings,
  FiLogOut,
  FiBell,
  FiMenu,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiQrCode,
  FiShield,
  FiDollarSign,
  FiStar,
  FiBarChart,
  FiUser,
  FiFileText,
  FiLayers,
  FiKey,
  FiSearch,
} from '@/utils/icons';

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

const DRAWER_WIDTH = 280;
const DRAWER_WIDTH_COLLAPSED = 80;

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: string;
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const navRef = useRef<HTMLElement>(null);

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
          {
            title: 'Account',
            items: [
              { label: 'Notifications', icon: <FiBell />, path: '/dashboard/notifications' },
              { label: 'Profile', icon: <FiUser />, path: '/dashboard/profile' },
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
            ],
          },
          {
            title: 'Loyalty & Rewards',
            items: [
              { label: 'Rewards', icon: <FiGift />, path: '/dashboard/rewards' },
              { label: 'Loyalty Tiers', icon: <FiStar />, path: '/dashboard/loyalty-tiers' },
              { label: 'Reward Config', icon: <FiGift />, path: '/dashboard/reward-config' },
            ],
          },
          {
            title: 'QR & Payments',
            items: [
              { label: 'QR Codes', icon: <FiQrCode />, path: '/dashboard/qr-codes' },
              ...(role === 'SUPER_ADMIN' ? [{ label: 'QR Scanner', icon: <FiQrCode />, path: '/dashboard/qr-scanner' }] : []),
            ],
          },
          {
            title: 'Support',
            items: [
              { label: 'Disputes', icon: <FiShield />, path: '/dashboard/disputes' },
              { label: 'Refunds', icon: <FiDollarSign />, path: '/dashboard/refunds' },
            ],
          },
          {
            title: 'Access Control',
            items: [
              { label: 'Roles', icon: <FiLayers />, path: '/dashboard/roles' },
              { label: 'Permissions', icon: <FiKey />, path: '/dashboard/permissions' },
            ],
          },
          {
            title: 'Settings',
            items: [
              { label: 'Notifications', icon: <FiBell />, path: '/dashboard/notifications' },
              { label: 'Settings', icon: <FiSettings />, path: '/dashboard/settings' },
              { label: 'Profile', icon: <FiUser />, path: '/dashboard/profile' },
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
          {
            title: 'Account',
            items: [
              { label: 'Profile', icon: <FiUser />, path: '/dashboard/profile' },
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
              { label: 'Notifications', icon: <FiBell />, path: '/dashboard/notifications' },
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
        <div className="flex flex-col h-full bg-sidebar-bg relative">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5 pointer-events-none" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none opacity-50" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent-cyan/5 rounded-full blur-3xl pointer-events-none opacity-50" />

          {/* Logo/Header */}
          <div className="relative h-[72px] flex items-center border-b border-white/5" style={{ padding: isCollapsed ? '0 12px' : '0 20px' }}>
            <div className={`flex items-center gap-3 transition-all duration-300 ${isCollapsed ? 'w-full justify-center' : ''}`}>
              <div className="relative flex-shrink-0 w-10 h-10">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-lighter rounded-xl animate-pulse-glow" />
                <div className="relative w-full h-full bg-gradient-to-br from-primary to-primary-lighter rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                  <span className="text-lg font-black text-white tracking-tight">A</span>
                </div>
              </div>

              {!isCollapsed && (
                <div className="overflow-hidden">
                  <h1 className="text-[17px] font-bold text-white whitespace-nowrap tracking-tight">
                    ASR Loyalty
                  </h1>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <p className="text-[11px] text-sidebar-text whitespace-nowrap font-medium">
                      {role.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Collapse toggle button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex absolute -right-4 top-[36px] -translate-y-1/2 w-8 h-8 bg-white text-gray-600 rounded-full shadow-lg items-center justify-center hover:bg-primary hover:text-white transition-all duration-200 z-[60] border border-gray-200 hover:border-primary"
          >
            {sidebarCollapsed ? <FiChevronRight className="w-4 h-4" /> : <FiChevronLeft className="w-4 h-4" />}
          </button>

          {/* Navigation */}
          <nav ref={navRef} className="flex-1 overflow-y-auto overflow-x-hidden py-5 sidebar-scrollbar relative z-10">
            <div className="space-y-6" style={{ padding: isCollapsed ? '0 8px' : '0 16px' }}>
              {navSections.map((section) => (
                <div key={section.title}>
                  {/* Section Title */}
                  <div className="mb-2" style={{ padding: isCollapsed ? '0' : '0 12px' }}>
                    {isCollapsed ? (
                      <div className="flex justify-center py-1">
                        <div className="w-8 h-px bg-gradient-to-r from-transparent via-sidebar-text/30 to-transparent" />
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-sidebar-heading uppercase tracking-[0.15em] flex items-center gap-2">
                        <span className="w-4 h-px bg-sidebar-heading/30" />
                        {section.title}
                      </span>
                    )}
                  </div>

                  {/* Section Items */}
                  <ul className="space-y-1">
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
                              transition-all duration-200 relative
                              ${isCollapsed
                                ? 'justify-center py-2.5 px-0'
                                : 'gap-3 px-3 py-2.5'
                              }
                              ${isActive
                                ? 'text-white'
                                : 'text-sidebar-text hover:text-white hover:bg-white/[0.05]'
                              }
                            `}
                          >
                            {/* Active background */}
                            {isActive && (
                              <div className="absolute inset-0 bg-gradient-to-r from-primary/25 via-primary/15 to-transparent rounded-xl" />
                            )}

                            {/* Active left indicator */}
                            {isActive && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary-lighter rounded-r-full shadow-glow" />
                            )}

                            {/* Icon */}
                            <span className={`relative flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200
                              ${isActive
                                ? 'bg-primary/25 text-primary-lighter'
                                : ''
                              }
                            `}>
                              <span className="text-[18px] leading-none">{item.icon}</span>
                            </span>

                            {/* Label */}
                            {!isCollapsed && (
                              <span className="relative font-medium text-[13px] whitespace-nowrap">
                                {item.label}
                              </span>
                            )}

                            {/* Badge */}
                            {item.badge && !isCollapsed && (
                              <span className="relative ml-auto bg-red-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
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
          </nav>

          {/* User Section & Logout */}
          <div className="relative z-10 border-t border-white/5">
            {/* User Info */}
            <div className="p-3">
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-2'}`}>
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary via-primary-light to-accent-cyan rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/20 ring-2 ring-primary/20">
                    {getInitials()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-sidebar-bg" />
                </div>

                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-[11px] text-sidebar-text truncate">{user?.email}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Logout Button */}
            <div className={`px-3 pb-4 ${isCollapsed ? 'flex justify-center' : ''}`}>
              <button
                onClick={handleLogout}
                onMouseEnter={(e) => isCollapsed && showTooltip(e, 'Logout')}
                onMouseLeave={hideTooltip}
                className={`
                  flex items-center rounded-xl transition-all duration-200 relative overflow-hidden
                  ${isCollapsed ? 'w-10 h-10 justify-center p-0' : 'w-full gap-3 px-3 py-2.5'}
                  text-sidebar-text hover:text-red-400 hover:bg-red-500/10
                `}
              >
                <FiLogOut className="w-[18px] h-[18px] flex-shrink-0 relative z-10" />
                {!isCollapsed && (
                  <span className="font-medium text-[13px] relative z-10">
                    Logout
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${sidebarCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[280px]'}`}
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

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 p-1.5 lg:p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <div className="relative">
                    <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-primary to-primary-lighter rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md shadow-primary/20">
                      {getInitials()}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-semibold text-gray-900 leading-tight">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-[11px] text-gray-400 font-medium">{role.replace(/_/g, ' ')}</p>
                  </div>
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-20 overflow-hidden animate-slide-down">
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
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>

      <style jsx global>{`
        .sidebar-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.2);
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
