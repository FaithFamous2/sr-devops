import {
  ApiErrorResponse,
  CreateSecretRequest,
  CreateSecretResponse,
  RetrieveSecretResponse,
  AppError,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://secure-drop.localhost';

class SecretService {
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData: ApiErrorResponse = await response.json().catch(() => ({
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred',
        },
      }));

      throw new AppError(
        errorData.error.code as AppError['code'],
        errorData.error.message,
        errorData.error.details
      );
    }

    return response.json();
  }

  async createSecret(data: CreateSecretRequest): Promise<CreateSecretResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/secrets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return this.handleResponse<CreateSecretResponse>(response);
  }

  async retrieveSecret(id: string): Promise<RetrieveSecretResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/secrets/${id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    return this.handleResponse<RetrieveSecretResponse>(response);
  }
}

export const secretService = new SecretService();
