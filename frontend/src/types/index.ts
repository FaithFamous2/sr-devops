// API Response Types
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface CreateSecretResponse {
  data: {
    id: string;
    url: string;
  };
}

export interface RetrieveSecretResponse {
  data: {
    text: string;
    remainingViews: number;
  };
}

// Request Types
export interface CreateSecretRequest {
  text: string;
  ttlSeconds?: number;
  maxViews?: number;
}

// Activity Types
export interface SecretActivity {
  id: string;
  url: string;
  createdAt: string;
}

// Form Types
export interface SecretFormData {
  text: string;
  ttlSeconds: string;
  maxViews: string;
}

// Error Types
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'SECRET_NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export class AppError extends Error {
  code: ErrorCode;
  details?: Record<string, string[]>;

  constructor(code: ErrorCode, message: string, details?: Record<string, string[]>) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }
}
