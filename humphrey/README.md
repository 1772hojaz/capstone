# SPACS AFRICA - Collaborative Bulk-Purchasing Platform for Informal Traders

## 🌍 Overview

SPACS AFRICA is an intelligent, event-driven Progressive Web Application (PWA) that empowers informal sector traders to form dynamic groups for bulk purchases. By leveraging machine learning for recommendations and providing transparent explanations, the platform enables small traders to access the same bulk-buying advantages as large retailers.

### Core Value Proposition
- **Empower Small Traders**: Give individual vendors the buying power of large businesses
- **Increase Profits**: Help traders save 15-30% on inventory through bulk purchasing
- **Build Trust**: Provide clear, non-technical explanations for every recommendation
- **Work Anywhere**: Function seamlessly offline on low-end smartphones

## 🏗️ Architecture

### Tech Stack

**Frontend (PWA)**
- React.js 18+ with TypeScript
- Redux Toolkit for state management
- Tailwind CSS + Material-UI for styling
- Service Worker for offline functionality
- Web Push Notifications

**Backend (API)**
- Python 3.11+ with FastAPI
- Pydantic for data validation
- PostgreSQL for primary database
- Redis for caching and session management
- Celery for background tasks

**Machine Learning**
- Scikit-learn (K-Means clustering)
- Surprise/LightFM (collaborative filtering)
- SHAP/LIME (explainability)
- Feature store in PostgreSQL

**Infrastructure**
- Docker & Docker Compose
- Redis Pub/Sub for event-driven communication

## 📋 Prerequisites

- Docker Desktop (v20.10+)
- Docker Compose (v2.0+)
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)
- 4GB RAM minimum
- Modern web browser (Chrome, Firefox, Edge, Safari)

## 🚀 Quick Start

### 1. Clone and Navigate
```bash
git clone <repository-url>
cd humphrey
```

### 2. Start Backend Services
```bash
# Start PostgreSQL, Redis, and FastAPI backend
docker-compose up -d
```

This will:
- Start PostgreSQL on port 5432
- Start Redis on port 6379
- Start FastAPI backend on http://localhost:8000
- Initialize database schema automatically
- Start Celery worker for background tasks

### 3. Verify Backend
```bash
# Check API health
curl http://localhost:8000/health

# View API documentation
# Open: http://localhost:8000/docs
```

### 4. Start Frontend (Development)
```bash
cd frontend
npm install
npm start
```

Frontend will be available at http://localhost:3000

### 5. Generate Synthetic Data
```bash
# Option 1: Via API
curl -X POST http://localhost:8000/api/admin/generate-synthetic-data

# Option 2: Via Admin Dashboard
# Navigate to http://localhost:3000/admin
# Click "Generate Synthetic Data" button
```

## 📁 Project Structure

```
humphrey/
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── models.py               # Pydantic models
│   ├── database.py             # Database connection & config
│   ├── clustering.py           # K-Means clustering module
│   ├── recommender.py          # Group recommendation engine
│   ├── explainability.py       # Explanation generation
│   ├── event_bus.py            # Event-driven communication
│   ├── synthetic_data.py       # Synthetic data generation
│   ├── evaluation.py           # ML metrics calculation
│   ├── celery_worker.py        # Background task worker
│   ├── requirements.txt        # Python dependencies
│   └── Dockerfile              # Backend container
├── frontend/
│   ├── public/
│   │   ├── manifest.json       # PWA manifest
│   │   └── service-worker.js   # Service worker
│   ├── src/
│   │   ├── App.tsx             # Main app with routing
│   │   ├── store/              # Redux store
│   │   ├── components/
│   │   │   ├── trader/
│   │   │   │   ├── TraderDashboard.tsx
│   │   │   │   ├── GroupRecommendationCard.tsx
│   │   │   │   ├── ProductBrowser.tsx
│   │   │   │   └── ProfileSetup.tsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.tsx
│   │   │       ├── AdminClusterReport.tsx
│   │   │       └── SystemMetrics.tsx
│   │   ├── services/
│   │   │   ├── api.ts          # API client
│   │   │   └── offline.ts      # Offline sync logic
│   │   └── types/              # TypeScript types
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── shared/
│   └── init.sql                # PostgreSQL schema
├── docker-compose.yml          # Multi-container orchestration
└── README.md                   # This file
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Database
POSTGRES_USER=spacs_user
POSTGRES_PASSWORD=spacs_secure_password_2025
POSTGRES_DB=spacs_africa
DATABASE_URL=postgresql://spacs_user:spacs_secure_password_2025@postgres:5432/spacs_africa

# Redis
REDIS_URL=redis://redis:6379/0

# JWT
SECRET_KEY=your-super-secret-jwt-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Celery
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

# Frontend
REACT_APP_API_URL=http://localhost:8000
```

## 📊 Key Features

### For Traders

1. **Personalized Dashboard**
   - Product recommendations based on purchase history
   - Group buying opportunities with clear savings
   - Potential savings tracker

