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
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve refund');
    },
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
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject refund');
    },
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
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to process refund');
    },
  });

  const handleApprove = () => {
    approveMutation.mutate(approvalNotes ? { notes: approvalNotes } : undefined);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    rejectMutation.mutate({ reason: rejectReason });
  };

  const handleProcess = () => {
    processMutation.mutate(processNotes ? { notes: processNotes } : undefined);
  };

  const canManage = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'OTHERS';
  const canProcess = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'OTHERS';

  if (isLoading || refundLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!refund) {
    return (
        <div className="text-center py-12">
          <FiDollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Refund not found</p>
          <button onClick={() => router.back()} className="btn-primary mt-4">
            Go Back
          </button>
        </div>
    );
  }

  const role = user?.role || 'CUSTOMER';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'PROCESSED':
        return 'bg-green-100 text-green-700';
      case 'REJECTED':
      case 'FAILED':
        return 'bg-red-100 text-red-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <>
      <div>
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:hover:text-[#F1F5F9] mb-4"
          >
            <FiArrowLeft className="w-5 h-5" />
            Back to Refunds
          </button>
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-[#E5B887] mb-2">Refund Details</h1>
          <p className="text-gray-600">View and manage refund information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Refund Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Transaction ID</label>
                  <p className="text-gray-900 font-mono text-sm mt-1">{refund.transactionId}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Amount</label>
                  <p className="text-gray-900 font-bold text-2xl mt-1">
                    ₦{parseFloat(refund.amount).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Reason</label>
                  <p className="text-gray-900 mt-1">{refund.reason}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(refund.status)}`}>
                      {refund.status}
                    </span>
                  </div>
                </div>
                {refund.rejectedReason && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Rejection Reason</label>
                    <p className="text-gray-900 mt-1">{refund.rejectedReason}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Actions */}
            {canManage && (
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Actions</h2>
                <div className="space-y-4">
                  {refund.status === 'PENDING' && !isApproving && !isRejecting && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setIsApproving(true);
                          setIsRejecting(false);
                        }}
                        className="btn-primary flex items-center gap-2"
                      >
                        <FiCheckCircle className="w-5 h-5" />
                        Approve Refund
                      </button>
                      <button
                        onClick={() => {
                          setIsRejecting(true);
                          setIsApproving(false);
                        }}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <FiXCircle className="w-5 h-5" />
                        Reject Refund
                      </button>
                    </div>
                  )}

                  {refund.status === 'APPROVED' && canProcess && !isProcessing && (
                    <button
                      onClick={() => setIsProcessing(true)}
                      className="btn-primary flex items-center gap-2"
                    >
                      <FiCheckCircle className="w-5 h-5" />
                      Process Refund
                    </button>
                  )}

                  {isApproving && (
                    <div className="space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <label className="block text-sm font-semibold text-gray-700">
                        Approval Notes (Optional)
                      </label>
                      <textarea
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        className="input-field min-h-[100px]"
                        placeholder="Enter approval notes..."
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={handleApprove}
                          disabled={approveMutation.isPending}
                          className="btn-primary flex items-center gap-2"
                        >
                          <FiSave className="w-5 h-5" />
                          {approveMutation.isPending ? 'Approving...' : 'Confirm Approval'}
                        </button>
                        <button
                          onClick={() => {
                            setIsApproving(false);
                            setApprovalNotes('');
                          }}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {isRejecting && (
                    <div className="space-y-3 p-4 bg-red-50 rounded-xl border border-red-200">
                      <label className="block text-sm font-semibold text-gray-700">
                        Rejection Reason *
                      </label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="input-field min-h-[100px]"
                        placeholder="Enter reason for rejection..."
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={handleReject}
                          disabled={rejectMutation.isPending}
                          className="btn-secondary flex items-center gap-2 bg-red-600 text-white border-red-600 hover:bg-red-700"
                        >
                          <FiXCircle className="w-5 h-5" />
                          {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
                        </button>
                        <button
                          onClick={() => {
                            setIsRejecting(false);
                            setRejectReason('');
                          }}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {isProcessing && (
                    <div className="space-y-3 p-4 bg-green-50 rounded-xl border border-green-200">
                      <label className="block text-sm font-semibold text-gray-700">
                        Process Notes (Optional)
                      </label>
                      <textarea
                        value={processNotes}
                        onChange={(e) => setProcessNotes(e.target.value)}
                        className="input-field min-h-[100px]"
                        placeholder="Enter processing notes..."
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={handleProcess}
                          disabled={processMutation.isPending}
                          className="btn-primary flex items-center gap-2"
                        >
                          <FiSave className="w-5 h-5" />
                          {processMutation.isPending ? 'Processing...' : 'Confirm Processing'}
                        </button>
                        <button
                          onClick={() => {
                            setIsProcessing(false);
                            setProcessNotes('');
                          }}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Timeline</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(refund.createdAt).toLocaleString()}
                  </p>
                </div>
                {refund.processedAt && (
                  <div>
                    <p className="text-xs text-gray-500">Processed</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(refund.processedAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {refund.approvedBy && (
                  <div>
                    <p className="text-xs text-gray-500">Approved By</p>
                    <p className="text-sm font-semibold text-gray-900">{refund.approvedBy}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}



