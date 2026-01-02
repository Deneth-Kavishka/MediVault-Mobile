# Backend Connection Setup Guide

This guide will help you connect your React Native frontend to the PostgreSQL database through the Node.js backend.

## Step 1: Setup PostgreSQL Database in pgAdmin

1. **Open pgAdmin**
2. **Create New Database:**
   - Right-click on "Databases" → Create → Database
   - Name: `medivault_db`
   - Click "Save"

3. **Run the Schema:**
   - Right-click on `medivault_db` → Query Tool
   - Open the file: `backend/database/schema.sql`
   - Click "Execute" (F5) to create the tables

## Step 2: Configure Backend

1. **Install Node.js Dependencies:**
   ```powershell
   cd backend
   npm install
   ```

2. **Update Database Credentials:**
   - Open `backend/.env` file
   - Update these lines with your actual PostgreSQL credentials:
   ```env
   DB_NAME=medivault_db
   DB_USER=postgres
   DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE
   ```

## Step 3: Start the Backend Server

```powershell
cd backend
npm run dev
```

You should see:
```
✅ Connected to PostgreSQL database
🚀 MediVault API Server running on http://localhost:5000
```

## Step 4: Configure Frontend Connection

The frontend is already configured! It will automatically connect to:
- **Android Emulator:** `http://10.0.2.2:5000/api`
- **iOS Simulator:** `http://localhost:5000/api`

### For Physical Device (Phone/Tablet):

1. Find your computer's IP address:
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., 192.168.1.100)

2. Update `src/config/constants.ts`:
   ```typescript
   export const API_BASE_URL = 'http://192.168.1.100:5000/api';
   ```

3. Make sure your phone and computer are on the same WiFi network

## Step 5: Test the Connection

1. **Start Backend Server:**
   ```powershell
   cd backend
   npm run dev
   ```

2. **Start React Native App:**
   ```powershell
   # In a new terminal
   npm start
   ```

3. **Test Adding a User:**
   - Open the app
   - Login as admin
   - Go to Admin Dashboard
   - Click "Add User"
   - Fill in the form and click "Create User"
   - If successful, the user will be saved in PostgreSQL!

## Verify Database

Check if user was created in pgAdmin:
1. Open pgAdmin
2. Navigate to: Databases → medivault_db → Schemas → public → Tables → users
3. Right-click on "users" → View/Edit Data → All Rows
4. You should see your newly created user!

## Troubleshooting

### Error: "Unable to connect to server"
- Make sure backend server is running (`npm run dev` in backend folder)
- Check that port 5000 is not being used by another app

### Error: "Database connection failed"
- Verify PostgreSQL is running
- Check database credentials in `backend/.env`
- Make sure `medivault_db` database exists

### Error: "Network request failed" (on physical device)
- Ensure phone and computer are on same WiFi
- Update API_BASE_URL with your computer's IP address
- Check Windows Firewall isn't blocking port 5000

### Allow Port 5000 Through Firewall (if needed):
```powershell
# Run as Administrator
netsh advfirewall firewall add rule name="MediVault API" dir=in action=allow protocol=TCP localport=5000
```

## API Endpoints Available

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Patient registration
- `POST /api/users/create` - Create new user (admin)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Next Steps

Once the Admin Add User is working, you can:
1. Add authentication to protect admin routes
2. Connect other features (appointments, prescriptions, etc.)
3. Add real-time features with WebSocket
4. Deploy to production server
