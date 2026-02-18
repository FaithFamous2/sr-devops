<?php

namespace App\Repositories\Contracts;

use App\Models\Secret;

interface SecretRepositoryInterface
{
    /**
     * Find a secret by its public ID.
     */
    public function findByPublicId(string $publicId): ?Secret;

    /**
     * Create a new secret.
     */
    public function create(array $data): Secret;

    /**
     * Update a secret.
     */
    public function update(Secret $secret, array $data): bool;

    /**
     * Delete a secret.
     */
    public function delete(Secret $secret): bool;

    /**
     * Delete expired secrets.
     */
    public function deleteExpired(): int;
}
