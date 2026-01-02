# Backend Setup Guide - Medi Vault

## Overview
This guide will help you set up a Node.js/Express backend with PostgreSQL database to connect with your Medi Vault React Native frontend.

---

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn package manager
- Git

---

## 🗂️ Project Structure

Your frontend is already structured with API clients. Here's what you have:

```
frontend (current project)/
├── src/
│   ├── api/              # API client files
│   │   ├── auth.ts       # Authentication endpoints
│   │   ├── appointments.ts
│   │   ├── doctors.ts
│   │   ├── patients.ts
│   │   ├── prescriptions.ts
│   │   ├── labTests.ts
│   │   ├── medicines.ts
│   │   └── index.ts      # API client configuration
│   ├── config/
│   │   └── constants.ts  # API_BASE_URL configuration
│   └── types/            # TypeScript type definitions
```

---

## 🚀 Step-by-Step Backend Setup

### Step 1: Create Backend Project

1. **Create a new directory for backend:**
   ```bash
   cd "d:\Medi Vault"
   mkdir medi-vault-backend
   cd medi-vault-backend
   ```

2. **Initialize Node.js project:**
   ```bash
   npm init -y
   ```

3. **Install required dependencies:**
   ```bash
   npm install express pg cors dotenv bcryptjs jsonwebtoken cookie-parser express-session connect-pg-simple
   npm install --save-dev typescript @types/node @types/express @types/bcryptjs @types/jsonwebtoken @types/cookie-parser @types/express-session ts-node nodemon
   ```

### Step 2: Create Backend Folder Structure

```bash
mkdir -p src/controllers src/models src/routes src/middleware src/config src/utils
```

Your backend structure should look like:
```
medi-vault-backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   └── session.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── patientController.ts
│   │   ├── doctorController.ts
│   │   ├── appointmentController.ts
│   │   ├── prescriptionController.ts
│   │   └── labTestController.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Patient.ts
│   │   ├── Doctor.ts
│   │   ├── Appointment.ts
│   │   └── Prescription.ts
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── patientRoutes.ts
│   │   ├── doctorRoutes.ts
│   │   └── index.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── utils/
│   │   ├── helpers.ts
│   │   └── validators.ts
│   └── server.ts
├── .env
├── .gitignore
├── package.json
└── tsconfig.json
```

### Step 3: Configure TypeScript

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 4: Setup PostgreSQL Database

1. **Install PostgreSQL** (if not already installed)
   - Windows: Download from https://www.postgresql.org/download/windows/
   - Mac: `brew install postgresql`
   - Linux: `sudo apt install postgresql postgresql-contrib`

2. **Create Database:**
   ```sql
   -- Open PostgreSQL command line (psql)
   CREATE DATABASE medi_vault;
   
   -- Create user (optional, or use default postgres user)
   CREATE USER medivault_admin WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE medi_vault TO medivault_admin;
   ```

