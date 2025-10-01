# SPACS AFRICA - Collaborative Bulk-Purchasing Platform for Informal Traders

## 🌍 Overview

SPACS AFRICA is an intelligent, AI-powered Progressive Web Application (PWA) that enables informal sector traders across Africa to form dynamic groups for bulk purchases, achieving 15-30% cost savings on inventory.

### What Problem Does It Solve?

Small traders (market vendors, street sellers, kiosk owners) typically pay high retail prices because they can't afford bulk purchases. SPACS AFRICA uses machine learning to group similar traders together so they can collectively buy in bulk and access wholesale prices.

### Key Features

- 🤖 **AI-Powered Recommendations** - K-Means clustering groups traders by behavior, collaborative filtering suggests optimal groups
- 💡 **Transparent Explanations** - Every recommendation includes a clear, non-technical reason: *"You were grouped with 8 traders who also purchase rice weekly"*
- 📱 **Progressive Web App** - Works offline, installable on any device, optimized for low-end smartphones
- 📊 **Admin Dashboard** - Real-time metrics, ML model evaluation (Precision@K, Recall@K), cost savings tracking
- 🔄 **Event-Driven Architecture** - Real-time updates using Redis Pub/Sub
- 🎯 **Production-Ready** - Docker deployment, automated testing, comprehensive logging

---

## 🚀 Quick Start

### Recommended Setup: Docker for Databases Only

This approach uses Docker **only** for PostgreSQL and Redis, while running the backend and frontend natively for the best development experience.

#### Prerequisites

- **Linux** (Ubuntu/Debian recommended)
- **Docker & Docker Compose**
- **Python 3.11+**
- **Node.js 18+**

#### Installation Steps

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# 2. Install Python 3.11 and build tools
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3-pip \
                    build-essential libpq-dev

# 3. Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Navigate to project
cd /path/to/humphrey

# 5. Install backend dependencies
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

# 6. Install frontend dependencies
cd ../frontend
npm install

# 7. Make scripts executable
cd ..
chmod +x run_native.sh stop_native.sh

