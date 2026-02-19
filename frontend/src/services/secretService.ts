import {
  ApiErrorResponse,
  CreateSecretRequest,
  CreateSecretResponse,
  RetrieveSecretResponse,
  AppError,
} from '@/types';

// Use relative URLs for API calls in production (same origin)
// This avoids CORS issues and works with any domain/IP
const API_BASE_URL = '/api/v1';

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
    const url = `${API_BASE_URL}/secrets`;
    const response = await fetch(url, {
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
    const url = `${API_BASE_URL}/secrets/${id}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    return this.handleResponse<RetrieveSecretResponse>(response);
  }
}

export const secretService = new SecretService();
