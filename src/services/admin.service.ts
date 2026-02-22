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
    today: number;
    thisMonth: number;
    lastMonth: number;
    growthPercentage: number;
  };
  pendingActions: {
    disputes: number;
    refunds: number;
  };
  totalWalletBalance: number;
}

// Transaction Stats Types
export interface TransactionStats {
  totalCount: number;
  totalVolume: number;
  successfulVolume: number;
  totalRewardsGiven: number;
  byStatus: Record<string, number>;
  byType: Record<string, { count: number; volume: number } | number>;
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
  revenue: number;
  fees: number;
  rewards: number;
  count: number;
}

export interface RevenueReport {
  period?: {
    start: string;
    end: string;
    groupBy: string;
  };
  breakdown: RevenueReportItem[];
  totals: {
    totalRevenue: number;
    totalFees: number;
    totalRewardsGiven: number;
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
  currentTier?: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  mustChangePassword?: boolean;
  totalSpent?: number;
  totalTransactions?: number;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  wallets?: Array<{
    id: string;
    balance: string;
    currency: string;
    type?: string;
    isActive?: boolean;
  }>;
  _count?: {
    transactions: number;
    disputes: number;
    refunds: number;
    notifications: number;
  };
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

/**
 * Extract the actual payload from backend responses.
 * After unwrapResponse removes the outer { success, statusCode, timestamp, data } wrapper,
 * the inner data still has { success: true, [key]: actualData }.
 * This helper extracts the named key.
 */
function extractInner<T>(data: any, key: string): T {
  // If the data has the named key, return it
  if (data && data[key] !== undefined) {
    return data[key] as T;
  }
  // Fallback: return data as-is (in case backend returns flat structure)
  return data as T;
}

/**
 * Extract paginated response from backend.
 * Backend returns { success, data: [...], pagination: { total, page, limit, totalPages } }
 */
function extractPaginated<T>(data: any): { data: T[]; total: number; page: number; limit: number } {
  // If data is already an array (e.g. unwrapResponse stripped too aggressively), use it directly
  if (Array.isArray(data)) {
    return { data: data as T[], total: data.length, page: 1, limit: data.length || 10 };
  }
  const items = data?.data || [];
  const pagination = data?.pagination || {};
  return {
    data: Array.isArray(items) ? items : [],
    total: pagination.total ?? data?.total ?? 0,
    page: pagination.page ?? data?.page ?? 1,
    limit: pagination.limit ?? data?.limit ?? 10,
  };
}

class AdminService {
  // GET /admin/dashboard - Get comprehensive dashboard summary
  // Backend returns: { success, dashboard: { users, revenue, pendingActions, totalWalletBalance } }
  async getDashboardSummary(): Promise<DashboardSummary> {
    const response = await apiClient.get<any>('/admin/dashboard');
    const data = unwrapResponse<any>(response.data);
    return extractInner<DashboardSummary>(data, 'dashboard');
  }

  // GET /admin/transactions - Get all transactions with filters
  // Backend returns: { success, data: [...], pagination: { total, page, limit, totalPages } }
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
    return extractPaginated<AdminTransaction>(data);
  }

  // GET /admin/transactions/stats - Get transaction statistics
  // Backend returns: { success, stats: { totalTransactions, totalVolume, ... } }
  async getTransactionStats(startDate?: string, endDate?: string): Promise<TransactionStats> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await apiClient.get<any>(`/admin/transactions/stats?${params.toString()}`);
    const data = unwrapResponse<any>(response.data);
    const stats = extractInner<any>(data, 'stats');
    // Normalize field names: backend uses totalTransactions, frontend uses totalCount
    return {
      totalCount: stats.totalTransactions ?? stats.totalCount ?? 0,
      totalVolume: stats.totalVolume ?? 0,
      successfulVolume: stats.successfulVolume ?? 0,
      totalRewardsGiven: stats.totalRewardsGiven ?? 0,
      byStatus: stats.byStatus ?? {},
      byType: stats.byType ?? {},
      successRate: parseFloat(stats.successRate) || 0,
    };
  }

  // GET /admin/transactions/:id - Get transaction details
  // Backend returns: { success, transaction: { ...txData } }
  async getTransactionById(id: string): Promise<AdminTransaction & {
    ledgerEntries?: any[];
    rewards?: any[];
    dispute?: any;
    refund?: any;
  }> {
    const response = await apiClient.get<any>(`/admin/transactions/${id}`);
    const data = unwrapResponse<any>(response.data);
    return extractInner<any>(data, 'transaction');
  }

