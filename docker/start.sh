#!/bin/sh
# Container entrypoint: guarantee exactly one Apache MPM (prefork, required by mod_php),
# then hand over to the stock php:apache foreground script.
set -e
rm -f /etc/apache2/mods-enabled/mpm_event.* /etc/apache2/mods-enabled/mpm_worker.*
[ -e /etc/apache2/mods-enabled/mpm_prefork.load ] || a2enmod -q mpm_prefork
# Create/update database tables when a database is configured (idempotent; waits for MySQL).
php /var/www/keyquest/install/migrate.php --wait=60 || echo "WARNING: database migration failed – accounts unavailable until it succeeds" >&2
chown -R www-data:www-data /var/www/keyquest/storage
exec apache2-foreground "$@"
