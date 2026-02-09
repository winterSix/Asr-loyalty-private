'use client';

import React, { useState, useEffect } from 'react';
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

const DRAWER_WIDTH = 280;
const DRAWER_WIDTH_COLLAPSED = 72;

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: string;
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

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
  const currentPageLabel = allNavItems.find(
    (item) => pathname === item.path || pathname?.startsWith(item.path + '/')
  )?.label || 'Dashboard';

  const sidebarWidth = sidebarCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;

  // Get initials for avatar
  const getInitials = () => {
    const first = user?.firstName?.[0] || '';
    const last = user?.lastName?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-white z-50
          transition-all duration-300 ease-in-out
          lg:translate-x-0 shadow-xl lg:shadow-none lg:border-r lg:border-gray-200
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ width: mobileOpen ? DRAWER_WIDTH : sidebarWidth }}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="h-16 bg-gradient-to-r from-primary to-primary-light flex items-center px-4 relative">
            <div className={`flex items-center gap-3 transition-all duration-300 ${sidebarCollapsed && !mobileOpen ? 'w-full justify-center' : ''}`}>
              <div className={`flex-shrink-0 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm ${sidebarCollapsed && !mobileOpen ? 'w-10 h-10' : ''}`}>
                <span className="text-xl font-bold text-white">A</span>
              </div>
              <div className={`transition-all duration-300 overflow-hidden ${sidebarCollapsed && !mobileOpen ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                <h1 className="text-lg font-bold text-white whitespace-nowrap">ASR Loyalty</h1>
                <p className="text-xs text-white/80 whitespace-nowrap">{role.replace(/_/g, ' ')}</p>
              </div>
            </div>

            {/* Collapse toggle button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white text-primary rounded-full shadow-lg items-center justify-center hover:scale-110 transition-all border border-gray-200"
            >
              {sidebarCollapsed ? <FiChevronRight className="w-3.5 h-3.5" /> : <FiChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 sidebar-scrollbar">
            <div className="space-y-6 px-3">
              {navSections.map((section) => (
                <div key={section.title}>
                  {/* Section Title */}
                  <div className={`mb-2 transition-all duration-300 ${sidebarCollapsed && !mobileOpen ? 'px-0' : 'px-3'}`}>
                    {sidebarCollapsed && !mobileOpen ? (
                      <div className="h-px bg-gray-200 my-2" />
                    ) : (
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        {section.title}
                      </span>
                    )}
                  </div>

                  {/* Section Items */}
                  <ul className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
                      return (
                        <li key={item.path} className="relative">
                          <button
                            onClick={() => {
                              router.push(item.path);
                              setMobileOpen(false);
                            }}
                            className={`
                              w-full flex items-center gap-3 rounded-xl
                              transition-all duration-200 group relative
                              ${sidebarCollapsed && !mobileOpen ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'}
                              ${
                                isActive
                                  ? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-md shadow-primary/30'
                                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                              }
                            `}
                          >
                            <span className={`flex-shrink-0 transition-all duration-200 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-primary'}`}>
                              <span className="text-lg">{item.icon}</span>
                            </span>
                            <span className={`font-medium text-sm transition-all duration-300 whitespace-nowrap ${sidebarCollapsed && !mobileOpen ? 'w-0 opacity-0 overflow-hidden' : 'opacity-100'}`}>
                              {item.label}
                            </span>
                            {item.badge && !(sidebarCollapsed && !mobileOpen) && (
                              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                                {item.badge}
                              </span>
                            )}
                          </button>

                          {/* Tooltip for collapsed state */}
                          {sidebarCollapsed && !mobileOpen && (
                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-[60] shadow-lg">
                              {item.label}
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45" />
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </nav>

          {/* User Section & Logout */}
          <div className="border-t border-gray-200">
            {/* User Info */}
            <div className={`p-3 ${sidebarCollapsed && !mobileOpen ? 'flex justify-center' : ''}`}>
              <div className={`flex items-center gap-3 ${sidebarCollapsed && !mobileOpen ? '' : 'px-2'}`}>
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-md">
                  {getInitials()}
                </div>
                <div className={`flex-1 min-w-0 transition-all duration-300 ${sidebarCollapsed && !mobileOpen ? 'w-0 opacity-0 overflow-hidden' : 'opacity-100'}`}>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <div className={`px-3 pb-3 ${sidebarCollapsed && !mobileOpen ? 'flex justify-center' : ''}`}>
              <button
                onClick={handleLogout}
                className={`
                  flex items-center gap-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 group
                  ${sidebarCollapsed && !mobileOpen ? 'w-10 h-10 justify-center p-0' : 'w-full px-3 py-2.5'}
                `}
              >
                <FiLogOut className="w-5 h-5 flex-shrink-0" />
                <span className={`font-medium text-sm transition-all duration-300 ${sidebarCollapsed && !mobileOpen ? 'w-0 opacity-0 overflow-hidden' : 'opacity-100'}`}>
                  Logout
                </span>
              </button>

              {/* Logout Tooltip for collapsed state */}
              {sidebarCollapsed && !mobileOpen && (
                <div className="absolute left-full bottom-3 ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-[60] shadow-lg pointer-events-none">
                  Logout
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45" />
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'}`}
      >
        {/* Top bar / Header */}
        <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-200 z-30 shadow-sm h-16">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
              >
                {mobileOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
              </button>
              <div>
                <h2 className="text-lg lg:text-xl font-bold text-gray-900">{currentPageLabel}</h2>
                <p className="text-xs lg:text-sm text-gray-500 hidden sm:block">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
              {/* Notifications */}
              <button
                onClick={() => router.push('/dashboard/notifications')}
                className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <FiBell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 lg:gap-3 p-1.5 lg:p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                    {getInitials()}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-semibold text-gray-900 leading-tight">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{role.replace(/_/g, ' ')}</p>
                  </div>
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-20 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <p className="text-sm font-semibold text-gray-900">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => {
                            router.push('/dashboard/profile');
                            setUserMenuOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700 transition-colors"
                        >
                          <FiUser className="w-4 h-4 text-gray-400" />
                          Profile
                        </button>
                        <button
                          onClick={() => {
                            router.push('/dashboard/settings');
                            setUserMenuOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700 transition-colors"
                        >
                          <FiSettings className="w-4 h-4 text-gray-400" />
                          Settings
                        </button>
                      </div>
                      <div className="border-t border-gray-100 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-2.5 text-left hover:bg-red-50 text-red-600 flex items-center gap-3 text-sm transition-colors"
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

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>

      {/* Global style for sidebar scroll */}
      <style jsx global>{`
        .sidebar-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 4px;
        }
        .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
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
