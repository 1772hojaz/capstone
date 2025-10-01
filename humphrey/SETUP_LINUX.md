# 🐧 Complete Linux Setup Guide

## Quick Install Script

Run this to install all dependencies automatically:

```bash
# Ubuntu/Debian
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

sudo apt update && sudo apt install -y \
    python3.11 python3.11-venv python3-pip \
    postgresql postgresql-contrib \
    redis-server \
    build-essential libpq-dev

# Install Node.js 18
nvm install 18
nvm use 18
```

---

## Step-by-Step Setup

### 1. Install Dependencies

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3-pip
sudo apt install -y postgresql postgresql-contrib
sudo apt install -y redis-server
sudo apt install -y build-essential libpq-dev

# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

**Fedora/RHEL:**
```bash
sudo dnf install -y python3.11 postgresql-server redis nodejs npm
sudo dnf install -y gcc postgresql-devel
sudo postgresql-setup --initdb
```

### 2. Configure PostgreSQL

```bash
# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create user and database
sudo -u postgres psql << 'EOF'
CREATE USER spacs_user WITH PASSWORD 'spacs_secure_password_2025';
CREATE DATABASE spacs_africa OWNER spacs_user;
GRANT ALL PRIVILEGES ON DATABASE spacs_africa TO spacs_user;
ALTER USER spacs_user CREATEDB;
\q
EOF

# Load schema
cd /path/to/humphrey
sudo -u postgres psql -U spacs_user -d spacs_africa < shared/init.sql
```

### 3. Configure Redis

```bash
# Start Redis
sudo systemctl start redis
sudo systemctl enable redis

# Test
redis-cli ping  # Should return PONG
```

### 4. Set Up Application

```bash
cd /path/to/humphrey

# Create logs directory
mkdir -p logs

# Make scripts executable
chmod +x run_linux.sh
chmod +x stop_linux.sh
chmod +x start_*.sh

# Install backend
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

# Install frontend
cd ../frontend
npm install
```

---

## Running the Application

### Option 1: Simple Script (Recommended)

```bash
cd /path/to/humphrey

# Start everything
./run_linux.sh

# Stop everything
./stop_linux.sh
```

### Option 2: Manual (3 Terminals)

**Terminal 1 - Backend:**
```bash
cd /path/to/humphrey/backend
source venv/bin/activate

export DATABASE_URL="postgresql://spacs_user:spacs_secure_password_2025@localhost:5432/spacs_africa"
export REDIS_URL="redis://localhost:6379/0"
export SECRET_KEY="your-secret-key-32-chars"

python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 - Celery:**
```bash
cd /path/to/humphrey/backend
source venv/bin/activate

export DATABASE_URL="postgresql://spacs_user:spacs_secure_password_2025@localhost:5432/spacs_africa"
export REDIS_URL="redis://localhost:6379/0"

celery -A celery_worker.celery worker --loglevel=info
```

**Terminal 3 - Frontend:**
```bash
cd /path/to/humphrey/frontend
npm start
```

### Option 3: Docker (Easiest)

```bash
cd /path/to/humphrey
docker-compose up -d
```

---

## Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health

**Login:**
- Email: `admin@spacsafrica.com`
- Password: `admin123`

---

## View Logs

```bash
# Backend logs
tail -f logs/backend.log

# Celery logs
tail -f logs/celery.log

# Frontend logs
tail -f logs/frontend.log

# All logs
tail -f logs/*.log
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find and kill process on port 8000
sudo lsof -ti:8000 | xargs kill -9

# Find and kill process on port 3000
sudo lsof -ti:3000 | xargs kill -9
```

### PostgreSQL Connection Error

```bash
# Check if running
sudo systemctl status postgresql

# Restart
sudo systemctl restart postgresql

# Test connection
psql -U spacs_user -d spacs_africa -c "SELECT 1;"
```

### Redis Connection Error

```bash
# Check if running
sudo systemctl status redis

# Restart
sudo systemctl restart redis

# Test
redis-cli ping
```

### Permission Issues

```bash
# Fix permissions
chmod +x *.sh
chmod -R 755 backend frontend shared

# Fix ownership
sudo chown -R $USER:$USER /path/to/humphrey
```

---

## Production Deployment

For production on a Linux server:

```bash
# 1. Use Docker Compose
docker-compose -f docker-compose.yml up -d

# 2. Or set up systemd services
sudo cp systemd/spacs-*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable spacs-backend spacs-celery spacs-frontend
sudo systemctl start spacs-backend spacs-celery spacs-frontend

# 3. Set up Nginx reverse proxy
sudo apt install nginx
sudo cp nginx/spacs.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/spacs.conf /etc/nginx/sites-enabled/
sudo systemctl restart nginx

# 4. Get SSL certificate
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Uninstall

```bash
# Stop services
./stop_linux.sh

# Remove services (if using systemd)
sudo systemctl stop postgresql redis
sudo systemctl disable postgresql redis

# Remove packages
sudo apt remove --purge postgresql redis-server

# Remove project
cd ~
rm -rf /path/to/humphrey
```

---

**Ready to run! Execute `./run_linux.sh` to start!** 🚀

