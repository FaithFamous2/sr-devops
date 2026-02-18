#!/bin/bash
# Secure Drop VPS Deployment Script
# Run this on the VPS after files are copied

set -e

cd /opt/secure-drop

echo "=== Secure Drop Deployment ==="

# Create backend .env.production if it doesn't exist
if [ ! -f backend/.env.production ]; then
    cat > backend/.env.production << 'EOF'
APP_NAME="Secure Drop"
APP_ENV=production
APP_KEY=base64:anZTCB2Kl2GWs7jY1i4r8Vih342Rz0FtOwN0/5cceG4=
APP_DEBUG=false
APP_TIMEZONE=UTC
APP_URL=http://51.20.121.247
FRONTEND_URL=http://51.20.121.247

APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_US

APP_MAINTENANCE_DRIVER=file

LOG_CHANNEL=stack
LOG_STACK=single
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

DB_CONNECTION=sqlite

SESSION_DRIVER=file
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database

CACHE_STORE=file
CACHE_PREFIX=

MAIL_MAILER=log
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"
EOF
    echo "Created backend/.env.production"
fi

# Create frontend .env if it doesn't exist
if [ ! -f frontend/.env ]; then
    echo "VITE_API_URL=" > frontend/.env
    echo "Created frontend/.env"
fi

# Stop old containers and start new ones
echo "Building and starting containers..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml down 2>/dev/null || true
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Wait for containers to be healthy
echo "Waiting for containers to be healthy..."
sleep 10

# Show status
echo ""
echo "=== Container Status ==="
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Get public IP
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")

echo ""
echo "=== Deployment Complete ==="
echo "Frontend:  http://${PUBLIC_IP}/"
echo "API:       http://${PUBLIC_IP}/api/v1/secrets"
echo "Health:    http://${PUBLIC_IP}/up"
echo ""
echo "Logs: docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f"