# 8. Start the application
./run_native.sh
```

#### What This Does

The startup script will:
1. ✅ Start PostgreSQL in Docker (port 5432)
2. ✅ Start Redis in Docker (port 6379)
3. ✅ Wait for databases to be ready
4. ✅ Load database schema automatically
5. ✅ Start FastAPI backend (port 8000)
6. ✅ Start Celery worker for background tasks
7. ✅ Start React frontend (port 3000)

#### Access the Application

- **Frontend:** http://localhost:3000
- **Backend API Docs:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health

**Default Admin Login:**
- Email: `admin@spacsafrica.com`
- Password: `admin123`

#### Stop the Application

```bash
./stop_native.sh
```

---

## 📚 Alternative Setup Options

### Option 1: Hybrid (Docker DB + Native App) ⭐ **RECOMMENDED**

- **Best for:** Local development, debugging, rapid iteration
- **Databases:** Docker (PostgreSQL + Redis)
- **Application:** Native (Python + Node.js)
- **Pros:** Fast startup, instant code changes, easy debugging, full performance
- **Commands:** `./run_native.sh` and `./stop_native.sh`
- **Guide:** `SETUP_DOCKER_DB.md`

### Option 2: Full Docker

- **Best for:** Production-like testing, CI/CD, deployment
- **Everything:** Runs in Docker containers
- **Pros:** Consistent environments, easy scaling, production parity
- **Commands:**
  ```bash
  docker-compose up -d    # Start all services
  docker-compose down     # Stop all services
  docker-compose logs -f  # View logs
  ```
- **Guide:** `DEPLOYMENT_GUIDE.md`

### Option 3: Fully Native

- **Best for:** No Docker available, limited resources
- **Everything:** Native installation (PostgreSQL, Redis, Python, Node.js)
- **Pros:** No Docker overhead, full control
- **Commands:** `./run_linux.sh` and `./stop_linux.sh`
- **Guide:** `SETUP_LINUX.md`

---

## 📁 Project Structure

```
humphrey/
├── backend/                        # Python FastAPI backend
│   ├── main.py                    # FastAPI app with 30+ endpoints
│   ├── models.py                  # Pydantic models for validation
│   ├── database.py                # PostgreSQL connection & utilities
│   ├── clustering.py              # K-Means user clustering (ML)
│   ├── recommender.py             # Group recommendation engine (ML)
│   ├── explainability.py          # Human-readable explanations
│   ├── event_bus.py               # Redis Pub/Sub event system
│   ├── synthetic_data.py          # Test data generator
│   ├── evaluation.py              # ML metrics (Precision@K, Recall@K)
│   ├── celery_worker.py           # Background tasks & scheduling
│   ├── requirements.txt           # Python dependencies
│   └── Dockerfile                 # Backend container config
├── frontend/                       # React PWA with TypeScript
│   ├── src/
│   │   ├── pages/                 # React pages (Login, Dashboard, Admin)
│   │   ├── components/            # Reusable components
│   │   ├── store/                 # Redux state management
│   │   ├── services/              # API client & offline sync
│   │   └── hooks/                 # Custom React hooks
│   ├── public/
│   │   ├── manifest.json          # PWA manifest (installable)
│   │   └── service-worker.js      # Offline functionality
│   ├── package.json               # Node.js dependencies
│   ├── tsconfig.json              # TypeScript configuration
│   └── Dockerfile                 # Frontend container config
├── shared/
│   └── init.sql                   # PostgreSQL schema (15 tables)
├── logs/                           # Application logs (auto-created)
├── docker-compose.yml             # Full Docker orchestration
├── docker-compose-db-only.yml     # Databases only
├── run_native.sh                  # Start hybrid setup ⭐
├── stop_native.sh                 # Stop hybrid setup
├── run_linux.sh                   # Start fully native
├── stop_linux.sh                  # Stop fully native
├── README.md                      # This file
├── SETUP_DOCKER_DB.md            # Detailed hybrid setup guide
├── SETUP_LINUX.md                # Fully native setup guide
├── DEPLOYMENT_GUIDE.md           # Production deployment
└── SYSTEM_SUMMARY.md             # Architecture deep dive
```

---

## 🎯 How It Works

### For Traders (End Users)

1. **Register** → Create account with business name, location, products of interest
2. **Automatic Clustering** → ML groups you with similar traders based on purchase behavior
3. **View Recommendations** → See personalized group opportunities on your dashboard
4. **Read Explanations** → *"You were grouped with 8 traders who also purchase rice weekly. Joining this group achieves a 20% discount."*
5. **Join Groups** → Click to commit your quantity and join the bulk purchase
6. **Save Money** → Receive products at bulk prices (15-30% savings)

### For Administrators

1. **Monitor System** → View total users, active groups, transactions, revenue
2. **Generate Test Data** → Create synthetic traders and transactions for testing
3. **Evaluate ML Models** → See Precision@K, Recall@K, coverage, diversity metrics
4. **View Clusters** → Understand trader segments (e.g., "High-Frequency Urban Buyers")
5. **Track Impact** → Monitor total cost savings across the platform

### The ML Pipeline

1. **Data Collection** → Track user transactions, purchase patterns, preferences
2. **Feature Engineering** → Calculate purchase frequency, price sensitivity, product affinities
3. **Clustering (K-Means)** → Group traders into 5 behavioral segments
4. **Recommendation Engine** → Use collaborative filtering to suggest groups
5. **Explainability** → Generate human-readable reasons for each recommendation
6. **Automated Retraining** → Celery tasks retrain models nightly as data grows

---

## 🧪 Testing the System

### Step 1: Access Admin Dashboard

1. Start the application: `./run_native.sh`
2. Open http://localhost:3000
3. Login with `admin@spacsafrica.com` / `admin123`
4. Click the **"Admin"** button in the navigation

### Step 2: Generate Synthetic Data

1. Click **"Generate Synthetic Data"** button
2. This creates:
   - 100 realistic traders
   - 500 transactions with purchase patterns
   - 20 bulk-purchase groups
   - Calculated user features for ML

### Step 3: Trigger ML Pipeline

The system will automatically:
- Calculate user features (purchase frequency, price sensitivity, etc.)
- Cluster users into behavioral segments
- Generate group recommendations with explanations

### Step 4: View Recommendations

1. Go back to the main dashboard
2. See personalized group recommendations
3. Notice the clear explanations for each suggestion
4. Try joining a group

### Step 5: Check Metrics

1. Return to Admin dashboard
2. View ML evaluation metrics:
   - Precision@5 (recommendation accuracy)
   - Recall@5 (coverage of relevant items)
   - Total cost savings
   - Group success rate

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Database
DATABASE_URL=postgresql://spacs_user:spacs_secure_password_2025@localhost:5432/spacs_africa

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT Authentication
SECRET_KEY=your-super-secret-key-minimum-32-characters-long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Celery Background Tasks
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2

# Application
ENVIRONMENT=development
```

### Database Connection

**With Docker (recommended):**
- Host: `localhost`
- Port: `5432`
- User: `spacs_user`
- Password: `spacs_secure_password_2025`
- Database: `spacs_africa`

**Schema is loaded automatically** from `shared/init.sql` when container starts.

---

## 📊 Technology Stack

### Backend
- **FastAPI** - Modern Python web framework with automatic API docs
- **PostgreSQL 15** - Relational database with JSONB support
- **Redis 7** - Cache and message broker
- **Celery** - Distributed task queue for background jobs
- **SQLAlchemy** - ORM for database operations
- **Pydantic** - Data validation and settings management

### Machine Learning
- **Scikit-learn** - K-Means clustering, feature engineering
- **Surprise/Scikit-surprise** - Collaborative filtering algorithms
- **SHAP/LIME** - Model explainability (feature importance)
- **Pandas & NumPy** - Data manipulation and analysis

### Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type-safe JavaScript
- **Redux Toolkit** - State management
- **Material-UI (MUI)** - Component library
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **Axios** - HTTP client with interceptors

### Infrastructure
- **Docker & Docker Compose** - Containerization
- **Nginx** - Reverse proxy (production)
- **Workbox** - Service worker for PWA functionality

---

## 📝 Viewing Logs

### Application Logs

```bash
# Backend API logs
tail -f logs/backend.log

# Celery worker logs
tail -f logs/celery.log

# Frontend logs
tail -f logs/frontend.log

# All logs together
tail -f logs/*.log
```

### Docker Database Logs

```bash
# PostgreSQL logs
docker logs -f spacs_postgres

# Redis logs
docker logs -f spacs_redis

# Both together
docker-compose -f docker-compose-db-only.yml logs -f
```

---

## 🐛 Troubleshooting

### Services Won't Start

```bash
# Check if Docker is running
docker info

# Check which ports are in use
sudo lsof -i :5432  # PostgreSQL
sudo lsof -i :6379  # Redis
sudo lsof -i :8000  # Backend API
sudo lsof -i :3000  # Frontend

# Kill processes blocking ports
sudo lsof -ti:8000 | xargs kill -9
sudo lsof -ti:3000 | xargs kill -9
```

### Database Connection Failed

```bash
# Check if PostgreSQL container is running
docker ps | grep spacs_postgres

# Check if PostgreSQL is ready
docker exec spacs_postgres pg_isready -U spacs_user

# Test database connection
psql -h localhost -U spacs_user -d spacs_africa -c "SELECT version();"

# View PostgreSQL logs
docker logs spacs_postgres

# Restart PostgreSQL
docker restart spacs_postgres
```

### Redis Connection Failed

```bash
# Check if Redis container is running
docker ps | grep spacs_redis

# Test Redis connection
docker exec spacs_redis redis-cli ping

# Or with local redis-cli
redis-cli -h localhost ping

# Restart Redis
docker restart spacs_redis
```

### Backend Import Errors

```bash
cd backend
source venv/bin/activate

# Reinstall dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Check for specific package
pip show fastapi sqlalchemy redis
```

### Frontend Build Errors

```bash
cd frontend

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Or try with legacy peer deps
npm install --legacy-peer-deps
```

### Reset Everything

```bash
# Stop all services
./stop_native.sh

# Remove all Docker data (database will be recreated)
docker-compose -f docker-compose-db-only.yml down -v

# Remove logs
rm -rf logs/*.log

# Start fresh
./run_native.sh
```

---

## 🚢 Production Deployment

### Using Docker Compose (Recommended)

```bash
# Build production images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Scale backend
docker-compose up -d --scale backend=3

# Stop services
docker-compose down
```

### Manual Production Setup

1. **Set up reverse proxy** (Nginx)
2. **Get SSL certificate** (Let's Encrypt)
3. **Configure firewall** (UFW)
4. **Set up monitoring** (Prometheus + Grafana)
5. **Configure log aggregation** (ELK stack)
6. **Set up CI/CD** (GitHub Actions)

See `DEPLOYMENT_GUIDE.md` for detailed production deployment instructions.

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **README.md** | Overview and quick start (this file) |
| **SETUP_DOCKER_DB.md** | Detailed guide for hybrid setup (Docker DB + native app) |
| **SETUP_LINUX.md** | Guide for fully native installation |
| **DEPLOYMENT_GUIDE.md** | Production deployment instructions |
| **SYSTEM_SUMMARY.md** | Technical architecture and design decisions |

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `pytest backend/tests/`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

---

## 📄 License

MIT License - See LICENSE file for details.

---

## 🙏 Acknowledgments

**SPACS AFRICA** was built to empower informal traders across Africa by democratizing access to bulk purchasing. Small traders are the backbone of African economies, and this platform gives them the collective buying power they deserve.

**Key Statistics:**
- ~8,400 lines of production code
- 41 files across backend, frontend, and infrastructure
- 15 database tables with optimized indexes
- 30+ API endpoints fully documented
- Complete ML pipeline with explainability
- PWA-ready with offline functionality

**Built with ❤️ for African Traders**

---

## 📞 Quick Reference

```bash
# Start application (recommended)
./run_native.sh

# Stop application
./stop_native.sh

# View logs
tail -f logs/backend.log
tail -f logs/frontend.log

# Access services
open http://localhost:3000        # Frontend
open http://localhost:8000/docs   # API docs

# Docker database management
docker-compose -f docker-compose-db-only.yml ps
docker-compose -f docker-compose-db-only.yml logs -f
docker-compose -f docker-compose-db-only.yml restart

# Reset database
docker-compose -f docker-compose-db-only.yml down -v
./run_native.sh
```

---

**Ready to empower traders? Run `./run_native.sh` and start building!** 🚀