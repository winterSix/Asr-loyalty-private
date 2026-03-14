'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, UserFilters, CreateCashierData } from '@/services/admin.service';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  FiUsers,
  FiSearch,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiUserPlus,
  FiCopy,
  FiCheckCircle,
} from '@/utils/icons';
import CustomSelect from '@/components/ui/CustomSelect';

const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phoneNumber: z.string().optional(),
  role: z.string().min(1, 'Role is required'),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

export default function UsersPage() {
  const { user, isLoading } = useAuthGuard();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Create Cashier modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    temporaryPassword: string;
    name: string;
    role: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

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
    enabled: !!user && isAdmin,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: 'CASHIER' },
  });

  const createUserMutation = useMutation({
    mutationFn: (data: CreateCashierData) => adminService.createCashier(data),
    onSuccess: (result) => {
      setCreatedCredentials({
        email: result.cashier.email,
        temporaryPassword: result.cashier.temporaryPassword,
        name: `${result.cashier.firstName} ${result.cashier.lastName}`,
        role: result.cashier.role,
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      reset({ role: 'CASHIER' });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create user');
    },
  });

  const onCreateUser = (data: CreateUserFormData) => {
    createUserMutation.mutate(data);
  };

  const handleCopyPassword = () => {
    if (createdCredentials?.temporaryPassword) {
      navigator.clipboard.writeText(createdCredentials.temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreatedCredentials(null);
    reset({ role: 'CASHIER' });
  };

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
    <>
      <div>
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25">
              <FiUsers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#E5B887]">Users Management</h1>
              <p className="text-gray-500 text-sm">Manage all system users ({total} total)</p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <FiUserPlus className="w-5 h-5" />
              Create User
            </button>
          )}
        </div>

        {/* Search & Filters */}
        <div className="card mb-6">
          <div className="flex flex-col gap-3">
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
            <div className="flex flex-wrap items-center gap-2">
              <FiFilter className="text-gray-400 w-4 h-4" />
              <CustomSelect
                value={roleFilter}
                onChange={(v) => { setRoleFilter(v); setPage(1); }}
                options={[
                  { value: '', label: 'All Roles' },
                  { value: 'CUSTOMER', label: 'Customer' },
                  { value: 'CASHIER', label: 'Cashier' },
                  { value: 'ADMIN', label: 'Admin' },
                  { value: 'SUPER_ADMIN', label: 'Super Admin' },
                ]}
              />
              <CustomSelect
                value={statusFilter}
                onChange={(v) => { setStatusFilter(v); setPage(1); }}
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'SUSPENDED', label: 'Suspended' },
                  { value: 'PENDING_VERIFICATION', label: 'Pending Verification' },
                  { value: 'DEACTIVATED', label: 'Deactivated' },
                ]}
              />
              <CustomSelect
                value={tierFilter}
                onChange={(v) => { setTierFilter(v); setPage(1); }}
                options={[
                  { value: '', label: 'All Tiers' },
                  { value: 'BRONZE', label: 'Bronze' },
                  { value: 'SILVER', label: 'Silver' },
                  { value: 'GOLD', label: 'Gold' },
                  { value: 'PLATINUM', label: 'Platinum' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="card flex flex-col">
          {usersLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : users.length > 0 ? (
            <>
              <div className="overflow-x-auto min-w-0">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 whitespace-nowrap min-w-[160px]">User</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 whitespace-nowrap min-w-[180px]">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 whitespace-nowrap min-w-[140px]">Phone</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 whitespace-nowrap min-w-[120px]">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 whitespace-nowrap min-w-[100px]">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 whitespace-nowrap min-w-[100px]">Tier</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 whitespace-nowrap min-w-[110px]">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/dashboard/users/${u.id}`)}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                              {u.firstName?.[0]}{u.lastName?.[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 whitespace-nowrap">
                                {u.firstName} {u.lastName}
                              </p>
                              <p className="text-xs text-gray-500 font-mono">
                                {u.id.substring(0, 8)}...
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-700 whitespace-nowrap">{u.email || '—'}</td>
                        <td className="py-4 px-4 text-sm text-gray-700 whitespace-nowrap">{u.phoneNumber}</td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium w-fit ${getRoleColor(u.role)}`}>
                              {u.role.replace('_', ' ')}
                            </span>
                            {u.mustChangePassword && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold w-fit bg-amber-100 text-amber-700">
                                Temp Password
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(u.status)}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTierColor(u.tier || 'BRONZE')}`}>
                            {u.tier || 'BRONZE'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500 whitespace-nowrap">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {users.length > 0 && (
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

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create User Account</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  A temporary password will be generated for the new user
                </p>
              </div>
              <button
                onClick={closeCreateModal}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {createdCredentials ? (
              /* Success state — show credentials */
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <FiCheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">User Created!</p>
                    <p className="text-sm text-gray-500">{createdCredentials.name} &middot; <span className="font-medium">{createdCredentials.role}</span></p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <p className="text-xs font-semibold text-amber-700 mb-3 uppercase tracking-wide">
                    Credentials (save these now)
                  </p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-mono text-sm text-gray-900">{createdCredentials.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Temporary Password</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-mono text-sm text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-1.5 flex-1">
                          {createdCredentials.temporaryPassword}
                        </p>
                        <button
                          onClick={handleCopyPassword}
                          className="p-2 rounded-lg hover:bg-amber-100 text-amber-600 transition-colors"
                          title="Copy password"
                        >
                          {copied ? <FiCheckCircle className="w-4 h-4 text-green-600" /> : <FiCopy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-amber-600 mt-3">
                    The user will be prompted to change their password on first login. The credentials have also been emailed to them.
                  </p>
                </div>

                <button
                  onClick={closeCreateModal}
                  className="btn-primary w-full"
                >
                  Done
                </button>
              </div>
            ) : (
              /* Create form */
              <form onSubmit={handleSubmit(onCreateUser)} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('firstName')}
                      type="text"
                      className={`input-field ${errors.firstName ? 'border-red-300' : ''}`}
                      placeholder="John"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('lastName')}
                      type="text"
                      className={`input-field ${errors.lastName ? 'border-red-300' : ''}`}
                      placeholder="Doe"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className={`input-field ${errors.email ? 'border-red-300' : ''}`}
                    placeholder="user@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Phone Number <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    {...register('phoneNumber')}
                    type="tel"
                    className="input-field"
                    placeholder="+234..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    value={watch('role')}
                    onChange={(v) => setValue('role', v)}
                    options={[
                      { value: 'CASHIER', label: 'Cashier' },
                      { value: 'CUSTOMER', label: 'Customer' },
                      { value: 'FINANCE_MANAGER', label: 'Finance Manager' },
                      { value: 'LOYALTY_MANAGER', label: 'Loyalty Manager' },
                      { value: 'CUSTOMER_SUPPORT', label: 'Customer Support' },
                      { value: 'ADMIN', label: 'Admin' },
                    ]}
                  />
                  {errors.role && (
                    <p className="mt-1 text-xs text-red-600">{errors.role.message}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1.5">
                    This sets what the user can access in the system.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createUserMutation.isPending}
                    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createUserMutation.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Creating...
                      </span>
                    ) : (
                      'Create User'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
