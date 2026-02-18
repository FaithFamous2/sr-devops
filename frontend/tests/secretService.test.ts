import { describe, it, expect, vi, beforeEach } from 'vitest';
import { secretService } from '../src/services/secretService';
import { AppError } from '../src/types';

// Mock fetch
global.fetch = vi.fn();

describe('SecretService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createSecret', () => {
    it('should create a secret successfully', async () => {
      const mockResponse = {
        data: {
          id: 'test-id-123',
          url: 'http://test.localhost/secrets/test-id-123',
        },
      };

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await secretService.createSecret({
        text: 'my-secret',
      });

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/secrets'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ text: 'my-secret' }),
        })
      );
    });

    it('should throw AppError on validation error', async () => {
      const mockErrorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The given data was invalid.',
          details: {
            text: ['The secret text is required.'],
          },
        },
      };

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      });

      await expect(secretService.createSecret({ text: '' })).rejects.toThrow(AppError);
    });
  });

  describe('retrieveSecret', () => {
    it('should retrieve a secret successfully', async () => {
      const mockResponse = {
        data: {
          text: 'my-secret',
          remainingViews: 0,
        },
      };

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await secretService.retrieveSecret('test-id-123');

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/secrets/test-id-123'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should throw AppError when secret not found', async () => {
      const mockErrorResponse = {
        error: {
          code: 'SECRET_NOT_FOUND',
          message: 'This secret has been burned, expired, or does not exist.',
        },
      };

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      });

      await expect(secretService.retrieveSecret('nonexistent')).rejects.toThrow(AppError);
    });
  });
});
