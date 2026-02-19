#!/bin/sh
set -e

# Wait for the database to be ready (if using external DB)
# sleep 1

# Run migrations if APP_ENV is not local (production/staging)
if [ "$APP_ENV" != "local" ]; then
    echo "Running migrations..."
    php artisan migrate --force || echo "Migration failed or already run"
fi

# Execute the main command
exec "$@"
