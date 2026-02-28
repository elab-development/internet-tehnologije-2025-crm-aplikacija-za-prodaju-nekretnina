FROM php:8.3-fpm-alpine

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
RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

# 3) onda kopiraj ostatak aplikacije
COPY . .

# cache/storage folderi
RUN mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
 && chmod -R 775 storage bootstrap/cache || true

EXPOSE 9000
CMD ["php-fpm"]