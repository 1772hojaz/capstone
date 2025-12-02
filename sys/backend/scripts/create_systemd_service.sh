#!/usr/bin/env bash
set -euo pipefail

# Usage: sudo ./scripts/create_systemd_service.sh <USER> [CLOUDFLARED_PATH]
# Example: sudo ./scripts/create_systemd_service.sh humphrey /usr/local/bin/cloudflared

if [ "$(id -u)" -ne 0 ]; then
  echo "This script must be run as root (it writes to /etc/systemd/system). Use sudo." >&2
  exit 1
fi

USER_NAME=${1:-youruser}
CLOUDFLARED_PATH=${2:-/usr/local/bin/cloudflared}
SERVICE_PATH=/etc/systemd/system/cloudflared-capstone.service

cat > ${SERVICE_PATH} <<EOF
[Unit]
Description=Cloudflared Tunnel - capstone-tunnel
After=network-online.target

[Service]
Type=simple
User=${USER_NAME}
Environment=HOME=/home/${USER_NAME}
ExecStart=${CLOUDFLARED_PATH} tunnel run capstone-tunnel
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

echo "Wrote ${SERVICE_PATH}"
systemctl daemon-reload
systemctl enable --now cloudflared-capstone.service
echo "Service enabled and started. Check status with: systemctl status cloudflared-capstone.service"
