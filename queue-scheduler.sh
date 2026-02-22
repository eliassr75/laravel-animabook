#!/usr/bin/env bash

set -euo pipefail

cd /var/www

if [[ -f ".env.host" ]]; then
    cp ".env.host" ".env"
elif [[ -f ".env.production" && ! -f ".env" ]]; then
    cp ".env.production" ".env"
fi

echo "[scheduler] schedule:work iniciado"

exec php artisan schedule:work --no-interaction
