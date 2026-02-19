# Troubleshooting Guide

This document details the challenges encountered during the development and deployment of the Secure Drop application, along with their solutions.

---

## Table of Contents

1. [Frontend 404 Page Not Found](#1-frontend-404-page-not-found)
2. [Traefik Not Routing to Frontend](#2-traefik-not-routing-to-frontend)
3. [Vite Host Blocking](#3-vite-host-blocking)
4. [Container Health Check Failures](#4-container-health-check-failures)
5. [Traefik Timeout Errors](#5-traefik-timeout-errors)
6. [Health Check API Documentation](#6-health-check-api-documentation)
7. [Docker API Version Compatibility](#7-docker-api-version-compatibility)

---

## 1. Frontend 404 Page Not Found

### Problem

When accessing `http://secure-drop-ui.localhost/`, the response was:
```
404 page not found
```

### Root Cause Analysis

The issue was multi-layered:

1. **Traefik was not registering the frontend router** - The frontend service was not appearing in Traefik's routing table
2. **Container was marked as unhealthy** - Traefik's Docker provider filters out unhealthy containers by default
3. **Health check command was failing** - The health check used `curl` which wasn't available in the Alpine-based Node.js container

### Investigation Steps

1. **Checked container status:**
   ```bash
   docker compose ps
   # Output showed: secure-drop-frontend (unhealthy)
   ```

2. **Checked Traefik routers:**
   ```bash
   curl -s http://localhost:8080/api/http/routers | jq '.[] | .name'
   # Output: "api@internal", "backend@docker", "dashboard@internal"
   # Missing: frontend@docker
   ```

3. **Checked container labels:**
   ```bash
   docker inspect secure-drop-frontend --format='{{json .Config.Labels}}' | jq .
   # Labels were correctly set
   ```

4. **Enabled Traefik debug logging:**
   ```yaml
   command:
     - "--log.level=DEBUG"
   ```

   Debug logs revealed:
   ```
   Filtering unhealthy or starting container container=frontend-...
   ```

### Solution

**File: `sr-devops/docker-compose.override.yml`**

Changed the health check from using `curl` (not available in Alpine) to `wget` (available by default):

```yaml
# Before (failing)
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5173/"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 10s

# After (working)
healthcheck:
  test: ["CMD", "wget", "-q", "--spider", "http://localhost:5173/"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 10s
```

**Why this works:**
- Alpine Linux images include `wget` by default but not `curl`
- `wget --spider` performs a HEAD request without downloading the body
- The `-q` flag suppresses output, making it suitable for health checks

---

## 2. Traefik Not Routing to Frontend

### Problem

Even after fixing the health check, Traefik was still not routing requests to the frontend container.

### Root Cause

Traefik's Docker provider has a safety feature: it automatically filters out containers that are:
- Unhealthy (failing health checks)
- Still in the "starting" phase (before `start_period` ends)

### Solution

1. **Fixed the health check** (see above)

2. **Added explicit network configuration to Traefik:**
   ```yaml
   # sr-devops/docker-compose.yml
   command:
     - "--providers.docker.network=secure-drop-network"
   ```

3. **Verified all containers are on the same network:**
   ```bash
   docker network inspect sr-devops_secure-drop-network
   ```

---

## 3. Vite Host Blocking

### Problem

When Traefik tried to proxy requests to the Vite dev server, Vite rejected them with:
```
Blocked request. This host ("secure-drop-frontend") is not allowed.
To allow this host, add "secure-drop-frontend" to `server.allowedHosts` in vite.config.js.
```

### Root Cause

Vite's development server has security features that block requests from unknown hosts to prevent DNS rebinding attacks. When Traefik proxies requests, it can use different hostnames than what Vite expects.

### Solution

**File: `sr-devops/frontend/vite.config.ts`**

```typescript
// Before
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})

// After
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['secure-drop-ui.localhost', 'secure-drop-frontend', 'localhost'],
  },
})
```

**Why this works:**
- `allowedHosts` tells Vite which hostnames are trusted
- Includes the external hostname (`secure-drop-ui.localhost`)
- Includes the Docker service name (`secure-drop-frontend`) for internal communication
- Includes `localhost` for local development

---

## 4. Container Health Check Failures

### Problem

Containers were showing as "unhealthy" even when the services inside were running correctly.

### Root Cause Analysis

Different base images have different tools available:

| Base Image | `curl` | `wget` | Notes |
|------------|--------|--------|-------|
| `node:20-alpine` | ❌ | ✅ | Minimal image, wget only |
| `nginx:alpine` | ❌ | ✅ | Minimal image, wget only |
| `php:8.2-fpm-alpine` | ❌ | ✅ | Minimal image, wget only |
| `ubuntu`, `debian` | ✅ | ✅ | Full images have both |

### Best Practices for Health Checks

1. **Use `wget` for Alpine-based images:**
   ```yaml
   healthcheck:
     test: ["CMD", "wget", "-q", "--spider", "http://localhost:PORT/"]
   ```

2. **Use `curl` for full images:**
   ```yaml
   healthcheck:
     test: ["CMD", "curl", "-f", "http://localhost:PORT/"]
   ```

3. **For services without HTTP (e.g., databases):**
   ```yaml
   healthcheck:
     test: ["CMD", "pg_isready", "-U", "postgres"]
   ```

---

## 5. Traefik Timeout Errors

### Problem

Traefik logs showed repeated timeout errors:
```
ERR Error while Peeking first byte error="read tcp 172.18.0.2:80->192.168.65.1:22858: i/o timeout"
```

### Root Cause

These errors occurred when:
1. Health checks were failing (Traefik trying to reach unhealthy backends)
2. Containers were restarting during deployment
3. Network connectivity issues between containers

### Solution

1. **Fixed underlying health check issues** (see above)

2. **Configured appropriate timeouts:**
   ```yaml
   labels:
     - "traefik.http.services.frontend.loadbalancer.healthcheck.interval=10s"
     - "traefik.http.services.frontend.loadbalancer.healthcheck.timeout=5s"
   ```

3. **Added proper start periods:**
   ```yaml
   healthcheck:
     start_period: 10s  # Give container time to start before health checks
   ```

---

## 6. Health Check API Documentation

### Problem

Health check endpoints needed to be added to the API for:
- Traefik load balancer health checks
- Kubernetes liveness/readiness probes
- Monitoring systems

### Solution

Created a dedicated `HealthController` with multiple endpoints:

**File: `sr-devops/backend/app/Http/Controllers/Api/V1/HealthController.php`**

```php
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
     */
    public function index(): JsonResponse
    {
        $health = [
            'status' => 'ok',
            'timestamp' => now()->toIso8601String(),
            'service' => 'secure-drop-api',
        ];

        try {
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
     */
    public function liveness(): JsonResponse
    {
        return response()->json(['status' => 'alive']);
    }

    /**
     * Readiness Probe
     *
     * Check if the application is ready to receive traffic.
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
```

### Endpoints Created

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `GET /up` | Simple Traefik health check | `{"status": "ok"}` |
| `GET /api/health` | Full health check with DB | `{"status": "ok", "database": "connected", ...}` |
| `GET /api/health/liveness` | Kubernetes liveness probe | `{"status": "alive"}` |
| `GET /api/health/readiness` | Kubernetes readiness probe | `{"status": "ready"}` |

### OpenAPI Documentation

Updated `sr-devops/backend/public/openapi.yaml` to include health check endpoints:

```yaml
paths:
  /api/health:
    get:
      tags:
        - Health Check
      summary: Health Check
      description: Check the health status of the API and its dependencies
      responses:
        '200':
          description: API is healthy
        '503':
          description: API is degraded
```

---

## 7. Docker API Version Compatibility

### Problem

When deploying to an AWS EC2 instance, Traefik logs showed repeated errors:
```
ERR Failed to retrieve information of the docker client and server host error="Error response from daemon: client version 1.24 is too old. Minimum supported API version is 1.44, please upgrade your client to a newer version" providerName=docker
```

This resulted in:
- 404 Page Not Found for both frontend and backend
- Traefik unable to discover containers
- All services showing as "healthy" but not accessible

### Root Cause Analysis

The issue occurs when there's a mismatch between:
1. **Docker client API version** that Traefik uses internally
2. **Docker server API version** running on the host

Newer Docker servers (Docker 25+) require a minimum API version (1.44+), but Traefik's internal Docker client was attempting to use an older API version (1.24).

### Investigation Steps

1. **Check Docker version on server:**
   ```bash
   docker version
   # Client: Docker 27.x
   # Server: Docker 27.x
   # API version: 1.44+
   ```

2. **Check Traefik logs:**
   ```bash
   docker compose logs traefik
   # Shows: "client version 1.24 is too old"
   ```

3. **Verify containers are running:**
   ```bash
   docker ps
   # All containers show as "healthy"
   ```

4. **Check Traefik dashboard:**
   - No routers registered
   - No services discovered
   - Docker provider showing errors

### Solution

**File: `sr-devops/docker-compose.prod.yml`**

Add the `DOCKER_API_VERSION` environment variable to the Traefik service:

```yaml
traefik:
  image: traefik:v3.3
  restart: always
  environment:
    # Fix for Docker API version compatibility - use server's supported version
    - DOCKER_API_VERSION=1.44
  command:
    - "--providers.docker=true"
    - "--providers.docker.exposedbydefault=false"
    - "--providers.docker.endpoint=unix:///var/run/docker.sock"
    - "--providers.docker.network=web"
    # ... other configuration
```

**Why this works:**
- `DOCKER_API_VERSION=1.44` tells Traefik's Docker client to use API version 1.44
- This matches the minimum required by modern Docker servers
- The Docker client will negotiate with the server for the best compatible version

### Alternative Solutions

1. **Use TCP endpoint with API version negotiation:**
   ```yaml
   command:
     - "--providers.docker.endpoint=tcp://127.0.0.1:2375"
   ```
   Note: Requires enabling Docker TCP API on the host.

2. **Downgrade Docker on the server** (not recommended):
   - Using an older Docker version that supports API 1.24
   - Not recommended for security reasons

### Verification

After applying the fix:

```bash
# Restart Traefik
docker compose restart traefik

# Check logs - should not show API version errors
docker compose logs traefik

# Verify routers are registered
curl -s http://localhost:8080/api/http/routers | jq '.[] | .name'
# Should show: "api@docker", "frontend@docker", etc.

# Test the application
curl http://localhost/api/health
# Should return: {"status":"ok",...}
```

### Prevention

To prevent this issue in the future:

1. **Always specify DOCKER_API_VERSION** in production deployments
2. **Keep Traefik updated** to the latest version
3. **Document Docker version requirements** in deployment guides

---

## Summary of Key Lessons

1. **Always check container health status** - Unhealthy containers are filtered out by orchestrators
2. **Use appropriate tools for health checks** - `wget` for Alpine, `curl` for full images
3. **Configure Vite's `allowedHosts`** when behind a reverse proxy
4. **Enable debug logging** in Traefik when troubleshooting routing issues
5. **Verify network connectivity** between all containers
6. **Document health check endpoints** in your API documentation

---

## Useful Commands

```bash
# Check container health status
docker compose ps

# Check Traefik routers
curl -s http://localhost:8080/api/http/routers | jq '.[] | .name'

# Check Traefik services
curl -s http://localhost:8080/api/http/services | jq .

# Check container labels
docker inspect <container-name> --format='{{json .Config.Labels}}' | jq .

# Check network connectivity
docker network inspect <network-name>

# View Traefik debug logs
docker compose logs traefik | grep -i "filtering\|router\|error"

# Test health check command inside container
docker compose exec <service> wget -q --spider http://localhost:PORT/
```

---

## References

- [Traefik Docker Provider Documentation](https://doc.traefik.io/traefik/providers/docker/)
- [Docker Health Check Documentation](https://docs.docker.com/engine/reference/builder/#healthcheck)
- [Vite Server Configuration](https://vitejs.dev/config/server-options.html)
- [Kubernetes Liveness and Readiness Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/)
