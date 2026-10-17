<div align="center">

# HealthFlow 🏥

**A full-stack healthcare management platform inspired by Practo**

[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io)
[![Razorpay](https://img.shields.io/badge/Razorpay-02042B?style=for-the-badge&logo=razorpay&logoColor=3395FF)](https://razorpay.com)

[Live Demo](https://healthflow.vercel.app) · [Backend API](https://healthflow-api.onrender.com/api/health)

</div>

---

## Features

### Three Role Dashboards
| Patient | Doctor | Admin |
|---------|--------|-------|
| Search & book appointments | Manage daily schedule | Verify doctor accounts |
| Pay online via Razorpay | Upload medical records | View platform analytics |
| View medical records | Real-time appointment alerts | Manage all users |
| Rate completed visits | Emergency alert system | Monitor transactions |
| Video consultations | Video consultations | — |

### Core Technical Features
- **JWT Authentication** — httpOnly cookies, role-based protected routes, token rotation on password change
- **Real-time Notifications** — Socket.io broadcasts for appointment confirmations, cancellations, emergency alerts
- **Razorpay Payments** — order creation, HMAC signature verification, webhook handling, Pay at Clinic fallback
- **Supabase File Storage** — medical record uploads with 10-min signed URL expiry
- **Video Consultations** — Jitsi Meet integration, no API key required, deterministic room per appointment
- **Emergency Alert System** — doctor triggers → instant Socket.io broadcast to all online admins
- **Offline Detection** — global overlay with auto-reconnect when network drops
- **Security** — Helmet CSP, rate limiting, mongo-sanitize, trust proxy, CORS per-origin validation

---

## Tech Stack

**Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, React Query, Zustand, Socket.io-client

**Backend:** Node.js, Express, MongoDB + Mongoose, Socket.io, JWT, bcrypt, Helmet, express-rate-limit

**Integrations:** Razorpay (payments), Supabase Storage (files), Jitsi Meet (video)

**Deployment:** Vercel (frontend), Render (backend), MongoDB Atlas (database)

---

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB (local) or MongoDB Atlas

### Setup

```bash
# 1. Clone and install
git clone https://github.com/pranav1768/healthflow.git
cd healthflow
npm install

# 2. Backend env
cp backend/.env.example backend/.env
# Fill: MONGO_URI, JWT_SECRET (required) + RAZORPAY_*, SUPABASE_* (optional)

# 3. Frontend env — leave VITE_API_URL blank for dev
cp frontend/.env.example frontend/.env

# 4. Seed database
npm run seed

# 5. Run both servers
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:5000 |
| Health check | http://localhost:5000/api/health |

### Seed Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@healthflow.app | Admin@12345 |
| Doctor | doctor1@healthflow.app | Doctor@12345 |
| Patient | patient1@healthflow.app | Patient@12345 |

> Doctors go up to `doctor6`, patients up to `patient5`

---

## Deployment

### Backend → Render

1. New Web Service → connect GitHub → set root dir to `backend`
2. Build: `npm install` · Start: `npm start`
3. Environment variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGO_URI` | Atlas connection string |
| `JWT_SECRET` | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | Your Vercel URL |
| `RAZORPAY_KEY_ID` | From Razorpay dashboard |
| `RAZORPAY_KEY_SECRET` | From Razorpay dashboard |
| `RAZORPAY_WEBHOOK_SECRET` | From Razorpay webhook settings |
| `SUPABASE_URL` | From Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase → Settings → API (service_role) |
| `SUPABASE_STORAGE_BUCKET` | `medical-records` |

4. MongoDB Atlas: Network Access → Add `0.0.0.0/0` (required for Render's dynamic IPs)
5. After deploy: run `npm run seed` from Render Shell tab

### Frontend → Vercel

1. Import repo → set root dir to `frontend` → Framework: Vite
2. Environment variable: `VITE_API_URL` = your Render URL (no trailing slash)
3. Deploy — `vercel.json` handles SPA routing automatically

### Razorpay Webhook
URL: `https://your-backend.onrender.com/api/payments/webhook`
Events: `payment.captured`, `payment.failed`

---

## Running Tests

```bash
cd backend
npm test
```

Tests cover: auth registration, login, wrong password, deactivated accounts, cookie setting, password change, admin account blocking.

---

## Project Structure

```
healthflow/
├── frontend/                  # React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/        # SideNavBar, TopNavBar, MobileNavDrawer
│   │   │   └── shared/        # EmergencyModal, RatingModal, OfflineOverlay
│   │   ├── pages/
│   │   │   ├── patient/       # Dashboard, Appointments, Records, Payments
│   │   │   ├── doctor/        # Dashboard, Appointments, Patients, Schedule
│   │   │   ├── admin/         # Dashboard, Users, Analytics, Settings
│   │   │   └── public/        # Home, Login, 404, Unauthorized
│   │   ├── context/           # AuthContext
│   │   ├── hooks/             # useSocket, usePageTitle, usePageTransition
│   │   ├── store/             # Zustand (uiStore, transitionStore)
│   │   └── services/          # axios api.js
│   ├── public/
│   │   └── fonts/             # Self-hosted woff2 (no Google CDN)
│   └── vercel.json
│
└── backend/                   # Express + MongoDB
    ├── controllers/           # auth, appointments, payments, records, emergency
    ├── models/                # User, Doctor, Patient, Appointment, Payment, Record
    ├── routes/                # 8 route files, all protected
    ├── middleware/            # auth, rateLimiters, errorHandler
    ├── sockets/               # Socket.io with JWT handshake
    ├── tests/                 # Jest + Supertest (auth, payments)
    └── utils/                 # seed, AppError, token, storage
```

---

## What I Built & Learned

- Designed a multi-role auth system from scratch with JWT + httpOnly cookies and role-based middleware
- Implemented real-time features using Socket.io — learned about rooms, namespaces, and JWT handshake on WS connections  
- Integrated Razorpay end-to-end including HMAC webhook signature verification to prevent payment fraud
- Handled cross-origin deployment (Vercel + Render) — learned about `sameSite: none`, trust proxy, and CORS for credentialed requests
- Built a file upload system with Supabase Storage using signed URLs that expire to limit exposure
- Self-hosted fonts to work around institutional network blocks on Google CDN

---

## Author

**Pranav Jaysing Karke**

[![GitHub](https://img.shields.io/badge/GitHub-pranav1768-181717?style=flat&logo=github)](https://github.com/pranav1768)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-pranav--karke-0A66C2?style=flat&logo=linkedin)](https://linkedin.com/in/pranav-karke)
