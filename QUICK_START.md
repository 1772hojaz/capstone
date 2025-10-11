# Quick Start Guide

## 🚀 Start the Application

### Option 1: Quick Start Script (Recommended)

```bash
cd ~/capstone
./start-app.sh
```

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd ~/capstone/sys/backend
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd ~/capstone/sys/Front-end
npm run dev
```

## 🌐 Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## ✅ Verify Integration

1. Open http://localhost:3000
2. You should see:
   - ✅ Backend status: "healthy"
   - ✅ Products list (if database is seeded)
   - ✅ Available API endpoints

## 📦 First Time Setup

If database is empty:

```bash
cd ~/capstone/sys/backend

# Initialize database
python init_db.py

# Seed with test data
python seed_mbare_data.py
```

## 🔧 Troubleshooting

**Backend won't start:**
```bash
cd sys/backend
pip install -r requirements.txt
python init_db.py
```

**Frontend won't start:**
```bash
cd sys/Front-end
npm install
```

**Port already in use:**
```bash
# Kill process on port 8000 (backend)
lsof -i :8000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

## 📚 Documentation

- **Integration Guide**: `FRONTEND_BACKEND_INTEGRATION.md`
- **Integration Summary**: `INTEGRATION_SUMMARY.md`
- **Frontend README**: `sys/Front-end/README.md`

## 🎯 Next Steps

1. Add React Router for navigation
2. Build Login/Register pages
3. Create Trader Dashboard
4. Create Admin Dashboard
5. Add UI library (Tailwind, MUI, etc.)

---

**Ready to develop!** 🎉
