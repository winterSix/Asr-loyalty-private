import { apiClient, unwrapResponse } from '@/config/api';

export interface SetPaymentPinDto {
  pin: string;
}

export interface ChangePaymentPinDto {
  oldPin: string;
  newPin: string;
}

class PaymentPinService {
  // POST /payment-pin/set
  async setPaymentPin(pin: string) {
    const response = await apiClient.post<any>('/payment-pin/set', { pin });
    return unwrapResponse<{ message: string }>(response.data);
  }

  // PATCH /payment-pin/change
  async changePaymentPin(oldPin: string, newPin: string) {
    const response = await apiClient.patch<any>('/payment-pin/change', {
      oldPin,
      newPin,
    });
    return unwrapResponse<{ message: string }>(response.data);
  }
}

export const paymentPinService = new PaymentPinService();

