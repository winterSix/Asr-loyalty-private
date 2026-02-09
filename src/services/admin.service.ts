import { apiClient, unwrapResponse } from '@/config/api';

// Dashboard Summary Types
export interface DashboardSummary {
  users: {
    total: number;
    active: number;
    newToday: number;
    newThisMonth: number;
  };
  revenue: {
    today: string;
    thisMonth: string;
    lastMonth: string;
    growthPercentage: number;
  };
  pendingActions: {
    disputes: number;
    refunds: number;
  };
  totalWalletBalance: string;
}

// Transaction Stats Types
export interface TransactionStats {
  totalCount: number;
  totalVolume: string;
  successfulVolume: string;
  totalRewardsGiven: string;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  successRate: number;
}

// User Stats Types
export interface UserStats {
  total: number;
  verifiedPhones: number;
  recentSignups: number;
  byStatus: Record<string, number>;
  byRole: Record<string, number>;
  byTier: Record<string, number>;
}

// Revenue Report Types
export interface RevenueReportItem {
  period: string;
  revenue: string;
  fees: string;
  rewards: string;
  count: number;
}

export interface RevenueReport {
  breakdown: RevenueReportItem[];
  totals: {
    totalRevenue: string;
    totalFees: string;
    totalRewardsGiven: string;
    transactionCount: number;
  };
}

// Admin Transaction Types
export interface AdminTransaction {
  id: string;
  userId: string;
  type: string;
  status: string;
  amount: string;
  currency: string;
  reference: string;
  description?: string;
  fee?: string;
  rewardAmount?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
  wallet?: {
    id: string;
    balance: string;
    currency: string;
  };
}

// Admin User Types
export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
  status: string;
  tier?: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  wallets?: Array<{
    id: string;
    balance: string;
    currency: string;
  }>;
}

// Filter Types
export interface TransactionFilters {
  userId?: string;
  type?: string;
  status?: string;
  reference?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  tier?: string;
  startDate?: string;
  endDate?: string;
  phoneVerified?: boolean;
  page?: number;
  limit?: number;
}

export interface RevenueFilters {
  startDate: string;
  endDate: string;
  groupBy?: 'day' | 'week' | 'month';
}

class AdminService {
  // GET /admin/dashboard - Get comprehensive dashboard summary
  async getDashboardSummary(): Promise<DashboardSummary> {
    const response = await apiClient.get<any>('/admin/dashboard');
    return unwrapResponse<DashboardSummary>(response.data);
  }

  // GET /admin/transactions - Get all transactions with filters
  async getTransactions(filters?: TransactionFilters): Promise<{
    data: AdminTransaction[];
    total: number;
    page: number;
    limit: number;
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response = await apiClient.get<any>(`/admin/transactions?${params.toString()}`);
    const data = unwrapResponse<any>(response.data);
    return {
      data: data.data || data || [],
      total: data.total || 0,
      page: data.page || 1,
      limit: data.limit || 10,
    };
  }

  // GET /admin/transactions/stats - Get transaction statistics
  async getTransactionStats(startDate?: string, endDate?: string): Promise<TransactionStats> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await apiClient.get<any>(`/admin/transactions/stats?${params.toString()}`);
    return unwrapResponse<TransactionStats>(response.data);
  }

  // GET /admin/transactions/:id - Get transaction details
  async getTransactionById(id: string): Promise<AdminTransaction & {
    ledgerEntries?: any[];
    rewards?: any[];
    dispute?: any;
    refund?: any;
  }> {
    const response = await apiClient.get<any>(`/admin/transactions/${id}`);
    return unwrapResponse<any>(response.data);
  }

  // GET /admin/revenue - Get revenue report
  async getRevenueReport(filters: RevenueFilters): Promise<RevenueReport> {
    const params = new URLSearchParams();
    params.append('startDate', filters.startDate);
    params.append('endDate', filters.endDate);
    if (filters.groupBy) params.append('groupBy', filters.groupBy);
    const response = await apiClient.get<any>(`/admin/revenue?${params.toString()}`);
    return unwrapResponse<RevenueReport>(response.data);
  }

  // GET /admin/users - Get all users with filters
  async getUsers(filters?: UserFilters): Promise<{
    data: AdminUser[];
    total: number;
    page: number;
    limit: number;
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response = await apiClient.get<any>(`/admin/users?${params.toString()}`);
    const data = unwrapResponse<any>(response.data);
    return {
      data: data.data || data || [],
      total: data.total || 0,
      page: data.page || 1,
      limit: data.limit || 10,
    };
  }

  // GET /admin/users/stats - Get user statistics
  async getUserStats(): Promise<UserStats> {
    const response = await apiClient.get<any>('/admin/users/stats');
    return unwrapResponse<UserStats>(response.data);
  }

  // GET /admin/users/:id - Get user details
  async getUserById(userId: string): Promise<AdminUser & {
    preferences?: any;
    devices?: any[];
    loyaltyHistory?: any[];
    transactionCount?: number;
    disputeCount?: number;
    refundCount?: number;
    recentTransactions?: any[];
  }> {
    const response = await apiClient.get<any>(`/admin/users/${userId}`);
    return unwrapResponse<any>(response.data);
  }

  // GET /admin/users/:id/transactions - Get user's transactions
  async getUserTransactions(userId: string, filters?: Omit<TransactionFilters, 'userId'>): Promise<{
    data: AdminTransaction[];
    total: number;
    page: number;
    limit: number;
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response = await apiClient.get<any>(`/admin/users/${userId}/transactions?${params.toString()}`);
    const data = unwrapResponse<any>(response.data);
    return {
      data: data.data || data || [],
      total: data.total || 0,
      page: data.page || 1,
      limit: data.limit || 10,
    };
  }

  // GET /admin/users/:id/wallets - Get user's wallets
  async getUserWallets(userId: string): Promise<Array<{
    id: string;
    balance: string;
    currency: string;
    ledgerEntries?: any[];
  }>> {
    const response = await apiClient.get<any>(`/admin/users/${userId}/wallets`);
    return unwrapResponse<any>(response.data);
  }

  // PATCH /admin/users/:id/status - Update user status
  async updateUserStatus(userId: string, data: { status: string; reason?: string }): Promise<AdminUser> {
    const response = await apiClient.patch<any>(`/admin/users/${userId}/status`, data);
    return unwrapResponse<AdminUser>(response.data);
  }

  // PATCH /admin/users/:id/role - Update user role (SUPER_ADMIN only)
  async updateUserRole(userId: string, data: { role: string }): Promise<AdminUser> {
    const response = await apiClient.patch<any>(`/admin/users/${userId}/role`, data);
    return unwrapResponse<AdminUser>(response.data);
  }
}

export const adminService = new AdminService();
