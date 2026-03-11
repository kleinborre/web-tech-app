# 🔍 ImageToTextOnline — OCR Web Application

![Node](https://img.shields.io/badge/node-v20.x-green.svg)
![Express](https://img.shields.io/badge/express-v5.x-blue.svg)
![MongoDB](https://img.shields.io/badge/mongodb-Atlas-green.svg)
![Firebase](https://img.shields.io/badge/firebase-Storage-orange.svg)
![OAuth](https://img.shields.io/badge/auth-Google_OAuth_2.0-red.svg)
![Helmet](https://img.shields.io/badge/security-Helmet.js-blueviolet.svg)

> A full-stack OCR web application that converts images to editable text using Tesseract.js, with JWT + Google OAuth authentication, Firebase Storage, SMTP password reset, real-time notifications, role-based access control, and a full admin dashboard.

---

## 📋 Table of Contents

1. [Description](#-description)
2. [Purpose & Goal](#-purpose--goal)
3. [Live Deployments](#-live-deployments)
4. [Default User Accounts & Role Access](#-default-user-accounts--role-access)
5. [Features](#-features)
6. [Tech Stack](#-tech-stack)
7. [Project Directory Structure](#-project-directory-structure)
8. [Architecture & Design Patterns](#-architecture--design-patterns)
9. [Database Schema](#-database-schema)
10. [REST API Endpoints](#-rest-api-endpoints)
11. [Setup & Installation (Local)](#-setup--installation-local)
12. [Accessing the Application](#-accessing-the-application)
13. [Project Documentation Links](#-project-documentation-links)
14. [Security Implementation](#-security-implementation)
15. [Development Phases](#-development-phases)

---

## 📝 Description

**ImageToTextOnline** is a web-based OCR application that lets users upload images (JPG, PNG, GIF, BMP, WebP, JFIF, HEIC, PDF) and extract text instantly. It supports batch processing (up to 5 files), user authentication via JWT and Google OAuth 2.0, profile picture storage on Firebase, password reset via SMTP email, real-time notifications, conversion history with bulk operations, and a four-tier RBAC system (guest → user → admin → superadmin) with a full admin dashboard.

Built with Node.js, Express 5, MongoDB Atlas, and a vanilla HTML/CSS/JS + Bootstrap 5 frontend.

---

## 🎯 Purpose & Goal

Provide a free, browser-based tool for extracting text from images — no software installation required. Key goals include multi-format support, batch processing, secure authentication (local + OAuth), admin oversight with user management, and industry-standard security (Helmet.js, rate limiting, input validation, centralized error handling).

---

## 🌐 Live Deployments

| Platform | URL | Scope |
|----------|-----|-------|
| **Vercel** | [web-tech-app.vercel.app](https://web-tech-app.vercel.app/) | Full-stack — frontend + backend + database + Firebase + OAuth |
| **GitHub Pages** | [kleinborre.github.io/web-tech-app](https://kleinborre.github.io/web-tech-app/) | Frontend only — no backend/API access |

---

## 👤 Default User Accounts & Role Access

Seeded by `seeder.js`:

| Username | Role | Password |
|----------|------|----------|
| admin-user | **superadmin** | `eX6LooLPiVfCuZF6` |
| test-user | **user** | `VitBxRJVNwqdHLsQ` |

### RBAC Permission Matrix

| Permission | Guest | User | Admin | Superadmin |
|-----------|:-----:|:----:|:-----:|:----------:|
| OCR Conversion + Copy/Download | ✅ | ✅ | ✅ | ✅ |
| Register / Login (Email or Google) | ✅ | ✅ | ✅ | ✅ |
| Save Conversion History | ❌ | ✅ | ✅ | ✅ |
| View / Delete Own History | ❌ | ✅ | ✅ | ✅ |
| Real-Time Notifications | ❌ | ✅ | ✅ | ✅ |
| Profile Management (Username, Email, Password) | ❌ | ✅ | ✅ | ✅ |
| Upload / Delete Profile Picture | ❌ | ✅ | ✅ | ✅ |
| Reset Password via Email | ❌ | ✅ | ✅ | ✅ |
| Admin Dashboard + User Management | ❌ | ❌ | ✅ | ✅ |
| Change User Roles | ❌ | ❌ | ❌ | ✅ |

---

## ✨ Features

### Core
- ✅ **OCR Conversion** — Tesseract.js engine, batch upload (up to 5), confidence scores
- ✅ **Multi-Format** — JPG, PNG, GIF, BMP, WebP, JFIF, HEIC, PDF
- ✅ **Copy / Download** — One-click clipboard copy or `.txt` export
- ✅ **Separate OCR Pages** — Guest landing page (`index.html`) and authenticated converter (`home.html`)

### User
- ✅ **Email + Password Auth** — Registration, login (email or username), logout with JWT cookies
- ✅ **Google OAuth 2.0** — One-click sign-in/sign-up via Google
- ✅ **Forgot Password** — SMTP email with tokenized reset link (1-hour expiry)
- ✅ **Profile Management** — Update username, email, password from settings
- ✅ **Profile Picture** — Upload/delete via Firebase Storage
- ✅ **Conversion History** — Paginated, searchable, bulk select + delete
- ✅ **Notifications** — Bell icon with unread badge, notification sound, mark as read
- ✅ **Terms of Service & Privacy Policy** — Scrollable modals on registration page

### UX & Navigation
- ✅ **Clean URLs** — No `.html` extensions (e.g., `/auth/login`, `/dashboard`, `/settings`)
- ✅ **Loading Overlays** — Smooth page transition animations on all navigation links, logo, and user-link clicks
- ✅ **Sound Effects** — Web Audio API sounds for success, error, notification, and page transitions (SoundManager)
- ✅ **404 Error Pages** — Dedicated catch-all pages for guest and authenticated users with themed design
- ✅ **Back-Button Protection** — Guest page prevents back navigation; login back → homepage; post-logout history prevention
- ✅ **Welcome Header** — Username/avatar in desktop header on home page, hoverable with teal underline transition

### Admin
- ✅ **Dashboard** — Real-time stats, 7-day conversion chart
- ✅ **User Management** — View, search, activate/deactivate users
- ✅ **Role Management** — Superadmin-exclusive role promotion/demotion

### Security
- ✅ **Helmet.js** — HTTP security headers
- ✅ **Rate Limiting** — Global (300/15min, bypassed for authenticated users), auth (20/15min), login (10/15min)
- ✅ **CORS Hardening** — Exposed rate-limit headers, 24hr preflight cache, `X-Content-Type-Options: nosniff`
- ✅ **Input Validation** — express-validator on all endpoints
- ✅ **Centralized Error Handler** — AppError class with Mongoose/JWT/Multer error mapping
- ✅ **Anti-Cache Headers** — `no-store`, `no-cache`, `must-revalidate` on sensitive pages
- ✅ **Gzip Compression** — `compression` middleware for response optimization
- ✅ **Morgan Logging** — HTTP request logging (`dev` in development, `combined` in production)

---

## 🛠 Tech Stack

### Backend

| Technology | Purpose |
|-----------|---------|
| Node.js (v20+) | JavaScript runtime |
| Express.js (v5) | Web framework |
| MongoDB Atlas + Mongoose | Database + ODM |
| Tesseract.js | OCR engine |
| Firebase Admin SDK | Profile picture storage |
| Passport.js + Google OAuth 2.0 | Social authentication |
| bcrypt | Password hashing |
| jsonwebtoken | JWT token management |
| nodemailer | SMTP email (password reset) |
| helmet | HTTP security headers |
| express-validator | Input validation |
| express-rate-limit | Rate limiting (with auth bypass) |
| multer | File upload handling |
| heic-convert | HEIC → JPEG conversion |
| unpdf | PDF text extraction |
| cookie-parser | Cookie parsing |
| cors | Cross-origin policy |
| morgan | HTTP request logging |
| compression | Gzip response compression |
| dotenv | Environment configuration |

### Frontend

| Technology | Purpose |
|-----------|---------|
| HTML5 / CSS3 / JavaScript (ES6+) | Structure, styling, logic |
| Bootstrap 5.3.2 + Icons | UI framework + icon library |
| Google Fonts (Poppins) | Typography |

---

## 📁 Project Directory Structure

```
web-tech-app/
├── .gitignore
├── README.md
├── index.html                              # GitHub Pages redirect
├── vercel.json                             # Vercel deployment config
│
├── backend/
│   ├── .env                                # Environment variables (not committed)
│   ├── firebase-service-account.json       # Firebase credentials (not committed)
│   ├── package.json
│   ├── server.js                           # Express entry point
│   ├── seeder.js                           # Default account seeder
│   ├── eng.traineddata                     # Tesseract English data
│   │
│   ├── config/
│   │   ├── db.js                           # MongoDB connection + retry
│   │   └── passport.js                     # Google OAuth strategy
│   │
│   ├── controllers/
│   │   ├── admin.controller.js             # Stats, user management
│   │   ├── auth.controller.js              # Auth, profile, password reset
│   │   ├── history.controller.js           # History CRUD + bulk ops
│   │   ├── notification.controller.js      # Notifications
│   │   └── ocr.controller.js              # OCR processing
│   │
│   ├── middleware/
│   │   ├── admin.middleware.js             # adminOnly, superadminOnly
│   │   ├── auth.middleware.js              # protect, optionalAuth
│   │   ├── error.middleware.js             # Centralized error handler
│   │   ├── rateLimiter.middleware.js       # Rate limiting tiers
│   │   ├── upload.middleware.js            # Multer config
│   │   ├── validate.middleware.js          # express-validator rules
│   │   └── validateFile.middleware.js      # File type/size checks
│   │
│   ├── models/
│   │   ├── ConversionLog.model.js          # OCR history records
│   │   ├── Notification.model.js           # User notifications
│   │   ├── PasswordResetToken.model.js     # Password reset tokens
│   │   └── User.model.js                  # User accounts
│   │
│   ├── routes/
│   │   ├── admin.routes.js                # /api/admin/*
│   │   ├── auth.routes.js                 # /api/auth/* (incl. OAuth)
│   │   ├── history.routes.js              # /api/history/*
│   │   ├── notification.routes.js         # /api/notifications/*
│   │   └── ocr.routes.js                 # /api/ocr/*
│   │
│   └── utils/
│       ├── email.js                        # SMTP email sending
│       ├── firebase.js                     # Firebase upload/delete
│       └── ocrProcessor.js                # Tesseract worker pool
│
└── frontend/
    ├── index.html                          # Guest landing page + OCR converter
    ├── home.html                           # Authenticated OCR converter (dashboard nav)
    ├── 404.html                            # Guest 404 error page
    ├── 404-auth.html                       # Authenticated 404 error page
    ├── admin/
    │   ├── dashboard.html                  # Admin dashboard
    │   ├── settings.html                   # Account settings
    │   └── users.html                     # User management (admin-only)
    ├── auth/
    │   ├── forgot-password.html            # Forgot password form
    │   ├── login.html                      # Login (email/username + Google OAuth)
    │   ├── register.html                   # Registration (with TOS & Privacy modals)
    │   └── update-password.html            # Reset password (email link)
    ├── css/
    │   └── style.css                       # Main stylesheet
    ├── js/
    │   ├── auth.js                         # Auth logic + sound integration
    │   ├── bulk-selection.js               # Checkbox bulk selection
    │   ├── dashboard.js                    # Dashboard logic + sound integration
    │   ├── loading-overlay.js              # Page transition animations + sound
    │   ├── main.js                         # Core OCR + UI logic + sound integration
    │   ├── notifications.js                # Notification manager + sound
    │   ├── settings.js                     # Settings page logic + sound integration
    │   └── sound-manager.js               # Web Audio API sound effects (4 sounds)
    └── assets/                             # Static assets
```

---

## 🏗 Architecture & Design Patterns

### MVC Pattern

```
Client Request → Routes → Middleware → Controllers → Models → MongoDB / Firebase
```

| Layer | Location | Responsibility |
|-------|----------|---------------|
| **Model** | `models/` | Database schemas, validation, Mongoose hooks |
| **View** | `frontend/` | HTML/CSS/JS served as static files |
| **Controller** | `controllers/` | Business logic, `next(error)` on failure |
| **Routes** | `routes/` | URL mapping + middleware chains |
| **Middleware** | `middleware/` | Auth, validation, rate limiting, error handling |
| **Config** | `config/` | Database connection, OAuth strategy |
| **Utils** | `utils/` | OCR engine, Firebase storage, SMTP email |

---

## 🗄 Database Schema

### User (`User.model.js`)

| Field | Type | Description |
|-------|------|-------------|
| `username` | String | Unique display name (3-30 chars) |
| `email` | String | Unique email (indexed) |
| `password` | String | Bcrypt hash (optional for Google-only users) |
| `role` | String | `user` / `admin` / `superadmin` |
| `isActive` | Boolean | Account status (default: `true`) |
| `googleId` | String | Google OAuth ID (optional) |
| `profilePicture` | String | Firebase Storage URL (optional) |
| `createdAt` / `updatedAt` | Date | Timestamps |

### ConversionLog (`ConversionLog.model.js`)

| Field | Type | Description |
|-------|------|-------------|
| `userId` | ObjectId | Reference to User |
| `originalFileName` | String | Uploaded file name |
| `extractedText` | String | OCR output |
| `conversionDate` | Date | Timestamp |

### Notification (`Notification.model.js`)

| Field | Type | Description |
|-------|------|-------------|
| `userId` | ObjectId | Recipient user |
| `type` | String | `conversion` / `profile_update` / `new_user` |
| `message` | String | Content text |
| `read` | Boolean | Read status |
| `referenceIds` | [ObjectId] | Linked ConversionLog IDs |
| `createdAt` | Date | Timestamp |

### PasswordResetToken (`PasswordResetToken.model.js`)

| Field | Type | Description |
|-------|------|-------------|
| `userId` | ObjectId | User requesting reset |
| `token` | String | Bcrypt-hashed token |
| `expiresAt` | Date | 1-hour expiration |

---

## 📡 REST API Endpoints

**Base URL:** `/api`

### Authentication

| # | Feature | Endpoint | Method | Parameters | Response |
|---|---------|----------|--------|-----------|----------|
| 1 | Register | `/auth/register` | POST | username, email, password, confirmPassword | success, token, user |
| 2 | Login | `/auth/login` | POST | email, password | success, token, user |
| 3 | Logout | `/auth/logout` | POST | auth cookie | success, message |
| 4 | Get Current User | `/auth/me` | GET | auth cookie | success, user |
| 5 | Check Email | `/auth/check-email` | POST | email | success, exists |
| 6 | Forgot Password | `/auth/forgot-password` | POST | email | success, message |
| 7 | Reset Password | `/auth/reset-password` | POST | token, email, password | success, message |

### Google OAuth

| # | Feature | Endpoint | Method | Description |
|---|---------|----------|--------|-------------|
| 8 | Initiate Login | `/auth/google` | GET | Redirects to Google consent screen |
| 9 | Callback | `/auth/google/callback` | GET | Sets JWT cookie → redirects to `/dashboard` |

### Profile Management (Auth Required)

| # | Feature | Endpoint | Method | Parameters |
|---|---------|----------|--------|-----------|
| 10 | Update Username | `/auth/update-username` | PATCH | username |
| 11 | Update Email | `/auth/update-email` | PATCH | email |
| 12 | Update Password | `/auth/update-password` | PATCH | currentPassword, newPassword, confirmNewPassword |
| 13 | Verify Password | `/auth/verify-password` | POST | password |
| 14 | Upload Profile Pic | `/auth/profile-picture` | POST | profilePicture (form-data, max 2MB) |
| 15 | Delete Profile Pic | `/auth/profile-picture` | DELETE | — |

### OCR

| # | Feature | Endpoint | Method | Parameters |
|---|---------|----------|--------|-----------|
| 16 | Convert Images | `/ocr/convert` | POST | images (form-data, max 5 files, 10MB each) |

### History (Auth Required)

| # | Feature | Endpoint | Method | Parameters |
|---|---------|----------|--------|-----------|
| 17 | Get History | `/history` | GET | page, limit |
| 18 | Get Single Item | `/history/:id` | GET | id |
| 19 | Delete Item | `/history/:id` | DELETE | id |
| 20 | Bulk Delete | `/history/bulk-delete` | POST | ids (array) |
| 21 | Clear All | `/history` | DELETE | — |

### Notifications (Auth Required)

| # | Feature | Endpoint | Method | Parameters |
|---|---------|----------|--------|-----------|
| 22 | Get Notifications | `/notifications` | GET | page, limit |
| 23 | Unread Count | `/notifications/unread-count` | GET | — |
| 24 | Mark All Read | `/notifications/read-all` | PATCH | — |
| 25 | Mark One Read | `/notifications/:id/read` | PATCH | id |

### Admin (Admin Role Required)

| # | Feature | Endpoint | Method | Parameters |
|---|---------|----------|--------|-----------|
| 26 | Dashboard Stats | `/admin/stats` | GET | — |
| 27 | All Users | `/admin/users` | GET | page, limit |
| 28 | Single User | `/admin/users/:id` | GET | id |
| 29 | Toggle Status | `/admin/users/:id/status` | PATCH | id |
| 30 | Change Role | `/admin/users/:id/role` | PATCH | id, role (**superadmin only**) |

### Utility

| # | Feature | Endpoint | Method | Response |
|---|---------|----------|--------|----------|
| 31 | Health Check | `/health` | GET | status, timestamp, environment |

---

## 🚀 Setup & Installation (Local)

### Prerequisites

- **Node.js** v20+ — [nodejs.org](https://nodejs.org/)
- **Git** — [git-scm.com](https://git-scm.com/)
- **MongoDB Atlas** account — [mongodb.com/atlas](https://www.mongodb.com/atlas)
- **Firebase project** with Storage enabled — [console.firebase.google.com](https://console.firebase.google.com/)
- **Google Cloud** OAuth 2.0 credentials — [console.cloud.google.com](https://console.cloud.google.com/)
- **Gmail App Password** for SMTP — [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)

### Step 1 — Clone & Install

```bash
git clone https://github.com/kleinborre/web-tech-app.git
cd web-tech-app/backend
npm install
```

### Step 2 — Firebase Service Account

Download the Firebase service account JSON and place it at `backend/firebase-service-account.json`:

📥 **Download:** [firebase-service-account.json (Google Drive)](https://drive.google.com/file/d/1XDrP_eZ6B_mfM_7tkojuM3uLD_dbP0cX/view?usp=sharing)

> This file is excluded from Git via `.gitignore`. It grants the backend access to `imagetotextonline.firebasestorage.app`.

### Step 3 — Environment Variables

Create `backend/.env` with the following:

```env
# =============================================================================
# Environment Configuration
# =============================================================================

# Server Configuration
PORT=3000
NODE_ENV=development

# File Upload Configuration
MAX_FILE_SIZE=10485760
MAX_FILES=5

# MongoDB Configuration
MONGO_URI=mongodb+srv://<db_username>:<db_password>@<cluster>.mongodb.net/<database_name>

# JWT Configuration
JWT_SECRET=<your_jwt_secret_key>
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# SMTP for Password Reset
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<your_gmail_address>
SMTP_PASS=<your_gmail_app_password>
BASE_URL=http://localhost:3000

# Firebase Storage (Profile Pictures)
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./firebase-service-account.json
FIREBASE_STORAGE_BUCKET=<your_project>.firebasestorage.app

# Google OAuth
GOOGLE_CLIENT_ID=<your_client_id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your_client_secret>
```

#### Environment Variables Reference

| Variable | Required | Description |
|----------|:--------:|-------------|
| `PORT` | ✅ | Server port (default: 3000) |
| `NODE_ENV` | ✅ | `development` or `production` |
| `MAX_FILE_SIZE` | ✅ | Max upload size in bytes (10MB = 10485760) |
| `MAX_FILES` | ✅ | Max files per OCR request |
| `MONGO_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Secret key for signing JWT tokens |
| `JWT_EXPIRE` | ✅ | Token lifetime (e.g., `7d`) |
| `JWT_COOKIE_EXPIRE` | ✅ | Cookie expiry in days |
| `SMTP_HOST` | ✅ | SMTP server (e.g., `smtp.gmail.com`) |
| `SMTP_PORT` | ✅ | SMTP port (587 for STARTTLS) |
| `SMTP_SECURE` | ✅ | `false` for STARTTLS on port 587 |
| `SMTP_USER` | ✅ | Sender email address |
| `SMTP_PASS` | ✅ | Gmail App Password (not regular password) |
| `BASE_URL` | ✅ | App URL for email links (local or Vercel) |
| `FIREBASE_SERVICE_ACCOUNT_KEY_PATH` | ✅ | Path to Firebase JSON (local: `./firebase-service-account.json`) |
| `FIREBASE_STORAGE_BUCKET` | ✅ | Firebase Storage bucket name |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth client secret |

### Step 4 — Seed Default Accounts

```bash
node seeder.js
```

### Step 5 — Start the Server

```bash
npm run dev     # Development (auto-restart)
npm start       # Production
```

Server runs at `http://localhost:3000`.

---

## 🌐 Accessing the Application

### Local Development

| Page | URL |
|------|-----|
| Home / OCR Converter (Guest) | `http://localhost:3000` |
| Home / OCR Converter (Auth) | `http://localhost:3000/home` |
| Login | `http://localhost:3000/auth/login` |
| Register | `http://localhost:3000/auth/register` |
| Google Sign-In | `http://localhost:3000/api/auth/google` |
| Forgot Password | `http://localhost:3000/auth/forgot-password` |
| Reset Password (from email) | `http://localhost:3000/auth/update-password?token=...&email=...` |
| Dashboard | `http://localhost:3000/dashboard` |
| Account Settings | `http://localhost:3000/settings` |
| User Management (admin-only) | `http://localhost:3000/admin/users` |
| API Health Check | `http://localhost:3000/api/health` |

### Vercel Production

| Page | URL |
|------|-----|
| Home / OCR Converter (Guest) | `https://web-tech-app.vercel.app` |
| Home / OCR Converter (Auth) | `https://web-tech-app.vercel.app/home` |
| Login | `https://web-tech-app.vercel.app/auth/login` |
| Google Sign-In | `https://web-tech-app.vercel.app/api/auth/google` |
| Dashboard | `https://web-tech-app.vercel.app/dashboard` |
| Account Settings | `https://web-tech-app.vercel.app/settings` |
| User Management (admin-only) | `https://web-tech-app.vercel.app/admin/users` |
| API Health Check | `https://web-tech-app.vercel.app/api/health` |

---

## 📄 Project Documentation Links

| Document | Link |
|----------|------|
| API Testing Evidence | [Google Docs](https://docs.google.com/document/d/1Dy_AZTZUmfaXDNUsZJ2sT2C8Ql5BlMrPPcbbarUE2aY/edit?usp=sharing) |
| Postman Collection & Environment Files | [Google Drive](https://drive.google.com/drive/folders/161GvthrYjIRRU98gUH0n_Kk2WSjGz86x?usp=sharing) |
| UML Class Diagram | [Google Drive](https://drive.google.com/file/d/1N6aiYrpLr0-uCCgnmWqELqAG6obFmbSI/view?usp=sharing) |
| Use Case Diagram | [Google Drive](https://drive.google.com/file/d/1qijDwGLEIh7zaWLz7aWpQWt5eAUfguC2/view?usp=sharing) |
| Firebase Service Account Key | [Google Drive](https://drive.google.com/file/d/1XDrP_eZ6B_mfM_7tkojuM3uLD_dbP0cX/view?usp=sharing) |

> **Note:** The Postman Collection folder also contains the `.env` configuration file and MongoDB URI text files. These files have restricted access outside the organization.

---

## 🔒 Security Implementation

| Feature | Implementation |
|---------|---------------|
| **Password Hashing** | bcrypt with salt rounds |
| **JWT Authentication** | HTTPOnly cookies (not localStorage), 7-day expiry |
| **Google OAuth 2.0** | Passport.js, `sameSite: 'lax'` for redirect compatibility |
| **Helmet.js** | X-Frame-Options, HSTS, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, X-Powered-By removal |
| **Rate Limiting** | Global: 300/15min (bypassed for authenticated users), Auth: 20/15min, Login: 10/15min per IP |
| **CORS Hardening** | Exposed rate-limit headers, 24hr preflight cache, `X-Content-Type-Options: nosniff` on API responses |
| **Anti-Cache Headers** | `no-store`, `no-cache`, `must-revalidate`, `Pragma: no-cache` on sensitive page routes |
| **bfcache Prevention** | Browser back/forward cache disabled to prevent stale session state |
| **Input Validation** | express-validator on all endpoints with field-level errors |
| **Centralized Error Handler** | AppError class mapping Mongoose, JWT, Multer, and JSON parse errors to proper HTTP status codes |
| **RBAC** | Four-tier middleware: guest → user → admin → superadmin |
| **File Validation** | MIME whitelist + size caps (10MB OCR, 2MB profile picture) |
| **Password Reset Tokens** | Bcrypt-hashed, single-use, 1-hour expiry |
| **CORS** | Hardened configuration — exposed rate-limit headers, 24hr preflight cache, restrictive in production |
| **Gzip Compression** | `compression` middleware for optimized response sizes |
| **Morgan Logging** | HTTP request logging — `dev` format in development, `combined` in production |
| **404 Catch-All** | Auth-aware global catch-all serves dedicated 404 pages with HTTP 404 status |
| **Clean URLs** | No `.html` extensions exposed — server-side route aliasing via Express |
| **Environment Secrets** | `.env` + `firebase-service-account.json` excluded via `.gitignore` |

---

## 📌 Development Phases

| Phase | Description |
|-------|-------------|
| **Phase 1** | Project initialization — folder structure, Express 5 server, MongoDB Atlas connection with retry logic |
| **Phase 2** | User authentication — registration, login, logout with JWT tokens in HTTPOnly cookies |
| **Phase 3** | OCR engine — Tesseract.js integration, multi-format support (HEIC auto-conversion, PDF text extraction) |
| **Phase 4** | History & admin — conversion history API with pagination, admin dashboard stats, user management endpoints |
| **Phase 5** | Frontend — responsive UI with Bootstrap 5, admin panel, user management interface, login/register pages |
| **Phase 6** | Polish & docs — clean URL routing, GitHub Pages + Vercel deployment, PDF engine optimization, responsive design (mobile/tablet), admin dashboard chart, account settings page, initial README |
| **Phase 7** | Firebase Storage — profile picture upload, change, and deletion with automatic old-image cleanup |
| **Phase 8** | Google OAuth 2.0 — Passport.js integration, one-click Google sign-in/sign-up, auto user creation, JWT on callback |
| **Phase 9** | Forgot password — SMTP email via Gmail (nodemailer), tokenized reset links with bcrypt hashing and 1-hour expiry, update-password page |
| **Phase 10** | Bug fixes — OAuth session persistence, notification deletion sync (referenceIds), bulk selection v2.0 for history, loading overlays, confirmation dialogs |
| **Phase 11** | Middleware validation — express-validator rules for all endpoints, express-rate-limit (3-tier), MongoDB ObjectId param validation, enhanced JWT error messages |
| **Phase 12** | RBAC refinement — `superadminOnly` middleware on role-change route, user-scoped history verification, frontend role-button visibility |
| **Phase 13** | Security & error handling — Helmet.js headers, centralized `AppError` error handler, refactored all 28 controller functions to `next(error)` |
| **Phase 14** | Documentation — comprehensive README v2.0 update, Vercel deployment guide (Firebase, OAuth, SMTP), updated API endpoint table (31 endpoints), development phase history |
| **Phase 15** | Auth UX & security — anti-cache headers (no-store, no-cache, must-revalidate), bfcache prevention, login loading animation (replaces success modal), logout toast + loading overlay, unauthorized access warning popup, username-or-email login, rate-limit JSON responses, users page JS syntax fix (stray brackets breaking table load), removed spurious `justLoggedIn` flag from `updateUI()`, added loading-overlay to users page, increased rate limits to SPA-friendly levels (global 300/15min, auth 20/15min, login 10/15min), nav link loading animations on all dashboard pages |
| **Phase 16** | Page separation & back-button protection — separate guest OCR (`index.html`) and authenticated OCR (`home.html`) pages, dashboard-style nav on auth pages, post-login back-button sign-out confirmation, post-logout history prevention via `replace()`, active nav item disabled (`pointer-events: none`), gzip compression middleware, Vercel static cache (1yr immutable), clickable welcome/avatar → Settings, OCR modal redesign (Copy/Download/Delete matching dashboard), footer polish (MMDC link, mentor line), Terms of Service & Privacy Policy modals on register page |
| **Phase 17** | Clean URLs & API security — removed `.html` extensions from all internal navigation links (auth, admin, settings), Morgan HTTP request logging (`dev`/`combined`), hardened CORS (exposed rate-limit headers, 24hr preflight cache), `X-Content-Type-Options: nosniff` on API responses, removed stale confirmation dialogs from settings sidebar/mobile nav (replaced with LoadingOverlay), guest page back-button prevention, login page back → homepage redirect |
| **Phase 18** | URL structure & loading animations — separated user/admin URL paths (`/dashboard`, `/settings` for all users; `/admin/users` for admin-only), route aliasing via server.js (no page duplication), updated Google OAuth redirect, loading overlay transitions on all nav links/logo/user-link/dashboard buttons across dashboard.js, settings.js, users.html, and home.html, welcome/username/avatar added to home page desktop header (→ settings), theme-color hover transition on welcome text (home + dashboard pages) |
| **Phase 19** | Global catch-all error pages & UX polish — dedicated `404.html` (guest) and `404-auth.html` (authenticated) with themed hover icon, creative error copy, and redirect button; server.js catch-all detects auth via JWT cookie, returns proper HTTP 404; SoundManager utility (Web Audio API) with 4 synthesized sounds integrated across all pages; settings popup success icon color matched to theme teal; Welcome/username hover: underline + teal color transition; settings welcome/avatar hoverable non-navigating container; rate limiting bypassed for authenticated users via globalLimiter `skip` function |
| **Phase 20** | Comprehensive README update — updated all documentation sections (Features, Tech Stack, Directory Structure, Security Implementation, Accessing the Application, API Endpoints) to reflect Phases 15–19 changes: new files (`404.html`, `404-auth.html`, `sound-manager.js`), clean URL paths (`/dashboard`, `/settings`), updated rate limit values, added new features (sound effects, loading overlays, TOS/Privacy modals, separate OCR pages, back-button protection, anti-cache headers, gzip, Morgan logging, CORS hardening) |

---

<div align="center">
  <p><strong>ImageToTextOnline</strong> — Built with ☕ by Oliver Jann Klein Borre</p>
  <p><em>MO-IT149 Web Technology Application — Mapua Malayan Digital College</em></p>
  <p>© 2026 Oliver Jann Klein Borre. All rights reserved.</p>
</div>
