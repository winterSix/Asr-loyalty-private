'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { disputeService } from '@/services/dispute.service';
import toast from 'react-hot-toast';
import {
  FiShield,
  FiArrowLeft,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiEdit,
  FiSave,
} from '@/utils/icons';

export default function DisputeDetailPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const disputeId = params?.id as string;
  const queryClient = useQueryClient();
  const [isResolving, setIsResolving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const { data: dispute, isLoading: disputeLoading } = useQuery({
    queryKey: ['dispute', disputeId],
    queryFn: () => disputeService.getDispute(disputeId),
    enabled: !!disputeId && !!user,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => disputeService.updateStatus(disputeId, { status: status as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispute', disputeId] });
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      toast.success('Dispute status updated');
      setIsResolving(false);
      setIsRejecting(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update dispute');
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (data: { resolution: string; resolutionNotes?: string }) =>
      disputeService.resolveDispute(disputeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispute', disputeId] });
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      toast.success('Dispute resolved successfully');
      setIsResolving(false);
      setResolutionNotes('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to resolve dispute');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => disputeService.rejectDispute(disputeId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispute', disputeId] });
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      toast.success('Dispute rejected');
      setIsRejecting(false);
      setRejectReason('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject dispute');
    },
  });

  const handleResolve = () => {
    if (!resolutionNotes.trim()) {
      toast.error('Please provide resolution notes');
      return;
    }
    resolveMutation.mutate({ resolution: 'Resolved', resolutionNotes });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    rejectMutation.mutate(rejectReason);
  };

  const canManage = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'OTHERS';

  if (isLoading || disputeLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!dispute) {
    return (
        <div className="text-center py-12">
          <FiShield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Dispute not found</p>
          <button onClick={() => router.back()} className="btn-primary mt-4">
            Go Back
          </button>
        </div>
    );
  }

  const role = user?.role || 'CUSTOMER';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return 'bg-green-100 text-green-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      case 'OPEN':
        return 'bg-yellow-100 text-yellow-700';
      case 'INVESTIGATING':
        return 'bg-blue-100 text-blue-700';
      case 'ESCALATED':
        return 'bg-purple-100 text-purple-700';
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
            Back to Disputes
          </button>
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-[#E5B887] mb-2">Dispute Details</h1>
          <p className="text-gray-600">View and manage dispute information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Dispute Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Transaction ID</label>
                  <p className="text-gray-900 font-mono text-sm mt-1">{dispute.transactionId}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Reason</label>
                  <p className="text-gray-900 mt-1">{dispute.reason}</p>
                </div>
                {dispute.description && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Description</label>
                    <p className="text-gray-900 mt-1">{dispute.description}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-semibold text-gray-700">Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(dispute.status)}`}>
                      {dispute.status}
                    </span>
                  </div>
                </div>
                {dispute.resolution && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Resolution</label>
                    <p className="text-gray-900 mt-1">{dispute.resolution}</p>
                  </div>
                )}
                {dispute.resolutionNotes && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Resolution Notes</label>
                    <p className="text-gray-900 mt-1">{dispute.resolutionNotes}</p>
                  </div>
                )}
                {dispute.rejectedReason && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Rejection Reason</label>
                    <p className="text-gray-900 mt-1">{dispute.rejectedReason}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Actions */}
            {canManage && dispute.status !== 'RESOLVED' && dispute.status !== 'REJECTED' && (
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Actions</h2>
                <div className="space-y-4">
                  {!isResolving && !isRejecting && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setIsResolving(true);
                          setIsRejecting(false);
                        }}
                        className="btn-primary flex items-center gap-2"
                      >
                        <FiCheckCircle className="w-5 h-5" />
                        Resolve Dispute
                      </button>
                      <button
                        onClick={() => {
                          setIsRejecting(true);
                          setIsResolving(false);
                        }}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <FiXCircle className="w-5 h-5" />
                        Reject Dispute
                      </button>
                      {dispute.status === 'OPEN' && (
                        <button
                          onClick={() => updateStatusMutation.mutate('INVESTIGATING')}
                          className="btn-secondary flex items-center gap-2"
                          disabled={updateStatusMutation.isPending}
                        >
                          <FiClock className="w-5 h-5" />
                          Mark as Investigating
                        </button>
                      )}
                    </div>
                  )}

                  {isResolving && (
                    <div className="space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <label className="block text-sm font-semibold text-gray-700">
                        Resolution Notes *
                      </label>
                      <textarea
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        className="input-field min-h-[100px]"
                        placeholder="Enter resolution details..."
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={handleResolve}
                          disabled={resolveMutation.isPending}
                          className="btn-primary flex items-center gap-2"
                        >
                          <FiSave className="w-5 h-5" />
                          {resolveMutation.isPending ? 'Resolving...' : 'Confirm Resolution'}
                        </button>
                        <button
                          onClick={() => {
                            setIsResolving(false);
                            setResolutionNotes('');
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
                    {new Date(dispute.createdAt).toLocaleString()}
                  </p>
                </div>
                {dispute.resolvedAt && (
                  <div>
                    <p className="text-xs text-gray-500">Resolved</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(dispute.resolvedAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {dispute.resolvedBy && (
                  <div>
                    <p className="text-xs text-gray-500">Resolved By</p>
                    <p className="text-sm font-semibold text-gray-900">{dispute.resolvedBy}</p>
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



