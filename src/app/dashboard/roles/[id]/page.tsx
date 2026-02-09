'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService } from '@/services/role.service';
import toast from 'react-hot-toast';
import {
  FiLayers,
  FiArrowLeft,
  FiEdit,
  FiSave,
  FiTrash2,
  FiUsers,
  FiKey,
} from '@/utils/icons';

export default function RoleDetailPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const roleId = params?.id as string;
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const { data: role, isLoading: roleLoading } = useQuery({
    queryKey: ['role', roleId],
    queryFn: () => roleService.getRole(roleId),
    enabled: !!roleId && !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'),
  });

  // Sync form state when role data loads
  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description || '');
    }
  }, [role]);

  const updateMutation = useMutation({
    mutationFn: (data: { name?: string; description?: string }) =>
      roleService.updateRole(roleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role', roleId] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role updated successfully');
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update role');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => roleService.deleteRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role deleted successfully');
      router.push('/dashboard/roles');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete role');
    },
  });

  const handleUpdate = () => {
    updateMutation.mutate({ name, description });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!role) {
    return (
      <DashboardLayout role={user?.role || 'CUSTOMER'}>
        <div className="text-center py-12">
          <FiLayers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Role not found</p>
          <button onClick={() => router.back()} className="btn-primary mt-4">
            Go Back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const roleUserRole = user?.role || 'CUSTOMER';
  const canEdit = !role.isSystem && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN');

  return (
    <DashboardLayout role={roleUserRole}>
      <div>
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <FiArrowLeft className="w-5 h-5" />
            Back to Roles
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Role Details</h1>
              <p className="text-gray-600">View and manage role information</p>
            </div>
            {canEdit && (
              <div className="flex gap-3">
                {!isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <FiEdit className="w-5 h-5" />
                      Edit Role
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                      className="btn-secondary flex items-center gap-2 bg-red-600 text-white border-red-600 hover:bg-red-700"
                    >
                      <FiTrash2 className="w-5 h-5" />
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleUpdate}
                      disabled={updateMutation.isPending}
                      className="btn-primary flex items-center gap-2"
                    >
                      <FiSave className="w-5 h-5" />
                      {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setName(role.name);
                        setDescription(role.description || '');
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Role Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Role Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-field mt-1"
                    />
                  ) : (
                    <p className="text-gray-900 font-semibold text-lg mt-1">{role.name}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Description</label>
                  {isEditing ? (
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="input-field mt-1 min-h-[100px]"
                    />
                  ) : (
                    <p className="text-gray-900 mt-1">{role.description || 'No description'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">System Role</label>
                  <div className="mt-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      role.isSystem ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {role.isSystem ? 'System Role' : 'Custom Role'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Role ID</label>
                  <p className="text-gray-900 font-mono text-xs mt-1">{role.id}</p>
                </div>
              </div>
            </div>

            {/* Permissions */}
            {role.permissions && role.permissions.length > 0 && (
              <div className="card mt-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Assigned Permissions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {role.permissions.map((perm: any) => (
                    <div
                      key={perm.id}
                      className="p-3 rounded-lg border border-gray-200 hover:border-primary transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{perm.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {perm.resource}:{perm.action}
                          </p>
                        </div>
                        <button
                          onClick={() => router.push(`/dashboard/permissions/${perm.id}`)}
                          className="text-primary hover:text-primary-light"
                        >
                          <FiKey className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Info</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(role.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {role.updatedAt && (
                  <div>
                    <p className="text-xs text-gray-500">Last Updated</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(role.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {role.permissions && (
                  <div>
                    <p className="text-xs text-gray-500">Permissions Count</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {role.permissions.length}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}



