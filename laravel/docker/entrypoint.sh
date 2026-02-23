#!/usr/bin/env bash
set -e

cd /var/www

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  cp .env.example .env
fi

if [ -f "composer.json" ]; then
  composer install --no-interaction
fi

if [ -f "artisan" ]; then
  php artisan key:generate --force || true
  php artisan config:clear || true
  php artisan route:clear || true
  php artisan cache:clear || true
fi

exec "$@"