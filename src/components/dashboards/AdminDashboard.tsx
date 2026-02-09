'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
  ComposedChart, Line,
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
  FiEye,
  FiActivity,
  FiPieChart,
  FiBarChart2,
  FiRefreshCw,
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

// Demo data for visualization when API data is not available
const DEMO_REVENUE_DATA = [
  { name: 'Jan 1', revenue: 45000, fees: 4500 },
  { name: 'Jan 5', revenue: 52000, fees: 5200 },
  { name: 'Jan 10', revenue: 48000, fees: 4800 },
  { name: 'Jan 15', revenue: 61000, fees: 6100 },
  { name: 'Jan 20', revenue: 55000, fees: 5500 },
  { name: 'Jan 25', revenue: 67000, fees: 6700 },
  { name: 'Jan 30', revenue: 72000, fees: 7200 },
];

const DEMO_TRANSACTION_TYPES = [
  { name: 'Payments', value: 450 },
  { name: 'Transfers', value: 280 },
  { name: 'Rewards', value: 180 },
  { name: 'Refunds', value: 45 },
];

const DEMO_USER_ROLES = [
  { name: 'Customer', value: 1250 },
  { name: 'Admin', value: 12 },
  { name: 'Cashier', value: 35 },
  { name: 'Support', value: 8 },
];

const DEMO_LOYALTY_TIERS = [
  { name: 'Bronze', value: 650 },
  { name: 'Silver', value: 380 },
  { name: 'Gold', value: 180 },
  { name: 'Platinum', value: 45 },
];

const DEMO_TRANSACTION_STATUS = [
  { name: 'Completed', value: 850 },
  { name: 'Pending', value: 120 },
  { name: 'Failed', value: 30 },
];

