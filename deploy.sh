#!/bin/bash

# =============================================================================
# Secure Drop - Production Deployment Script
# =============================================================================
# Usage: ./deploy.sh [OPTIONS]
#
# Options:
#   --skip-build    Skip building images (use existing)
#   --skip-pull     Skip git pull (use current code)
#   --url=URL       Set the server URL (default: http://51.20.121.247)
#   --help          Show this help message
#
# Example:
#   ./deploy.sh --url=http://your-server-ip
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
SKIP_BUILD=false
SKIP_PULL=false
SERVER_URL="http://51.20.121.247"

# Parse command line arguments
for arg in "$@"; do
    case $arg in
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-pull)
            SKIP_PULL=true
            shift
            ;;
        --url=*)
            SERVER_URL="${arg#*=}"
            shift
            ;;
        --help)
            head -20 "$0" | tail -15
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $arg${NC}"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   Secure Drop - Production Deployment${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}[1/7] Checking prerequisites...${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"

# Step 2: Create .env.production if not exists
echo -e "${YELLOW}[2/8] Checking environment files...${NC}"

# Create backend .env.production if not exists
if [ ! -f "backend/.env.production" ]; then
    echo -e "${YELLOW}Creating backend/.env.production...${NC}"
    cat > backend/.env.production << 'ENVEOF'
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
ENVEOF
    echo -e "${GREEN}✓ Created backend/.env.production${NC}"
else
    echo -e "${GREEN}✓ backend/.env.production already exists${NC}"
fi

# Create frontend .env if not exists
if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}Creating frontend/.env...${NC}"
    echo "VITE_API_URL=" > frontend/.env
    echo -e "${GREEN}✓ Created frontend/.env${NC}"
else
    echo -e "${GREEN}✓ frontend/.env already exists${NC}"
fi

# Step 3: Pull latest code
if [ "$SKIP_PULL" = false ]; then
    echo -e "${YELLOW}[3/8] Pulling latest code from Git...${NC}"
    if [ -d ".git" ]; then
        git pull || echo -e "${YELLOW}Warning: Could not pull from Git. Using current code.${NC}"
    else
        echo -e "${YELLOW}Warning: Not a Git repository. Skipping pull.${NC}"
    fi
else
    echo -e "${YELLOW}[3/8] Skipping Git pull (--skip-pull)${NC}"
fi

# Step 4: Stop existing containers
echo -e "${YELLOW}[4/8] Stopping existing containers...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true

# Step 5: Clean up old network if exists
echo -e "${YELLOW}[5/8] Cleaning up old network...${NC}"
docker network rm secure-drop-network 2>/dev/null || true

# Step 6: Build images
if [ "$SKIP_BUILD" = false ]; then
    echo -e "${YELLOW}[6/8] Building Docker images...${NC}"
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
else
    echo -e "${YELLOW}[6/8] Skipping build (--skip-build)${NC}"
fi

# Step 7: Start containers
echo -e "${YELLOW}[7/8] Starting containers...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Step 8: Wait for health checks and verify
echo -e "${YELLOW}[8/8] Waiting for containers to be healthy...${NC}"
echo -n "Waiting"
for i in {1..30}; do
    BACKEND_STATUS=$(docker inspect --format='{{.State.Health.Status}}' secure-drop-backend 2>/dev/null || echo "unknown")
    FRONTEND_STATUS=$(docker inspect --format='{{.State.Health.Status}}' secure-drop-frontend 2>/dev/null || echo "unknown")

    if [ "$BACKEND_STATUS" = "healthy" ] && [ "$FRONTEND_STATUS" = "healthy" ]; then
        echo -e "\n${GREEN}✓ All containers are healthy!${NC}"
        break
    fi

    if [ $i -eq 30 ]; then
        echo -e "\n${YELLOW}Warning: Timeout waiting for healthy containers${NC}"
        echo -e "  Backend: $BACKEND_STATUS"
        echo -e "  Frontend: $FRONTEND_STATUS"
    fi

    echo -n "."
    sleep 2
done

echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   Deployment Complete!${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Show container status
echo -e "${YELLOW}Container Status:${NC}"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
echo ""

# Test endpoints
echo -e "${YELLOW}Testing endpoints...${NC}"

# Test /up endpoint
echo -n "  /up: "
UP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/up 2>/dev/null || echo "000")
if [ "$UP_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ OK (200)${NC}"
else
    echo -e "${RED}✗ Failed ($UP_RESPONSE)${NC}"
fi

# Test /api/health endpoint
echo -n "  /api/health: "
HEALTH_RESPONSE=$(curl -s http://localhost/api/health 2>/dev/null || echo "{}")
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ Failed${NC}"
fi

# Test frontend
echo -n "  / (frontend): "
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null || echo "000")
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ OK (200)${NC}"
else
    echo -e "${RED}✗ Failed ($FRONTEND_RESPONSE)${NC}"
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}   Your application is now live!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "  Frontend:  ${BLUE}${SERVER_URL}/${NC}"
echo -e "  API:       ${BLUE}${SERVER_URL}/api/v1/secrets${NC}"
echo -e "  Health:    ${BLUE}${SERVER_URL}/api/health${NC}"
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo "  View logs:     docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f"
echo "  Stop:          docker-compose -f docker-compose.yml -f docker-compose.prod.yml down"
echo "  Restart:       docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart"
echo ""
