#!/usr/bin/env bash
set -euo pipefail

# Helper to run docker compose with a predictable env file path.
# Usage: ./scripts/run_compose.sh [path-to-env]
# If no path provided, defaults to $HOME/capstone/.env then ./ .env

USER_ENV=${1:-"${HOME}/capstone/.env"}

if [ -f "${USER_ENV}" ]; then
  export ENV_FILE="${USER_ENV}"
  echo "Using env file: ${ENV_FILE}"
elif [ -f "./.env" ]; then
  export ENV_FILE="$(pwd)/.env"
  echo "Using repo .env: ${ENV_FILE}"
else
  echo "No env file found. Create ${USER_ENV} or ./ .env, or pass path as first arg." >&2
  exit 1
fi

echo "Running: ENV_FILE=${ENV_FILE} docker compose up --build"
ENV_FILE=${ENV_FILE} docker compose up --build
