# Capstone Project

Description
-----------

This repository contains the final capstone project: a full-stack group-buy recommendation and dashboard application with a Python backend (Flask) and a React frontend. The project includes data preprocessing and machine learning models for recommendations, an admin dashboard, and trader/user interfaces.

Repository
----------

GitHub: https://github.com/1772hojaz/capstone

Quick links
-----------

- Google Colab (notebook): https://colab.research.google.com/drive/1h3pVNah8ckJJjoeoKlbLJDc2c4gsA9Em#scrollTo=9cad86e2
- Video demo (Vimeo): https://vimeo.com/1125306747?share=copy

How to set up the environment and the project
---------------------------------------------

Prerequisites

- Python 3.10+ (project code uses Python 3.12 bytecode in __pycache__ but is compatible with 3.10+)
- Node.js 16+ and npm (for the frontend)
- git

Backend (Python)

1. Create and activate a virtual environment:

   python -m venv .venv
   source .venv/bin/activate
2. Install backend requirements:

   pip install -r sys/backend/requirements.txt
3. Initialize or reset the database (SQLite used in repo):

   python sys/backend/init_db.py
4. (Optional) Seed demo data:

   python sys/backend/seed_mbare_data.py
5. Run the backend server:

   python sys/backend/main.py

Frontend (React)

1. Install dependencies and build/start the frontend:

   cd sys/frontend
   npm install
   npm run build   # or `npm start` for dev server
2. The built frontend is in `sys/frontend/build`. In production the backend can serve the static files from this folder (already wired in the repo).

Designs
-------
FIGMA

https://www.figma.com/community/file/1558219458205810998 

Included design artifacts and screenshots (stored in `docs/assets/`):

- Figma mockups (link or embed) — add Figma URL here
- Circuit diagram (if any hardware was used) — add file or link

Screenshots

The following screenshots are included in `docs/assets/`:

![Screenshot 1](docs/assets/Screenshot%20from%202025-10-09%2022-59-21.png)

![Screenshot 2](docs/assets/Screenshot%20from%202025-10-09%2022-59-55.png)

![Screenshot 3](docs/assets/Screenshot%20from%202025-10-09%2023-00-06.png)

![Screenshot 4](docs/assets/Screenshot%20from%202025-10-09%2023-00-24.png)

![Screenshot 5](docs/assets/Screenshot%20from%202025-10-09%2023-00-32.png)

![Screenshot 6](docs/assets/Screenshot%20from%202025-10-09%2023-00-44.png)

![Screenshot 7](docs/assets/Screenshot%20from%202025-10-09%2023-01-06.png)

![Screenshot 8](docs/assets/Screenshot%20from%202025-10-09%2023-01-33.png)

![Screenshot 9](docs/assets/Screenshot%20from%202025-10-09%2023-01-41.png)

![Screenshot 10](docs/assets/Screenshot%20from%202025-10-09%2023-01-48.png)

![Screenshot 11](docs/assets/Screenshot%20from%202025-10-09%2023-01-52.png)

![Screenshot 12](docs/assets/Screenshot%20from%202025-10-09%2023-01-58.png)

![Screenshot 13](docs/assets/Screenshot%20from%202025-10-09%2023-02-03.png)

Deployment Plan (Docker + Localhost)
------------------------------------

This project uses Docker for containerized deployment with the backend running in Docker and accessible on localhost.

### Prerequisites

- Docker 20.10+ and Docker Compose 2.0+
- Git
- (Optional) Docker Desktop for easier management

### Architecture

