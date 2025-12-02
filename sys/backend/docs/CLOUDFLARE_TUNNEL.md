# Expose this app via Cloudflare Tunnel (api.asked.qzz.io)

This document shows how to expose your local FastAPI app (uvicorn) publicly using Cloudflare Tunnel
so your Swagger UI will be reachable at `https://api.asked.qzz.io/docs`.

Important: do NOT commit any Cloudflare credential JSON files to source control. The credentials live in
`~/.cloudflared/` on your machine.

Prerequisites
- A Cloudflare account with control of the `asked.qzz.io` zone.
- `cloudflared` CLI installed locally (see https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation).
- Your FastAPI app runs locally (e.g. `uvicorn main:app --host 127.0.0.1 --port 8000`).

Quick overview (commands you will run)

1. Authenticate cloudflared with Cloudflare:

```bash
cloudflared login
```

2. Create a named tunnel:

```bash
cloudflared tunnel create capstone-tunnel
# Note the printed TUNNEL-UUID and the credentials file path (~/.cloudflared/<TUNNEL-UUID>.json)
```

3. Route DNS for your hostname:

```bash
cloudflared tunnel route dns capstone-tunnel api.asked.qzz.io
```

4. Create a `~/.cloudflared/config.yml` using the example below (do not commit it):

```yaml
tunnel: <TUNNEL-UUID>
credentials-file: /home/<youruser>/.cloudflared/<TUNNEL-UUID>.json

ingress:
  - hostname: api.asked.qzz.io
    service: http://localhost:8000

  - service: http_status:404
```

5. Start your local FastAPI app (example):

```bash
# optionally in a venv
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-web.txt
uvicorn main:app --host 127.0.0.1 --port 8000
```

6. Run the tunnel attached to the named tunnel:

```bash
cloudflared tunnel run capstone-tunnel
```

Now `https://api.asked.qzz.io/docs` will proxy to your local `/docs` endpoint.

Persistent service (systemd)
----------------------------
Create a systemd unit to keep the tunnel running after reboots. Place this file as
`/etc/systemd/system/cloudflared-capstone.service` (update `User`, and `ExecStart` if cloudflared is installed to a different path):

```
[Unit]
Description=Cloudflared Tunnel - capstone-tunnel
After=network-online.target

[Service]
Type=simple
User=youruser
Environment=HOME=/home/youruser
ExecStart=/usr/local/bin/cloudflared tunnel run capstone-tunnel
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now cloudflared-capstone.service
sudo journalctl -u cloudflared-capstone -f
```

Notes and tips
- Use `127.0.0.1` binding for uvicorn where possible (more secure). If you use Docker, set `service: http://host.docker.internal:8000` or the container IP.
- Update CORS in `main.py` to allow `https://api.asked.qzz.io`.
- Keep the credentials file under `~/.cloudflared` and do NOT add it to git.

Troubleshooting
- 502: ensure uvicorn is running and reachable on the configured host/port.
- DNS issues: verify the CNAME created by `cloudflared tunnel route dns` exists in Cloudflare DNS UI and is proxied.
- Tunnel shows permission errors: re-run `cloudflared login` and ensure you selected the correct account/zone.

If you want, I can also add a small helper script to start the app and the tunnel together locally. See `scripts/start_local_tunnel.sh` and `.cloudflared/config.example.yml` for templates.
