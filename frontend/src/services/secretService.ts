import {
  ApiErrorResponse,
  CreateSecretRequest,
  CreateSecretResponse,
  RetrieveSecretResponse,
  AppError,
} from '@/types';

// Use VITE_API_URL from environment (set during Docker build)
// In production, this should be the full API URL (e.g., http://51.20.121.247/api/v1)
// In development, this defaults to empty string for relative URLs
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

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
    const url = API_BASE_URL ? `${API_BASE_URL}/secrets` : '/api/v1/secrets';
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
    const url = API_BASE_URL ? `${API_BASE_URL}/secrets/${id}` : `/api/v1/secrets/${id}`;
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
