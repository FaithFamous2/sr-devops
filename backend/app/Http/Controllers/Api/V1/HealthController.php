<?php

namespace App\Http\Controllers\Api\V1;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Routing\Controller;

/**
 * @group Health Check
 *
 * Endpoints to monitor the health and status of the API.
 */
class HealthController extends Controller
{
    /**
     * Health Check
     *
     * Check the health status of the API and its dependencies.
     * This endpoint is used for monitoring and load balancer health checks.
     *
     * @response scenario=success {
     *   "status": "ok",
     *   "timestamp": "2024-02-17T21:46:41+00:00",
     *   "service": "secure-drop-api",
     *   "database": "connected"
     * }
     * @response status=503 scenario=database-failure {
     *   "status": "degraded",
     *   "timestamp": "2024-02-17T21:46:41+00:00",
     *   "service": "secure-drop-api",
     *   "database": "disconnected",
     *   "error": "Connection refused"
     * }
     */
    public function index(): JsonResponse
    {
        $health = [
            'status' => 'ok',
            'timestamp' => now()->toIso8601String(),
            'service' => 'secure-drop-api',
        ];

        try {
            // Test database connection
            DB::connection()->getPdo();
            $health['database'] = 'connected';
        } catch (\Exception $e) {
            $health['status'] = 'degraded';
            $health['database'] = 'disconnected';
            $health['error'] = $e->getMessage();

            return response()->json($health, 503);
        }

        return response()->json($health);
    }

    /**
     * Liveness Probe
     *
     * Simple endpoint for Kubernetes/Traefik liveness probes.
     * Returns 200 OK if the application is running.
     *
     * @response scenario=success {
     *   "status": "alive"
     * }
     */
    public function liveness(): JsonResponse
    {
        return response()->json(['status' => 'alive']);
    }

    /**
     * Readiness Probe
     *
     * Check if the application is ready to receive traffic.
     * Tests database connectivity.
     *
     * @response scenario=success {
     *   "status": "ready"
     * }
     * @response status=503 scenario=not-ready {
     *   "status": "not ready",
     *   "reason": "database unavailable"
     * }
     */
    public function readiness(): JsonResponse
    {
        try {
            DB::connection()->getPdo();
            return response()->json(['status' => 'ready']);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'not ready',
                'reason' => 'database unavailable',
            ], 503);
        }
    }
}
