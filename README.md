#  Webinar HUB

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Backend: Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-success)
![Frontend: Flutter](https://img.shields.io/badge/Frontend-Flutter-02569B?logo=flutter)
![Admin: React](https://img.shields.io/badge/Admin-React%20%7C%20Vite-61DAFB?logo=react)
![Database: PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Prisma-336791?logo=postgresql)

**Webinar HUB** is a comprehensive, production-grade enterprise webinar marketplace. It enables Expert Hosts to schedule, monetize, and stream live webinars to global audiences using a highly secure, containerized architecture.

##  Core Features
- ** Financial Rails**: End-to-end Razorpay integration with idempotent backend webhooks to prevent duplicate charges and tampering.
- ** Zero-Trust Security**: Deep RBAC middleware, JWT rotation mapping, device tracking, Brute-force Redis lockouts, and HttpOnly cookies.
- ** Cross-Platform Flutter App**: A gorgeous Material 3 responsive frontend bridging Mobile (`BottomNavigationBar`) and Web (`NavigationRail`) audiences. 
- ** Dedicated Web Admin Portal**: A React/Vite operational dashboard allowing sysadmins to permanently ban malicious users and forcefully delete rogue webinars.
- ** Real-Time Socket.IO Channels**: Instant live chat bridging hosts and attendees in securely authenticated JWT-bound websocket rooms.
- ** DevOps Ready**: Includes automated testing suites (Jest + Supertest), structured JSON Winston-equivalent logs, Docker-Compose orchestrations, and native Kubernetes Readiness/Health probes.

---

##  Architecture Stack

| Layer | Technologies |
| ----- | ------------ |
| **Backend API** | Node.js, Express.js, TypeScript, Socket.IO |
| **Database & Cache** | PostgreSQL, Prisma ORM, Redis |
| **User Frontend** | Flutter, Clean Architecture, Dio |
| **Admin Dashboard** | React 18, Vite, React Router, Axios |
| **Security & Audits**| Helmet, Express-Rate-Limit, bcrypt, Zod |

---

##  Quick Start (One-Click Run)
Webinar HUB is fully orchestrated. You can boot the Postgres DB, Redis Cache, Node API, and the React Admin portal strictly via one command using our automated Node runner:

1. **Clone the repository**
   ```bash
   git clone https://github.com/NithishNK123/webinarhub-platform.git
   cd webinarhub-platform
   ```

2. **Configure Environments**
   Populate your `.env` variables using the provided templates:
   - `backend/.env.example` -> `backend/.env`
   - `admin-panel/.env.example` -> `admin-panel/.env`
   - `frontend/.env.example` -> `frontend/.env`

3. **Install Dependencies & Seed Database**
   ```bash
   cd backend && npm install && npx prisma db push && npx prisma db seed
   cd ../admin-panel && npm install
   ```

4. **Launch the Fleet**
   From the root of the project, run:
   ```bash
   node start.js
   ```
   *Instantly orchestrates Docker, the Backend API on port 5000, and the Admin Panel on port 5173.*

---

##  Testing
The backend is mapped with rigorous AAA (Arrange, Act, Assert) QA pipelines utilizing `Jest`, `Supertest`, and `jest-mock-extended` ensuring total data-isolation.
To run the automated test suite simulating Malicious Webhooks, Invalid JWT bypassed, and Controller logic:
```bash
cd backend
npm run test
```

##  Admin Access
For security reasons, default administrative credentials must be configured securely before production deployment. 

The automated DB seeder (`npx prisma db seed`) will generate an initial Super Admin account. Please review `backend/prisma/seed.ts` to customize the Admin email and securely hash your intended password before launching your environment.

Once initialized, login seamlessly at `http://localhost:5173` (or your routed production URL) to access the operational dashboard.

---
*Built with secure, scalable, and modular architectural principles.*
