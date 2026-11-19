#!/bin/sh
# Container entrypoint: guarantee exactly one Apache MPM (prefork, required by mod_php),
# then hand over to the stock php:apache foreground script.
set -e
rm -f /etc/apache2/mods-enabled/mpm_event.* /etc/apache2/mods-enabled/mpm_worker.*
[ -e /etc/apache2/mods-enabled/mpm_prefork.load ] || a2enmod -q mpm_prefork
exec apache2-foreground "$@"
