'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { auditService, AuditLog } from '@/services/audit.service';
import {
  FiArrowLeft,
  FiUser,
  FiClock,
  FiGlobe,
  FiFileText,
  FiDatabase,
  FiShield,
  FiActivity,
} from '@/utils/icons';

export default function AuditDetailPage() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && isAuthenticated) {
      checkAuth();
    }
  }, [isLoading, isAuthenticated, router, checkAuth]);

  const { data: auditLog, isLoading: detailLoading, error } = useQuery({
    queryKey: ['audit-log', id],
    queryFn: () => auditService.getAuditLog(id),
    enabled: !!user && !!id && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'),
  });

  const role = user?.role || 'CUSTOMER';

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-700 ring-green-600/20';
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-700 ring-blue-600/20';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-700 ring-red-600/20';
    if (action.includes('LOGIN')) return 'bg-purple-100 text-purple-700 ring-purple-600/20';
    if (action.includes('LOGOUT')) return 'bg-orange-100 text-orange-700 ring-orange-600/20';
    if (action.includes('PAYMENT')) return 'bg-emerald-100 text-emerald-700 ring-emerald-600/20';
    if (action.includes('REFUND')) return 'bg-amber-100 text-amber-700 ring-amber-600/20';
    if (action.includes('SUSPEND')) return 'bg-red-100 text-red-700 ring-red-600/20';
    if (action.includes('ACTIVATE')) return 'bg-green-100 text-green-700 ring-green-600/20';
    if (action.includes('ROLE')) return 'bg-indigo-100 text-indigo-700 ring-indigo-600/20';
    if (action.includes('DISPUTE')) return 'bg-yellow-100 text-yellow-700 ring-yellow-600/20';
    return 'bg-gray-100 text-gray-700 ring-gray-600/20';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return <FiShield className="w-5 h-5" />;
    if (action.includes('PAYMENT') || action.includes('REFUND')) return <FiDatabase className="w-5 h-5" />;
    if (action.includes('USER') || action.includes('ROLE')) return <FiUser className="w-5 h-5" />;
    return <FiActivity className="w-5 h-5" />;
  };

  if (isLoading || detailLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderValue = (value: unknown): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <>
      <div>
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-4 group"
          >
            <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Audit Logs</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-lg shadow-primary/20">
              <FiFileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Audit Log Detail</h1>
              <p className="text-gray-500 text-sm font-mono mt-0.5">{id}</p>
            </div>
          </div>
        </div>

        {error ? (
          <div className="card text-center py-16">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiFileText className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-gray-900 font-semibold text-lg mb-1">Audit log not found</p>
            <p className="text-gray-500 text-sm">The requested audit log could not be loaded.</p>
          </div>
        ) : auditLog ? (
          <div className="space-y-6">
            {/* Action Summary Card */}
            <div className="card">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getActionColor(auditLog.action).replace('text-', 'text-').split(' ')[0]}`}>
                    {getActionIcon(auditLog.action)}
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ring-1 ring-inset ${getActionColor(auditLog.action)}`}>
                      {auditLog.action}
                    </span>
                    <p className="text-gray-500 text-sm mt-1">
                      {new Date(auditLog.createdAt).toLocaleString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Resource */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <FiDatabase className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Resource</span>
                  </div>
                  <p className="text-gray-900 font-semibold">{auditLog.resource}</p>
                  {auditLog.resourceId && (
                    <p className="text-gray-500 text-xs font-mono mt-1 break-all">{auditLog.resourceId}</p>
                  )}
                </div>

                {/* Timestamp */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <FiClock className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Timestamp</span>
                  </div>
                  <p className="text-gray-900 font-semibold">
                    {new Date(auditLog.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(auditLog.createdAt).toLocaleTimeString()}
                  </p>
                </div>

                {/* IP Address */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <FiGlobe className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">IP Address</span>
                  </div>
                  <p className="text-gray-900 font-mono font-semibold">{auditLog.ipAddress || '—'}</p>
                </div>

                {/* User Agent */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <FiActivity className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">User Agent</span>
                  </div>
                  <p className="text-gray-700 text-sm break-all leading-relaxed">{auditLog.userAgent || '—'}</p>
                </div>
              </div>
            </div>

            {/* People Involved */}
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiUser className="w-5 h-5 text-primary" />
                People Involved
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Performed By */}
                <div className="p-4 border border-gray-200 rounded-xl">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Performed By</span>
                  {auditLog.performer ? (
                    <div className="mt-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-bold text-sm">
                            {auditLog.performer.firstName?.[0]}{auditLog.performer.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-gray-900 font-semibold">
                            {auditLog.performer.firstName} {auditLog.performer.lastName}
                          </p>
                          <p className="text-gray-500 text-sm">{auditLog.performer.email}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="text-gray-700 font-mono text-sm">{auditLog.performedBy || 'System'}</p>
                    </div>
                  )}
                </div>

                {/* Target User */}
                <div className="p-4 border border-gray-200 rounded-xl">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Target User</span>
                  {auditLog.user ? (
                    <div className="mt-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-600 font-bold text-sm">
                            {auditLog.user.firstName?.[0]}{auditLog.user.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-gray-900 font-semibold">
                            {auditLog.user.firstName} {auditLog.user.lastName}
                          </p>
                          <p className="text-gray-500 text-sm">{auditLog.user.email}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="text-gray-700 font-mono text-sm">{auditLog.userId || '—'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Changes */}
            {auditLog.changes && Object.keys(auditLog.changes).length > 0 && (
              <div className="card">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiFileText className="w-5 h-5 text-primary" />
                  Changes
                </h2>
                <div className="bg-gray-50 rounded-xl p-4 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Field</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Object.entries(auditLog.changes).map(([key, value]) => (
                        <tr key={key}>
                          <td className="py-3 px-3 text-sm font-medium text-gray-700">{key}</td>
                          <td className="py-3 px-3 text-sm text-gray-600 font-mono break-all">
                            {renderValue(value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Metadata */}
            {auditLog.metadata && Object.keys(auditLog.metadata).length > 0 && (
              <div className="card">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiDatabase className="w-5 h-5 text-primary" />
                  Metadata
                </h2>
                <div className="bg-gray-50 rounded-xl p-4 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Key</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Object.entries(auditLog.metadata).map(([key, value]) => (
                        <tr key={key}>
                          <td className="py-3 px-3 text-sm font-medium text-gray-700">{key}</td>
                          <td className="py-3 px-3 text-sm text-gray-600 font-mono break-all">
                            {renderValue(value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </>
  );
}
