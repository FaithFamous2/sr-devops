# Multi-stage build for React frontend

# Stage 1: Build dependencies and application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production image with Nginx
FROM nginx:alpine AS production

# Copy custom nginx config (use port 8080 for non-root)
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Update nginx config to listen on port 8080
RUN sed -i 's/listen 80;/listen 8080;/g' /etc/nginx/conf.d/default.conf

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Copy built application from builder
COPY --from=builder --chown=appuser:appgroup /app/dist /usr/share/nginx/html

# Create necessary directories and set permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
    chown -R appuser:appgroup /usr/share/nginx/html && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    chown -R appuser:appgroup /var/run

# Switch to non-root user
USER appuser

# Expose port 8080 (non-privileged)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

# Stage 3: Development image
FROM node:20-alpine AS development

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start Vite dev server
CMD ["npm", "run", "dev"]
