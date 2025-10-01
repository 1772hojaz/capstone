# 🐳 SPACS AFRICA - Docker for Databases Only

This setup uses **Docker only for PostgreSQL and Redis**, while running the backend and frontend natively on Linux.

## Why This Setup?

- ✅ **Easy database management** - No need to install/configure PostgreSQL and Redis
- ✅ **Native performance** - Backend and frontend run at full speed
- ✅ **Easy debugging** - Direct access to Python and Node processes
- ✅ **Flexible development** - Modify code without rebuilding containers

---

## Prerequisites

### Required Software

1. **Docker & Docker Compose**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Add user to docker group (no sudo needed)
   sudo usermod -aG docker $USER
   newgrp docker
   
   # Verify
   docker --version
   docker-compose --version
   ```

2. **Python 3.11+**
   ```bash
   sudo apt install -y python3.11 python3.11-venv python3-pip
   python3.11 --version
   ```

3. **Node.js 18+**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   node --version
   npm --version
   ```

4. **Build Tools**
   ```bash
   sudo apt install -y build-essential libpq-dev
   ```

---

## Installation

### Step 1: Install Dependencies

```bash
cd /path/to/humphrey

# Install backend dependencies
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Make Scripts Executable

```bash
cd /path/to/humphrey
chmod +x run_native.sh stop_native.sh
```

---

## Running the Application

### Start Everything

```bash
./run_native.sh
```

This will:
1. ✅ Start PostgreSQL in Docker
2. ✅ Start Redis in Docker
3. ✅ Wait for databases to be ready
4. ✅ Start backend (native Python)
5. ✅ Start Celery worker (native)
6. ✅ Start frontend (native Node.js)

### Stop Everything

```bash
./stop_native.sh
```

This will:
1. Stop backend, Celery, and frontend processes
2. Stop PostgreSQL and Redis containers
3. Keep data volumes (database data persists)

### Remove Database Data

```bash
# Stop and remove all data
docker-compose -f docker-compose-db-only.yml down -v
```

---

## Access Points

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000/docs
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

**Login:**
- Email: `admin@spacsafrica.com`
- Password: `admin123`

---

## Managing Docker Databases

### View Running Containers

```bash
docker ps
```

### View Logs

```bash
# PostgreSQL logs
docker logs -f spacs_postgres

# Redis logs
docker logs -f spacs_redis
```

### Connect to PostgreSQL

```bash
# Using Docker exec
docker exec -it spacs_postgres psql -U spacs_user -d spacs_africa

# Using local psql (if installed)
psql -h localhost -U spacs_user -d spacs_africa
```

### Connect to Redis

```bash
# Using Docker exec
docker exec -it spacs_redis redis-cli

# Using local redis-cli (if installed)
redis-cli -h localhost
```

### Restart Databases

```bash
# Restart PostgreSQL
docker restart spacs_postgres

# Restart Redis
docker restart spacs_redis

# Restart both
docker-compose -f docker-compose-db-only.yml restart
```

### View Database Data

```bash
# Check PostgreSQL volume
docker volume inspect humphrey_postgres_data

# Check Redis volume
docker volume inspect humphrey_redis_data
```

---

## Application Logs

View native process logs:

```bash
# Backend
tail -f logs/backend.log

# Celery
tail -f logs/celery.log

# Frontend
tail -f logs/frontend.log

# All logs
tail -f logs/*.log
```

---

## Troubleshooting

### Docker Containers Won't Start

```bash
# Check Docker is running
docker info

# Check for port conflicts
sudo lsof -i :5432  # PostgreSQL
sudo lsof -i :6379  # Redis

# Remove old containers
docker-compose -f docker-compose-db-only.yml down
docker-compose -f docker-compose-db-only.yml up -d
```

### Backend Can't Connect to Database

```bash
# Check PostgreSQL is ready
docker exec spacs_postgres pg_isready -U spacs_user

# Check PostgreSQL is listening
docker exec spacs_postgres netstat -tuln | grep 5432

# Test connection
psql -h localhost -U spacs_user -d spacs_africa -c "SELECT 1;"
```

### Backend Can't Connect to Redis

```bash
# Check Redis is ready
docker exec spacs_redis redis-cli ping

# Test connection
redis-cli -h localhost ping
```

### Port Already in Use

```bash
# Backend port 8000
sudo lsof -ti:8000 | xargs kill -9

# Frontend port 3000
sudo lsof -ti:3000 | xargs kill -9

# PostgreSQL port 5432 (another PostgreSQL running?)
sudo lsof -ti:5432 | xargs kill -9
sudo systemctl stop postgresql

# Redis port 6379 (another Redis running?)
sudo lsof -ti:6379 | xargs kill -9
sudo systemctl stop redis
```

### Database Schema Not Loaded

```bash
# Reload schema
docker exec -i spacs_postgres psql -U spacs_user -d spacs_africa < shared/init.sql

# Or rebuild database
docker-compose -f docker-compose-db-only.yml down -v
docker-compose -f docker-compose-db-only.yml up -d
# Wait 10 seconds for init.sql to run automatically
```

---

## Development Workflow

### Modify Backend Code

1. Edit Python files in `backend/`
2. FastAPI auto-reloads (if using `--reload`)
3. Changes take effect immediately

### Modify Frontend Code

1. Edit React files in `frontend/src/`
2. React auto-reloads
3. Changes appear in browser immediately

### Update Dependencies

**Backend:**
```bash
cd backend
source venv/bin/activate
pip install package-name
pip freeze > requirements.txt
deactivate
```

**Frontend:**
```bash
cd frontend
npm install package-name
```

### Reset Database

```bash
# Stop everything
./stop_native.sh

# Remove database data
docker-compose -f docker-compose-db-only.yml down -v

# Start again (schema loads automatically)
./run_native.sh
```

---

## Advantages of This Setup

### vs. Full Docker

- ✅ **Faster startup** - No need to build backend/frontend images
- ✅ **Instant code changes** - No rebuild on every change
- ✅ **Better debugging** - Direct access to Python debugger
- ✅ **Lower resource usage** - Only 2 containers vs 5+

### vs. Full Native

- ✅ **Easy database setup** - No PostgreSQL/Redis installation
- ✅ **Consistent environment** - Same DB versions everywhere
- ✅ **Easy cleanup** - `docker-compose down -v` removes everything
- ✅ **Isolated databases** - Won't conflict with other projects

---

## Production Considerations

For production, you'd typically:

1. Use full Docker setup (all services containerized)
2. Use managed databases (AWS RDS, etc.)
3. Use proper secrets management
4. Add monitoring and logging
5. Set up CI/CD pipelines

See `DEPLOYMENT_GUIDE.md` for production deployment.

---

**This is the recommended setup for local development on Linux!** 🚀

