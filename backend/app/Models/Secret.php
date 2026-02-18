<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class Secret extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'public_id',
        'encrypted_text',
        'max_views',
        'remaining_views',
        'expires_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'expires_at' => 'datetime',
        'max_views' => 'integer',
        'remaining_views' => 'integer',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'id',
        'encrypted_text',
    ];

    /**
     * Set the secret text (encrypts automatically).
     */
    public function setTextAttribute(string $value): void
    {
        $this->attributes['encrypted_text'] = Crypt::encryptString($value);
    }

    /**
     * Get the decrypted secret text.
     */
    public function getTextAttribute(): string
    {
        return Crypt::decryptString($this->encrypted_text);
    }

    /**
     * Check if the secret has expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    /**
     * Check if the secret has remaining views.
     */
    public function hasRemainingViews(): bool
    {
        return $this->remaining_views > 0;
    }

    /**
     * Check if the secret is valid (not expired and has views).
     */
    public function isValid(): bool
    {
        return !$this->isExpired() && $this->hasRemainingViews();
    }

    /**
     * Decrement remaining views.
     */
    public function decrementViews(): bool
    {
        if ($this->remaining_views <= 0) {
            return false;
        }

        $this->decrement('remaining_views');
        return true;
    }
}
