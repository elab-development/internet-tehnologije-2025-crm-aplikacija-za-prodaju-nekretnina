#!/bin/sh
set -e

mkdir -p /var/www/storage/framework/cache \
         /var/www/storage/framework/sessions \
         /var/www/storage/framework/views \
         /var/www/storage/logs \
         /var/www/bootstrap/cache

chmod -R 777 /var/www/storage /var/www/bootstrap/cache || true

# Ako vendor ne postoji (tipično zbog bind mount-a), instaliraj dependencije
if [ ! -d "/var/www/vendor" ]; then
  echo "vendor/ not found -> running composer install..."
  composer install --no-interaction --prefer-dist
fi

# Sacekaj MySQL (da migracije ne puknu)
if [ -n "$DB_HOST" ]; then
  echo "Waiting for MySQL at $DB_HOST:$DB_PORT..."
  until php -r "try { new PDO('mysql:host=' . getenv('DB_HOST') . ';port=' . getenv('DB_PORT'), getenv('DB_USERNAME'), getenv('DB_PASSWORD')); echo 'OK'; } catch (Exception \$e) { exit(1);}"; do
    sleep 2
  done
  echo "MySQL is up."
fi

# Opciona migracija/seed preko env varijabli
if [ "$RUN_MIGRATIONS" = "true" ]; then
  php artisan migrate --no-interaction
fi

if [ "$RUN_SEED" = "true" ]; then
  php artisan db:seed --no-interaction
fi

exec "$@"