3. **Create Database Schema:**
   ```sql
   -- Connect to database
   \c medi_vault;

   -- Users table (main authentication)
   CREATE TABLE users (
       id SERIAL PRIMARY KEY,
       email VARCHAR(255) UNIQUE NOT NULL,
       password_hash VARCHAR(255) NOT NULL,
       full_name VARCHAR(255) NOT NULL,
       phone VARCHAR(20),
       role VARCHAR(50) NOT NULL CHECK (role IN ('patient', 'doctor', 'pharmacist', 'lab_technician', 'admin')),
       is_active BOOLEAN DEFAULT true,
       email_verified BOOLEAN DEFAULT false,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Patients table
   CREATE TABLE patients (
       id SERIAL PRIMARY KEY,
       user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       nic VARCHAR(20) UNIQUE NOT NULL,
       date_of_birth DATE,
       gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
       blood_type VARCHAR(5),
       address TEXT,
       emergency_contact VARCHAR(100),
       emergency_phone VARCHAR(20),
       medical_history TEXT,
       allergies TEXT,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Doctors table
   CREATE TABLE doctors (
       id SERIAL PRIMARY KEY,
       user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       license_number VARCHAR(50) UNIQUE NOT NULL,
       specialization VARCHAR(100),
       qualifications TEXT,
       experience_years INTEGER,
       consultation_fee DECIMAL(10, 2),
       available_days TEXT,
       available_time_start TIME,
       available_time_end TIME,
       rating DECIMAL(3, 2) DEFAULT 0.00,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Appointments table
   CREATE TABLE appointments (
       id SERIAL PRIMARY KEY,
       patient_id INTEGER REFERENCES patients(id),
       doctor_id INTEGER REFERENCES doctors(id),
       appointment_date DATE NOT NULL,
       appointment_time TIME NOT NULL,
       status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
       reason TEXT,
       notes TEXT,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Prescriptions table
   CREATE TABLE prescriptions (
       id SERIAL PRIMARY KEY,
       patient_id INTEGER REFERENCES patients(id),
       doctor_id INTEGER REFERENCES doctors(id),
       appointment_id INTEGER REFERENCES appointments(id),
       prescription_date DATE DEFAULT CURRENT_DATE,
       diagnosis TEXT,
       notes TEXT,
       status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'dispensed', 'completed', 'cancelled')),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Prescription Items table
   CREATE TABLE prescription_items (
       id SERIAL PRIMARY KEY,
       prescription_id INTEGER REFERENCES prescriptions(id) ON DELETE CASCADE,
       medicine_name VARCHAR(255) NOT NULL,
       dosage VARCHAR(100),
       frequency VARCHAR(100),
       duration VARCHAR(100),
       quantity INTEGER,
       instructions TEXT,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Medicines table
   CREATE TABLE medicines (
       id SERIAL PRIMARY KEY,
       name VARCHAR(255) NOT NULL,
       generic_name VARCHAR(255),
       category VARCHAR(100),
       manufacturer VARCHAR(255),
       unit_price DECIMAL(10, 2),
       stock_quantity INTEGER DEFAULT 0,
       reorder_level INTEGER DEFAULT 10,
       expiry_date DATE,
       description TEXT,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Lab Tests table
   CREATE TABLE lab_tests (
       id SERIAL PRIMARY KEY,
       patient_id INTEGER REFERENCES patients(id),
       doctor_id INTEGER REFERENCES doctors(id),
       test_name VARCHAR(255) NOT NULL,
       test_type VARCHAR(100),
       status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
       priority VARCHAR(20) DEFAULT 'routine' CHECK (priority IN ('routine', 'urgent', 'stat')),
       order_date DATE DEFAULT CURRENT_DATE,
       result_date DATE,
       results TEXT,
       notes TEXT,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Medical Records table
   CREATE TABLE medical_records (
       id SERIAL PRIMARY KEY,
       patient_id INTEGER REFERENCES patients(id),
       doctor_id INTEGER REFERENCES doctors(id),
       record_type VARCHAR(50),
       record_date DATE DEFAULT CURRENT_DATE,
       title VARCHAR(255),
       description TEXT,
       file_url TEXT,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Sessions table (for authentication)
   CREATE TABLE "session" (
       "sid" VARCHAR NOT NULL COLLATE "default",
       "sess" JSON NOT NULL,
       "expire" TIMESTAMP(6) NOT NULL,
       CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
   );

   CREATE INDEX "IDX_session_expire" ON "session" ("expire");

   -- Indexes for better performance
   CREATE INDEX idx_users_email ON users(email);
   CREATE INDEX idx_patients_nic ON patients(nic);
   CREATE INDEX idx_appointments_date ON appointments(appointment_date);
   CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
   CREATE INDEX idx_lab_tests_patient ON lab_tests(patient_id);
   ```

### Step 5: Create Environment Configuration

Create `.env` file in backend root:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medi_vault
DB_USER=medivault_admin
DB_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-change-this-too

# CORS Configuration
FRONTEND_URL=http://localhost:8081

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

### Step 6: Configure Package.json Scripts

Update `package.json`:
```json
{
  "name": "medi-vault-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "migrate": "ts-node src/config/migrations.ts"
  }
}
```

---

## 📝 Backend Code Files

### 1. Database Configuration (`src/config/database.ts`)

