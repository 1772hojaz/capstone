#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/setup_cloudflared_config.sh <TUNNEL_UUID> <CREDENTIALS_PATH> [HOSTNAME] [PORT]
# Example:
# ./scripts/setup_cloudflared_config.sh 41921350-a165-41a0-8dff-24139e3377ac ~/.cloudflared/41921350-a165-41a0-8dff-24139e3377ac.json api.asked.qzz.io 8000

TUNNEL_UUID=${1:-}
CRED_PATH=${2:-}
HOSTNAME=${3:-api.asked.qzz.io}
PORT=${4:-8000}

if [ -z "$TUNNEL_UUID" ] || [ -z "$CRED_PATH" ]; then
  echo "Usage: $0 <TUNNEL_UUID> <CREDENTIALS_PATH> [HOSTNAME] [PORT]"
  exit 1
fi

if [ ! -f "$CRED_PATH" ]; then
  echo "Warning: credentials file not found at $CRED_PATH"
  echo "Proceeding anyway — ensure the credentials file exists at that path before running cloudflared."
fi

mkdir -p "$HOME/.cloudflared"

cat > "$HOME/.cloudflared/config.yml" <<EOF
tunnel: ${TUNNEL_UUID}
credentials-file: ${CRED_PATH}

ingress:
  - hostname: ${HOSTNAME}
    service: http://127.0.0.1:${PORT}

  - service: http_status:404
EOF

echo "Wrote $HOME/.cloudflared/config.yml"
echo "Contents:"
cat "$HOME/.cloudflared/config.yml"

echo "Next: ensure your FastAPI app is running on 127.0.0.1:${PORT} and run:"
echo "  cloudflared tunnel run <your-tunnel-name> --config $HOME/.cloudflared/config.yml"
