<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSecretRequest;
use App\Services\SecretService;
use Illuminate\Http\JsonResponse;

class SecretController extends Controller
{
    protected SecretService $secretService;

    public function __construct(SecretService $secretService)
    {
        $this->secretService = $secretService;
    }

    /**
     * Create a new secret.
     *
     * @group Secrets
     *
     * @bodyParam text string required The secret text to encrypt. Example: my-api-key-12345
     * @bodyParam ttlSeconds int optional Time to live in seconds (10 to 2592000). Example: 3600
     * @bodyParam maxViews int optional Maximum number of views allowed (1 to 100). Default: 1. Example: 1
     *
     * @response 201 scenario="Secret created successfully" {
     *   "data": {
     *     "id": "V1StGXR8_Z5jdHi6B-myT",
     *     "url": "http://secure-drop.localhost/secrets/V1StGXR8_Z5jdHi6B-myT"
     *   }
     * }
     * @response 422 scenario="Validation error" {
     *   "error": {
     *     "code": "VALIDATION_ERROR",
     *     "message": "The given data was invalid.",
     *     "details": {
     *       "text": ["The secret text is required."]
     *     }
     *   }
     * }
     */
    public function store(StoreSecretRequest $request): JsonResponse
    {
        $secret = $this->secretService->createSecret(
            $request->input('text'),
            $request->input('ttlSeconds'),
            $request->input('maxViews')
        );

        $baseUrl = config('app.frontend_url', config('app.url'));

        return response()->json([
            'data' => [
                'id' => $secret->public_id,
                'url' => rtrim($baseUrl, '/') . '/secrets/' . $secret->public_id,
            ],
        ], 201);
    }

    /**
     * Retrieve a secret (burn-on-read).
     *
     * @group Secrets
     *
     * @urlParam id string required The secret ID. Example: V1StGXR8_Z5jdHi6B-myT
     *
     * @response 200 scenario="Secret retrieved successfully" {
     *   "data": {
     *     "text": "my-api-key-12345",
     *     "remainingViews": 0
     *   }
     * }
     * @response 404 scenario="Secret not found, expired, or burned" {
     *   "error": {
     *     "code": "SECRET_NOT_FOUND",
     *     "message": "This secret has been burned, expired, or does not exist."
     *   }
     * }
     */
    public function show(string $id): JsonResponse
    {
        $secret = $this->secretService->retrieveSecret($id);

        if (!$secret) {
            return response()->json([
                'error' => [
                    'code' => 'SECRET_NOT_FOUND',
                    'message' => 'This secret has been burned, expired, or does not exist.',
                ],
            ], 404);
        }

        return response()->json([
            'data' => [
                'text' => $secret->decrypted_text,
                'remainingViews' => $secret->remaining_views,
            ],
        ]);
    }
}
