FROM php:8.3-fpm-alpine

WORKDIR /var/www

RUN apk add --no-cache \
    bash curl git zip unzip libzip-dev icu-dev oniguruma-dev mysql-client \
    && docker-php-ext-install pdo pdo_mysql mbstring zip intl opcache

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# entrypoint
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

EXPOSE 9000
CMD ["php-fpm"]