'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  ComposedChart, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
  PieChart, Pie, Cell,
  BarChart, Bar,
} from 'recharts';
import { adminService } from '@/services/admin.service';
import { disputeService } from '@/services/dispute.service';
import { refundService } from '@/services/refund.service';
import {
  FiUsers,
  FiWallet,
  FiCreditCard,
  FiGift,
  FiShield,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiArrowRight,
  FiActivity,
  FiPieChart,
  FiBarChart2,
  FiRefreshCw,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
} from '@/utils/icons';

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 12,
    },
  },
};

const cardHoverVariants: Variants = {
  hover: {
    y: -4,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 10,
    },
  },
};

// Chart colors
const CHART_COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  pink: '#ec4899',
  cyan: '#06b6d4',
};

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

// Dedicated color palettes
const LOYALTY_TIER_COLORS: Record<string, string> = {
  Bronze: '#CD7F32',
  Silver: '#94A3B8',
  Gold: '#F59E0B',
  Platinum: '#6366f1',
};

const TRANSACTION_TYPE_COLORS = ['#6366f1', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#3b82f6'];

// Custom pie chart label with connector lines colored to match each slice
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderOuterLabel = (props: any) => {
  const { cx, cy, midAngle, outerRadius, percent, name, fill } = props;
  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-midAngle * RADIAN);
  const cos = Math.cos(-midAngle * RADIAN);
  const sx = cx + (outerRadius + 4) * cos;
  const sy = cy + (outerRadius + 4) * sin;
  const mx = cx + (outerRadius + 18) * cos;
  const my = cy + (outerRadius + 18) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 20;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';
  const lineColor = fill || '#b0b8c4';

  if (percent < 0.03) return null;

  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={lineColor} fill="none" strokeWidth={1.5} opacity={0.7} />
      <circle cx={ex} cy={ey} r={3} fill={lineColor} />
      <text x={ex + (cos >= 0 ? 8 : -8)} y={ey - 1} textAnchor={textAnchor} fill="#374151" fontSize={11} fontWeight={600}>
        {name}
      </text>
      <text x={ex + (cos >= 0 ? 8 : -8)} y={ey + 13} textAnchor={textAnchor} fill={lineColor} fontSize={10} fontWeight={500}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    </g>
  );
};

// Custom dot for revenue chart active points
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderActiveDot = (props: any) => {
  const { cx, cy, fill } = props;
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill={fill} opacity={0.15} />
      <circle cx={cx} cy={cy} r={5} fill="white" stroke={fill} strokeWidth={2.5} />
    </g>
  );
};


// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    return (
      <div style={{ backgroundColor: isDark ? '#1E293B' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0'}`, borderRadius: 12, padding: '10px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: isDark ? '#F1F5F9' : '#111827', marginBottom: 6 }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ fontSize: 12, color: entry.color }}>
            {entry.name}: ₦{Number(entry.value).toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Revenue stacked-area tooltip — shows Gross (computed), Net, and Fees
const RevenueTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number }>;
  label?: string;
}) => {
  if (!active || !payload || !payload.length) return null;
  const fees = payload.find((p) => p.dataKey === 'fees')?.value ?? 0;
  const net = payload.find((p) => p.dataKey === 'net')?.value ?? 0;
  const gross = fees + net;
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const bg = isDark ? '#1E293B' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb';
  const divider = isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6';
  const labelCol = isDark ? '#F1F5F9' : '#374151';
  const mutedCol = isDark ? '#94A3B8' : '#6b7280';
  const boldCol  = isDark ? '#F1F5F9' : '#111827';
  return (
    <div style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: 14, boxShadow: '0 10px 25px rgba(0,0,0,0.25)', padding: '14px 18px', minWidth: 218 }}>
      <p style={{ color: labelCol, fontWeight: 700, marginBottom: 10, fontSize: 12 }}>{label}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 12, height: 8, borderRadius: 2, background: 'linear-gradient(90deg,#f59e0b,#10b981)' }} />
            <span style={{ color: mutedCol, fontSize: 12 }}>Gross Revenue</span>
          </div>
          <span style={{ color: boldCol, fontSize: 13, fontWeight: 700 }}>₦{Number(gross).toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
            <span style={{ color: mutedCol, fontSize: 12 }}>Net Revenue</span>
          </div>
          <span style={{ color: '#10b981', fontSize: 13, fontWeight: 700 }}>₦{Number(net).toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, paddingTop: 7, borderTop: `1px solid ${divider}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: '#f59e0b' }} />
            <span style={{ color: mutedCol, fontSize: 12 }}>Paystack Fees</span>
          </div>
          <span style={{ color: '#f59e0b', fontSize: 13, fontWeight: 700 }}>₦{Number(fees).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

// Animated counter component
const AnimatedCounter = ({ value, prefix = '', suffix = '' }: { value: number | string; prefix?: string; suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) || 0 : value;

  useEffect(() => {
    if (numericValue === 0) {
      setDisplayValue(0);
      return;
    }
    const duration = 1500;
    const steps = 60;
    const increment = numericValue / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setDisplayValue(numericValue);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [numericValue]);

  return (
    <span>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
};

export default function AdminDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersSearchInput, setUsersSearchInput] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  const usersPerPage = 5;
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['admin'] });
    await queryClient.invalidateQueries({ queryKey: ['disputes'] });
    await queryClient.invalidateQueries({ queryKey: ['refunds'] });
    setIsRefreshing(false);
  };

  // Fetch dashboard summary
  const { data: dashboardSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminService.getDashboardSummary(),
    staleTime: 30000,
    retry: 1,
  });

  // Compute date range from selected period (shared by multiple queries)
  const dateRange = (() => {
    const endDate = new Date();
    const startDate = new Date();
    if (selectedPeriod === 'week') {
      startDate.setDate(endDate.getDate() - 7);
    } else if (selectedPeriod === 'month') {
      startDate.setDate(endDate.getDate() - 30);
    } else {
      startDate.setFullYear(endDate.getFullYear() - 1);
    }
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  })();

  // Fetch transaction stats
  const { data: transactionStats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'transactions', 'stats', selectedPeriod],
    queryFn: () => adminService.getTransactionStats(dateRange.startDate, dateRange.endDate),
    staleTime: 30000,
    retry: 1,
  });

  // Fetch user stats
  const { data: userStats, isLoading: userStatsLoading } = useQuery({
    queryKey: ['admin', 'users', 'stats'],
    queryFn: () => adminService.getUserStats(),
    staleTime: 30000,
    retry: 1,
  });

  // Debounced search handler
  const handleUsersSearchChange = (value: string) => {
    setUsersSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setUsersSearch(value);
      setUsersPage(1);
    }, 400);
  };

  // Fetch recent users
  const { data: recentUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users', 'recent', usersSearch, usersPage],
    queryFn: () => adminService.getUsers({
      page: usersPage,
      limit: usersPerPage,
      ...(usersSearch ? { search: usersSearch } : {}),
    }),
    staleTime: 30000,
    retry: 1,
  });

  // Fetch revenue report — staleTime:0 so switching back to a period always re-fetches fresh data
  const { data: revenueReport, isLoading: revenueLoading } = useQuery({
    queryKey: ['admin', 'revenue', selectedPeriod, dateRange.startDate, dateRange.endDate],
    queryFn: () => adminService.getRevenueReport({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      groupBy: selectedPeriod === 'year' ? 'month' : 'day',
    }),
    staleTime: 0,
    retry: 1,
  });

  // Fetch pending disputes (for count only)
  const { data: disputes } = useQuery({
    queryKey: ['disputes', 'pending'],
    queryFn: () => disputeService.getDisputes({ status: 'OPEN', page: 1, limit: 1 }),
    retry: 1,
  });

  // Fetch pending refunds (for count only)
  const { data: refunds } = useQuery({
    queryKey: ['refunds', 'pending'],
    queryFn: () => refundService.getRefunds({ status: 'PENDING', page: 1, limit: 1 }),
    retry: 1,
  });

  // Fetch gateway stats
  const { data: gatewayStats } = useQuery({
    queryKey: ['admin', 'gateway-stats'],
    queryFn: () => adminService.getGatewayStats(),
    staleTime: 30000,
    retry: 1,
  });

  // Use API data with proper nullish coalescing (not ||, which treats 0 as falsy)
  const revenueChartData = revenueReport?.breakdown?.length
    ? revenueReport.breakdown.map((item) => {
        const revenue = typeof item.revenue === 'number' ? item.revenue : parseFloat(String(item.revenue)) || 0;
        const fees = typeof item.fees === 'number' ? item.fees : parseFloat(String(item.fees)) || 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const count = typeof (item as any).count === 'number' ? (item as any).count as number : 0;
        return {
          name: new Date(item.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue,
          fees,
          net: revenue - fees,
          count,
        };
      })
    : [];

  const chartTotalRevenue = revenueChartData.reduce((sum, d) => sum + (d.revenue || 0), 0);
  const chartTotalFees = revenueChartData.reduce((sum, d) => sum + (d.fees || 0), 0);
  const chartTotalNet = chartTotalRevenue - chartTotalFees;
  const chartFeePercentage = chartTotalRevenue > 0 ? (chartTotalFees / chartTotalRevenue) * 100 : 0;
  const chartAvgPerDay = revenueChartData.length > 0 ? Math.round(chartTotalRevenue / revenueChartData.length) : 0;
  const chartHighestDay = revenueChartData.reduce(
    (best, d) => (d.revenue > best.revenue ? d : best),
    { name: '–', revenue: 0, fees: 0, net: 0, count: 0 },
  );
  const chartAvgRevenue = revenueChartData.length > 0 ? chartTotalRevenue / revenueChartData.length : 0;

  const transactionTypeData = transactionStats?.byType && Object.keys(transactionStats.byType).length > 0
    ? Object.entries(transactionStats.byType)
        .filter(([name]) => name === 'WALLET_FUNDING' || name === 'PAYMENT')
        .map(([name, value]) => ({
          name: name.replace(/_/g, ' '),
          // Backend byType values can be { count, volume } objects or plain numbers
          value: typeof value === 'object' && value !== null ? (value as any).count ?? 0 : (value as number),
        }))
    : [];

  const transactionStatusData = transactionStats?.byStatus && Object.keys(transactionStats.byStatus).length > 0
    ? Object.entries(transactionStats.byStatus).map(([name, value]) => ({
        name,
        value: value as number,
      }))
    : [];

  const userRoleData = userStats?.byRole && Object.keys(userStats.byRole).length > 0
    ? Object.entries(userStats.byRole).map(([name, value]) => ({
        name: name.replace(/_/g, ' '),
        value: value as number,
      }))
    : [];

  const userTierData = userStats?.byTier && Object.keys(userStats.byTier).length > 0
    ? Object.entries(userStats.byTier).map(([name, value]) => ({
        name,
        value: value as number,
      }))
    : [];

  // Get actual values with nullish coalescing to preserve 0 values
  const totalUsers = dashboardSummary?.users?.total ?? userStats?.total ?? 0;
  const totalRevenue = dashboardSummary?.revenue?.rolling30Days ?? dashboardSummary?.revenue?.thisMonth ?? 0;
  const growthPercentage = dashboardSummary?.revenue?.growthPercentage ?? 0;
  const totalTransactions = transactionStats?.totalCount ?? 0;
  const walletBalance = dashboardSummary?.totalWalletBalance ?? '0';
  const pendingDisputes = dashboardSummary?.pendingActions?.disputes ?? disputes?.total ?? 0;
  const pendingRefunds = dashboardSummary?.pendingActions?.refunds ?? refunds?.total ?? 0;
  const newUsersThisMonth = dashboardSummary?.users?.newThisMonth ?? 0;
  const successRate = transactionStats?.successRate ?? 0;

  const usersToDisplay = recentUsers?.data ?? [];
  const usersTotalPages = Math.ceil((recentUsers?.total ?? 0) / usersPerPage);
  const usersTotalCount = recentUsers?.total ?? 0;

  // Stat cards configuration
  const statCards = [
    {
      label: 'Total Users',
      value: totalUsers,
      icon: <FiUsers className="w-6 h-6" />,
      gradient: 'from-blue-500 to-blue-600',
      bgGlow: 'bg-blue-500/20',
      change: `+${newUsersThisMonth} this month`,
      trend: 'up' as const,
      href: '/dashboard/users',
    },
    {
      label: 'Last 30 Days Revenue',
      value: totalRevenue,
      icon: <FiWallet className="w-6 h-6" />,
      gradient: 'from-emerald-500 to-emerald-600',
      bgGlow: 'bg-emerald-500/20',
      change: `${growthPercentage >= 0 ? '+' : ''}${growthPercentage}% vs prev. month`,
      trend: growthPercentage >= 0 ? 'up' as const : 'down' as const,
      isAmount: true,
      href: '/dashboard/reports',
    },
    {
      label: 'Transactions',
      value: totalTransactions,
      icon: <FiCreditCard className="w-6 h-6" />,
      gradient: 'from-purple-500 to-purple-600',
      bgGlow: 'bg-purple-500/20',
      change: `${successRate.toFixed(1)}% success rate`,
      trend: 'up' as const,
      href: '/dashboard/transactions',
    },
    {
      label: 'Wallet Balance',
      value: walletBalance,
      icon: <FiDollarSign className="w-6 h-6" />,
      gradient: 'from-cyan-500 to-cyan-600',
      bgGlow: 'bg-cyan-500/20',
      change: 'Total in wallets',
      trend: 'up' as const,
      isAmount: true,
      href: '/dashboard/wallets',
    },
    {
      label: 'Pending Disputes',
      value: pendingDisputes,
      icon: <FiShield className="w-6 h-6" />,
      gradient: 'from-amber-500 to-amber-600',
      bgGlow: 'bg-amber-500/20',
      change: 'Requires attention',
      trend: 'down' as const,
      href: '/dashboard/disputes',
    },
    {
      label: 'Pending Refunds',
      value: pendingRefunds,
      icon: <FiRefreshCw className="w-6 h-6" />,
      gradient: 'from-rose-500 to-rose-600',
      bgGlow: 'bg-rose-500/20',
      change: 'Requires attention',
      trend: 'down' as const,
      href: '/dashboard/refunds',
    },
  ];

  const isLoading = summaryLoading || statsLoading || userStatsLoading || isRefreshing;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25">
            <FiActivity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#E5B887]">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm">System overview and management</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
            title="Refresh dashboard"
          >
            <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            whileHover="hover"
            onClick={() => card.href && router.push(card.href)}
          >
            <motion.div
              variants={cardHoverVariants}
              className="relative overflow-hidden bg-white rounded-2xl p-5 border border-gray-100 shadow-sm cursor-pointer"
            >
              {/* Background glow */}
              <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full ${card.bgGlow} blur-2xl opacity-60`} />

              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-lg`}>
                    {card.icon}
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${
                    card.trend === 'up' ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {card.trend === 'up' ? (
                      <FiTrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <FiTrendingDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-1 font-medium">{card.label}</p>
                <p className="text-xl font-bold text-gray-900">
                  {card.isAmount ? (
                    <>₦<AnimatedCounter value={card.value} /></>
                  ) : (
                    <AnimatedCounter value={card.value} />
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-1.5">{card.change}</p>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      {/* Revenue Trend Chart — Full Width */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl shadow-sm border border-gray-100 bg-white"
      >
        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <FiActivity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Revenue Trend</h2>
                <p className="text-sm text-gray-500">Net Revenue <span className="text-gray-300">+</span> Fees <span className="text-gray-300">=</span> Gross Revenue</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Period Selector */}
              <div className="flex rounded-xl bg-gray-100 p-1">
                {(['week', 'month', 'year'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      selectedPeriod === period
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-emerald-700 font-medium">Net Revenue</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
                  <div className="w-3 h-2 rounded-sm bg-amber-400" />
                  <span className="text-amber-700 font-medium">Paystack Fees</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5-metric summary strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-gray-100 rounded-xl overflow-hidden mb-6 border border-gray-100">
            <div className="bg-white p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Gross Revenue</p>
              <p className="text-xl font-bold text-gray-900 mt-1">₦{chartTotalRevenue.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-0.5">Total received</p>
            </div>
            <div className="bg-white p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Net Revenue</p>
              <p className="text-xl font-bold text-indigo-600 mt-1">₦{chartTotalNet.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-0.5">After fees</p>
            </div>
            <div className="bg-white p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Paystack Fees</p>
              <p className="text-xl font-bold text-amber-500 mt-1">₦{chartTotalFees.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-0.5">Processing cost</p>
            </div>
            <div className="bg-white p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Fee Rate</p>
              <p className="text-xl font-bold text-rose-500 mt-1">{chartFeePercentage.toFixed(2)}%</p>
              <div className="w-full h-1 bg-gray-100 rounded-full mt-2">
                <div
                  className="h-1 bg-gradient-to-r from-amber-400 to-rose-400 rounded-full"
                  style={{ width: `${Math.min(chartFeePercentage * 10, 100)}%` }}
                />
              </div>
            </div>
            <div className="bg-white p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Avg / Period</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">₦{chartAvgPerDay.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-0.5">Per day</p>
            </div>
          </div>

          {/* Stacked Area Chart — fees (amber, bottom) + net (emerald, top) = gross revenue */}
          <div className="h-72">
            {revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="feesStackGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.15} />
                    </linearGradient>
                    <linearGradient id="netStackGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v >= 1000000
                        ? `₦${(v / 1000000).toFixed(1)}M`
                        : v >= 1000
                        ? `₦${(v / 1000).toFixed(0)}k`
                        : `₦${v}`
                    }
                  />
                  <Tooltip
                    content={<RevenueTooltip />}
                    cursor={{ stroke: 'rgba(0,0,0,0.08)', strokeWidth: 1 }}
                  />
                  <ReferenceLine
                    y={chartAvgRevenue}
                    stroke="rgba(148,163,184,0.4)"
                    strokeDasharray="6 3"
                    strokeWidth={1}
                    label={{ value: 'Avg', fill: '#94A3B8', fontSize: 10, position: 'insideTopRight' }}
                  />
                  {/* Bottom slice: Paystack Fees */}
                  <Area
                    type="monotone"
                    stackId="stack"
                    dataKey="fees"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    fill="url(#feesStackGrad)"
                    name="fees"
                    animationDuration={1200}
                    dot={{ r: 4, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
                    activeDot={renderActiveDot}
                  />
                  {/* Top slice: Net Revenue */}
                  <Area
                    type="monotone"
                    stackId="stack"
                    dataKey="net"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#netStackGrad)"
                    name="net"
                    animationDuration={1500}
                    dot={{ r: 4, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                    activeDot={renderActiveDot}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-sm">{revenueLoading ? 'Loading...' : 'No revenue data yet'}</p>
              </div>
            )}
          </div>

          {/* Footer insights */}
          <div className="flex flex-wrap items-center gap-6 mt-5 pt-5 border-t border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                <FiTrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Peak Day</p>
                <p className="text-sm font-bold text-gray-900">
                  {chartHighestDay.name}{' '}
                  <span className="text-emerald-600">₦{chartHighestDay.revenue.toLocaleString()}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                <FiActivity className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Net Efficiency</p>
                <p className="text-sm font-bold text-gray-900">
                  {chartTotalRevenue > 0 ? ((chartTotalNet / chartTotalRevenue) * 100).toFixed(1) : '0'}
                  <span className="text-gray-400 font-normal text-xs">% retained</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
                <FiCreditCard className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Transactions in Period</p>
                <p className="text-sm font-bold text-gray-900">
                  {revenueChartData.reduce((sum, d) => sum + (d.count || 0), 0) || '–'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Charts Row — Transaction Types & User Roles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Distribution Chart */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                <FiPieChart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Transaction Types</h2>
                <p className="text-sm text-gray-500">Distribution by type</p>
              </div>
            </div>
          </div>
          <div className="h-72">
            {transactionTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={transactionTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={renderOuterLabel}
                    labelLine={false}
                    animationBegin={0}
                    animationDuration={1500}
                  >
                    {transactionTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={TRANSACTION_TYPE_COLORS[index % TRANSACTION_TYPE_COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [(value as number).toLocaleString(), 'Count']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', backgroundColor: typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? '#1E293B' : '#ffffff', color: typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? '#F1F5F9' : '#111827' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-sm">{statsLoading ? 'Loading...' : 'No transaction data yet'}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* User Roles Distribution */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
              <FiUsers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">User Roles</h2>
              <p className="text-sm text-gray-500">By role type</p>
            </div>
          </div>
          <div className="h-56">
            {userRoleData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userRoleData} layout="vertical" barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" horizontal={true} vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip formatter={(value) => [(value as number).toLocaleString(), 'Users']} />
                  <Bar
                    dataKey="value"
                    fill={CHART_COLORS.primary}
                    radius={[0, 6, 6, 0]}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-sm">{userStatsLoading ? 'Loading...' : 'No user data yet'}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Charts Row — Loyalty Tiers & Transaction Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loyalty Tiers Distribution */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-lg">
              <FiGift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Loyalty Tiers</h2>
              <p className="text-sm text-gray-500">User distribution</p>
            </div>
          </div>
          <div className="h-64">
            {userTierData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userTierData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                    label={renderOuterLabel}
                    labelLine={false}
                    animationDuration={1500}
                  >
                    {userTierData.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={LOYALTY_TIER_COLORS[entry.name] || PIE_COLORS[0]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [(value as number).toLocaleString(), 'Users']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', backgroundColor: typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? '#1E293B' : '#ffffff', color: typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? '#F1F5F9' : '#111827' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-sm">{userStatsLoading ? 'Loading...' : 'No tier data yet'}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Transaction Status */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg">
              <FiBarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Transaction Status</h2>
              <p className="text-sm text-gray-500">By status</p>
            </div>
          </div>
          <div className="h-56">
            {transactionStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={transactionStatusData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => [(value as number).toLocaleString(), 'Count']} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={1500}>
                    {transactionStatusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.name === 'Completed' || entry.name === 'SUCCESS' || entry.name === 'SUCCESSFUL'
                            ? CHART_COLORS.success
                            : entry.name === 'Pending' || entry.name === 'PENDING'
                            ? CHART_COLORS.warning
                            : entry.name === 'Failed' || entry.name === 'FAILED'
                            ? CHART_COLORS.danger
                            : PIE_COLORS[index % PIE_COLORS.length]
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-sm">{statsLoading ? 'Loading...' : 'No status data yet'}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Payment Gateway Stats */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Paystack */}
          {(() => {
            const gw = gatewayStats?.gateways?.find((g: any) => g.gateway?.toLowerCase().includes('paystack'));
            const successRate = gw && gw.totalTransactions > 0
              ? ((gw.successfulTransactions / gw.totalTransactions) * 100).toFixed(1)
              : '0';
            const failedCount = gw?.byStatus
              ? Object.entries(gw.byStatus)
                  .filter(([s]) => s === 'FAILED' || s === 'failed')
                  .reduce((sum, [, v]: [string, any]) => sum + (v?.count ?? 0), 0)
              : 0;
            return (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-blue-500/10 blur-xl" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-md">P</div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">Paystack</p>
                        <div className={`flex items-center gap-1 mt-0.5 ${gw ? 'text-emerald-500' : 'text-gray-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${gw ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                          <span className="text-[10px] font-semibold">{gw ? 'Live' : 'No data'}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{successRate}%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 bg-gray-50 rounded-xl">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Transactions</p>
                      <p className="text-lg font-bold text-gray-900 mt-0.5">{(gw?.totalTransactions ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded-xl">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Volume</p>
                      <p className="text-lg font-bold text-gray-900 mt-0.5">₦{Number(gw?.totalVolume ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="p-2.5 bg-emerald-50 rounded-xl">
                      <p className="text-[10px] text-emerald-600 uppercase tracking-wide font-semibold">Successful</p>
                      <p className="text-lg font-bold text-emerald-700 mt-0.5">{(gw?.successfulTransactions ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="p-2.5 bg-red-50 rounded-xl">
                      <p className="text-[10px] text-red-500 uppercase tracking-wide font-semibold">Failed</p>
                      <p className="text-lg font-bold text-red-600 mt-0.5">{failedCount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* OPay */}
          {(() => {
            const gw = gatewayStats?.gateways?.find((g: any) => g.gateway?.toLowerCase().includes('opay'));
            const successRate = gw && gw.totalTransactions > 0
              ? ((gw.successfulTransactions / gw.totalTransactions) * 100).toFixed(1)
              : '0';
            const failedCount = gw?.byStatus
              ? Object.entries(gw.byStatus)
                  .filter(([s]) => s === 'FAILED' || s === 'failed')
                  .reduce((sum, [, v]: [string, any]) => sum + (v?.count ?? 0), 0)
              : 0;
            return (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-green-500/10 blur-xl" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center text-white font-black text-xs shadow-md">O</div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">OPay</p>
                        <div className={`flex items-center gap-1 mt-0.5 ${gw ? 'text-emerald-500' : 'text-gray-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${gw ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                          <span className="text-[10px] font-semibold">{gw ? 'Live' : 'No data'}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">{successRate}%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 bg-gray-50 rounded-xl">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Transactions</p>
                      <p className="text-lg font-bold text-gray-900 mt-0.5">{(gw?.totalTransactions ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded-xl">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Volume</p>
                      <p className="text-lg font-bold text-gray-900 mt-0.5">₦{Number(gw?.totalVolume ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="p-2.5 bg-emerald-50 rounded-xl">
                      <p className="text-[10px] text-emerald-600 uppercase tracking-wide font-semibold">Successful</p>
                      <p className="text-lg font-bold text-emerald-700 mt-0.5">{(gw?.successfulTransactions ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="p-2.5 bg-red-50 rounded-xl">
                      <p className="text-[10px] text-red-500 uppercase tracking-wide font-semibold">Failed</p>
                      <p className="text-lg font-bold text-red-600 mt-0.5">{failedCount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Moniepoint (mock) */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-purple-500/10 blur-xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white font-black text-xs shadow-md">M</div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Moniepoint</p>
                    <div className="flex items-center gap-1 mt-0.5 text-amber-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span className="text-[10px] font-semibold">Coming soon</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">—</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-gray-50 rounded-xl">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Transactions</p>
                  <p className="text-lg font-bold text-gray-400 mt-0.5">—</p>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-xl">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Volume</p>
                  <p className="text-lg font-bold text-gray-400 mt-0.5">—</p>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-xl">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Successful</p>
                  <p className="text-lg font-bold text-gray-400 mt-0.5">—</p>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-xl">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Failed</p>
                  <p className="text-lg font-bold text-gray-400 mt-0.5">—</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent Users — full width */}
      <div className="grid grid-cols-1 gap-6">
        {/* Recent Users */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg">
                <FiUsers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Recent Users</h2>
                {usersTotalCount > 0 && (
                  <p className="text-xs text-gray-400">{usersTotalCount} total</p>
                )}
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/dashboard/users')}
              className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2 text-sm"
            >
              View All <FiArrowRight className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={usersSearchInput}
              onChange={(e) => handleUsersSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all placeholder:text-gray-400"
            />
          </div>

          {usersToDisplay.length > 0 ? (
            <>
              <div className="overflow-x-auto flex-1">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 min-w-[160px]">User</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 min-w-[180px]">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 min-w-[120px]">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 min-w-[100px]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence mode="wait">
                      {usersToDisplay.map((user, index) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                          onClick={() => router.push(`/dashboard/users/${user.id}`)}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xs shadow-sm flex-shrink-0">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm whitespace-nowrap">
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-xs text-gray-400 whitespace-nowrap">{user.phoneNumber}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">{user.email}</td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {user.role?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              user.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-700'
                                : user.status === 'SUSPENDED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {user.status}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {usersTotalPages > 1 && (
                <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Page {usersPage} of {usersTotalPages}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                      disabled={usersPage <= 1}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setUsersPage((p) => Math.min(usersTotalPages, p + 1))}
                      disabled={usersPage >= usersTotalPages}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <FiUsers className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">
                {usersLoading ? 'Loading...' : usersSearch ? 'No users match your search' : 'No users yet'}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