- **Backend**: Python Flask API running in Docker container (port 5000)
- **Frontend**: React app served as static files via Flask
- **Database**: SQLite database with persistent volume
- **ML Models**: Pre-trained models stored in persistent volume

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/1772hojaz/capstone.git
   cd capstone
   ```

2. **Create Dockerfile** (`Dockerfile` in project root)
   ```dockerfile
   FROM python:3.12-slim

   WORKDIR /app

   # Install system dependencies
   RUN apt-get update && apt-get install -y \
       build-essential \
       curl \
       && rm -rf /var/lib/apt/lists/*

   # Copy backend requirements and install Python dependencies
   COPY sys/backend/requirements.txt /app/requirements.txt
   RUN pip install --no-cache-dir -r requirements.txt

   # Copy backend code
   COPY sys/backend /app/backend

   # Copy frontend build (make sure to build first)
   COPY sys/frontend/build /app/frontend/build

   WORKDIR /app/backend

   # Expose Flask port
   EXPOSE 5000

   # Run the Flask application
   CMD ["python", "main.py"]
   ```

3. **Create docker-compose.yml** (`docker-compose.yml` in project root)
   ```yaml
   version: '3.8'

   services:
     backend:
       build: .
       container_name: capstone-backend
       ports:
         - "5000:5000"
       volumes:
         - ./sys/backend/groupbuy.db:/app/backend/groupbuy.db
         - ./sys/backend/ml_models:/app/backend/ml_models
         - ./sys/backend/backend/ml_models:/app/backend/backend/ml_models
       environment:
         - FLASK_ENV=production
         - FLASK_APP=main.py
         - PYTHONUNBUFFERED=1
       restart: unless-stopped
   ```

4. **Build the frontend** (must be done before Docker build)
   ```bash
   cd sys/frontend
   npm install
   npm run build
   cd ../..
   ```

5. **Build and run with Docker Compose**
   ```bash
   # Build the Docker image
   docker-compose build

   # Start the container
   docker-compose up -d

   # View logs
   docker-compose logs -f
   ```

6. **Initialize the database** (first time only)
   ```bash
   # Access the running container
   docker exec -it capstone-backend bash

   # Inside container, initialize database
   python init_db.py

   # (Optional) Seed with demo data
   python seed_mbare_data.py

   # Exit container
   exit
   ```

7. **Access the application**
   - Open browser to: `http://localhost:5000`
   - Admin login: Use credentials from seeded data
   - Trader login: Use credentials from seeded data

### Docker Management Commands

```bash
# Start the application
docker-compose up -d

# Stop the application
docker-compose down

# Restart the application
docker-compose restart

# View logs
docker-compose logs -f backend

# Access container shell
docker exec -it capstone-backend bash

# Rebuild after code changes
docker-compose build --no-cache
docker-compose up -d

# Stop and remove all containers, networks, volumes
docker-compose down -v
```

### Database Backup and Restore

**Backup database:**
```bash
# Copy database from container to host
docker cp capstone-backend:/app/backend/groupbuy.db ./backup-$(date +%Y%m%d).db

# Or use docker-compose
docker-compose exec backend cp /app/backend/groupbuy.db /tmp/backup.db
docker cp capstone-backend:/tmp/backup.db ./backup-$(date +%Y%m%d).db
```

**Restore database:**
```bash
# Stop the container
docker-compose down

# Replace database file
cp backup-YYYYMMDD.db sys/backend/groupbuy.db

# Restart container
docker-compose up -d
```

### ML Model Training

To retrain ML models inside the container:

```bash
# Access container
docker exec -it capstone-backend bash

# Run ML training script
python ml.py

# Or use the scheduler
python ml_scheduler.py

# Exit
exit
```

### Troubleshooting

**Port 5000 already in use:**
```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill the process
sudo kill -9 <PID>

# Or change port in docker-compose.yml to "5001:5000"
```

**Container won't start:**
```bash
# Check logs
docker-compose logs backend

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

**Database not persisting:**
- Ensure the volume path in docker-compose.yml matches your database location
- Check file permissions: `sudo chown -R $USER:$USER sys/backend/`

**Frontend not loading:**
- Ensure `npm run build` was run before Docker build
- Check that `sys/frontend/build` directory exists
- Verify Flask is serving static files correctly in `main.py`

### Production Considerations

For production deployment beyond localhost:

1. **Use environment variables** for sensitive configuration
   - Create `.env` file for secrets
   - Reference in docker-compose.yml: `env_file: .env`

2. **Add NGINX reverse proxy** for SSL/TLS
   ```yaml
   # Add to docker-compose.yml
   nginx:
     image: nginx:alpine
     ports:
       - "80:80"
       - "443:443"
     volumes:
       - ./nginx.conf:/etc/nginx/nginx.conf
       - ./ssl:/etc/nginx/ssl
     depends_on:
       - backend
   ```

3. **Migrate to PostgreSQL** for better performance
4. **Set up automated backups** with cron jobs
5. **Implement logging and monitoring** (e.g., Prometheus + Grafana)
6. **Use Docker secrets** for credentials
7. **Enable health checks** in docker-compose.yml

### Health Check

Add to your `docker-compose.yml` under the backend service:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

Ensure you have a `/health` endpoint in your Flask app (`main.py`).

Video Demo
----------

Watch the demo video on Vimeo:

https://vimeo.com/1125306747?share=copy

Google Colab
------------

Interactive Colab notebook:

https://colab.research.google.com/drive/1aQHusbRqE0p9XRAUgaSX2bhqjjkr-0w6#scrollTo=86a458d3
