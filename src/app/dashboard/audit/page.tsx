'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { auditService } from '@/services/audit.service';
import {
  FiFileText,
  FiSearch,
  FiFilter,
  FiEye,
} from '@/utils/icons';
import CustomSelect from '@/components/ui/CustomSelect';

export default function AuditLogsPage() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const [actionFilter, setActionFilter] = useState<string>('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && isAuthenticated) {
      checkAuth();
    }
  }, [isLoading, isAuthenticated, router, checkAuth]);

  const { data: auditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ['audit-logs', actionFilter],
    queryFn: () => auditService.getAuditLogs({ action: actionFilter || undefined, page: 1, limit: 50 }),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'),
  });

  if (isLoading || auditLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const role = user?.role || 'CUSTOMER';

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-700';
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-700';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-700';
    if (action.includes('LOGIN')) return 'bg-purple-100 text-purple-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
      <div>
        <div className="mb-8 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-600 to-gray-700 text-white shadow-lg shadow-slate-600/25">
            <FiFileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-gray-500 text-sm">System activity and audit trail</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search audit logs..."
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" />
              <CustomSelect
                value={actionFilter}
                onChange={(v) => setActionFilter(v)}
                options={[
                  { value: '', label: 'All Actions' },
                  { value: 'CREATE', label: 'Create' },
                  { value: 'UPDATE', label: 'Update' },
                  { value: 'DELETE', label: 'Delete' },
                  { value: 'LOGIN', label: 'Login' },
                  { value: 'LOGOUT', label: 'Logout' },
                ]}
                className="flex-1 min-w-[160px]"
              />
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="card">
          {auditLogs?.data && auditLogs.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Action</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Resource</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Performed By</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">IP Address</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.data.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-medium text-gray-900">{log.resource}</p>
                        {log.resourceId && (
                          <p className="text-xs text-gray-500 font-mono">{log.resourceId.substring(0, 12)}...</p>
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-700">
                        {log.performedBy || 'System'}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500 font-mono">
                        {log.ipAddress || '—'}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => router.push(`/dashboard/audit/${log.id}`)}
                          className="text-primary hover:text-primary-light"
                        >
                          <FiEye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FiFileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No audit logs found</p>
            </div>
          )}
        </div>
      </div>
  );
}