  // GET /admin/revenue - Get revenue report
  // Backend returns: { success, report: { period, totals, breakdown } }
  async getRevenueReport(filters: RevenueFilters): Promise<RevenueReport> {
    const params = new URLSearchParams();
    params.append('startDate', filters.startDate);
    params.append('endDate', filters.endDate);
    if (filters.groupBy) params.append('groupBy', filters.groupBy);
    const response = await apiClient.get<any>(`/admin/revenue?${params.toString()}`);
    const data = unwrapResponse<any>(response.data);
    return extractInner<RevenueReport>(data, 'report');
  }

  // GET /admin/users - Get all users with filters
  // Backend returns: { success, data: [...], pagination: { total, page, limit, totalPages } }
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
    return extractPaginated<AdminUser>(data);
  }

  // GET /admin/users/stats - Get user statistics
  // Backend returns: { success, stats: { total, verifiedPhones, ... } }
  async getUserStats(): Promise<UserStats> {
    const response = await apiClient.get<any>('/admin/users/stats');
    const data = unwrapResponse<any>(response.data);
    return extractInner<UserStats>(data, 'stats');
  }

  // GET /admin/users/:id - Get user details
  // Backend returns: { success, user: { ...userData, _count, wallets, recentTransactions, ... } }
  async getUserById(userId: string): Promise<AdminUser & {
    preferences?: any;
    devices?: any[];
    loyaltyHistory?: any[];
    recentTransactions?: any[];
  }> {
    const response = await apiClient.get<any>(`/admin/users/${userId}`);
    const data = unwrapResponse<any>(response.data);
    const user = extractInner<any>(data, 'user');
    // Normalize: backend uses currentTier, frontend uses tier
    if (user && user.currentTier && !user.tier) {
      user.tier = user.currentTier;
    }
    return user;
  }

  // GET /admin/users/:id/transactions - Get user's transactions
  // Backend returns: { success, data: [...], pagination: { ... } }
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
    return extractPaginated<AdminTransaction>(data);
  }

  // GET /admin/users/:id/wallets - Get user's wallets
  // Backend returns: { success, wallets: [...] }
  async getUserWallets(userId: string): Promise<Array<{
    id: string;
    balance: string;
    currency: string;
    type?: string;
    isActive?: boolean;
    ledgerEntries?: any[];
  }>> {
    const response = await apiClient.get<any>(`/admin/users/${userId}/wallets`);
    const data = unwrapResponse<any>(response.data);
    return extractInner<any[]>(data, 'wallets') || [];
  }

  // PATCH /admin/users/:id/status - Update user status
  // Backend returns: { success, message, user: { ... } }
  async updateUserStatus(userId: string, data: { status: string; reason?: string }): Promise<AdminUser> {
    const response = await apiClient.patch<any>(`/admin/users/${userId}/status`, data);
    const result = unwrapResponse<any>(response.data);
    return extractInner<AdminUser>(result, 'user');
  }

  // PATCH /admin/users/:id/role - Update user role (SUPER_ADMIN only)
  // Backend returns: { success, message, user: { ... } }
  async updateUserRole(userId: string, data: { role: string }): Promise<AdminUser> {
    const response = await apiClient.patch<any>(`/admin/users/${userId}/role`, data);
    const result = unwrapResponse<any>(response.data);
    return extractInner<AdminUser>(result, 'user');
  }

  // POST /admin/cashiers - Create a new cashier account
  // Backend returns: { success, message, cashier: { id, firstName, lastName, email, phoneNumber, role, status, temporaryPassword } }
  async createCashier(data: CreateCashierData): Promise<CreateCashierResponse> {
    const response = await apiClient.post<any>('/admin/cashiers', data);
    const result = unwrapResponse<any>(response.data);
    // The backend returns the full object at the top level (not nested under a key)
    return result as CreateCashierResponse;
  }
}

export interface CreateCashierData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
}

export interface CreateCashierResponse {
  success: boolean;
  message: string;
  cashier: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
    role: string;
    status: string;
    temporaryPassword: string;
  };
}

export const adminService = new AdminService();
