# 🐧 Run SPACS AFRICA on Linux

## Quick Start (Docker Method)

```bash
# Clone or navigate to project
cd /path/to/humphrey

# Start everything with Docker
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Access API docs
xdg-open http://localhost:8000/docs

# Stop everything
docker-compose down
```

---

## Native Installation (No Docker)

### 1. Install Dependencies

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3-pip \
                    postgresql postgresql-contrib \
                    redis-server nodejs npm build-essential
```

**Fedora/RHEL:**
```bash
sudo dnf install -y python3.11 postgresql-server redis nodejs npm gcc
```

### 2. Set Up Database

```bash
# Start services
sudo systemctl start postgresql redis
sudo systemctl enable postgresql redis

# Create database
sudo -u postgres psql << EOF
CREATE USER spacs_user WITH PASSWORD 'spacs_secure_password_2025';
CREATE DATABASE spacs_africa OWNER spacs_user;
\q
EOF

# Load schema
cd /path/to/humphrey
sudo -u postgres psql -U spacs_user -d spacs_africa -f shared/init.sql
```

### 3. Use Startup Scripts

```bash
# Make scripts executable
chmod +x start_*.sh

# Option A: Start everything at once
./start_all_linux.sh

# Option B: Start individually in separate terminals
# Terminal 1:
./start_backend_linux.sh

# Terminal 2:
./start_celery_linux.sh

# Terminal 3:
./start_frontend_linux.sh
```

---

## Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health

**Login:**
- Email: admin@spacsafrica.com
- Password: admin123

---

## Systemd Services (Optional - Run as Services)

Create `/etc/systemd/system/spacs-backend.service`:

```ini
[Unit]
Description=SPACS AFRICA Backend
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/humphrey/backend
Environment="DATABASE_URL=postgresql://spacs_user:spacs_secure_password_2025@localhost:5432/spacs_africa"
Environment="REDIS_URL=redis://localhost:6379/0"
Environment="SECRET_KEY=your-secret-key"
ExecStart=/path/to/humphrey/backend/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable spacs-backend
sudo systemctl start spacs-backend
```

---

## Troubleshooting

**PostgreSQL connection failed:**
```bash
sudo systemctl status postgresql
sudo journalctl -u postgresql
```

**Redis not responding:**
```bash
redis-cli ping
sudo systemctl restart redis
```

**Port already in use:**
```bash
sudo lsof -i :8000
sudo kill -9 <PID>
```

---

## Production Deployment (Linux Server)

For production on Linux:

1. Use Docker Compose (recommended)
2. Set up Nginx reverse proxy
3. Get SSL certificate (Let's Encrypt)
4. Configure firewall (ufw/firewalld)
5. Set up monitoring (systemd + journald)

See DEPLOYMENT_GUIDE.md for details.

---

**Everything is ready! Run `./start_all_linux.sh` to begin!** 🚀
