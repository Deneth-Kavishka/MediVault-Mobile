# Connection Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     MEDIVAULT ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐
│   REACT NATIVE APP       │
│   (Your Phone/Emulator)  │
│                          │
│  ┌────────────────────┐  │
│  │  AdminAddUser      │  │
│  │  Component         │  │
│  │                    │  │
│  │  - Form Fields     │  │
│  │  - Validation      │  │
│  │  - Submit Button   │  │
│  └────────┬───────────┘  │
│           │              │
│           │ HTTP POST    │
└───────────┼──────────────┘
            │
            │ /api/users/create
            │ { fullName, email, ... }
            │
            ▼
┌──────────────────────────┐
│   NODE.JS BACKEND        │
│   (localhost:5000)       │
│                          │
│  ┌────────────────────┐  │
│  │  Express Server    │  │
│  │  - Routes          │  │
│  │  - Validation      │  │
│  │  - Password Hash   │  │
│  └────────┬───────────┘  │
│           │              │
│           │ SQL INSERT   │
└───────────┼──────────────┘
            │
            │ INSERT INTO users (...)
            │
            ▼
┌──────────────────────────┐
│   POSTGRESQL DATABASE    │
│   (pgAdmin)              │
│                          │
│  ┌────────────────────┐  │
│  │  medivault_db      │  │
│  │                    │  │
│  │  Tables:           │  │
│  │  - users           │  │
│  │    • id            │  │
│  │    • full_name     │  │
│  │    • email         │  │
│  │    • role          │  │
│  │    • password_hash │  │
│  │    • ...           │  │
│  └────────────────────┘  │
│                          │
└──────────────────────────┘

═══════════════════════════════════════════════════════════════

DATA FLOW EXAMPLE:

1. Admin fills form:
   ├─ Full Name: "Dr. John Smith"
   ├─ Email: "john@example.com"
   ├─ Username: "drjohn"
   ├─ Password: "password123"
   └─ Role: "doctor"

2. Frontend sends HTTP POST:
   POST http://10.0.2.2:5000/api/users/create
   Content-Type: application/json
   {
     "fullName": "Dr. John Smith",
     "email": "john@example.com",
     "username": "drjohn",
     "password": "password123",
     "role": "doctor"
   }

3. Backend processes:
   ├─ Validates data
   ├─ Hashes password → "$2b$10$abc..."
   └─ Executes SQL:
      INSERT INTO users (full_name, email, username, password_hash, role)
      VALUES ('Dr. John Smith', 'john@example.com', 'drjohn', '$2b$10$abc...', 'doctor')

4. Database stores:
   users table:
   ┌────┬────────────────┬──────────────────┬──────────┬──────────┐
   │ id │ full_name      │ email            │ username │ role     │
   ├────┼────────────────┼──────────────────┼──────────┼──────────┤
   │ 1  │ Dr. John Smith │ john@example.com │ drjohn   │ doctor   │
   └────┴────────────────┴──────────────────┴──────────┴──────────┘

5. Backend responds:
   {
     "success": true,
     "message": "User created successfully",
     "data": {
       "id": 1,
       "fullName": "Dr. John Smith",
       "email": "john@example.com",
       "role": "doctor"
     }
   }

6. Frontend shows:
   "Success! User created successfully!"

═══════════════════════════════════════════════════════════════

NETWORK ADDRESSES:

Android Emulator:
  Frontend → Backend: http://10.0.2.2:5000
  (10.0.2.2 is the host machine in Android emulator)

iOS Simulator:
  Frontend → Backend: http://localhost:5000

Physical Device:
  Frontend → Backend: http://192.168.1.XXX:5000
  (Use your computer's actual IP address)

Backend → Database:
  localhost:5432 (PostgreSQL default port)

═══════════════════════════════════════════════════════════════

SECURITY FEATURES:

✅ Password Hashing (bcrypt)
   Plain: "password123"
   Stored: "$2b$10$YourHashedPasswordHere..."

✅ SQL Injection Prevention
   Using parameterized queries ($1, $2, etc.)

✅ Input Validation
   Email format, password length, required fields

✅ JWT Tokens (for future authentication)
   Secure session management

═══════════════════════════════════════════════════════════════
```
