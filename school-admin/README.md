# 🏫 SchoolAdmin — Web-Based School Administration System

> **BSc Software Engineering Final Year Project**  
> Ismail Patel · Manchester Metropolitan University · 2026

A full-stack MERN web application providing centralised administration for schools — managing students, courses, attendance, grades, and more.

---

## ⚡ Quick Start

### 1. Prerequisites

- ✅ **Node.js LTS** — [https://nodejs.org](https://nodejs.org) *(must install first!)*
- ✅ **MongoDB Atlas account** — [https://cloud.mongodb.com](https://cloud.mongodb.com) (free tier)

### 2. Install all dependencies

```bash
cd school-admin
npm install          # installs concurrently
npm run install:all  # installs server + client dependencies
```

### 3. Configure environment

```bash
# Copy the example env file
cp server/.env.example server/.env
```

Then edit `server/.env` and fill in your **MongoDB Atlas connection string** and a **JWT secret**.

### 4. Seed the database with demo data

```bash
npm run seed
```

This creates 1 admin, 3 teachers, 10 students, 4 courses, attendance records, and grades.

**Login credentials printed after seed:**
| Role | Email | Password |
|---|---|---|
| Admin | admin@schooladmin.com | Admin1234! |
| Teacher | sarah.johnson@schooladmin.com | Teacher1234! |

### 5. Run the application

```bash
npm run dev
```

- Frontend → http://localhost:5173  
- Backend API → http://localhost:5000/api

---

## 🧪 Run Tests

```bash
npm test
```

Runs Jest + Supertest API tests covering: auth, student CRUD, role restrictions, health check.

---

## 🏗️ Project Structure

```
school-admin/
├── server/          ← Express API (Node.js)
│   ├── models/      ← Mongoose schemas
│   ├── routes/      ← API endpoints
│   ├── middleware/  ← JWT auth, role guard
│   ├── utils/       ← Seed script, audit logger
│   └── tests/       ← Jest + Supertest
└── client/          ← React 18 (Vite)
    └── src/
        ├── pages/   ← 7 feature pages
        ├── components/ ← Layout, Sidebar, Navbar
        ├── context/ ← Auth, Toast
        └── api/     ← Axios + API helpers
```

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 Role-based auth | Admin / Teacher / Student with JWT |
| 👩‍🎓 Student Management | CRUD + search + CSV export |
| 📚 Course Management | Create courses, enrol/remove students |
| 📋 Attendance | Bulk mark per class session (present/absent/late/excused) |
| 📝 Grades | Log grades with letter grade & percentage |
| 📊 Analytics Dashboard | Charts: attendance rate, grade distribution |
| 🗒️ Audit Log | Full chronological activity history |
| ⭐ SUS Evaluation | Built-in 10-question usability survey |
| 🔒 Security | Helmet, rate limiting, input validation |
| 🧪 Unit Tests | Jest + Supertest API coverage |

---

## 🔗 API Endpoints

`POST /api/auth/login` · `GET /api/students` · `GET /api/courses` · `POST /api/attendance` · `GET /api/grades` · `GET /api/analytics/summary` · `GET /api/audit` · `POST /api/evaluation`

---

## 🛡️ Security

- **Helmet.js** — HTTP security headers (OWASP)
- **Rate limiting** — 100 req/15min general, 10/15min for auth
- **JWT** — stateless authentication
- **bcryptjs** — password hashing (cost factor 12)
- **Input validation** — express-validator on all write endpoints
- **GDPR** — data consent flag on students, audit log TTL (1 year)