2. **Intelligent Group Recommendations**
   - ML-powered matching with similar traders
   - Transparent explanations for each recommendation
   - Real-time discount calculations

3. **Offline-First Design**
   - Cached dashboard and recommendations
   - Queue actions for sync when online
   - Progressive data loading

4. **Web Push Notifications**
   - Group formation alerts
   - Discount milestone notifications
   - New recommendation alerts

### For Administrators

1. **System Health Dashboard**
   - Total traders, active groups, transactions
   - Cost savings analytics
   - System performance metrics

2. **Cluster Management**
   - Visual representation of trader clusters
   - Cluster characteristics and insights
   - Cluster evolution over time

3. **Data Management**
   - Synthetic data generation for testing
   - Seamless transition to real data
   - Data quality monitoring

4. **Evaluation Metrics**
   - Precision@K, Recall@K
   - Group participation rates
   - Simulated cost savings
   - Interactive charts and reports

## 🤖 Machine Learning Pipeline

### 1. Clustering Module (`clustering.py`)
- **Algorithm**: K-Means (configurable k=5-10)
- **Features**: purchase_frequency, product_preferences, avg_transaction_value, location
- **Output**: cluster_id for each trader
- **Retraining**: Nightly via Celery beat task

### 2. Recommender Engine (`recommender.py`)
- **Approach**: Hybrid collaborative filtering
- **Logic**:
  1. Find traders in same cluster
  2. Identify common product demand
  3. Form or suggest bulk-purchase groups
  4. Rank by compatibility score
- **Personalization**: Adapts to individual purchase patterns

### 3. Explainability Module (`explainability.py`)
- **Method**: Rule-based templates + SHAP values
- **Output**: Human-readable explanations
- **Examples**:
  - "You were grouped with 8 traders who also purchase rice weekly"
  - "Traders in your area save an average of 22% on bulk rice purchases"

### 4. Evaluation (`evaluation.py`)
- **Technical Metrics**: Precision@5, Recall@5, NDCG
- **Business Metrics**: Cost savings, group success rate, participation rate
- **Reporting**: JSON output for admin dashboard

## 🔄 Event-Driven Architecture

The system uses Redis Pub/Sub for real-time event processing:

**Events**:
- `new_transaction` → Update user features, trigger re-clustering check
- `user_joined_group` → Update group status, check discount threshold
- `group_formed` → Send notifications, update recommendations
- `new_user` → Assign initial cluster, generate first recommendations

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Integration Tests
```bash
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 📱 PWA Installation

### On Mobile (Android/iOS)
1. Open http://localhost:3000 in Chrome/Safari
2. Tap the menu (⋮) → "Add to Home Screen"
3. The app will install and work offline

### On Desktop
1. Open http://localhost:3000 in Chrome/Edge
2. Click the install icon (⊕) in the address bar
3. Click "Install"

## 🚢 Production Deployment

### Build Production Images
```bash
# Build backend
docker build -t spacs-backend:latest ./backend

# Build frontend
docker build -t spacs-frontend:latest ./frontend
```

### Deploy to Cloud
```bash
# Example: Deploy to AWS ECS, GCP Cloud Run, or Azure Container Instances
# Update docker-compose.prod.yml with production settings
docker-compose -f docker-compose.prod.yml up -d
```

### Production Checklist
- [ ] Change all default passwords and secrets
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS for production domain
- [ ] Set up database backups
- [ ] Configure log aggregation (e.g., ELK, CloudWatch)
- [ ] Set up monitoring (e.g., Prometheus, Grafana)
- [ ] Enable rate limiting
- [ ] Configure CDN for static assets
- [ ] Set up CI/CD pipeline

## 🔐 Security Considerations

- JWT-based authentication with HTTP-only cookies
- Password hashing with bcrypt
- SQL injection protection via SQLAlchemy ORM
- CORS configured for specific origins
- Rate limiting on API endpoints
- Input validation with Pydantic
- Secrets managed via environment variables

## 📈 Scalability

**Current Capacity**: ~1,000 concurrent users, ~10,000 transactions/day

**Horizontal Scaling**:
- Backend: Add FastAPI instances behind a load balancer
- Database: PostgreSQL read replicas
- Cache: Redis cluster
- Celery: Add worker instances

**Vertical Scaling**:
- Increase container resources in docker-compose.yml
- Optimize database indexes
- Implement database partitioning

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d
```

### Frontend Build Issues
```bash
# Clear cache and rebuild
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

### Celery Worker Not Processing Tasks
```bash
# Check Celery logs
docker-compose logs celery

# Restart Celery
docker-compose restart celery
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Support

For support, email support@spacsafrica.com or open an issue on GitHub.

## 🙏 Acknowledgments

- Inspired by the resilience and entrepreneurship of informal traders across Africa
- Built with modern, production-ready technologies
- Designed for real-world impact in resource-constrained environments

---

**Built with ❤️ for African Traders**
