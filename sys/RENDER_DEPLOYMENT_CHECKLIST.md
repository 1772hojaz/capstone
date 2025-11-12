# Render Deployment Readiness Checklist

**Project:** Group-Buy System  
**Status:** ✅ **READY FOR RENDER DEPLOYMENT**  
**Last Updated:** 2025-11-11

---

## 1. Deployment Configuration Files ✅

| File | Status | Notes |
|------|--------|-------|
| `render.yaml` | ✅ Present | Defines backend web service, frontend static site, and PostgreSQL database |
| `Procfile` | ✅ Present | Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT` |
| `requirements.txt` (root) | ✅ Present | Delegates to `backend/requirements-prod.txt` |
| `backend/requirements-prod.txt` | ✅ Present | Lean production dependencies (no heavy ML packages) |

---

## 2. Backend Configuration ✅

### Database
- **Status:** ✅ Environment variable ready
- **Details:**
  - `backend/db/database.py` reads `DATABASE_URL` from environment
  - Falls back to SQLite if `DATABASE_URL` not set (safe for local dev)
  - Render will auto-wire `DATABASE_URL` when attached database created
  - Uses SQLAlchemy (psycopg2-binary in requirements for Postgres)

### Environment Variables
- **Status:** ⚠️ **ACTION REQUIRED in Render Dashboard**
- **Must be set in Render backend service:**
  - `SECRET_KEY` — JWT signing key (required for auth)
  - `FLUTTERWAVE_SECRET_KEY` — Flutterwave payment API key
  - `FLUTTERWAVE_PUBLIC_KEY` — Flutterwave public key
  - `FLUTTERWAVE_ENCRYPTION_KEY` — Flutterwave encryption
  - `CLOUDINARY_CLOUD_NAME` — Image storage (currently hardcoded in .env; Render will override)
  - `CLOUDINARY_API_KEY` — Image storage key
  - `CLOUDINARY_API_SECRET` — Image storage secret
- **Auto-wired by Render:**
  - `DATABASE_URL` — Postgres connection string (from attached groupbuy-db)

### API & Port
- **Status:** ✅ Ready
- **Details:**
  - FastAPI app listens on `0.0.0.0:$PORT` (respects Render's PORT env var)
  - Swagger UI available at `/docs`
  - CORS configured for frontend origin

### Database Initialization
- **Status:** ✅ Automatic
- **Details:**
  - `backend/main.py` calls `Base.metadata.create_all(bind=engine)` on startup
  - Tables are auto-created on first run if using SQLite or Postgres

---

## 3. Frontend Configuration ✅

### Build
- **Status:** ✅ Ready
- **Details:**
  - Build command: `cd Front-end/connectsphere && npm ci && npm run build`
  - `package.json` scripts defined: `tsc && vite build`
  - Output directory: `Front-end/connectsphere/dist`
  - TypeScript compilation enabled

### Environment Variables
- **Status:** ℹ️ Frontend doesn't need runtime secrets
- **Details:**
  - Frontend is a static site (no backend secrets exposed)
  - API endpoint is configurable via `VITE_API_BASE_URL` (defaults to `http://localhost:8000` in dev)
  - Render's static site doesn't require special env vars (built output is pre-compiled)

### API Integration
- **Status:** ✅ Via apiService
- **Details:**
  - Frontend calls backend at `VITE_API_BASE_URL` (set to Render backend URL after deployment)
  - Ensure frontend's `.env` or build config has correct API endpoint for Render backend

---

## 4. Dependencies ✅

### Backend
- **Production packages:** FastAPI, Uvicorn, SQLAlchemy, psycopg2, dotenv, Cloudinary, Requests, passlib/bcrypt
- **ML packages:** Excluded from `requirements-prod.txt` to reduce build time
- **Status:** ✅ Lean and production-ready

### Frontend
- **Dependencies:** React 18, TypeScript, Tailwind, React Router, Lucide, Recharts, axios
- **DevDependencies:** Vite, ESLint, TypeScript, PostCSS, Tailwind
- **Status:** ✅ Standard Node.js project

---

## 5. Database ✅

- **Type:** PostgreSQL 15 (via Render managed service)
- **Plan:** Starter (sufficient for initial deployment)
- **Connection:** Render auto-wires `DATABASE_URL`
- **Migrations:** Uses SQLAlchemy ORM; auto-creates tables on startup

---

## 6. Deployment Steps

