FROM php:8.3-fpm-alpine

WORKDIR /var/www

RUN apk add --no-cache \
    bash curl git zip unzip libzip-dev icu-dev oniguruma-dev mysql-client \
    && docker-php-ext-install pdo pdo_mysql mbstring zip intl opcache

# composer (bez multi-stage)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Aplikacija
COPY . .

# (opciono, ali korisno) napravi foldere da ne puca na cache/view putanjama
RUN mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache

# (opciono) permisije - nemoj 777, dovoljno 775
RUN chmod -R 775 storage bootstrap/cache || true

EXPOSE 9000
CMD ["php-fpm"]