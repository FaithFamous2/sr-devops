# =============================================================================
# Multi-Stage Dockerfile for React Frontend (Secure Drop UI)
# Stage 1: Build the production bundle
# Stage 2: Serve via Nginx (minimal Alpine image)
# =============================================================================

# --- Stage 1: Build ---
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci --no-audit

# Copy source and build
COPY . .

# Build args for API URL configuration
ARG VITE_API_URL=http://secure-drop.localhost/api/v1
ARG VITE_UI_URL=http://secure-drop-ui.localhost
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_UI_URL=${VITE_UI_URL}

RUN npm run build

# --- Stage 2: Production (Nginx) ---
FROM nginx:1.27-alpine AS production

# Install wget for health checks
RUN apk add --no-cache wget

# Create non-root user
RUN addgroup -g 1000 -S appgroup && \
    adduser -u 1000 -S appuser -G appgroup

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Adjust permissions for non-root
RUN chown -R appuser:appgroup /usr/share/nginx/html && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R appuser:appgroup /var/run/nginx.pid

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=5s \
    CMD wget -qO- http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
