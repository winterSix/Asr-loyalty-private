import { apiClient, unwrapResponse } from '@/config/api';

export interface QRCode {
  id: string;
  userId?: string;
  code: string;
  amount?: string;
  reference: string;
  description?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'USED' | 'CANCELLED';
  expiresAt: string;
  usedAt?: string;
  transactionId?: string;
  createdAt: string;
}

export interface ScannerSession {
  id: string;
  expectedAmount: string;
  currency: string;
  cashierId?: string;
  posReference?: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string;
  completedAt?: string;
  transactionId?: string;
  createdAt: string;
}

export interface CreatePaymentWithQrDto {
  amount: number;
  description?: string;
  paymentPin: string;
}

export interface PrepareScannerDto {
  expectedAmount: number;
  currency?: string;
  posReference?: string;
  timeoutMinutes?: number;
}

export interface ScanQrCodeDto {
  scannerSessionId: string;
  qrCode: string;
}

class QRService {
  // POST /qr-code/payment/create (Customer)
  async createPaymentQr(data: CreatePaymentWithQrDto) {
    const response = await apiClient.post<any>('/qr-code/payment/create', data);
    return unwrapResponse<QRCode>(response.data);
  }

  // POST /qr-code/verify
  async verifyQr(signedData: string) {
    const response = await apiClient.post<any>('/qr-code/verify', { signedData });
    return unwrapResponse(response.data);
  }

  // POST /qr-code/scanner/prepare (Cashier)
  async prepareScannerSession(data: PrepareScannerDto) {
    const response = await apiClient.post<any>('/qr-code/scanner/prepare', data);
    return unwrapResponse<ScannerSession>(response.data);
  }

  // POST /qr-code/scanner/scan (Cashier)
  async scanQrCode(data: ScanQrCodeDto): Promise<{ qrCodeId: string; status: string; amount?: string }> {
    const response = await apiClient.post<{ qrCodeId: string; status: string; amount?: string }>('/qr-code/scanner/scan', data);
    return unwrapResponse<{ qrCodeId: string; status: string; amount?: string }>(response.data);
  }

  // POST /qr-code/payment/process (Cashier)
  async processPayment(scannerSessionId: string, qrCodeId: string) {
    const response = await apiClient.post<any>('/qr-code/payment/process', {
      scannerSessionId,
      qrCodeId,
    });
    return unwrapResponse(response.data);
  }

  // GET /qr-code/status/:qrCodeId
  async getQrStatus(qrCodeId: string) {
    const response = await apiClient.get<any>(`/qr-code/status/${qrCodeId}`);
    return unwrapResponse<QRCode>(response.data);
  }

  // Legacy methods for compatibility
  async generateQRCode(data: { amount?: number; description?: string; expiresInMinutes?: number; paymentPin: string }) {
    return this.createPaymentQr({
      amount: data.amount || 0,
      description: data.description,
      paymentPin: data.paymentPin,
    });
  }

  async getQRCodes(params?: { page?: number; limit?: number; status?: string }) {
    // This endpoint doesn't exist in the backend, return empty for now
    return { data: [], total: 0 };
  }

  async getQRCode(qrCodeId: string) {
    return this.getQrStatus(qrCodeId);
  }

  async cancelQRCode(qrCodeId: string) {
    // This endpoint doesn't exist in the backend
    throw new Error('Cancel QR code endpoint not available');
  }

  async createScannerSession(data: { expectedAmount: number; currency?: string; posReference?: string; timeoutMinutes?: number }) {
    return this.prepareScannerSession(data);
  }

  async processQRPayment(data: { qrCode: string; scannerSessionId?: string; paymentPin: string }) {
    if (!data.scannerSessionId) {
      throw new Error('Scanner session ID is required');
    }
    // First scan the QR code
    const scanResult = await this.scanQrCode({
      scannerSessionId: data.scannerSessionId,
      qrCode: data.qrCode,
    });
    // Then process the payment
    return this.processPayment(data.scannerSessionId, scanResult.qrCodeId || '');
  }
}

export const qrService = new QRService();
