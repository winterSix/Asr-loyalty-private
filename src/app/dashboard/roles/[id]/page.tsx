'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService } from '@/services/role.service';
import toast from 'react-hot-toast';
import {
  FiLayers,
  FiArrowLeft,
  FiEdit,
  FiSave,
  FiTrash2,
  FiKey,
  FiCheck,
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
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const { data: role, isLoading: roleLoading } = useQuery({
    queryKey: ['role', roleId],
    queryFn: () => roleService.getRole(roleId),
    enabled: !!roleId && !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'OTHERS'),
  });

  const { data: allPermissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => roleService.getPermissions(),
    enabled: !isLoading && !!user && isSuperAdmin,
  });

  // Sync form state when role data loads
  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description || '');
      setSelectedPermissionIds(new Set((role.permissions || []).map((p: any) => p.id)));
    }
  }, [role]);

  const updateMutation = useMutation({
    mutationFn: (data: { name?: string; description?: string; permissionIds?: string[] }) =>
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
    const payload: { name?: string; description?: string; permissionIds?: string[] } = {
      description,
    };
    // Only include name if it's not a system role (backend blocks renaming anyway)
    if (!role?.isSystem) {
      payload.name = name;
    }
    // Only SUPER_ADMIN can update permissions
    if (isSuperAdmin) {
      payload.permissionIds = [...selectedPermissionIds];
    }
    updateMutation.mutate(payload);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) {
        next.delete(permId);
      } else {
        next.add(permId);
      }
      return next;
    });
  };

  const cancelEdit = () => {
    setIsEditing(false);
    if (role) {
      setName(role.name);
      setDescription(role.description || '');
      setSelectedPermissionIds(new Set((role.permissions || []).map((p: any) => p.id)));
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
        <div className="text-center py-12">
          <FiLayers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Role not found</p>
          <button onClick={() => router.back()} className="btn-primary mt-4">
            Go Back
          </button>
        </div>
    );
  }

  // Super Admin can edit all roles except SUPER_ADMIN itself
  // Admin can only edit custom (non-system) roles
  const canEdit = role.name !== 'SUPER_ADMIN' && (
    isSuperAdmin || (!role.isSystem && user?.role === 'ADMIN')
  );

  // Group all permissions by resource for the checkbox UI
  const permissionsByResource: Record<string, any[]> = {};
  if (allPermissions) {
    for (const perm of allPermissions) {
      if (!permissionsByResource[perm.resource]) {
        permissionsByResource[perm.resource] = [];
      }
      permissionsByResource[perm.resource].push(perm);
    }
  }

  return (
    <>
      <div>
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:hover:text-[#F1F5F9] mb-4"
          >
            <FiArrowLeft className="w-5 h-5" />
            Back to Roles
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25">
                <FiLayers className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#E5B887]">Role Details</h1>
                <p className="text-gray-500 text-sm">View and manage role information</p>
              </div>
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
                    {!role.isSystem && (
                      <button
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                        className="btn-secondary flex items-center gap-2 bg-red-600 text-white border-red-600 hover:bg-red-700"
                      >
                        <FiTrash2 className="w-5 h-5" />
                        Delete
                      </button>
                    )}
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
                      onClick={cancelEdit}
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
                  {isEditing && !role.isSystem ? (
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-field mt-1"
                    />
                  ) : (
                    <p className="text-gray-900 font-semibold text-lg mt-1">
                      {role.name}
                      {role.isSystem && (
                        <span className="text-xs text-gray-400 font-normal ml-2">(system role — name cannot be changed)</span>
                      )}
                    </p>
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
            <div className="card mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {isEditing && isSuperAdmin ? 'Edit Permissions' : 'Assigned Permissions'}
                </h2>
                {isEditing && isSuperAdmin && (
                  <span className="text-xs text-gray-500">
                    {selectedPermissionIds.size} selected
                  </span>
                )}
              </div>

              {isEditing && isSuperAdmin ? (
                /* Pill-based permission editor grouped by resource — same UI as Create Role modal */
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">{selectedPermissionIds.size} selected</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (allPermissions) {
                          const allIds = allPermissions.map((p: any) => p.id);
                          setSelectedPermissionIds(
                            selectedPermissionIds.size === allIds.length
                              ? new Set()
                              : new Set(allIds)
                          );
                        }
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      {allPermissions && selectedPermissionIds.size === allPermissions.length ? 'Deselect all' : 'Select all'}
                    </button>
                  </div>
                  {Object.entries(permissionsByResource).sort().map(([resource, perms]) => {
                    const allSelected = perms.every(p => selectedPermissionIds.has(p.id));
                    const someSelected = perms.some(p => selectedPermissionIds.has(p.id));
                    return (
                      <div key={resource} className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                        {/* Resource header — click to toggle all in resource */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPermissionIds(prev => {
                              const next = new Set(prev);
                              if (allSelected) {
                                perms.forEach(p => next.delete(p.id));
                              } else {
                                perms.forEach(p => next.add(p.id));
                              }
                              return next;
                            });
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                            allSelected ? 'bg-violet-50 dark:bg-violet-900/20' : someSelected ? 'bg-gray-50 dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'
                          }`}
                        >
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{resource}</span>
                          <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            allSelected
                              ? 'bg-violet-500 border-violet-500'
                              : someSelected
                              ? 'bg-violet-200 border-violet-300'
                              : 'border-gray-300'
                          }`}>
                            {(allSelected || someSelected) && <FiCheck className="w-2.5 h-2.5 text-white" />}
                          </span>
                        </button>
                        {/* Action pills */}
                        <div className="px-4 py-2 flex flex-wrap gap-2">
                          {perms.map((perm) => {
                            const checked = selectedPermissionIds.has(perm.id);
                            return (
                              <button
                                key={perm.id}
                                type="button"
                                onClick={() => togglePermission(perm.id)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                                  checked
                                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 ring-1 ring-violet-400/40'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                              >
                                {checked && <FiCheck className="w-3 h-3" />}
                                {perm.action}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Read-only view */
                role.permissions && role.permissions.length > 0 ? (
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
                ) : (
                  <p className="text-gray-500 text-sm">No permissions assigned</p>
                )
              )}
            </div>
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
                      {isEditing && isSuperAdmin ? selectedPermissionIds.size : role.permissions.length}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                <FiTrash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Role</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
              Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">{role.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary"
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowDeleteModal(false); deleteMutation.mutate(); }}
                disabled={deleteMutation.isPending}
                className="btn-secondary flex items-center gap-2 bg-red-600 text-white border-red-600 hover:bg-red-700"
              >
                <FiTrash2 className="w-4 h-4" />
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
