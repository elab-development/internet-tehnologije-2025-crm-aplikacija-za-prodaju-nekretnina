#!/bin/sh
set -e

 
mkdir -p /var/www/storage /var/www/bootstrap/cache
chmod -R 775 /var/www/storage /var/www/bootstrap/cache || true

exec "$@"