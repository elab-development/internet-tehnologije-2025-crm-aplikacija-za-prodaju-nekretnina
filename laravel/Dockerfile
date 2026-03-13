FROM php:8.3-fpm-alpine

ARG APP_ENV=production
WORKDIR /var/www

# Instaliranje system dependency-ja
RUN apk update && apk upgrade \
    && apk add --no-cache bash curl git zip unzip libzip-dev icu-dev oniguruma-dev libpng-dev libxml2-dev mysql-client autoconf g++ make

# Instaliranje PHP ekstenzija
RUN docker-php-ext-configure intl \
    && docker-php-ext-install pdo pdo_mysql zip intl mbstring opcache bcmath

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# 1) prvo kopiraj composer fajlove da Docker moze da kesira deps
COPY composer.json composer.lock ./

# 2) instaliraj dependencije u image (vendor ce postojati i posle restarta)
RUN if [ "$APP_ENV" = "production" ]; then \
    composer install --no-interaction --prefer-dist --no-autoloader --no-dev --no-scripts; \
    else \
    composer install --no-interaction --prefer-dist --no-autoloader --no-scripts; \
    fi

# 3) onda kopiraj ostatak aplikacije
COPY . .

# 4) zatim konacno mapiranje i registriranje instaliranih paketa
RUN composer dump-autoload --optimize \
    && php artisan package:discover --ansi  

# cache/storage folderi
RUN mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
 && chmod -R 775 storage bootstrap/cache || true

COPY .docker-entrypoint.sh /usr/local/bin/.docker-entrypoint.sh
RUN chmod +x /usr/local/bin/.docker-entrypoint.sh

EXPOSE 9000
ENTRYPOINT [ "/usr/local/bin/.docker-entrypoint.sh" ]