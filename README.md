# Secure Drop

A secure, containerized secret sharing service built with Laravel and React. Share sensitive information (passwords, API keys, etc.) that self-destructs after being viewed.

## Features

- **Burn on Read**: Secrets are automatically deleted after viewing
- **Time-based Expiration**: Optional TTL (Time to Live) for secrets
- **View Limits**: Control how many times a secret can be viewed
- **Encryption at Rest**: All secrets are encrypted using AES-256-CBC
- **Secure IDs**: Non-sequential Nanoid prevents URL enumeration attacks
- **Production-Ready Docker**: Multi-stage builds, non-root containers, health checks
- **Traefik Reverse Proxy**: Modern routing with automatic SSL support

## Architecture

```
secure-drop/
├── backend/                    # Laravel 11 API
│   ├── app/
│   │   ├── Http/Controllers/   # API Controllers
│   │   ├── Services/           # Business Logic
│   │   ├── Repositories/       # Data Access
│   │   └── Models/             # Eloquent Models
│   ├── database/migrations/    # Database Schema
│   └── tests/                  # Feature Tests
├── frontend/                   # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/         # Reusable Components
│   │   ├── pages/              # Page Components
│   │   ├── services/           # API Client
│   │   ├── hooks/              # Custom Hooks
│   │   └── types/              # TypeScript Types
│   └── tests/                  # Component Tests
├── docker-compose.yml          # Base Configuration
├── docker-compose.override.yml # Development Overrides
├── docker-compose.prod.yml     # Production Overrides
└── .github/workflows/          # CI/CD Pipeline
```

## Quick Start

### Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose)
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd secure-drop
   ```

2. **Start the development environment**
   ```bash
   docker-compose up --build
   ```
   ```docker compose -f sr-devops/docker-compose.yml -f sr-devops/docker-compose.override.yml exec backend php artisan migrate --force```

3. **Access the applications**
   - Frontend: http://secure-drop-ui.localhost
   - Backend API: http://secure-drop.localhost
   - API Documentation: http://secure-drop.localhost/docs
   - Traefik Dashboard: http://traefik.localhost:8080

### Hosts File Configuration

Add the following entries to your `/etc/hosts` file:

```
127.0.0.1 secure-drop.localhost
127.0.0.1 secure-drop-ui.localhost
127.0.0.1 traefik.localhost
```

## API Documentation

### Create Secret

**POST** `/api/v1/secrets`

Request body:
```json
{
  "text": "my-secret-password",
  "ttlSeconds": 3600,    // Optional: 10 to 2592000 (30 days)
  "maxViews": 1          // Optional: 1 to 100 (default: 1)
}
```

Response (201):
```json
{
  "data": {
    "id": "V1StGXR8_Z5jdHi6B-myT",
    "url": "http://secure-drop-ui.localhost/secrets/V1StGXR8_Z5jdHi6B-myT"
  }
}
```

### Retrieve Secret

**GET** `/api/v1/secrets/{id}`

Response (200):
```json
{
  "data": {
    "text": "my-secret-password",
    "remainingViews": 0
  }
}
```

Error Response (404):
```json
{
  "error": {
    "code": "SECRET_NOT_FOUND",
    "message": "This secret has been burned, expired, or does not exist."
  }
}
```

## Development

### Backend (Laravel)

```bash
# Enter backend container
docker-compose exec backend sh

# Run tests
php artisan test

# Run code style
./vendor/bin/pint

# Generate API documentation
php artisan scribe:generate
```

### Frontend (React)

```bash
# Enter frontend container
docker-compose exec frontend sh

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Run linting
npm run lint
```

## Production Deployment

### Using Docker Compose

1. **Set environment variables**
   ```bash
   export APP_KEY=base64:your-32-character-key-here
   export APP_URL=https://secure-drop.example.com
   export FRONTEND_URL=https://secure-drop-ui.example.com
   export BACKEND_HOST=secure-drop.example.com
   export FRONTEND_HOST=secure-drop-ui.example.com
   export ACME_EMAIL=admin@example.com
   ```

2. **Deploy with production configuration**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

### CI/CD Pipeline

The GitHub Actions pipeline includes:

1. **Lint & Test**
   - Backend: Laravel Pint + PHPUnit tests
   - Frontend: ESLint + Vitest tests

2. **Security Scan**
   - Trivy vulnerability scanning for both services

3. **Build & Push**
   - Multi-stage Docker builds
   - Push to GitHub Container Registry (GHCR)

4. **Deploy** (Optional)
   - SSH-based deployment to VPS
   - Requires `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` secrets

## Security Considerations

### Backend
- **Encryption**: AES-256-CBC encryption for all secret text
- **Non-sequential IDs**: Nanoid (21 characters) prevents enumeration
- **Input Validation**: Comprehensive validation on all inputs
- **CORS**: Configured for cross-origin requests

### Frontend
- **No Secret Logging**: Secrets are never logged or persisted in localStorage
- **Secure State Management**: React Query with proper cache invalidation
- **XSS Protection**: React's built-in escaping + CSP headers

### Infrastructure
- **Non-root Containers**: All containers run as non-root users
- **Multi-stage Builds**: Minimal attack surface in production images
- **Health Checks**: Container-level health monitoring
- **Automatic SSL**: Let's Encrypt via Traefik

## Technology Stack

### Backend
- PHP 8.3
- Laravel 11
- SQLite (configurable for MySQL/PostgreSQL)
- Nginx + PHP-FPM (via Supervisor)

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Query (TanStack Query)
- React Router v6

### Infrastructure
- Docker + Docker Compose
- Traefik v3
- GitHub Actions
- Trivy (security scanning)

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
