#!/usr/bin/env sh

# Po default-u, docker compose up naredba pravi kontejnere na osnovu docker-compose.yml fajla \
# ukoliko mu se ne definise fajl po kome ce praviti

# Prekini odmah ako skripta baci non-zero status (error)
set -e

# Brisi config.php ako ga postoji
php artisan config:clear || true

# Promeni korisnika i grupu. Boolean true stavljen da se skripta ne bi prekinula zbog gore navedene naredbe
chown -R www-data:www-data storage bootstrap/cache || true

# Pokreni PHP-FPM
exec php-fpm