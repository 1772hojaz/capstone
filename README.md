# ConnectSphere


ConnectSphere is an AI-powered group-buying platform designed to democratize bulk purchasing for informal traders in Harare, Zimbabwe. The platform connects traders through intelligent group recommendations, enabling collaborative purchasing and providing real-time analytics for market optimization.

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
  - [Running the Backend](#running-the-backend)
  - [Running the Frontend](#running-the-frontend)
- [Database Setup](#database-setup)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Overview

**Mission**: Enable informal traders (Mbare market vendors) to access bulk purchasing through AI-powered group recommendations.

**Key Features**:

- AI-powered group-buy recommendations using hybrid ML system
- Secure multi-method payment processing (cards, mobile money, QR payments)
- Real-time group collaboration with WebSocket chat
- QR code-based logistics for secure pickup
- Comprehensive admin dashboard and supplier B2B portal
- Mobile-first PWA design with offline capabilities

**Business Model**: Commission-based platform (10% fee on successful group purchases)

## System Architecture

**Frontend**: React 18 with TypeScript, Vite, Tailwind CSS, Zustand state management

**Backend**: FastAPI with Python, SQLAlchemy ORM, WebSocket support

**Database**: SQLite (development), PostgreSQL (production)

**ML Engine**: Hybrid recommender system (Collaborative Filtering + Content-Based Filtering + Popularity Boosting)

**External Services**: Flutterwave payments, Cloudinary media storage

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

- **Python**: Version 3.9 or higher
- **Node.js**: Version 16.x or higher
- **npm**: Version 8.x or higher (comes with Node.js)
- **Git**: For cloning the repository

### Optional but Recommended

- **Virtual Environment**: Python venv or virtualenv
- **PostgreSQL**: For production database (SQLite is used for development)

### System Requirements

- **Operating System**: Linux, macOS, or Windows
- **RAM**: Minimum 4GB (8GB recommended for ML model training)
- **Storage**: At least 2GB free space

## Installation

### Clone the Repository

```bash
git clone https://github.com/1772hojaz/capstone.git
cd capstone
```

### Backend Setup

#### Step 1: Navigate to Backend Directory

```bash
cd sys/backend
```

#### Step 2: Create Python Virtual Environment

**On Linux/macOS:**

```bash
python3 -m venv venv
source venv/bin/activate
```

**On Windows:**

```bash
python -m venv venv
venv\Scripts\activate
```

#### Step 3: Upgrade pip

```bash
pip install --upgrade pip
```

#### Step 4: Install Python Dependencies

```bash
pip install -r requirements.txt
```

This will install all required packages including:

- FastAPI and Uvicorn for the web framework
- SQLAlchemy for database ORM
- PyJWT for authentication
- scikit-learn, torch, transformers for ML components
- websockets for real-time features
- qrcode and cryptography for QR logistics
- cloudinary for media management
- And other dependencies

#### Step 5: Verify Installation

```bash
python -c "import fastapi; import uvicorn; import sqlalchemy; print('All core packages installed successfully')"
```

### Frontend Setup

#### Step 1: Navigate to Frontend Directory

From the root project directory:

```bash
cd sys/Front-end/connectsphere
```

#### Step 2: Install Node Dependencies

```bash
npm install
```

This will install all required packages including:

- React 18 and React DOM
- React Router for navigation
- Axios for HTTP requests
- Zustand for state management
- Tailwind CSS for styling
- TypeScript and build tools
- Testing libraries

#### Step 3: Verify Installation

```bash
npm list react react-dom
```

## Configuration

### Backend Configuration

#### Step 1: Create Environment File

Create a `.env` file in the `sys/backend` directory:

```bash
cd sys/backend
touch .env
```

#### Step 2: Add Environment Variables

Edit the `.env` file with the following configuration:

```env
# ============================================
# DATABASE CONFIGURATION
# ============================================
# Development: SQLite (file-based database)
DATABASE_URL=sqlite:///./connectsphere.db

# Production: PostgreSQL (recommended)
# DATABASE_URL=postgresql://username:password@localhost:5432/connectsphere
# Example with connection pooling:
# DATABASE_URL=postgresql://user:pass@host:5432/dbname?pool_size=20&max_overflow=0

# ============================================
# JWT AUTHENTICATION & SECURITY
# ============================================
# Secret key for JWT token generation (REQUIRED)
# Generate using: openssl rand -hex 32
SECRET_KEY=your-secret-key-here-change-in-production

# JWT algorithm (default: HS256)
ALGORITHM=HS256

# Token expiration time in minutes (default: 1440 = 24 hours)
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# ============================================
# CORS CONFIGURATION
# ============================================
# Comma-separated list of allowed origins
# Include all frontend URLs that will access the API
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173

# ============================================
# CLOUDINARY CONFIGURATION (Media Storage)
# ============================================
# Required for image/file uploads (product images, profile pictures)
# Get credentials from: https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional: Cloudinary folder for organized storage
CLOUDINARY_FOLDER=connectsphere

# ============================================
# FLUTTERWAVE PAYMENT GATEWAY
# ============================================
# Required for payment processing
# Get credentials from: https://dashboard.flutterwave.com/settings/apis
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-your_secret_key_here
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-your_public_key_here
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TEST-your_encryption_key_here

# Flutterwave webhook secret for verifying webhook requests
FLUTTERWAVE_WEBHOOK_SECRET=your_webhook_secret_here

# Payment redirect URLs
PAYMENT_REDIRECT_URL=http://localhost:5173/payment/callback
PAYMENT_CANCEL_URL=http://localhost:5173/payment/cancelled

# ============================================
# REDIS CONFIGURATION (Caching & Sessions)
# ============================================
# Optional but recommended for production
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Redis connection URL (alternative format)
# REDIS_URL=redis://localhost:6379/0

# ============================================
# EMAIL CONFIGURATION (Notifications)
# ============================================
# SMTP settings for sending emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_EMAIL=noreply@connectsphere.com
SMTP_FROM_NAME=ConnectSphere

# ============================================
# SMS CONFIGURATION (Optional)
# ============================================
# SMS gateway for notifications (e.g., Twilio, Africa's Talking)
SMS_API_KEY=your_sms_api_key
SMS_API_SECRET=your_sms_api_secret
SMS_SENDER_ID=ConnectSphere

# ============================================
# LOGGING CONFIGURATION
# ============================================
# Log level: DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_LEVEL=INFO

# Log file location
LOG_FILE=logs/backend.log

# Maximum log file size in MB
LOG_MAX_SIZE=10

# Number of backup log files to keep
LOG_BACKUP_COUNT=5

# ============================================
# SERVER CONFIGURATION
# ============================================
# Server host and port
HOST=0.0.0.0
PORT=8000

# Number of worker processes (production)
WORKERS=4

# ============================================
# ML MODEL CONFIGURATION
# ============================================
# ML model training schedule (cron format)
ML_TRAINING_SCHEDULE=0 2 * * *  # Daily at 2 AM

# Minimum data required for training
ML_MIN_USERS=50
ML_MIN_TRANSACTIONS=100

# Model storage path
ML_MODEL_PATH=ml_models/

# ============================================
# CELERY CONFIGURATION (Background Tasks)
# ============================================
# Celery broker URL (uses Redis)
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2

# ============================================
# ENVIRONMENT
# ============================================
# Environment: development, staging, production
ENVIRONMENT=development

# Enable debug mode (development only)
DEBUG=True

# ============================================
# API RATE LIMITING
# ============================================
# Requests per minute per IP
RATE_LIMIT_PER_MINUTE=60

# Requests per hour per user
RATE_LIMIT_PER_HOUR=1000

# ============================================
# QR CODE CONFIGURATION
# ============================================
# QR code expiration time in hours
QR_CODE_EXPIRY_HOURS=24

# QR code encryption key (generate random string)
QR_ENCRYPTION_KEY=your-qr-encryption-key-here

# ============================================
# ANALYTICS CONFIGURATION
# ============================================
# Enable analytics tracking
ANALYTICS_ENABLED=True

# Analytics data retention days
ANALYTICS_RETENTION_DAYS=90

# ============================================
# WEBSOCKET CONFIGURATION
# ============================================
# WebSocket connection timeout in seconds
WS_TIMEOUT=300

# Maximum WebSocket connections per user
WS_MAX_CONNECTIONS=5
```

**Important Security Notes**:

1. **SECRET_KEY**: Must be changed in production. Generate using:

   ```bash
   openssl rand -hex 32
   ```
2. **Database**: Use PostgreSQL for production instead of SQLite for better performance and concurrent access.
3. **Flutterwave Keys**:

   - Test keys start with `FLWSECK_TEST` and `FLWPUBK_TEST`
   - Production keys start with `FLWSECK` and `FLWPUBK`
   - Never commit real keys to version control
4. **CORS Origins**: Add all domains that will access your API, including production URLs.
5. **Email Credentials**:

   - For Gmail, use App Passwords instead of regular password
   - Enable 2FA and generate app password at: https://myaccount.google.com/apppasswords

**Environment-Specific Configurations**:

**Development**:

```env
ENVIRONMENT=development
DEBUG=True
DATABASE_URL=sqlite:///./connectsphere.db
LOG_LEVEL=DEBUG
```

**Production**:

```env
ENVIRONMENT=production
DEBUG=False
DATABASE_URL=postgresql://user:pass@host:5432/connectsphere
LOG_LEVEL=WARNING
WORKERS=4
```

### Frontend Configuration

#### Step 1: Create Environment File

Create a `.env` file in the `sys/Front-end/connectsphere` directory:

```bash
cd sys/Front-end/connectsphere
touch .env
```

#### Step 2: Add Environment Variables

Edit the `.env` file with the following configuration:

```env
# ============================================
# API CONFIGURATION
# ============================================
# Backend API base URL (REQUIRED)
# Development: Local backend server
VITE_API_BASE_URL=http://localhost:8000

# Production: Deployed backend URL
# VITE_API_BASE_URL=https://api.connectsphere.com

# API timeout in milliseconds
VITE_API_TIMEOUT=30000

# ============================================
# WEBSOCKET CONFIGURATION
# ============================================
# WebSocket URL for real-time features
# Development: Local WebSocket server
VITE_WS_URL=ws://localhost:8000

# Production: Deployed WebSocket URL (use wss:// for secure)
# VITE_WS_URL=wss://api.connectsphere.com

# WebSocket reconnection attempts
VITE_WS_RECONNECT_ATTEMPTS=5

# WebSocket reconnection delay in milliseconds
VITE_WS_RECONNECT_DELAY=3000

# ============================================
# CLOUDINARY CONFIGURATION (Media Upload)
# ============================================
# Required for client-side image uploads
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# Optional: Cloudinary API key for signed uploads
VITE_CLOUDINARY_API_KEY=your_api_key

# Maximum file size in MB
VITE_MAX_FILE_SIZE=5

# Allowed file types (comma-separated)
VITE_ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# ============================================
# FLUTTERWAVE CONFIGURATION (Client-side)
# ============================================
# Flutterwave public key for payment widget
VITE_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-your_public_key_here

# Payment callback URLs
VITE_PAYMENT_CALLBACK_URL=http://localhost:5173/payment/callback
VITE_PAYMENT_CANCEL_URL=http://localhost:5173/payment/cancelled

# ============================================
# APPLICATION CONFIGURATION
# ============================================
# Environment: development, staging, production
VITE_ENV=development

# Application name
VITE_APP_NAME=ConnectSphere

# Application version
VITE_APP_VERSION=1.0.0

# Enable debug mode (shows additional logs)
VITE_DEBUG=true

# ============================================
# FEATURE FLAGS
# ============================================
# Enable/disable specific features
VITE_ENABLE_CHAT=true
VITE_ENABLE_QR_SCANNER=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PWA=true

# ============================================
# ANALYTICS CONFIGURATION
# ============================================
# Google Analytics tracking ID (optional)
VITE_GA_TRACKING_ID=G-XXXXXXXXXX

# Enable analytics in development
VITE_ANALYTICS_IN_DEV=false

# ============================================
# LOCALIZATION
# ============================================
# Default language
VITE_DEFAULT_LANGUAGE=en

# Available languages (comma-separated)
VITE_AVAILABLE_LANGUAGES=en,sn,nd

# Enable RTL support
VITE_ENABLE_RTL=false

# ============================================
# UI CONFIGURATION
# ============================================
# Items per page for pagination
VITE_ITEMS_PER_PAGE=12

# Toast notification duration in milliseconds
VITE_TOAST_DURATION=3000

# Theme: light, dark, auto
VITE_DEFAULT_THEME=light

# ============================================
# MAP CONFIGURATION (Optional)
# ============================================
# Google Maps API key for location features
VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key

# Default map center (latitude, longitude)
VITE_DEFAULT_MAP_CENTER=-17.8252,31.0335  # Harare, Zimbabwe

# Default map zoom level
VITE_DEFAULT_MAP_ZOOM=12

# ============================================
# SECURITY CONFIGURATION
# ============================================
# Enable CSRF protection
VITE_ENABLE_CSRF=true

# Token storage: localStorage or sessionStorage
VITE_TOKEN_STORAGE=localStorage

# Auto logout after inactivity (minutes)
VITE_AUTO_LOGOUT_MINUTES=30

# ============================================
# PERFORMANCE CONFIGURATION
# ============================================
# Enable service worker for PWA
VITE_ENABLE_SERVICE_WORKER=true

# Enable lazy loading for images
VITE_ENABLE_LAZY_LOADING=true

# Image quality (0-100)
VITE_IMAGE_QUALITY=80

# Enable code splitting
VITE_ENABLE_CODE_SPLITTING=true

# ============================================
# DEVELOPMENT TOOLS
# ============================================
# Enable React DevTools
VITE_ENABLE_REACT_DEVTOOLS=true

# Enable Redux DevTools (if using Redux)
VITE_ENABLE_REDUX_DEVTOOLS=true

# Show API request logs in console
VITE_LOG_API_REQUESTS=true

# ============================================
# ERROR TRACKING (Optional)
# ============================================
# Sentry DSN for error tracking
VITE_SENTRY_DSN=

# Sentry environment
VITE_SENTRY_ENVIRONMENT=development
```

**Important Notes**:

1. **VITE_ Prefix**: All environment variables must start with `VITE_` to be exposed to the browser. Variables without this prefix will not be accessible in your React code.
2. **API URLs**:

   - Ensure backend URL matches where your backend server runs
   - Use `http://` for local development
   - Use `https://` for production
   - No trailing slash in URLs
3. **WebSocket URLs**:

   - Use `ws://` for local development (insecure)
   - Use `wss://` for production (secure WebSocket)
   - Must match backend WebSocket endpoint
4. **Cloudinary Setup**:

   - Create upload preset at: https://cloudinary.com/console/settings/upload
   - Set upload preset to "unsigned" for client-side uploads
   - Configure allowed formats and transformations
5. **Security**:

   - Never commit sensitive keys to version control
   - Use different keys for development and production
   - Public keys (like Flutterwave public key) are safe to expose

**Environment-Specific Configurations**:

**Development (.env.development)**:

```env
VITE_ENV=development
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_DEBUG=true
VITE_LOG_API_REQUESTS=true
```

**Production (.env.production)**:

```env
VITE_ENV=production
VITE_API_BASE_URL=https://api.connectsphere.com
VITE_WS_URL=wss://api.connectsphere.com
VITE_DEBUG=false
VITE_LOG_API_REQUESTS=false
```

**Testing (.env.test)**:

```env
VITE_ENV=test
VITE_API_BASE_URL=http://localhost:8000
VITE_ENABLE_ANALYTICS=false
```

**Accessing Environment Variables in Code**:

```typescript
// In your React components or services
const apiUrl = import.meta.env.VITE_API_BASE_URL;
const wsUrl = import.meta.env.VITE_WS_URL;
const isDebug = import.meta.env.VITE_DEBUG === 'true';
```

## Database Setup

### Initial Database Setup

#### Step 1: Navigate to Backend Directory

```bash
cd sys/backend
```

#### Step 2: Initialize Database Tables

Run the database initialization script:

```bash
python -c "from db.database import Base, engine; Base.metadata.create_all(bind=engine); print('Database tables created successfully')"
```

Alternatively, if there's an init script:

```bash
python db/init_db.py
```

#### Step 3: Seed Initial Data (Optional)

If you want to populate the database with sample data:

```bash
python db/seed_mbare_data.py
```

This will create:

- Sample products
- Test user accounts
- Example groups
- Demo suppliers

### Database Migrations

If you need to modify the database schema:

```bash
python migrate_db.py
```

## Running the Application

### Running the Backend

#### Step 1: Activate Virtual Environment

**On Linux/macOS:**

```bash
cd sys/backend
source venv/bin/activate
```

**On Windows:**

```bash
cd sys\backend
venv\Scripts\activate
```

#### Step 2: Start the Backend Server

**Development Mode (with auto-reload):**

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Production Mode:**

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Alternative Method:**

```bash
python main.py
```

#### Step 3: Verify Backend is Running

Open your browser and navigate to:

- **API Documentation (Swagger UI)**: http://localhost:8000/docs
- **Alternative API Documentation (ReDoc)**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

You should see the API documentation interface and be able to test endpoints.

#### Backend Server Logs

The backend logs will be stored in `sys/backend/logs/backend.log`

To monitor logs in real-time:

```bash
tail -f logs/backend.log
```

### Running the Frontend

#### Step 1: Navigate to Frontend Directory

```bash
cd sys/Front-end/connectsphere
```

#### Step 2: Start the Development Server

```bash
npm run dev
```

The development server will start on http://localhost:5173 by default.

#### Step 3: Verify Frontend is Running

Open your browser and navigate to:

- **Application**: http://localhost:5173

You should see the ConnectSphere landing page.

#### Frontend Build Commands

**Development Server:**

```bash
npm run dev
```

**Production Build:**

```bash
npm run build
```

**Preview Production Build:**

```bash
npm run preview
```

**Linting:**

```bash
npm run lint
```

**Fix Linting Issues:**

```bash
npm run lint:fix
```

### Running Both Backend and Frontend

To run the complete application, you need two terminal windows:

**Terminal 1 - Backend:**

```bash
cd sys/backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**

```bash
cd sys/Front-end/connectsphere
npm run dev
```

Now you can access:

- **Frontend Application**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Testing

### Backend Testing

#### Step 1: Navigate to Backend Directory

```bash
cd sys/backend
source venv/bin/activate
```

#### Step 2: Run Tests

**Run all tests:**

```bash
python -m pytest
```

**Run specific test files:**

```bash
python -m pytest test/test_recommendations.py
python -m pytest test/test_payment.py
python -m pytest test/test_qr.py
```

**Run with coverage:**

```bash
python -m pytest --cov=. --cov-report=html
```

### Frontend Testing

#### Step 1: Navigate to Frontend Directory

```bash
cd sys/Front-end/connectsphere
```

#### Step 2: Run Tests

**Run all tests:**

```bash
npm run test
```

**Run tests in UI mode:**

```bash
npm run test:ui
```

**Run tests once (CI mode):**

```bash
npm run test:run
```

**Run with coverage:**

```bash
npm run test:coverage
```

## Deployment

### Backend Deployment

#### Using Docker

**Step 1: Build Docker Image**

```bash
cd sys/backend
docker build -t connectsphere-backend .
```

**Step 2: Run Container**

```bash
docker run -d -p 8000:8000 --env-file .env connectsphere-backend
```

#### Using Docker Compose

```bash
docker-compose up -d
```

### Frontend Deployment

#### Build for Production

```bash
cd sys/Front-end/connectsphere
npm run build
```

The production-ready files will be in the `dist` directory.

#### Deploy to Static Hosting

The `dist` folder can be deployed to:

- Vercel
- Netlify
- AWS S3 + CloudFront
- Nginx server

#### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/connectsphere/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Troubleshooting

### Common Backend Issues

#### Issue: ModuleNotFoundError

**Solution**: Ensure virtual environment is activated and dependencies are installed:

```bash
source venv/bin/activate
pip install -r requirements.txt
```

#### Issue: Database locked error (SQLite)

**Solution**: This happens with concurrent access. For production, use PostgreSQL:

```env
DATABASE_URL=postgresql://user:password@localhost/connectsphere
```

#### Issue: Port 8000 already in use

**Solution**: Use a different port:

```bash
uvicorn main:app --reload --port 8001
```

Or kill the process using port 8000:

```bash
lsof -ti:8000 | xargs kill -9
```

#### Issue: CORS errors

**Solution**: Ensure frontend URL is in CORS_ORIGINS in `.env`:

```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Common Frontend Issues

#### Issue: Module not found errors

**Solution**: Delete node_modules and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

#### Issue: Cannot connect to backend

**Solution**: Verify backend is running and check VITE_API_BASE_URL in `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

#### Issue: Build fails with TypeScript errors

**Solution**: Check TypeScript configuration and fix type errors:

```bash
npm run lint
```

#### Issue: Port 5173 already in use

**Solution**: Vite will automatically try the next available port, or specify a different port:

```bash
npm run dev -- --port 3000
```

### ML Model Issues

#### Issue: ML model training fails

**Solution**: Ensure sufficient data exists in the database:

```bash
python db/seed_mbare_data.py
```

#### Issue: Out of memory during model training

**Solution**: Reduce batch size or use a machine with more RAM. Adjust ML parameters in the code.

### Database Migration Issues

#### Issue: Migration fails

**Solution**: Backup database and recreate:

```bash
cp connectsphere.db connectsphere.db.backup
python -c "from db.database import Base, engine; Base.metadata.drop_all(bind=engine); Base.metadata.create_all(bind=engine)"
```

### Getting Help

If you encounter issues not covered here:

1. Check the logs in `sys/backend/logs/backend.log`
2. Review the API documentation at http://localhost:8000/docs
3. Check browser console for frontend errors
4. Ensure all environment variables are properly configured
5. Verify all dependencies are installed correctly

## Project Structure

```
capstone/
├── sys/
│   ├── backend/
│   │   ├── authentication/      # JWT authentication
│   │   ├── db/                  # Database models and migrations
│   │   ├── ml/                  # ML recommendation engine
│   │   ├── models/              # Business logic models
│   │   ├── payment/             # Payment processing
│   │   ├── websocket/           # Real-time features
│   │   ├── logs/                # Application logs
│   │   ├── main.py              # Application entry point
│   │   └── requirements.txt     # Python dependencies
│   └── Front-end/
│       └── connectsphere/
│           ├── src/
│           │   ├── components/  # React components
│           │   ├── pages/       # Page components
│           │   ├── services/    # API services
│           │   └── stores/      # State management
│           ├── public/          # Static assets
│           └── package.json     # Node dependencies
├── docs/                        # Documentation
├── notebooks/                   # Jupyter notebooks
└── README.md                    # This file
```

## Screenshots

### User Interface

#### Landing Page

![Landing Page](docs/assets/landingpage.png)
*ConnectSphere landing page showcasing the platform's value proposition for informal traders and group-buying features.*

#### User Login

![Login Page](docs/assets/loginpage.png)
*Secure authentication interface for traders to access their personalized dashboards.*

### Trader Features

#### Group Recommendations

![Trader Recommendations](docs/assets/tradergrouprecomendations.png)
*Personalized group-buy recommendations generated by the hybrid ML engine tailored to trader preferences.*

#### Browse All Groups

![Browse Groups](docs/assets/traderbrowsegroup.png)
*Browse and filter available group-buy opportunities with real-time progress tracking.*

#### Joined Groups

![Joined Groups](docs/assets/traderjoinedgroups.png)
*Trader's active group participations showing progress, deadlines, and group details.*

#### Group Explainability

![Group Explainability](docs/assets/traderviewgroupexplainability.png)
*Detailed explanation of why groups are recommended using LIME-powered explainability features.*

### Supplier Dashboard

#### Supplier Overview

![Supplier Dashboard](docs/assets/supplierDashboard.png)
*Comprehensive supplier dashboard for managing inventory, groups, and order fulfillment.*

#### Group Creation & View

![Supplier Groups](docs/assets/supplierGroupviewandcreationpage.png)
*Supplier interface for creating and managing group-buy opportunities with MOQ settings.*

#### Orders Management

![Supplier Orders](docs/assets/supplieroderspage.png)
*Supplier order management showing pending, active, and completed group orders.*

#### Payment Processing

![Supplier Payment](docs/assets/supplierpayment.png)
*Flutterwave payment integration for suppliers supporting multiple payment methods.*

### Admin Dashboard

#### All Created Groups View

![Admin Groups View](docs/assets/adminallcreatedgroupsview.png)
*Admin moderation interface displaying all active groups with status filters and management options.*

#### ML Monitoring

![Admin ML Monitoring](docs/assets/adminMLmonitoring.png)
*Machine learning model performance monitoring, A/B testing results, and recommendation metrics.*

#### QR Code Scanner

![Admin QR Scanner](docs/assets/adminscanqrcode.png)
*Admin QR code scanning interface for verifying and managing product pickups.*

### Additional Screenshots

For more detailed screenshots of specific features, see the [docs/assets](docs/assets/) directory.

## Demo Videos

Watch the platform in action:

- **Initial Demo**: [Vimeo](https://vimeo.com/1125306747?share=copy)
- **Final Product Demo**: [Vimeo](https://vimeo.com/1132954187?share=copy&fl=sv&fe=ci)

## Live Deployment

Access the deployed front-end part of  application: [ConnectSphere on Render](https://connectsphere-p5t9.onrender.com/)
