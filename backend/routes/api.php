<?php

use App\Http\Controllers\Api\V1\SecretController;
use App\Http\Controllers\Api\V1\HealthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Health check endpoints (no version prefix for stable monitoring access)
Route::get('/health', [HealthController::class, 'index']);
Route::get('/health/liveness', [HealthController::class, 'liveness']);
Route::get('/health/readiness', [HealthController::class, 'readiness']);

Route::prefix('v1')->group(function () {
    // Secret endpoints
    Route::post('/secrets', [SecretController::class, 'store']);
    Route::get('/secrets/{id}', [SecretController::class, 'show'])->where('id', '[A-Za-z0-9_-]+');
});
