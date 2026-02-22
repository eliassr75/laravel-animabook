FROM php:8.3-apache

# Instala dependências do sistema
RUN apt-get update && apt-get install -y \
    libicu-dev \
    libpq-dev \
    libzip-dev \
    unzip \
    git \
    vim \
    supervisor \
    && docker-php-ext-install intl pdo pdo_mysql pdo_pgsql zip

# Instala extensões adicionais que precisar
# Habilita mod_rewrite
RUN a2enmod rewrite

# Copia código
COPY . /var/www

# Define workdir
WORKDIR /var/www

# Instala composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

RUN composer install --optimize-autoloader --no-dev

# Permissões
RUN chown -R root:www-data /var/www;
RUN find . -type f -exec chmod 777 {} \;
RUN find . -type d -exec chmod 777 {} \;

## Expor porta
#EXPOSE 80

# Entrypoint opcional
RUN chmod +x /var/www/queue-worker.sh /var/www/queue-scheduler.sh

ENTRYPOINT ["/var/www/queue-worker.sh"]
