import { apiClient, unwrapResponse } from '@/config/api';

export interface QueueStatus {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

export interface Job {
  id: string;
  name: string;
  data: any;
  progress: number;
  attemptsMade: number;
  failedReason?: string;
  finishedOn?: number;
  processedOn?: number;
  timestamp: number;
}

export interface ReportJobData {
  type: string;
  startDate?: string;
  endDate?: string;
  format?: string;
  requestedBy: string;
  email?: string;
}

class JobsService {
  // GET /jobs/status
  async getAllQueueStatus() {
    const response = await apiClient.get<any>('/jobs/status');
    return unwrapResponse<{ success: boolean; queues: QueueStatus[] }>(response.data);
  }

  // GET /jobs/status/:queue
  async getQueueStatus(queue: string) {
    const response = await apiClient.get<any>(
      `/jobs/status/${queue}`
    );
    return unwrapResponse(response.data);
  }

  // GET /jobs/:queue/:jobId
  async getJob(queue: string, jobId: string) {
    const response = await apiClient.get<any>(
      `/jobs/${queue}/${jobId}`
    );
    return unwrapResponse(response.data);
  }

  // POST /jobs/:queue/:jobId/retry
  async retryJob(queue: string, jobId: string) {
    const response = await apiClient.post<any>(
      `/jobs/${queue}/${jobId}/retry`
    );
    return unwrapResponse(response.data);
  }

  // DELETE /jobs/:queue/:jobId
  async removeJob(queue: string, jobId: string) {
    const response = await apiClient.delete<any>(
      `/jobs/${queue}/${jobId}`
    );
    return unwrapResponse(response.data);
  }

  // POST /jobs/:queue/clean
  async cleanQueue(queue: string, status: 'completed' | 'failed' | 'delayed' | 'wait' | 'active') {
    const response = await apiClient.post<any>(
      `/jobs/${queue}/clean`,
      null,
      { params: { status } }
    );
    return unwrapResponse(response.data);
  }

  // POST /jobs/:queue/pause
  async pauseQueue(queue: string) {
    const response = await apiClient.post<any>(
      `/jobs/${queue}/pause`
    );
    return unwrapResponse(response.data);
  }

  // POST /jobs/:queue/resume
  async resumeQueue(queue: string) {
    const response = await apiClient.post<any>(
      `/jobs/${queue}/resume`
    );
    return unwrapResponse(response.data);
  }

  // POST /jobs/tier-evaluation/all
  async triggerBulkTierEvaluation() {
    const response = await apiClient.post<any>(
      '/jobs/tier-evaluation/all'
    );
    return unwrapResponse(response.data);
  }

  // POST /jobs/tier-evaluation/:userId
  async triggerUserTierEvaluation(userId: string) {
    const response = await apiClient.post<any>(
      `/jobs/tier-evaluation/${userId}`
    );
    return unwrapResponse(response.data);
  }

  // POST /jobs/reports/generate
  async generateReport(data: Omit<ReportJobData, 'requestedBy'>) {
    const response = await apiClient.post<any>(
      '/jobs/reports/generate',
      data
    );
    return unwrapResponse(response.data);
  }
}

export const jobsService = new JobsService();

