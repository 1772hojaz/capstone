This is the capstone back-end

## Local Development Setup

### Prerequisites
- Python 3.12+ with virtual environment at `/home/humphrey/capstone/venv`
- SQLite database (configured in `.env`)
- Cloudflare tunnel credentials (already configured)

### Running the Backend with Cloudflare Tunnel

The backend is configured to run locally and expose itself publicly via Cloudflare Tunnel.

#### Quick Start
```bash
# 1. Activate virtual environment
source /home/humphrey/capstone/venv/bin/activate

# 2. Navigate to project directory
cd /home/humphrey/capstone-back-end

# 3. Run backend with Cloudflare tunnel
./scripts/start_local_tunnel.sh
```

This will:
- Start the FastAPI backend on `http://127.0.0.1:8000`
- Launch Cloudflare tunnel to expose it at `https://api.asked.qzz.io`
- Set all required environment variables (Cloudinary, database, etc.)

#### Stopping the Server
Press `Ctrl+C` to stop both the backend and tunnel.

#### Environment Variables
All environment variables are automatically set by `run_backend.sh`:
- `CLOUDINARY_CLOUD_NAME=dz5rslegb`
- `CLOUDINARY_API_KEY=596291411567142`
- `CLOUDINARY_API_SECRET=7wR7cVkBDXHKVSI83-cG0bcD8Qk`
- `DATABASE_URL=sqlite:///./capstone.db`
- `USE_SQLITE=true`

#### API Endpoints
Once running, access:
- **API Documentation**: https://api.asked.qzz.io/docs
- **Local Backend**: http://127.0.0.1:8000

#### Troubleshooting
- If you see "Address already in use", kill the process: `lsof -ti:8000 | xargs kill -9`
- Warnings about scikit-learn version mismatch are expected (models from 1.3.2, running 1.6.1)
- Cloudflare tunnel warnings about ping_group_range can be ignored