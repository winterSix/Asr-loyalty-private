'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { refundService } from '@/services/refund.service';
import toast from 'react-hot-toast';
import {
  FiDollarSign,
  FiArrowLeft,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiSave,
  FiUser,
} from '@/utils/icons';

export default function RefundDetailPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const refundId = params?.id as string;
  const queryClient = useQueryClient();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [processNotes, setProcessNotes] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isLoading, isAuthenticated, router]);

  const { data: refund, isLoading: refundLoading } = useQuery({
    queryKey: ['refund', refundId],
    queryFn: () => refundService.getRefund(refundId),
    enabled: !!refundId && !!user,
  });

  const approveMutation = useMutation({
    mutationFn: (data?: { notes?: string }) => refundService.approveRefund(refundId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refund', refundId] });
      queryClient.invalidateQueries({ queryKey: ['refunds'] });
      toast.success('Refund approved successfully');
      setIsApproving(false);
      setApprovalNotes('');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to approve refund'),
  });

  const rejectMutation = useMutation({
    mutationFn: (data: { reason: string }) => refundService.rejectRefund(refundId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refund', refundId] });
      queryClient.invalidateQueries({ queryKey: ['refunds'] });
      toast.success('Refund rejected');
      setIsRejecting(false);
      setRejectReason('');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to reject refund'),
  });

  const processMutation = useMutation({
    mutationFn: (data?: { notes?: string }) => refundService.processRefund(refundId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refund', refundId] });
      queryClient.invalidateQueries({ queryKey: ['refunds'] });
      toast.success('Refund processed successfully');
      setIsProcessing(false);
      setProcessNotes('');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to process refund'),
  });

  const canManage = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'OTHERS';

  if (isLoading || refundLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!refund) {
    return (
      <div className="text-center py-12">
        <FiDollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Refund not found</p>
        <button onClick={() => router.back()} className="btn-primary mt-4">Go Back</button>
      </div>
    );
  }

  const r = refund as any;
  const cashier = r.cashier as { firstName: string; lastName: string; email: string } | null;
  const isQrPayment = !!cashier || r.transaction?.description?.startsWith('QR Payment');

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'APPROVED':  return { bg: 'bg-blue-50 dark:bg-blue-500/10',     text: 'text-blue-700 dark:text-blue-400',     dot: 'bg-blue-500' };
      case 'PROCESSED': return { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' };
      case 'REJECTED':
      case 'FAILED':    return { bg: 'bg-red-50 dark:bg-red-500/10',       text: 'text-red-700 dark:text-red-400',       dot: 'bg-red-500' };
      case 'PENDING':   return { bg: 'bg-amber-50 dark:bg-amber-500/10',   text: 'text-amber-700 dark:text-amber-400',   dot: 'bg-amber-500' };
      default:          return { bg: 'bg-gray-50 dark:bg-gray-700/50',     text: 'text-gray-700 dark:text-gray-300',     dot: 'bg-gray-500' };
    }
  };

  const ss = getStatusStyle(r.status);

  const labelCls = 'text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider';
  const valueCls = 'text-sm font-medium text-gray-900 dark:text-gray-100 mt-1';
  const cardCls  = 'bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm p-6';

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 text-sm font-medium transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Refunds
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#E5B887] mb-1">Refund Details</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">View and manage refund information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Refund Information */}
          <div className={cardCls}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-5">Refund Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <p className={labelCls}>Transaction ID</p>
                <p className="text-sm font-mono text-gray-900 dark:text-gray-100 mt-1 break-all">{r.transactionId}</p>
              </div>
              <div>
                <p className={labelCls}>Amount</p>
                <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">
                  ₦{parseFloat(r.amount).toLocaleString()}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className={labelCls}>Reason</p>
                <p className={valueCls}>{r.reason}</p>
              </div>
              <div>
                <p className={labelCls}>Status</p>
                <div className="mt-1">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${ss.bg} ${ss.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${ss.dot}`} />
                    {r.status}
                  </span>
                </div>
              </div>
              {r.transaction?.reference && (
                <div>
                  <p className={labelCls}>Reference</p>
                  <p className="text-sm font-mono text-gray-700 dark:text-gray-300 mt-1">{r.transaction.reference}</p>
                </div>
              )}
              {r.rejectedReason && (
                <div className="sm:col-span-2 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-700 dark:text-red-300">{r.rejectedReason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Cashier info — only for QR payments */}
          {isQrPayment && (
            <div className={cardCls}>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                  <FiUser className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Cashier Details</h2>
              </div>
              {cashier ? (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {cashier.firstName?.[0]}{cashier.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {cashier.firstName} {cashier.lastName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{cashier.email}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Processed the QR payment</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">QR payment — cashier details unavailable</p>
              )}
            </div>
          )}

          {/* Admin Actions */}
          {canManage && r.status !== 'PROCESSED' && r.status !== 'REJECTED' && (
            <div className={cardCls}>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-5">Actions</h2>
              <div className="space-y-4">

                {r.status === 'PENDING' && !isApproving && !isRejecting && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => { setIsApproving(true); setIsRejecting(false); }}
                      className="btn-primary flex items-center gap-2"
                    >
                      <FiCheckCircle className="w-4 h-4" />
                      Approve Refund
                    </button>
                    <button
                      onClick={() => { setIsRejecting(true); setIsApproving(false); }}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <FiXCircle className="w-4 h-4" />
                      Reject Refund
                    </button>
                  </div>
                )}

                {r.status === 'APPROVED' && !isProcessing && (
                  <button
                    onClick={() => setIsProcessing(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <FiCheckCircle className="w-4 h-4" />
                    Process Refund
                  </button>
                )}

                {isApproving && (
                  <div className="space-y-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Approval Notes <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-500/30 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm min-h-[100px] resize-none"
                      placeholder="Enter approval notes..."
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => approveMutation.mutate(approvalNotes ? { notes: approvalNotes } : undefined)}
                        disabled={approveMutation.isPending}
                        className="btn-primary flex items-center gap-2"
                      >
                        <FiSave className="w-4 h-4" />
                        {approveMutation.isPending ? 'Approving...' : 'Confirm Approval'}
                      </button>
                      <button onClick={() => { setIsApproving(false); setApprovalNotes(''); }} className="btn-secondary">Cancel</button>
                    </div>
                  </div>
                )}

                {isRejecting && (
                  <div className="space-y-3 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Rejection Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-700 border border-red-200 dark:border-red-500/30 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 text-sm min-h-[100px] resize-none"
                      placeholder="Enter reason for rejection..."
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          if (!rejectReason.trim()) { toast.error('Please provide a rejection reason'); return; }
                          rejectMutation.mutate({ reason: rejectReason });
                        }}
                        disabled={rejectMutation.isPending}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                      >
                        <FiXCircle className="w-4 h-4" />
                        {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
                      </button>
                      <button onClick={() => { setIsRejecting(false); setRejectReason(''); }} className="btn-secondary">Cancel</button>
                    </div>
                  </div>
                )}

                {isProcessing && (
                  <div className="space-y-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Process Notes <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      value={processNotes}
                      onChange={(e) => setProcessNotes(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-700 border border-emerald-200 dark:border-emerald-500/30 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm min-h-[100px] resize-none"
                      placeholder="Enter processing notes..."
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => processMutation.mutate(processNotes ? { notes: processNotes } : undefined)}
                        disabled={processMutation.isPending}
                        className="btn-primary flex items-center gap-2"
                      >
                        <FiSave className="w-4 h-4" />
                        {processMutation.isPending ? 'Processing...' : 'Confirm Processing'}
                      </button>
                      <button onClick={() => { setIsProcessing(false); setProcessNotes(''); }} className="btn-secondary">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="space-y-6">

          {/* Customer info */}
          {r.user && (
            <div className={cardCls}>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Customer</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {r.user.firstName?.[0]}{r.user.lastName?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{r.user.firstName} {r.user.lastName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{r.user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className={cardCls}>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Timeline</h3>
            <div className="space-y-4">
              <div>
                <p className={labelCls}>Submitted</p>
                <p className={valueCls}>{new Date(r.createdAt).toLocaleString()}</p>
              </div>
              {r.approvedBy && (
                <div>
                  <p className={labelCls}>Approved By</p>
                  <p className={valueCls + ' font-mono text-xs'}>{r.approvedBy}</p>
                </div>
              )}
              {r.processedAt && (
                <div>
                  <p className={labelCls}>Processed</p>
                  <p className={valueCls}>{new Date(r.processedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Transaction summary */}
          {r.transaction && (
            <div className={cardCls}>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Original Transaction</h3>
              <div className="space-y-3">
                <div>
                  <p className={labelCls}>Type</p>
                  <p className={valueCls}>{r.transaction.type?.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className={labelCls}>Original Amount</p>
                  <p className={valueCls}>₦{parseFloat(r.transaction.amount || '0').toLocaleString()}</p>
                </div>
                <div>
                  <p className={labelCls}>Transaction Status</p>
                  <p className={valueCls}>{r.transaction.status}</p>
                </div>
                {r.transaction.description && (
                  <div>
                    <p className={labelCls}>Description</p>
                    <p className={valueCls}>{r.transaction.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
