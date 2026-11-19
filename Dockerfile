# KeyQuest – container image (Railway, or any Docker host).
# Mirrors Hostinger: PHP 8.3 + Apache with .htaccess (mod_rewrite/headers).
FROM php:8.3-apache

RUN a2enmod rewrite headers deflate expires \
 && docker-php-ext-install pdo_mysql \
 && cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

COPY docker/php.ini "$PHP_INI_DIR/conf.d/zz-keyquest.ini"
COPY docker/apache.conf /etc/apache2/sites-available/000-default.conf
RUN echo 'Listen ${PORT}' > /etc/apache2/ports.conf \
 && echo 'ServerName localhost' > /etc/apache2/conf-available/servername.conf \
 && a2enconf servername

WORKDIR /var/www/keyquest
COPY . .
RUN chown -R www-data:www-data storage

# Railway injects PORT; default for local `docker run`.
ENV PORT=8080
EXPOSE 8080
CMD ["apache2-foreground"]
