# Quick Start Guide - Admin Add User Feature

## 🚀 Setup Steps (5 Minutes)

### Step 1: Setup Database (1 minute)

1. **Open pgAdmin**
2. **Right-click on the `medivault` database** → Query Tool
3. **Copy and paste** the entire content from `backend/database/SETUP_DATABASE.sql`
4. **Click Execute** (F5) or the ▶ button
5. You should see: "Database setup completed successfully!"

### Step 2: Start Backend & Frontend

**Option A: Start Both Together (Recommended)**
```cmd
START_BOTH.bat
```
This will open 2 terminals:
- Backend at http://localhost:5000
- Frontend with Expo

**Option B: Start Manually**
```cmd
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
npm start
```

### Step 3: Login & Test

1. **Open your app** (press `a` for Android or `i` for iOS in Expo terminal)

2. **Login as Admin:**
   - Username: `admin`
   - Password: `admin123`

3. **Navigate to Admin Dashboard**

4. **Click "Add User" or "User Management"**

5. **Fill the form:**
   - Full Name: Test User
   - Email: test@example.com
   - Phone: +94771234567
   - Username: testuser
   - Password: Test@123
   - Role: Select any role (Patient, Doctor, etc.)
   - Click "Create User"

6. **Success!** You should see "User created successfully"

---

## 🔍 Verify Backend Connection

Open browser and test these URLs:

1. **Health Check:**
   ```
   http://localhost:5000/api/health
   ```
   Should return: `{"success": true, "message": "MediVault API Server is running"}`

2. **Test Login API:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/login ^
   -H "Content-Type: application/json" ^
   -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
   ```

---

## 📱 API Configuration

### For Android Emulator:
Already configured: `http://10.0.2.2:5000/api`

### For iOS Simulator:
Edit `src/config/constants.ts`:
```typescript
export const API_BASE_URL = 'http://localhost:5000/api';
```

### For Physical Device:
1. Find your computer's IP: `ipconfig` (look for IPv4)
2. Edit `src/config/constants.ts`:
```typescript
export const API_BASE_URL = 'http://192.168.x.x:5000/api'; // Your IP
```

---

## 🎯 Admin Dashboard Features Available

✅ **Add User** - Create new users (patients, doctors, pharmacists, etc.)  
✅ **User Management** - View and manage all users  
✅ **Dashboard Stats** - View system statistics  
✅ **Recent Activities** - Monitor system activity  

---

## 🐛 Troubleshooting

### Backend not connecting?
```cmd
cd backend
npm install
npm start
```
Look for: ✅ Database connected successfully

### Frontend can't reach backend?
1. Check if backend is running on port 5000
2. Verify API_BASE_URL in `src/config/constants.ts`
3. For Android emulator, use `10.0.2.2:5000`

### Login fails?
1. Make sure you ran SETUP_DATABASE.sql
2. Verify credentials:
   - Username: `admin`
   - Password: `admin123`

### User creation fails?
Check backend terminal for errors. Common issues:
- Database not connected
- Missing required fields
- Duplicate email/username

---

## 📋 Default Admin Credentials

**Username:** admin  
**Password:** admin123  
**Email:** admin@medivault.com  

---

## ✅ What's Working

✅ Backend server running on port 5000  
✅ Database connected (PostgreSQL)  
✅ Admin login API endpoint  
✅ User creation API endpoint  
✅ Frontend API client configured  
✅ Admin dashboard with Add User component  
✅ Form validation  
✅ Error handling  
✅ Success notifications  

---

## 🎉 You're Ready!

Run `START_BOTH.bat` and start testing! The admin can now add users from the mobile app.
