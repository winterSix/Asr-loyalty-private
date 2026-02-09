import { apiClient, unwrapResponse } from '@/config/api';

export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export interface AssignRoleDto {
  userId: string;
  roleId: string;
}

class RoleService {
  // GET /roles
  async getRoles() {
    const response = await apiClient.get<any>('/roles');
    return unwrapResponse<Role[]>(response.data);
  }

  // GET /roles/:id
  async getRole(roleId: string) {
    const response = await apiClient.get<any>(`/roles/${roleId}`);
    return unwrapResponse<Role>(response.data);
  }

  // POST /roles
  async createRole(data: CreateRoleDto) {
    const response = await apiClient.post<any>('/roles', data);
    return unwrapResponse<Role>(response.data);
  }

  // PATCH /roles/:id
  async updateRole(roleId: string, data: UpdateRoleDto) {
    const response = await apiClient.patch<any>(`/roles/${roleId}`, data);
    return unwrapResponse<Role>(response.data);
  }

  // DELETE /roles/:id
  async deleteRole(roleId: string) {
    const response = await apiClient.delete(`/roles/${roleId}`);
    return unwrapResponse(response.data);
  }

  // GET /roles/permissions
  async getPermissions() {
    const response = await apiClient.get<any>('/roles/permissions');
    return unwrapResponse<Permission[]>(response.data);
  }

  // POST /roles/assign
  async assignRoleToUser(userId: string, roleId: string) {
    const response = await apiClient.post('/roles/assign', { userId, roleId });
    return unwrapResponse(response.data);
  }

  // DELETE /roles/:roleId/user/:userId
  async removeRoleFromUser(userId: string, roleId: string) {
    const response = await apiClient.delete(`/roles/${roleId}/user/${userId}`);
    return unwrapResponse(response.data);
  }

  // GET /roles/user/:userId/roles
  async getUserRoles(userId: string) {
    const response = await apiClient.get<any>(`/roles/user/${userId}/roles`);
    return unwrapResponse<Role[]>(response.data);
  }

  // GET /roles/user/:userId/permissions
  async getUserPermissions(userId: string) {
    const response = await apiClient.get<any>(`/roles/user/${userId}/permissions`);
    return unwrapResponse<Permission[]>(response.data);
  }
}

export const roleService = new RoleService();
