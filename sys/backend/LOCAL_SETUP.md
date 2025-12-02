# Local Development Setup with Cloudflare Tunnel

This guide explains how to run the backend server locally and expose it via Cloudflare Tunnel for public access.

## Prerequisites

1. **Python Environment**: Make sure you have Python 3.12+ and the virtual environment activated
2. **Cloudinary Credentials**: Set up your Cloudinary API credentials in environment variables
3. **Cloudflared**: Install cloudflared CLI (already installed if following this guide)

## Quick Start

### 1. Activate Virtual Environment
```bash
source /home/humphrey/capstone/venv/bin/activate
```

### 2. Run Backend with Tunnel
```bash
cd /home/humphrey/capstone-back-end
./scripts/start_local_tunnel.sh
```

This will:
- Start the FastAPI backend server on `http://127.0.0.1:8000`
- Load all environment variables (Cloudinary credentials, database settings)
- Start the Cloudflare tunnel
- Make your backend publicly accessible at `https://api.asked.qzz.io`

### 3. Access Your API

Once running, your backend will be available at:
- **Local**: `http://127.0.0.1:8000`
- **Public**: `https://api.asked.qzz.io`

## Troubleshooting

### Port 8000 Already in Use
If you get "Address already in use" error:
```bash
# Kill any existing processes on port 8000
lsof -ti:8000 | xargs kill -9 || true

# Wait a moment, then try again
./scripts/start_local_tunnel.sh
```

### Stop the Server and Tunnel
Press `Ctrl+C` in the terminal running the tunnel script. This will gracefully stop both the backend and tunnel.

### Environment Variables
The script automatically loads:
- `CLOUDINARY_CLOUD_NAME=dz5rslegb`
- `CLOUDINARY_API_KEY=596291411567142`
- `CLOUDINARY_API_SECRET=7wR7cVkBDXHKVSI83-cG0bcD8Qk`
- SQLite database configuration

## What's Included

- **FastAPI Backend**: REST API with ML recommendations
- **SQLite Database**: Local development database (auto-created)
- **Cloudinary Integration**: Image upload functionality
- **ML Models**: Recommendation system with collaborative and content-based filtering
- **WebSocket Support**: Real-time communication
- **Cloudflare Tunnel**: Secure public access without port forwarding

## Development Notes

- The backend uses SQLite for local development (switches from PostgreSQL)
- ML models are loaded with version compatibility warnings (expected)
- Hybrid training requires more data for optimal performance
- All dependencies are managed via `requirements.txt`