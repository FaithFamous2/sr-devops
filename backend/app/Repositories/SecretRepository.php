<?php

namespace App\Repositories;

use App\Models\Secret;
use App\Repositories\Contracts\SecretRepositoryInterface;

class SecretRepository implements SecretRepositoryInterface
{
    /**
     * Find a secret by its public ID.
     */
    public function findByPublicId(string $publicId): ?Secret
    {
        return Secret::where('public_id', $publicId)->first();
    }

    /**
     * Create a new secret.
     */
    public function create(array $data): Secret
    {
        return Secret::create($data);
    }

    /**
     * Update a secret.
     */
    public function update(Secret $secret, array $data): bool
    {
        return $secret->update($data);
    }

    /**
     * Delete a secret.
     */
    public function delete(Secret $secret): bool
    {
        return $secret->delete();
    }

    /**
     * Delete expired secrets.
     */
    public function deleteExpired(): int
    {
        return Secret::where('expires_at', '<', now())->delete();
    }
}
