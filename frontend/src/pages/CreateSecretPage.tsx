import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { secretService } from '@/services/secretService';
import { useActivity } from '@/hooks/useActivity';
import { useToast } from '@/components/Toast';
import { QRCode } from '@/components/QRCode';
import { ConfirmDialog } from '@/components/Modal';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { AppError, SecretFormData } from '@/types';

export function CreateSecretPage() {
  const [formData, setFormData] = useState<SecretFormData>({
    text: '',
    ttlSeconds: '',
    maxViews: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const { addActivity } = useActivity();
  const { showToast } = useToast();

  const createMutation = useMutation({
    mutationFn: () => {
      const data = {
        text: formData.text,
        ttlSeconds: formData.ttlSeconds ? parseInt(formData.ttlSeconds, 10) : undefined,
        maxViews: formData.maxViews ? parseInt(formData.maxViews, 10) : undefined,
      };
      return secretService.createSecret(data);
    },
    onSuccess: (response) => {
      setCreatedUrl(response.data.url);
      setCreatedId(response.data.id);
      addActivity(response.data.id, response.data.url);
      setFormData({ text: '', ttlSeconds: '', maxViews: '' });
      setErrors({});
      showToast('Secret created successfully!', 'success');
    },
    onError: (error) => {
      if (error instanceof AppError) {
        if (error.details) {
          const fieldErrors: Record<string, string> = {};
          Object.entries(error.details).forEach(([field, messages]) => {
            fieldErrors[field] = messages[0];
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ general: error.message });
        }
        showToast(error.message, 'error');
      } else {
        setErrors({ general: 'An unexpected error occurred. Please try again.' });
        showToast('An unexpected error occurred', 'error');
      }
    },
  });

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'Enter', ctrl: true, action: () => {
      if (!createdUrl && formData.text.trim()) {
        createMutation.mutate();
      }
    }},
  ]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.text.trim()) {
      newErrors.text = 'Secret text is required';
    } else if (formData.text.length > 10000) {
      newErrors.text = 'Secret text must be less than 10,000 characters';
    }

    if (formData.ttlSeconds) {
      const ttl = parseInt(formData.ttlSeconds, 10);
      if (isNaN(ttl) || ttl < 10 || ttl > 2592000) {
        newErrors.ttlSeconds = 'TTL must be between 10 seconds and 30 days';
      }
    }

    if (formData.maxViews) {
      const views = parseInt(formData.maxViews, 10);
      if (isNaN(views) || views < 1 || views > 100) {
        newErrors.maxViews = 'Max views must be between 1 and 100';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      createMutation.mutate();
    }
  };

  const handleCopyUrl = async () => {
    if (createdUrl && urlInputRef.current) {
      try {
        await navigator.clipboard.writeText(createdUrl);
        setCopySuccess(true);
        showToast('URL copied to clipboard!', 'success');
        setTimeout(() => setCopySuccess(false), 2000);
      } catch {
        urlInputRef.current.select();
        document.execCommand('copy');
        setCopySuccess(true);
        showToast('URL copied to clipboard!', 'success');
        setTimeout(() => setCopySuccess(false), 2000);
      }
    }
  };

  const handleCreateAnother = () => {
    setCreatedUrl(null);
    setCreatedId(null);
    setCopySuccess(false);
  };

  // Focus management
  useEffect(() => {
    if (createdUrl && urlInputRef.current) {
      urlInputRef.current.focus();
      urlInputRef.current.select();
    }
  }, [createdUrl]);

  if (createdUrl) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="card">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Secret Created!</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Your secret has been created and is ready to share.
            </p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-6">
            <QRCode value={createdUrl} size={180} />
          </div>

          {/* Share URL */}
          <div className="mb-6">
            <label htmlFor="share-url" className="label">
              Share URL
            </label>
            <div className="flex gap-2">
              <input
                ref={urlInputRef}
                id="share-url"
                type="text"
                value={createdUrl}
                readOnly
                className="input font-mono text-sm"
              />
              <button
                onClick={handleCopyUrl}
                className={`btn ${copySuccess ? 'bg-green-600 text-white' : 'btn-primary'} min-w-[80px]`}
              >
                {copySuccess ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
            <div className="flex">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Important</h3>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  This link will only work once (or the specified number of times). Copy it now as it won't be shown again.
                </p>
              </div>
            </div>
          </div>

          <button onClick={handleCreateAnother} className="btn btn-secondary w-full">
            Create Another Secret
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create a Secret</h1>
          <span className="text-xs text-gray-400">
            <kbd>⌘</kbd> + <kbd>Enter</kbd> to submit
          </span>
        </div>

        {errors.general && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6" role="alert">
            <div className="flex items-center gap-2">
              <span className="text-red-500">✕</span>
              <p className="text-red-700 dark:text-red-400">{errors.general}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-6">
            <label htmlFor="text" className="label">
              Secret Text <span className="text-red-500">*</span>
            </label>
            <textarea
              id="text"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              className={`input min-h-[120px] resize-y ${errors.text ? 'input-error' : ''}`}
              placeholder="Enter your secret text (password, API key, etc.)"
              aria-describedby={errors.text ? 'text-error' : undefined}
              aria-invalid={!!errors.text}
            />
            {errors.text && (
              <p id="text-error" className="error-text flex items-center gap-1" role="alert">
                <span>⚠️</span> {errors.text}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">{formData.text.length}/10,000 characters</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="ttlSeconds" className="label">
                Time to Live (seconds)
              </label>
              <input
                id="ttlSeconds"
                type="number"
                value={formData.ttlSeconds}
                onChange={(e) => setFormData({ ...formData, ttlSeconds: e.target.value })}
                className={`input ${errors.ttlSeconds ? 'input-error' : ''}`}
                placeholder="e.g., 3600 (1 hour)"
                min="10"
                max="2592000"
              />
              {errors.ttlSeconds ? (
                <p className="error-text flex items-center gap-1">
                  <span>⚠️</span> {errors.ttlSeconds}
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-1">Optional: 10s to 30 days</p>
              )}
            </div>

            <div>
              <label htmlFor="maxViews" className="label">
                Max Views
              </label>
              <input
                id="maxViews"
                type="number"
                value={formData.maxViews}
                onChange={(e) => setFormData({ ...formData, maxViews: e.target.value })}
                className={`input ${errors.maxViews ? 'input-error' : ''}`}
                placeholder="Default: 1"
                min="1"
                max="100"
              />
              {errors.maxViews ? (
                <p className="error-text flex items-center gap-1">
                  <span>⚠️</span> {errors.maxViews}
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-1">Optional: 1-100 (default: 1)</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn btn-primary w-full text-lg py-3"
          >
            {createMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating...
              </span>
            ) : (
              '🔐 Create Secret'
            )}
          </button>
        </form>
      </div>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={() => {
          setFormData({ text: '', ttlSeconds: '', maxViews: '' });
          setErrors({});
        }}
        title="Clear Form?"
        message="Are you sure you want to clear the form? All entered data will be lost."
        confirmText="Clear"
        variant="warning"
      />
    </div>
  );
}
