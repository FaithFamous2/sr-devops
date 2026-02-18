# Multi-stage build for Laravel backend

# Stage 1: Build dependencies
FROM composer:2 AS builder

WORKDIR /app

# Copy composer files first for better caching
COPY composer.json composer.lock ./

# Install dependencies (no dev for production)
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# Copy application files
COPY . .

# Create bootstrap cache directory
RUN mkdir -p bootstrap/cache && chmod 775 bootstrap/cache

# Generate optimized autoloader
RUN composer dump-autoload --optimize

# Stage 2: Production image - using Debian for better reliability
FROM php:8.4-fpm AS production

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    sqlite3 \
    libsqlite3-dev \
    libpng-dev \
    libzip-dev \
    zip \
    unzip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install -j$(nproc) bcmath pcntl zip gd pdo_sqlite

# Create non-root user for security
RUN groupadd -g 1000 appgroup && \
    useradd -u 1000 -g appgroup -m -s /bin/bash appuser

# Create nginx directories and set permissions BEFORE switching user
RUN mkdir -p /var/lib/nginx/body /var/lib/nginx/fastcgi /var/lib/nginx/proxy /var/lib/nginx/scgi /var/lib/nginx/uwsgi \
    && chown -R appuser:appgroup /var/lib/nginx \
    && chown -R appuser:appgroup /var/log/nginx \
    && chown -R appuser:appgroup /var/run \
    && mkdir -p /tmp/nginx \
    && chown -R appuser:appgroup /tmp/nginx

# Configure nginx to run as appuser
RUN sed -i 's/user www-data/user appuser/g' /etc/nginx/nginx.conf \
    && sed -i 's|pid /run/nginx.pid|pid /tmp/nginx/nginx.pid|g' /etc/nginx/nginx.conf

WORKDIR /var/www/html

# Copy application from builder
COPY --from=builder --chown=appuser:appgroup /app .

# Copy nginx config
COPY docker/nginx.conf /etc/nginx/sites-available/default

# Create necessary directories and set permissions
RUN mkdir -p /var/www/html/storage/logs /var/www/html/bootstrap/cache /var/www/html/database \
    && mkdir -p /var/log/nginx /var/run \
    && chown -R appuser:appgroup /var/www/html \
    && chown -R appuser:appgroup /var/log/nginx /var/run \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database \
    && rm -f /etc/nginx/sites-enabled/default \
    && ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# Create startup script
RUN echo '#!/bin/bash' > /start.sh && \
    echo 'php-fpm -D' >> /start.sh && \
    echo 'nginx -g "daemon off;"' >> /start.sh && \
    chmod +x /start.sh

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/up || exit 1

# Start nginx and php-fpm
CMD ["/bin/bash", "/start.sh"]

# Stage 3: Development image
FROM production AS development

USER root

# Install development dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    nano \
    && rm -rf /var/lib/apt/lists/*

USER appuser
