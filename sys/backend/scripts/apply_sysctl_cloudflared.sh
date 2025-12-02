#!/usr/bin/env bash
set -euo pipefail

# This script applies recommended sysctl settings for cloudflared/QUIC
# It requires sudo to write to /etc/sysctl.d and to reload sysctl settings.

CONF=/etc/sysctl.d/99-cloudflared.conf

echo "About to write sysctl config to ${CONF} (requires sudo)."
sudo tee ${CONF} > /dev/null <<'SYS'
net.core.rmem_max=8388608
net.core.wmem_max=8388608
net.core.rmem_default=262144
net.core.wmem_default=262144
# Optional: enable ICMP proxy for cloudflared (uncomment to enable)
# net.ipv4.ping_group_range = 0 2147483647
SYS

echo "Reloading sysctl settings..."
sudo sysctl --system

echo "Done. Current values:"
sysctl net.core.rmem_max net.core.wmem_max net.core.rmem_default net.core.wmem_default || true
