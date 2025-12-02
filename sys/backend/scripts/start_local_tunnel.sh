#!/usr/bin/env bash
# Helper to run uvicorn locally and then run cloudflared tunnel (development convenience)
# Usage: ./scripts/start_local_tunnel.sh [tunnel-name] [port]
# Example: ./scripts/start_local_tunnel.sh capstone-tunnel 8000

TUNNEL_ID="41921350-a165-41a0-8dff-24139e3377ac"
PORT=${1:-8000}

set -euo pipefail

command -v cloudflared >/dev/null 2>&1 || { echo >&2 "cloudflared is not installed. Install it first: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation"; exit 1; }

echo "Starting backend with environment variables on http://127.0.0.1:${PORT}"
./run_backend.sh &
BACKEND_PID=$!

sleep 0.8

echo "Running cloudflared tunnel (foreground). Use Ctrl-C to stop both processes." 
trap "echo 'Stopping...'; kill ${BACKEND_PID} || true; exit 0" INT TERM

# Use config file for tunnel configuration
if [ -f "$HOME/.cloudflared/config.yml" ]; then
	echo "Using config: $HOME/.cloudflared/config.yml"
	cloudflared tunnel run
else
	echo "No config file found. Please set up cloudflared tunnel first."
	exit 1
fi