```typescript
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'medi_vault',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export default pool;
```

### 2. Server Entry Point (`src/server.ts`)

```typescript
import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pool from './config/database';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// PostgreSQL session store
const PgSession = connectPgSimple(session);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8081',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(
  session({
    store: new PgSession({
      pool: pool,
      tableName: 'session',
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🗄️  Database: ${process.env.DB_NAME}`);
});

export default app;
```

### 3. Authentication Middleware (`src/middleware/auth.ts`)

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    next();
  };
};
```

### 4. Authentication Controller (`src/controllers/authController.ts`)

```typescript
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, phone, role } = req.body;

    // Check if user exists
    const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await query(
      'INSERT INTO users (email, password_hash, full_name, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, phone, role, created_at',
      [email, passwordHash, fullName, phone, role]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: { user, token },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // Remove password from response
    delete user.password_hash;

    res.json({
      success: true,
      data: { user, token },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCurrentUser = async (req: any, res: Response) => {
  try {
    const result = await query(
      'SELECT id, email, full_name, phone, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
```

### 5. Routes (`src/routes/index.ts`)

```typescript
import { Router } from 'express';
import authRoutes from './authRoutes';
// Import other routes here

const router = Router();

router.use('/auth', authRoutes);
// Add other routes here

export default router;
```

### 6. Auth Routes (`src/routes/authRoutes.ts`)

```typescript
import { Router } from 'express';
import { register, login, getCurrentUser } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getCurrentUser);

export default router;
```

---

## 🔌 Frontend Configuration

### Update API Base URL

In your frontend `.env.development` file (already exists):
```env
API_BASE_URL=http://localhost:5000/api
WS_URL=ws://localhost:5000
ENVIRONMENT=development
```

For development on physical device:
```env
API_BASE_URL=http://YOUR_COMPUTER_IP:5000/api
```

Find your IP:
- Windows: `ipconfig` (look for IPv4)
- Mac/Linux: `ifconfig` or `ip addr`

---

## 🚀 Running the Application

### Terminal 1 - Start PostgreSQL
```bash
# Ensure PostgreSQL is running
# Windows: Check Services
# Mac/Linux: 
sudo service postgresql start
```

### Terminal 2 - Start Backend
```bash
cd "d:\Medi Vault\medi-vault-backend"
npm run dev
```

### Terminal 3 - Start Frontend
```bash
cd "d:\Medi Vault\Medi vault2"
npx expo start
```

---

## 🧪 Testing the Connection

1. **Test Backend Health:**
   ```bash
   curl http://localhost:5000/health
   ```

2. **Test Registration:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123",
       "fullName": "Test User",
       "phone": "1234567890",
       "role": "patient"
     }'
   ```

3. **Test Login from Frontend:**
   - Open your app
   - Try to register/login
   - Check console for API calls

---

## 📚 Next Steps

1. **Implement remaining controllers:**
   - patientController.ts
   - doctorController.ts
   - appointmentController.ts
   - prescriptionController.ts
   - labTestController.ts

2. **Add validation middleware**
3. **Implement file upload for medical records**
4. **Add WebSocket support for real-time features**
5. **Implement proper error handling**
6. **Add API documentation (Swagger)**
7. **Set up logging (Winston/Morgan)**
8. **Implement rate limiting**
9. **Add unit tests**

---

## 🐛 Troubleshooting

### Connection Refused Error
- Check if backend is running on correct port
- Verify firewall settings
- Use computer IP instead of localhost for physical devices

### CORS Error
- Verify CORS origin in backend matches frontend URL
- Check credentials option is set to true

### Database Connection Error
- Verify PostgreSQL is running
- Check database credentials in .env
- Ensure database exists

### Authentication Error
- Check JWT_SECRET is same across requests
- Verify token is being sent in Authorization header
- Check token expiry

---

## 📞 Support

For issues:
1. Check error logs in both frontend and backend
2. Verify environment variables
3. Check database connection
4. Review API endpoint paths

---

**Ready to start?** Follow the steps above in order, and you'll have a fully functional backend connected to your React Native frontend!
