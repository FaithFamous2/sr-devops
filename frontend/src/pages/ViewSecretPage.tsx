import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { secretService } from '@/services/secretService';
import { AppError } from '@/types';

export function ViewSecretPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['secret', id],
    queryFn: () => secretService.retrieveSecret(id!),
    enabled: !!id,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <div className="animate-pulse">
            <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-gray-400 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Retrieving Secret...</h2>
            <p className="text-gray-600">Please wait while we securely retrieve your secret.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    const errorMessage = error instanceof AppError ? error.message : 'This secret has been burned, expired, or does not exist.';

    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Secret Not Found</h2>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <Link to="/" className="btn btn-primary">
            Create a New Secret
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-1000">Secret Revealed</h1>
          <p className="text-gray-600 mt-2">
            This secret has been revealed and may no longer be available.
          </p>
        </div>

        <div className="mb-6">
          <label htmlFor="secret-text" className="label">
            Secret Content
          </label>
          <div
            id="secret-text"
            className="w-full px-4 py-3 bg-gray-500 border border-gray-300 rounded-lg font-mono text-sm break-all"
            role="region"
            aria-live="polite"
          >
            {data.data.text}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <svg
              className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-blue-800">Important Information</h3>
              <ul className="text-sm text-blue-700 mt-1 list-disc list-inside">
                {data.data.remainingViews > 0 && (
                  <li>Remaining views: {data.data.remainingViews}</li>
                )}
                <li>This secret may be deleted after viewing</li>
                <li>Copy the content now if you need it later</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Link to="/" className="btn btn-primary flex-1">
            Create Another Secret
          </Link>
        </div>
      </div>
    </div>
  );
}
