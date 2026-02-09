import { apiClient, unwrapResponse } from '@/config/api';

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface GroupedPermissions {
  [resource: string]: Permission[];
}

export interface PermissionStatistics {
  totalPermissions: number;
  totalResources: number;
  totalActions: number;
  assignedPermissions: number;
  permissionsByResource?: Record<string, number>;
}

class PermissionService {
  // GET /permissions
  async getAllPermissions() {
    const response = await apiClient.get<any>('/permissions');
    return unwrapResponse<Permission[]>(response.data);
  }

  // GET /permissions/grouped
  async getGroupedPermissions() {
    const response = await apiClient.get<any>('/permissions/grouped');
    return unwrapResponse<GroupedPermissions>(response.data);
  }

  // GET /permissions/resources
  async getResources() {
    const response = await apiClient.get<any>('/permissions/resources');
    return unwrapResponse<string[]>(response.data);
  }

  // GET /permissions/resource/:resource
  async getPermissionsByResource(resource: string) {
    const response = await apiClient.get<any>(`/permissions/resource/${resource}`);
    return unwrapResponse<Permission[]>(response.data);
  }

  // GET /permissions/resource/:resource/actions
  async getActionsByResource(resource: string) {
    const response = await apiClient.get<any>(`/permissions/resource/${resource}/actions`);
    return unwrapResponse<string[]>(response.data);
  }

  // GET /permissions/resource/:resource/action/:action
  async getPermissionByResourceAndAction(resource: string, action: string) {
    const response = await apiClient.get<any>(`/permissions/resource/${resource}/action/${action}`);
    return unwrapResponse<Permission>(response.data);
  }

  // GET /permissions/:id
  async getPermission(permissionId: string) {
    const response = await apiClient.get<any>(`/permissions/${permissionId}`);
    return unwrapResponse<Permission>(response.data);
  }

  // GET /permissions/stats/overview
  async getStatistics(): Promise<PermissionStatistics> {
    const response = await apiClient.get<PermissionStatistics>('/permissions/stats/overview');
    return unwrapResponse<PermissionStatistics>(response.data);
  }

  // POST /permissions/seed
  async seedPermissions() {
    const response = await apiClient.post('/permissions/seed');
    return unwrapResponse(response.data);
  }
}

export const permissionService = new PermissionService();