### Step 1: Connect Repository to Render
1. Go to [render.com/dashboard](https://render.com/dashboard)
2. Click **New** → **Blueprint** (or **Infrastructure**)
3. Select **Connect a repo** and choose `1772hojaz/capstone`
4. Confirm you have a `render.yaml` file in the root (Render will auto-detect)
5. Click **Create** to deploy services from the Blueprint

### Step 2: Set Backend Secrets
1. Once services are created, go to the **groupbuy-backend** service
2. Open the **Environment** tab
3. Add the following secret variables:
   - `SECRET_KEY` — Generate a strong random string (e.g., `openssl rand -hex 32`)
   - `FLUTTERWAVE_SECRET_KEY` — Your Flutterwave secret key from dashboard
   - `FLUTTERWAVE_PUBLIC_KEY` — Your Flutterwave public key
   - `FLUTTERWAVE_ENCRYPTION_KEY` — Your Flutterwave encryption key
   - `CLOUDINARY_CLOUD_NAME` — Your Cloudinary cloud name
   - `CLOUDINARY_API_KEY` — Your Cloudinary API key
   - `CLOUDINARY_API_SECRET` — Your Cloudinary API secret
4. Leave `DATABASE_URL` as-is (Render wires it automatically)

### Step 3: Verify Deployment
1. Wait for **groupbuy-backend** and **groupbuy-frontend** services to show "Live"
2. Test backend health:
   - Visit `https://<backend-url>/docs` (should show Swagger UI)
   - You should see the OpenAPI documentation
3. Test frontend:
   - Visit `https://<frontend-url>` (should show the React app)
4. Check frontend-to-backend connectivity:
   - Open browser DevTools → Network tab
   - Try logging in or fetching data
   - API calls should reach the backend URL

### Step 4: Update Frontend API Endpoint (if needed)
1. If the frontend doesn't automatically detect the backend URL, you may need to:
   - Set a build environment variable `VITE_API_BASE_URL=https://<backend-url>` in the frontend service's Environment tab
   - Or update `Front-end/connectsphere/.env.production` with the backend URL
   - Redeploy the frontend service

---

## 7. Known Issues & Notes

### ⚠️ Local SQLite Database in Git
- **Issue:** `backend/groupbuy.db` is in version control (should be `.gitignore`d)
- **Impact:** Render will use a fresh Postgres DB, so no impact on production
- **Recommendation:** Update `.gitignore` to exclude `*.db` files before next commit

### ⚠️ Cloudinary Credentials in .env
- **Issue:** `backend/.env` contains Cloudinary API credentials (hardcoded)
- **Impact:** Render will override with environment variables set in dashboard
- **Recommendation:** Remove hardcoded secrets from `.env` before committing to production branches

### ⚠️ ML Models (TensorFlow, PyTorch)
- **Issue:** These are in the main `backend/requirements.txt` but excluded from `requirements-prod.txt`
- **Impact:** ML features (hybrid recommendations) won't work on Render starter plan (memory limited)
- **Recommendation:** 
  - For initial deployment, use `requirements-prod.txt` (no ML)
  - To enable ML later, upgrade to a larger Render plan or deploy ML separately

### ℹ️ Email/Notifications
- **Current:** Not configured in backend
- **Recommendation:** If adding email features, configure an SMTP service (e.g., SendGrid) and add credentials to Render env vars

### ℹ️ Redis/Celery
- **Current:** Not needed for basic deployment
- **Recommendation:** If adding async tasks or caching, create a Redis instance on Render and add `REDIS_URL`

---

## 8. Post-Deployment Verification Checklist

- [ ] Backend `/docs` page loads (Swagger UI)
- [ ] Frontend home page loads and renders correctly
- [ ] User can log in / register (auth flow)
- [ ] Cloudinary image uploads work
- [ ] Flutterwave payment initialization works (test mode)
- [ ] Database records are persisted (check with admin panel or API)
- [ ] Frontend API calls receive correct responses (no CORS errors)
- [ ] No 500 errors in backend logs

---

## 9. Scaling & Production Recommendations

1. **Database:** Upgrade from Starter to Standard/Pro if you exceed 1 GB storage or need backups
2. **Backend:** Upgrade plan if CPU/RAM becomes constrained
3. **Frontend:** Static site plan is sufficient; use CDN for faster global delivery
4. **SSL/TLS:** Render auto-provisions SSL certificates (free)
5. **Logging:** Monitor Render's real-time logs tab during first week
6. **Backups:** Enable daily backups for the PostgreSQL database
7. **Monitoring:** Set up Render alerts for deploy failures and service crashes

---

## 10. Summary

**✅ Status:** Project is **READY FOR RENDER DEPLOYMENT**

**Next Action:**
1. Connect the repository to Render via Blueprint
2. Set environment variables in the Render dashboard (secrets)
3. Trigger deployment and verify services go live
4. Test auth, API calls, and frontend-backend connectivity

**Estimated Deploy Time:** ~5-10 minutes (building dependencies, creating DB, deploying)

**Support Links:**
- [Render Docs: Web Services](https://render.com/docs/web-services)
- [Render Docs: Static Sites](https://render.com/docs/static-sites)
- [Render Docs: Postgres](https://render.com/docs/databases)
- [Blueprint Spec](https://render.com/docs/infrastructure-as-code)

---

**Last Verified:** 2025-11-11 | **Project:** capstone | **Maintainer:** 1772hojaz
