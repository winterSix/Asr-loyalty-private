import { apiClient, unwrapResponse } from '@/config/api';

// Note: Webhooks are typically server-to-server, but we can create a service for webhook management
// if there are admin endpoints for viewing webhook logs/history

class WebhooksService {
  // POST /webhooks/paystack
  // Note: This is typically called by Paystack, not by the frontend
  // But we can include it for reference/testing purposes
  async handlePaystackWebhook(signature: string, body: any) {
    const response = await apiClient.post(
      '/webhooks/paystack',
      body,
      {
        headers: {
          'x-paystack-signature': signature,
        },
      }
    );
    return unwrapResponse(response.data);
  }
}

export const webhooksService = new WebhooksService();

