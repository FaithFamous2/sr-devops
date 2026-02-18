<?php

namespace App\Services;

use App\Models\Secret;
use App\Repositories\Contracts\SecretRepositoryInterface;
use Hidehalo\Nanoid\Client as NanoidClient;
use Carbon\Carbon;
use Illuminate\Support\Facades\Crypt;

class SecretService
{
    protected SecretRepositoryInterface $repository;
    protected NanoidClient $nanoid;

    public function __construct(SecretRepositoryInterface $repository)
    {
        $this->repository = $repository;
        $this->nanoid = new NanoidClient();
    }

    /**
     * Create a new secret.
     */
    public function createSecret(string $text, ?int $ttlSeconds = null, ?int $maxViews = null): Secret
    {
        $publicId = $this->generatePublicId();
        $maxViews = $maxViews ?? 1;

        $data = [
            'public_id' => $publicId,
            'encrypted_text' => Crypt::encryptString($text),
            'max_views' => $maxViews,
            'remaining_views' => $maxViews,
        ];

        if ($ttlSeconds !== null && $ttlSeconds > 0) {
            $data['expires_at'] = Carbon::now()->addSeconds($ttlSeconds);
        }

        return $this->repository->create($data);
    }

    /**
     * Retrieve and consume a secret (burn-on-read).
     */
    public function retrieveSecret(string $publicId): ?Secret
    {
        $secret = $this->repository->findByPublicId($publicId);

        if (!$secret) {
            return null;
        }

        // Check if expired
        if ($secret->isExpired()) {
            $this->repository->delete($secret);
            return null;
        }

        // Check if has remaining views
        if (!$secret->hasRemainingViews()) {
            $this->repository->delete($secret);
            return null;
        }

        // Decrypt the text before decrementing/deleting
        $decryptedText = $secret->text;

        // Decrement remaining views
        $secret->decrementViews();
        $secret->refresh();

        // If no more views remaining, delete the secret
        if ($secret->remaining_views <= 0) {
            $this->repository->delete($secret);
        }

        // Return the secret with decrypted text
        $secret->decrypted_text = $decryptedText;
        return $secret;
    }

    /**
     * Get a secret without consuming it (for preview purposes).
     */
    public function getSecretInfo(string $publicId): ?Secret
    {
        $secret = $this->repository->findByPublicId($publicId);

        if (!$secret || $secret->isExpired() || !$secret->hasRemainingViews()) {
            return null;
        }

        return $secret;
    }

    /**
     * Delete expired secrets (cleanup job).
     */
    public function cleanupExpired(): int
    {
        return $this->repository->deleteExpired();
    }

    /**
     * Generate a unique public ID using Nanoid.
     */
    protected function generatePublicId(): string
    {
        do {
            $id = $this->nanoid->generateId(21);
        } while ($this->repository->findByPublicId($id) !== null);

        return $id;
    }
}
