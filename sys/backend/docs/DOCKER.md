Docker development and local deployment
=====================================

This repo includes a Dockerfile for the backend and a `docker-compose.yml` that
brings up the backend plus Redis and an optional cloudflared tunnel service.

Files:
- `Dockerfile` - builds the backend image (uses `requirements-web.txt`)
- `docker-compose.yml` - orchestrates `backend`, `redis`, and optional `cloudflared`
- `cloudflared/` (optional) - place your tunnel credentials and `config.yml` here if you want to run the tunnel in Docker. Do NOT commit credentials.

Quick start (development)
-------------------------
1. Copy environment variables into `.env` (do NOT commit secrets):

```bash
cp .env.example .env
# edit .env and fill in values (at least PORT, SECRET_KEY, DATABASE_URL if needed)
```

2. (Optional) create the `cloudflared` directory if you plan to run the tunnel service:

```bash
# after running `cloudflared tunnel create <name>` on your machine, copy the credentials json and a config.yml into ./cloudflared
mkdir -p cloudflared
# place your credentials json and config.yml into ./cloudflared (DO NOT commit)
```

3. Build and run with docker-compose:

Simplest (recommended): use the helper script which sets the env file to `~/capstone/.env`

```bash
chmod +x ./scripts/run_compose.sh
./scripts/run_compose.sh
```

Alternatively, pass an explicit env file (avoids snap HOME issues):

```bash
ENV_FILE="$HOME/capstone/.env" docker compose up --build
```

4. Open the API docs:

- If you are running without cloudflared: http://localhost:8000/docs
- If you also run the cloudflared service and have routed DNS: https://api.asked.qzz.io/docs

Notes
-----
- The `backend` service mounts `./ml_models` into `/app/ml_models`. This allows you
  to keep model artifacts outside of the image (download them into the folder or
  mount a host path). You can remove this volume if you prefer models baked into the image.
- The `cloudflared` service expects a `config.yml` and credentials JSON in `./cloudflared`.
  Example config (do NOT commit your credentials):

  ```yaml
  tunnel: <TUNNEL-UUID>
  credentials-file: /etc/cloudflared/<TUNNEL-UUID>.json

  ingress:
    - hostname: api.asked.qzz.io
      service: http://backend:8000
    - service: http_status:404
  ```

- If backend is not reachable from the `cloudflared` container, modify the service
  `service:` line to point to the correct hostname/port (backend:8000 should resolve within the compose network).

Persistent volumes
------------------
- Redis data is stored in a Docker volume named `redis-data`.

Stopping and cleanup
--------------------
Stop and remove containers:

```bash
docker compose down
```

Further improvements
--------------------
- Add a multi-stage Dockerfile to remove build dependencies after pip install to shrink image size.
- Split ML worker into a separate compose service that uses `requirements.txt` and downloads large models at startup.
