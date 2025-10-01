# 🚀 Run SPACS AFRICA Locally

## Step-by-Step Instructions

### 1️⃣ Start Docker Desktop
- Press **Windows Key**
- Type "Docker Desktop"
- Open it and wait for it to fully start (whale icon in system tray)

### 2️⃣ Start Backend (Terminal 1)
```powershell
cd "C:\Users\Audry Ashleen\humphrey"
docker-compose up -d
```

Wait 30 seconds for services to start.

### 3️⃣ Start Frontend (Terminal 2)
```powershell
cd "C:\Users\Audry Ashleen\humphrey\frontend"
npm install
npm start
```

### 4️⃣ Open Your Browser
- Frontend: **http://localhost:3000**
- Backend API: **http://localhost:8000/docs**

### 5️⃣ Login
- **Email:** admin@spacsafrica.com
- **Password:** admin123

### 6️⃣ Test the System
1. Click "Admin" button
2. Click "Generate Synthetic Data"
3. Wait for completion
4. Go back to dashboard
5. See recommendations!

## 🛠️ Troubleshooting

### Docker not starting?
- Make sure Docker Desktop is fully running
- Check system tray for whale icon

### Frontend errors?
```powershell
cd frontend
rm -rf node_modules
npm install
npm start
```

### Backend not responding?
```powershell
docker-compose down
docker-compose up -d
docker-compose logs -f backend
```

## 🎯 What to Expect

✅ Beautiful login page  
✅ Trader dashboard with recommendations  
✅ Admin dashboard with metrics  
✅ Product browser  
✅ Group join functionality  

**Everything is ready to use!** 🎉
