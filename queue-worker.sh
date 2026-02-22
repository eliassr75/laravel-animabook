#!/usr/bin/env bash

set -euo pipefail

cd /var/www

if [[ -f ".env.host" ]]; then
    cp ".env.host" ".env"
elif [[ -f ".env.production" && ! -f ".env" ]]; then
    cp ".env.production" ".env"
fi

export QUEUE_CONNECTION="${QUEUE_CONNECTION:-database}"
export WORKER_QUEUE="${1:-${WORKER_QUEUE:-default}}"
export WORKER_SLEEP="${WORKER_SLEEP:-1}"
export WORKER_TRIES="${WORKER_TRIES:-1}"
export WORKER_TIMEOUT="${WORKER_TIMEOUT:-0}"
export WORKER_MEMORY="${WORKER_MEMORY:-512}"
export WORKER_MAX_JOBS="${WORKER_MAX_JOBS:-1000}"
export WORKER_MAX_TIME="${WORKER_MAX_TIME:-3600}"

echo "[worker] connection=${QUEUE_CONNECTION} queue=${WORKER_QUEUE}"

exec /usr/bin/supervisord -n -c /var/www/supervisord.conf
