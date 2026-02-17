'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { adminService, UserFilters } from '@/services/admin.service';
import {
  FiUsers,
  FiSearch,
  FiEye,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
} from '@/utils/icons';

export default function UsersPage() {
  const { user, isLoading } = useAuthGuard();
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filters: UserFilters = {
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(roleFilter && { role: roleFilter }),
    ...(statusFilter && { status: statusFilter }),
    ...(tierFilter && { tier: tierFilter }),
    page,
    limit,
  };

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: () => adminService.getUsers(filters),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const role = user?.role || 'CUSTOMER';
  const users = usersData?.data || [];
  const total = usersData?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const getRoleColor = (userRole: string) => {
    switch (userRole) {
      case 'SUPER_ADMIN': return 'bg-red-100 text-red-700';
      case 'ADMIN': return 'bg-yellow-100 text-yellow-700';
      case 'CASHIER': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'SUSPENDED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier?.toUpperCase()) {
      case 'PLATINUM': return 'bg-indigo-100 text-indigo-700';
      case 'GOLD': return 'bg-amber-100 text-amber-700';
      case 'SILVER': return 'bg-slate-200 text-slate-700';
      default: return 'bg-orange-100 text-orange-700';
    }
  };

  return (
    <DashboardLayout role={role}>
      <div>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Users Management</h1>
          <p className="text-gray-600">Manage all system users ({total} total)</p>
        </div>

        {/* Search & Filters */}
        <div className="card mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400 w-4 h-4" />
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                className="input-field text-sm"
              >
                <option value="">All Roles</option>
                <option value="CUSTOMER">Customer</option>
                <option value="CASHIER">Cashier</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="input-field text-sm"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <select
                value={tierFilter}
                onChange={(e) => { setTierFilter(e.target.value); setPage(1); }}
                className="input-field text-sm"
              >
                <option value="">All Tiers</option>
                <option value="BRONZE">Bronze</option>
                <option value="SILVER">Silver</option>
                <option value="GOLD">Gold</option>
                <option value="PLATINUM">Platinum</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="card">
          {usersLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : users.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">User</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Phone</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tier</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Joined</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {u.firstName?.[0]}{u.lastName?.[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {u.firstName} {u.lastName}
                              </p>
                              <p className="text-xs text-gray-500 font-mono">
                                {u.id.substring(0, 8)}...
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-700">{u.email || '—'}</td>
                        <td className="py-4 px-4 text-sm text-gray-700">{u.phoneNumber}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(u.role)}`}>
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(u.status)}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTierColor(u.tier || 'BRONZE')}`}>
                            {u.tier || 'BRONZE'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => router.push(`/dashboard/users/${u.id}`)}
                            className="text-primary hover:text-primary-light transition-colors"
                            title="View details"
                          >
                            <FiEye className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600">
                    Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-medium text-gray-700 px-3">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <FiUsers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No users found</p>
              <p className="text-xs text-gray-400 mt-2">
                {debouncedSearch || roleFilter || statusFilter || tierFilter
                  ? 'Try adjusting your filters'
                  : 'No users in the system yet'}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
