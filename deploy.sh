#!/usr/bin/env bash

set -euo pipefail

echo "=================================="
echo "Iniciando deploy dos workers..."
echo "=================================="

WORKDIR="/opt/deploys/etecsystems/animabook/laravel-animabook"
BRANCH="${DEPLOY_BRANCH:-main}"

if [[ ! -d "$WORKDIR/.git" ]]; then
    echo "Repositório não encontrado em $WORKDIR"
    exit 1
fi

cd "$WORKDIR"

echo "Atualizando código ($BRANCH)..."
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "Subindo workers e scheduler..."
docker compose up -d --build --force-recreate --remove-orphans

echo "=================================="
echo "Deploy concluído com sucesso!"
echo "=================================="
