<?php

namespace Tests\Feature;

use App\Models\Secret;
use App\Repositories\Contracts\SecretRepositoryInterface;
use App\Services\SecretService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SecretApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->app->make(\Illuminate\Database\Console\Migrations\MigrateCommand::class);
    }

    /** @test */
    public function it_can_create_a_secret(): void
    {
        $response = $this->postJson('/api/v1/secrets', [
            'text' => 'my-secret-password',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'url',
                ],
            ]);

        $this->assertDatabaseHas('secrets', [
            'max_views' => 1,
            'remaining_views' => 1,
        ]);
    }

    /** @test */
    public function it_can_create_a_secret_with_custom_options(): void
    {
        $response = $this->postJson('/api/v1/secrets', [
            'text' => 'my-secret-password',
            'ttlSeconds' => 3600,
            'maxViews' => 5,
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('secrets', [
            'max_views' => 5,
            'remaining_views' => 5,
        ]);

        $secret = Secret::first();
        $this->assertNotNull($secret->expires_at);
    }

    /** @test */
    public function it_validates_required_text_field(): void
    {
        $response = $this->postJson('/api/v1/secrets', []);

        $response->assertStatus(422)
            ->assertJson([
                'error' => [
                    'code' => 'VALIDATION_ERROR',
                ],
            ]);
    }

    /** @test */
    public function it_validates_text_max_length(): void
    {
        $response = $this->postJson('/api/v1/secrets', [
            'text' => str_repeat('a', 10001),
        ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function it_can_retrieve_and_burn_a_secret(): void
    {
        // Create a secret
        $createResponse = $this->postJson('/api/v1/secrets', [
            'text' => 'my-secret-password',
        ]);

        $secretId = $createResponse->json('data.id');

        // Retrieve the secret
        $response = $this->getJson("/api/v1/secrets/{$secretId}");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'text' => 'my-secret-password',
                    'remainingViews' => 0,
                ],
            ]);

        // Secret should be deleted after burn
        $this->assertDatabaseMissing('secrets', [
            'public_id' => $secretId,
        ]);
    }

    /** @test */
    public function it_returns_404_for_non_existent_secret(): void
    {
        $response = $this->getJson('/api/v1/secrets/nonexistentid123');

        $response->assertStatus(404)
            ->assertJson([
                'error' => [
                    'code' => 'SECRET_NOT_FOUND',
                ],
            ]);
    }

    /** @test */
    public function it_handles_multiple_views_correctly(): void
    {
        // Create a secret with 3 views
        $createResponse = $this->postJson('/api/v1/secrets', [
            'text' => 'my-secret-password',
            'maxViews' => 3,
        ]);

        $secretId = $createResponse->json('data.id');

        // First view
        $response1 = $this->getJson("/api/v1/secrets/{$secretId}");
        $response1->assertStatus(200)
            ->assertJson(['data' => ['remainingViews' => 2]]);

        // Second view
        $response2 = $this->getJson("/api/v1/secrets/{$secretId}");
        $response2->assertStatus(200)
            ->assertJson(['data' => ['remainingViews' => 1]]);

        // Third view (should burn)
        $response3 = $this->getJson("/api/v1/secrets/{$secretId}");
        $response3->assertStatus(200)
            ->assertJson(['data' => ['remainingViews' => 0]]);

        // Fourth attempt should return 404
        $response4 = $this->getJson("/api/v1/secrets/{$secretId}");
        $response4->assertStatus(404);
    }

    /** @test */
    public function it_handles_expired_secrets(): void
    {
        // Create a secret with 1 second TTL
        $createResponse = $this->postJson('/api/v1/secrets', [
            'text' => 'my-secret-password',
            'ttlSeconds' => 1,
        ]);

        $secretId = $createResponse->json('data.id');

        // Wait for expiration
        sleep(2);

        // Try to retrieve expired secret
        $response = $this->getJson("/api/v1/secrets/{$secretId}");

        $response->assertStatus(404)
            ->assertJson([
                'error' => [
                    'code' => 'SECRET_NOT_FOUND',
                ],
            ]);
    }

    /** @test */
    public function it_encrypts_text_at_rest(): void
    {
        $response = $this->postJson('/api/v1/secrets', [
            'text' => 'my-secret-password',
        ]);

        $response->assertStatus(201);

        // Check that the text is encrypted in the database
        $secret = Secret::first();
        $this->assertNotEquals('my-secret-password', $secret->encrypted_text);
        $this->assertEquals('my-secret-password', $secret->text);
    }
}