const DEMO_USERS = [
  { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', phoneNumber: '+234 801 234 5678', role: 'CUSTOMER', status: 'ACTIVE' },
  { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', phoneNumber: '+234 802 345 6789', role: 'CUSTOMER', status: 'ACTIVE' },
  { id: '3', firstName: 'Mike', lastName: 'Johnson', email: 'mike@example.com', phoneNumber: '+234 803 456 7890', role: 'ADMIN', status: 'ACTIVE' },
  { id: '4', firstName: 'Sarah', lastName: 'Williams', email: 'sarah@example.com', phoneNumber: '+234 804 567 8901', role: 'CUSTOMER', status: 'SUSPENDED' },
  { id: '5', firstName: 'David', lastName: 'Brown', email: 'david@example.com', phoneNumber: '+234 805 678 9012', role: 'CASHIER', status: 'ACTIVE' },
];

const DEMO_DISPUTES = [
  { id: '1', reason: 'Transaction not credited', createdAt: new Date().toISOString() },
  { id: '2', reason: 'Duplicate charge', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: '3', reason: 'Unauthorized transaction', createdAt: new Date(Date.now() - 172800000).toISOString() },
];

const DEMO_REFUNDS = [
  { id: '1', amount: '15000', status: 'PENDING', createdAt: new Date().toISOString() },
  { id: '2', amount: '8500', status: 'PENDING', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: '3', amount: '25000', status: 'PENDING', createdAt: new Date(Date.now() - 172800000).toISOString() },
];

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100">
        <p className="text-sm font-semibold text-gray-900 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: ₦{Number(entry.value).toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
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
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  // Fetch dashboard summary
  const { data: dashboardSummary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminService.getDashboardSummary(),
    staleTime: 30000,
    retry: 1,
  });

  // Fetch transaction stats
  const { data: transactionStats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'transactions', 'stats'],
    queryFn: () => adminService.getTransactionStats(),
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

  // Fetch recent users
  const { data: recentUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users', 'recent'],
    queryFn: () => adminService.getUsers({ page: 1, limit: 5 }),
    staleTime: 30000,
    retry: 1,
  });

  // Fetch revenue report
  const { data: revenueReport, isLoading: revenueLoading } = useQuery({
    queryKey: ['admin', 'revenue', selectedPeriod],
    queryFn: () => {
      const endDate = new Date();
      const startDate = new Date();
      if (selectedPeriod === 'week') {
        startDate.setDate(endDate.getDate() - 7);
      } else if (selectedPeriod === 'month') {
        startDate.setDate(endDate.getDate() - 30);
      } else {
        startDate.setFullYear(endDate.getFullYear() - 1);
      }
      return adminService.getRevenueReport({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        groupBy: selectedPeriod === 'year' ? 'month' : 'day',
      });
    },
    staleTime: 60000,
    retry: 1,
  });

  // Fetch pending disputes
  const { data: disputes } = useQuery({
    queryKey: ['disputes', 'pending'],
    queryFn: () => disputeService.getDisputes({ status: 'OPEN', page: 1, limit: 5 }),
    retry: 1,
  });

  // Fetch pending refunds
  const { data: refunds } = useQuery({
    queryKey: ['refunds', 'pending'],
    queryFn: () => refundService.getRefunds({ status: 'PENDING', page: 1, limit: 5 }),
    retry: 1,
  });

  // Use API data or fall back to demo data
  const revenueChartData = revenueReport?.breakdown?.length
    ? revenueReport.breakdown.map((item) => ({
        name: new Date(item.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: parseFloat(item.revenue) || 0,
        fees: parseFloat(item.fees) || 0,
      }))
    : DEMO_REVENUE_DATA;

  const transactionTypeData = transactionStats?.byType && Object.keys(transactionStats.byType).length > 0
    ? Object.entries(transactionStats.byType).map(([name, value]) => ({
        name: name.replace(/_/g, ' '),
        value: value as number,
      }))
    : DEMO_TRANSACTION_TYPES;

  const transactionStatusData = transactionStats?.byStatus && Object.keys(transactionStats.byStatus).length > 0
    ? Object.entries(transactionStats.byStatus).map(([name, value]) => ({
        name,
        value: value as number,
      }))
    : DEMO_TRANSACTION_STATUS;

  const userRoleData = userStats?.byRole && Object.keys(userStats.byRole).length > 0
    ? Object.entries(userStats.byRole).map(([name, value]) => ({
        name: name.replace(/_/g, ' '),
        value: value as number,
      }))
    : DEMO_USER_ROLES;

  const userTierData = userStats?.byTier && Object.keys(userStats.byTier).length > 0
    ? Object.entries(userStats.byTier).map(([name, value]) => ({
        name,
        value: value as number,
      }))
    : DEMO_LOYALTY_TIERS;

  // Get actual values or demo values
  const totalUsers = dashboardSummary?.users?.total || userStats?.total || 1305;
  const totalRevenue = dashboardSummary?.revenue?.thisMonth || '2450000';
  const totalTransactions = transactionStats?.totalCount || 1000;
  const walletBalance = dashboardSummary?.totalWalletBalance || '5800000';
  const pendingDisputes = dashboardSummary?.pendingActions?.disputes || disputes?.total || 3;
  const pendingRefunds = dashboardSummary?.pendingActions?.refunds || refunds?.total || 3;
  const newUsersThisMonth = dashboardSummary?.users?.newThisMonth || 128;
  const revenueGrowth = dashboardSummary?.revenue?.growthPercentage || 12.5;
  const successRate = transactionStats?.successRate || 94.5;
  const todaysRevenue = dashboardSummary?.revenue?.today || '85000';
  const newUsersToday = dashboardSummary?.users?.newToday || 12;
  const activeUsers = dashboardSummary?.users?.active || 890;

  const usersToDisplay = recentUsers?.data?.length ? recentUsers.data : DEMO_USERS;
  const disputesToDisplay = disputes?.data?.length ? disputes.data : DEMO_DISPUTES;
  const refundsToDisplay = refunds?.data?.length ? refunds.data : DEMO_REFUNDS;

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
    },
    {
      label: 'Total Revenue',
      value: totalRevenue,
      icon: <FiWallet className="w-6 h-6" />,
      gradient: 'from-emerald-500 to-emerald-600',
      bgGlow: 'bg-emerald-500/20',
      change: `${revenueGrowth > 0 ? '+' : ''}${revenueGrowth.toFixed(1)}% growth`,
      trend: revenueGrowth >= 0 ? 'up' as const : 'down' as const,
      isAmount: true,
    },
    {
      label: 'Transactions',
      value: totalTransactions,
      icon: <FiCreditCard className="w-6 h-6" />,
      gradient: 'from-purple-500 to-purple-600',
      bgGlow: 'bg-purple-500/20',
      change: `${successRate.toFixed(1)}% success rate`,
      trend: 'up' as const,
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
    },
    {
      label: 'Pending Disputes',
      value: pendingDisputes,
      icon: <FiShield className="w-6 h-6" />,
      gradient: 'from-amber-500 to-amber-600',
      bgGlow: 'bg-amber-500/20',
      change: 'Requires attention',
      trend: 'down' as const,
    },
    {
      label: 'Pending Refunds',
      value: pendingRefunds,
      icon: <FiRefreshCw className="w-6 h-6" />,
      gradient: 'from-rose-500 to-rose-600',
      bgGlow: 'bg-rose-500/20',
      change: 'Requires attention',
      trend: 'down' as const,
    },
  ];

  const isLoading = summaryLoading || statsLoading || userStatsLoading;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">System overview and management</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => refetchSummary()}
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </motion.button>
          <div className="flex rounded-xl bg-gray-100 p-1">
            {(['week', 'month', 'year'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  selectedPeriod === period
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            whileHover="hover"
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
                <FiActivity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Revenue Trend</h2>
                <p className="text-sm text-gray-500">Daily revenue overview</p>
              </div>
            </div>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-gray-600">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-gray-600">Fees</span>
              </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="feesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.warning} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.warning} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={CHART_COLORS.success}
                  strokeWidth={2.5}
                  fill="url(#revenueGradient)"
                  name="Revenue"
                  animationDuration={1500}
                />
                <Area
                  type="monotone"
                  dataKey="fees"
                  stroke={CHART_COLORS.warning}
                  strokeWidth={2.5}
                  fill="url(#feesGradient)"
                  name="Fees"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

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
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={transactionTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {transactionTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [(value as number).toLocaleString(), 'Count']} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userRoleData} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
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
          </div>
        </motion.div>

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
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userTierData}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                  animationDuration={1500}
                >
                  {userTierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [(value as number).toLocaleString(), 'Users']} />
              </PieChart>
            </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={transactionStatusData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [(value as number).toLocaleString(), 'Count']} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={1500}>
                  {transactionStatusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.name === 'Completed' || entry.name === 'SUCCESS'
                          ? CHART_COLORS.success
                          : entry.name === 'Pending'
                          ? CHART_COLORS.warning
                          : entry.name === 'Failed'
                          ? CHART_COLORS.danger
                          : PIE_COLORS[index % PIE_COLORS.length]
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Recent Users and Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Users */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg">
                <FiUsers className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Recent Users</h2>
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

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {usersToDisplay.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-gray-400">{user.phoneNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {user.role?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => router.push(`/dashboard/users/${user.id}`)}
                          className="text-indigo-600 hover:text-indigo-700 p-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                        >
                          <FiEye className="w-4 h-4" />
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Sidebar - Alerts */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Pending Disputes */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow">
                  <FiShield className="w-4 h-4" />
                </div>
                <h2 className="font-bold text-gray-900">Pending Disputes</h2>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                {pendingDisputes}
              </span>
            </div>
            <div className="space-y-2.5">
              {disputesToDisplay.slice(0, 3).map((dispute, index) => (
                <motion.div
                  key={dispute.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => router.push(`/dashboard/disputes/${dispute.id}`)}
                  className="p-3 rounded-xl bg-gray-50 hover:bg-amber-50 cursor-pointer transition-all border border-transparent hover:border-amber-200"
                >
                  <p className="font-medium text-sm text-gray-900 line-clamp-1">{dispute.reason}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(dispute.createdAt).toLocaleDateString()}
                  </p>
                </motion.div>
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/dashboard/disputes')}
              className="w-full mt-4 py-2.5 rounded-xl bg-amber-50 text-amber-700 font-medium text-sm hover:bg-amber-100 transition-colors"
            >
              View All Disputes
            </motion.button>
          </div>

          {/* Pending Refunds */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow">
                  <FiRefreshCw className="w-4 h-4" />
                </div>
                <h2 className="font-bold text-gray-900">Pending Refunds</h2>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                {pendingRefunds}
              </span>
            </div>
            <div className="space-y-2.5">
              {refundsToDisplay.slice(0, 3).map((refund, index) => (
                <motion.div
                  key={refund.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => router.push(`/dashboard/refunds/${refund.id}`)}
                  className="p-3 rounded-xl bg-gray-50 hover:bg-rose-50 cursor-pointer transition-all border border-transparent hover:border-rose-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-gray-900">
                        ₦{parseFloat(refund.amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(refund.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                      {refund.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/dashboard/refunds')}
              className="w-full mt-4 py-2.5 rounded-xl bg-rose-50 text-rose-700 font-medium text-sm hover:bg-rose-100 transition-colors"
            >
              View All Refunds
            </motion.button>
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
            <h3 className="font-bold mb-4 text-lg">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-white/20">
                <span className="text-indigo-100 text-sm">Today&apos;s Revenue</span>
                <span className="font-bold">₦{parseFloat(String(todaysRevenue)).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/20">
                <span className="text-indigo-100 text-sm">New Users Today</span>
                <span className="font-bold">{newUsersToday}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/20">
                <span className="text-indigo-100 text-sm">Active Users</span>
                <span className="font-bold">{activeUsers}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-indigo-100 text-sm">Success Rate</span>
                <span className="font-bold">{successRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
