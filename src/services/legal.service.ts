import { apiClient, unwrapResponse } from '@/config/api';

export type LegalDocumentType = 'PRIVACY_POLICY' | 'TERMS_AND_CONDITIONS';

export interface LegalDocument {
  id: string;
  type: LegalDocumentType;
  title: string;
  content: string;
  version: number;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateLegalDocumentDto {
  title?: string;
  content: string;
}

export const legalService = {
  getAllDocuments: async (): Promise<LegalDocument[]> => {
    const res = await apiClient.get('/legal');
    return unwrapResponse<LegalDocument[]>(res.data);
  },

  getDocument: async (type: LegalDocumentType): Promise<LegalDocument> => {
    const res = await apiClient.get(`/legal/${type}`);
    return unwrapResponse<LegalDocument>(res.data);
  },

  updateDocument: async (type: LegalDocumentType, dto: UpdateLegalDocumentDto): Promise<LegalDocument> => {
    const res = await apiClient.patch(`/legal/${type}`, dto);
    return unwrapResponse<LegalDocument>(res.data);
  },
};
