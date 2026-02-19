# =============================================================================
# Multi-Stage Dockerfile for Laravel Secure Drop API
# Stage 1: Build stage with full PHP environment
# Stage 2: Production image (non-root, minimal)
# =============================================================================

# --- Stage 1: Build with full PHP environment ---
FROM php:8.4-cli-alpine AS builder

# Install system dependencies and PHP extensions needed for build
RUN apk add --no-cache \
    sqlite \
    sqlite-dev \
    libzip-dev \
    icu-dev \
    oniguruma-dev \
    && docker-php-ext-install \
    pdo_sqlite \
    bcmath \
    pcntl \
    zip \
    mbstring \
    intl \
    && rm -rf /var/cache/apk/*

# Install composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy composer files first for better caching
COPY composer.json composer.lock ./

# Install dependencies
RUN composer install \
    --no-dev \
    --no-scripts \
    --prefer-dist \
    --optimize-autoloader

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache \
    database \
    && touch database/database.sqlite \
    && chmod -R 777 storage bootstrap/cache database

# Create .env file for production (use .env.production if available, fallback to .env.example)
RUN cp .env.production .env 2>/dev/null || cp .env.example .env || true

# Generate package manifest (runs ComposerScripts::postAutoloadDump + package:discover)
RUN php artisan package:discover --ansi

# --- Stage 2: Production image ---
FROM php:8.4-fpm-alpine AS production

# Install system dependencies and PHP extensions
RUN apk add --no-cache \
    nginx \
    supervisor \
    sqlite \
    sqlite-dev \
    libzip-dev \
    icu-dev \
    oniguruma-dev \
    && docker-php-ext-install \
    pdo_sqlite \
    bcmath \
    pcntl \
    zip \
    mbstring \
    intl \
    opcache \
    && rm -rf /var/cache/apk/*

# Configure OPcache for production
RUN { \
    echo 'opcache.memory_consumption=128'; \
    echo 'opcache.interned_strings_buffer=8'; \
    echo 'opcache.max_accelerated_files=4000'; \
    echo 'opcache.revalidate_freq=2'; \
    echo 'opcache.fast_shutdown=1'; \
    echo 'opcache.enable_cli=1'; \
    } > /usr/local/etc/php/conf.d/opcache-recommended.ini

# Configure PHP
RUN { \
    echo 'upload_max_filesize=10M'; \
    echo 'post_max_size=12M'; \
    echo 'memory_limit=256M'; \
    echo 'max_execution_time=30'; \
    echo 'expose_php=Off'; \
    } > /usr/local/etc/php/conf.d/custom.ini

# Create non-root user
RUN addgroup -g 1000 -S appgroup && \
    adduser -u 1000 -S appuser -G appgroup

WORKDIR /var/www/html

# Copy application from builder stage
COPY --from=builder /app /var/www/html

# Ensure directories exist and are writable
RUN mkdir -p \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache \
    database \
    && touch database/database.sqlite \
    && chmod -R 775 storage bootstrap/cache database

# Copy Nginx config
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

# Copy Supervisor config
COPY docker/supervisord.conf /etc/supervisord.conf

# Copy entrypoint
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Create supervisor log directory
RUN mkdir -p /var/log/supervisor

# Set permissions
RUN chown -R appuser:appgroup /var/www/html \
    && chown -R appuser:appgroup /var/log \
    && chown -R appuser:appgroup /run \
    && chown -R appuser:appgroup /var/lib/nginx

# Switch to non-root user
USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s \
    CMD wget -qO- http://localhost:8080/api/health || exit 1

ENTRYPOINT ["entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
