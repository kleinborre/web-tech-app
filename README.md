# 🔍 ImageToTextOnline — OCR Web Application

> A full-stack web application that converts images to editable text using Optical Character Recognition (OCR) technology, built with Node.js, Express.js, MongoDB, Tesseract.js, Firebase Storage, and Google OAuth 2.0.

| | |
|---|---|
| **Course** | MO-IT149 - Web Technology Application |
| **Term / Section** | Term 2 — Section A3101 |
| **Institution** | Mapua Malayan Digital College |
| **Mentor** | Sir Mario Pison Jr. |
| **Developer** | Oliver Jann Klein Borre |
| **Version** | 2.0.0 |

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
11. [Setup & Installation](#-setup--installation)
12. [Accessing the Application](#-accessing-the-application)
13. [Project Documentation Links](#-project-documentation-links)
14. [Security Implementation](#-security-implementation)
15. [Development Phases](#-development-phases)

---

## 📝 Description

**ImageToTextOnline** is a web-based OCR (Optical Character Recognition) application that enables users to upload images and extract text from them instantly. The application supports a wide range of image formats including **JPG, PNG, GIF, BMP, WebP, JFIF, HEIC, and PDF** files. It features a complete user authentication system with JWT and Google OAuth 2.0, role-based access control (RBAC) across four tiers, conversion history tracking with pagination and bulk operations, real-time notifications, a forgot-password flow via SMTP email, profile picture management via Firebase Storage, and a fully featured admin dashboard for user management and system monitoring.

The project is built on a **client-server architecture** with a RESTful API backend powered by Node.js and Express.js, a MongoDB database layer managed through Mongoose ODM, Firebase Storage for file management, and a responsive frontend built with vanilla HTML, CSS, and JavaScript enhanced by the Bootstrap 5 framework.

All API endpoints adhere to **REST conventions** with clean URL routing, proper HTTP methods, consistent JSON response formatting, industry-standard status codes, input validation via express-validator, rate limiting via express-rate-limit, and security headers via Helmet.js. Authentication is handled through **JWT tokens** stored in secure HTTPOnly cookies, with Google OAuth 2.0 as an alternative login method.

---

## 🎯 Purpose & Goal

### Purpose

To provide a free, accessible, and user-friendly online tool for converting images containing text into editable, copy-paste-ready digital text — eliminating the need to manually transcribe content from photographs, scanned documents, screenshots, or other image-based sources.

### Goals

| Goal | Description |
|------|-------------|
| **Accessibility** | Enable anyone with a browser to extract text from images without installing third-party software |
| **Multi-Format Support** | Accept a wide range of image formats including JPG, PNG, GIF, BMP, WebP, JFIF, HEIC, and PDF |
| **Batch Processing** | Allow up to 5 images to be processed simultaneously in a single request |
| **User Management** | Provide a tiered role-based access control system with user, admin, and superadmin roles |
| **History Tracking** | Enable authenticated users to save, review, and manage their past conversions |
| **Admin Oversight** | Equip administrators with a dashboard to manage users, monitor conversion activity, and view real-time system statistics |
| **Security** | Implement industry-standard security measures including Helmet.js, rate limiting, input validation, and centralized error handling |
| **RESTful Architecture** | Implement industry-standard REST API design principles for maintainability and scalability |

---

## 🌐 Live Deployments

| Platform | URL | Scope |
|----------|-----|-------|
| **GitHub Pages** | [https://kleinborre.github.io/web-tech-app/](https://kleinborre.github.io/web-tech-app/) | Frontend implementation only — limited by GitHub Pages static hosting, no backend or API access |
| **Vercel** | [https://web-tech-app.vercel.app/](https://web-tech-app.vercel.app/) | Full-stack deployment — demonstrates both frontend and backend capabilities of the web application |

---

## 👤 Default User Accounts & Role Access

The following accounts are created by the database seeder (`seeder.js`):

| Username | Role | Password |
|----------|------|----------|
| admin-user | **superadmin** | `eX6LooLPiVfCuZF6` |
| test-user | **user** | `VitBxRJVNwqdHLsQ` |

### Role-Based Access Control Matrix

| Permission | Guest (No Account) | User | Admin | Superadmin |
|-----------|:------------------:|:----:|:-----:|:----------:|
| Perform OCR Image Conversion | ✅ | ✅ | ✅ | ✅ |
| Copy Extracted Text / Download as TXT | ✅ | ✅ | ✅ | ✅ |
| Temporarily Store Converted Data ¹ | ✅ | ✅ | ✅ | ✅ |
| Register / Login with Email & Password | ✅ | ✅ | ✅ | ✅ |
| Register / Login with Google OAuth | ✅ | ✅ | ✅ | ✅ |
| Permanently Save to Conversion History | ❌ | ✅ | ✅ | ✅ |
| View / Delete Own Conversion History | ❌ | ✅ | ✅ | ✅ |
| Receive Real-Time Notifications | ❌ | ✅ | ✅ | ✅ |
| Manage Profile (Username, Email, Password) | ❌ | ✅ | ✅ | ✅ |
| Upload / Delete Profile Picture | ❌ | ✅ | ✅ | ✅ |
| Reset Password via Email | ❌ | ✅ | ✅ | ✅ |
| Access Admin Dashboard | ❌ | ❌ | ✅ | ✅ |
| View All Registered Users | ❌ | ❌ | ✅ | ✅ |
| Activate / Deactivate Users | ❌ | ❌ | ✅ | ✅ |
| View Platform Statistics | ❌ | ❌ | ✅ | ✅ |
| Change User Roles | ❌ | ❌ | ❌ | ✅ |

> ¹ **Temporarily Store Converted Data:** All users — including guests — can view, copy, and download extracted text during their active session. This data is temporarily stored in the browser and is automatically cleared upon page refresh or when a new conversion is performed.

---

## ✨ Features

### Core Features
- ✅ **Image-to-Text Conversion** — Upload images and extract text using the Tesseract.js OCR engine
- ✅ **Multi-Format Support** — JPG, PNG, GIF, BMP, WebP, JFIF, HEIC, and PDF
- ✅ **Batch Upload** — Process up to 5 images at once (max 10MB each)
- ✅ **Copy to Clipboard** — One-click copying of extracted text to the system clipboard
- ✅ **Download as TXT** — Export extracted text as a downloadable `.txt` file
- ✅ **Confidence Score** — Each conversion displays the OCR accuracy percentage

### User Features
- ✅ **User Registration & Login** — Secure authentication with email and password
- ✅ **Google OAuth 2.0** — One-click sign-in/sign-up via Google account
- ✅ **Forgot Password** — Password reset via SMTP email with secure tokenized links
- ✅ **Profile Management** — Update username, email, and password from the settings page
- ✅ **Profile Picture** — Upload, change, or delete profile pictures stored on Firebase Storage
- ✅ **Conversion History** — View, search, and manage past conversions with pagination and bulk selection
- ✅ **Real-Time Notifications** — Bell icon notifications for conversions and profile updates
- ✅ **Auto-Save** — Authenticated users' conversions are automatically persisted to history
- ✅ **Guest Mode** — Unauthenticated users can perform OCR conversions without an account (history not saved)

### Admin Features
- ✅ **Admin Dashboard** — Real-time statistics including total users, conversions, and weekly activity trends
- ✅ **Conversions Chart** — Visual bar chart displaying conversion trends over the last 7 days
- ✅ **User Management** — View, search, activate/deactivate, and manage all user accounts
- ✅ **Role Management** — Superadmins can promote or demote user roles across the platform

### Technical Features
- ✅ **RESTful API** — Clean, standardized REST endpoints organized under the `/api` prefix
- ✅ **Clean URL Routing** — Industry-standard page URLs without `.html` extensions
- ✅ **JWT Authentication** — Secure token-based authentication stored in HTTPOnly cookies
- ✅ **Google OAuth 2.0** — Passport.js integration with Google strategy
- ✅ **Firebase Storage** — Cloud storage for profile pictures with automatic cleanup
- ✅ **Role-Based Access Control (RBAC)** — Four-tier authorization: guest, user, admin, superadmin
- ✅ **Input Validation** — express-validator rules for all endpoints with structured error responses
- ✅ **Rate Limiting** — express-rate-limit with global (100/15min), auth (10/15min), and login (5/15min) tiers
- ✅ **Helmet.js** — HTTP security headers (X-Frame-Options, HSTS, X-Content-Type-Options, etc.)
- ✅ **Centralized Error Handling** — AppError class with consistent JSON error responses and Mongoose/JWT/Multer error mapping
- ✅ **SMTP Email** — Password reset emails via Gmail SMTP with HTML templates
- ✅ **HEIC Conversion** — Automatic HEIC-to-JPEG conversion for Apple device photographs
- ✅ **PDF Text Extraction** — Direct text extraction from PDF documents using unpdf
- ✅ **Responsive Design** — Mobile-friendly layout utilizing the Bootstrap 5 grid system
- ✅ **Loading Overlays** — Visible navigation transitions between pages

---

## 🛠 Tech Stack

### Backend

| Technology | Version | Purpose |
|-----------|---------| --------|
| **Node.js** | 18+ | JavaScript runtime environment |
| **Express.js** | 5.x | Web application framework for routing and middleware |
| **MongoDB** | Cloud (Atlas) | NoSQL document database for persistent data storage |
| **Mongoose** | 9.x | MongoDB Object Data Modeling (ODM) library |
| **Tesseract.js** | 7.x | OCR engine for optical character recognition |
| **Firebase Admin SDK** | 13.x | Firebase Storage for profile picture uploads |
| **Passport.js** | 0.7.x | Authentication middleware for Google OAuth 2.0 |
| **passport-google-oauth20** | 2.x | Google OAuth 2.0 strategy for Passport |
| **bcrypt** | 6.x | Cryptographic password hashing with salt rounds |
| **jsonwebtoken** | 9.x | JWT token generation, signing, and verification |
| **multer** | 2.x | Multipart form-data file upload handling |
| **nodemailer** | 6.x | SMTP email sending for password reset |
| **helmet** | 8.x | HTTP security headers middleware |
| **express-validator** | 7.x | Input validation and sanitization |
| **express-rate-limit** | 7.x | API rate limiting and brute-force protection |
| **heic-convert** | 2.x | HEIC/HEIF to JPEG image format conversion |
| **unpdf** | 1.x | PDF text extraction (serverless compatible) |
| **cookie-parser** | 1.x | HTTP cookie parsing middleware |
| **cors** | 2.x | Cross-Origin Resource Sharing policy management |
| **dotenv** | 17.x | Environment variable configuration loader |

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **HTML5** | — | Semantic page structure and markup |
| **CSS3** | — | Custom styling, animations, and responsive design |
| **JavaScript (ES6+)** | — | Client-side application logic and API communication |
| **Bootstrap** | 5.3.2 | Responsive grid system, UI components, and utilities |
| **Bootstrap Icons** | 1.11.1 | Scalable vector icon library |
| **Google Fonts (Poppins)** | — | Modern web typography |

### Development & Tooling

| Tool | Purpose |
|------|---------|
| **Git** | Version control and source code management |
| **Postman** | API testing, endpoint validation, and documentation |
| **MongoDB Atlas** | Cloud-hosted database management |
| **Firebase Console** | Cloud storage management for profile pictures |
| **Google Cloud Console** | OAuth 2.0 client credentials management |
| **npm** | Package management and script execution |

---

## 📁 Project Directory Structure

```
web-tech-app/
├── .gitignore                              # Git ignore configuration
├── README.md                               # Project documentation (this file)
├── index.html                              # GitHub Pages redirect entry point
├── vercel.json                             # Vercel deployment configuration
│
├── backend/                                # Server-side application
│   ├── .env                                # Environment variables (not committed)
│   ├── firebase-service-account.json       # Firebase credentials (not committed)
│   ├── package.json                        # Node.js dependencies and scripts
│   ├── server.js                           # Main Express server entry point
│   ├── seeder.js                           # Database seeder for default accounts
│   ├── eng.traineddata                     # Tesseract OCR English language data
│   │
│   ├── config/                             # Configuration files
│   │   ├── db.js                           # MongoDB connection with retry logic
│   │   └── passport.js                     # Google OAuth 2.0 Passport strategy
│   │
│   ├── controllers/                        # Business logic layer (request handlers)
│   │   ├── admin.controller.js             # Admin operations (stats, user management)
│   │   ├── auth.controller.js              # Authentication, profile, password reset
│   │   ├── history.controller.js           # Conversion history CRUD + bulk operations
│   │   ├── notification.controller.js      # Notification retrieval and read marking
│   │   └── ocr.controller.js              # OCR image processing and text extraction
│   │
│   ├── middleware/                          # Express middleware functions
│   │   ├── admin.middleware.js             # Admin & superadmin role authorization
│   │   ├── auth.middleware.js              # JWT authentication & optional auth
│   │   ├── error.middleware.js             # Centralized error handler (AppError class)
│   │   ├── rateLimiter.middleware.js       # Rate limiting (global, auth, strict login)
│   │   ├── upload.middleware.js            # Multer file upload configuration
│   │   ├── validate.middleware.js          # express-validator rules for all endpoints
│   │   └── validateFile.middleware.js      # File type and size validation
│   │
│   ├── models/                             # Mongoose database schemas
│   │   ├── ConversionLog.model.js          # Conversion history records
│   │   ├── Notification.model.js           # User notifications with referenceIds
│   │   ├── PasswordResetToken.model.js     # Tokenized password reset requests
│   │   └── User.model.js                  # User accounts (local + Google OAuth)
│   │
│   ├── routes/                             # API route definitions
│   │   ├── admin.routes.js                # /api/admin/* endpoints
│   │   ├── auth.routes.js                 # /api/auth/* endpoints (incl. OAuth)
│   │   ├── history.routes.js              # /api/history/* endpoints
│   │   ├── notification.routes.js         # /api/notifications/* endpoints
│   │   └── ocr.routes.js                 # /api/ocr/* endpoints
│   │
│   └── utils/                              # Utility functions and helpers
│       ├── email.js                        # SMTP email sending (password reset)
│       ├── firebase.js                     # Firebase Storage upload/delete helpers
│       └── ocrProcessor.js                # Tesseract.js worker pool and OCR engine
│
└── frontend/                               # Client-side application
    ├── index.html                          # Landing page and OCR converter interface
    │
    ├── admin/                              # Admin panel pages
    │   ├── dashboard.html                  # Admin dashboard with stats and charts
    │   ├── settings.html                   # Account settings (profile, password)
    │   └── users.html                     # User management and role administration
    │
    ├── auth/                               # Authentication pages
    │   ├── forgot-password.html            # Password recovery form
    │   ├── login.html                      # User login form (with Google OAuth button)
    │   ├── register.html                   # User registration form
    │   └── update-password.html            # Password reset form (from email link)
    │
    ├── css/                                # Stylesheets
    │   └── style.css                       # Main application stylesheet
    │
    ├── js/                                 # JavaScript modules
    │   ├── auth.js                         # Authentication logic (login, register, OAuth)
    │   ├── bulk-selection.js               # Bulk checkbox selection for history table
    │   ├── dashboard.js                    # Admin dashboard logic (stats, charts, users)
    │   ├── loading-overlay.js              # Loading animation for page transitions
    │   ├── main.js                         # Core application logic (OCR, UI, utilities)
    │   ├── notifications.js                # Notification manager (bell icon, badge, list)
    │   └── settings.js                    # Settings page logic (profile, password updates)
    │
    └── assets/                             # Static assets (images, icons, media)
```

---

## 🏗 Architecture & Design Patterns

### MVC Architecture (Model-View-Controller)

The backend follows the **MVC pattern** to maintain a clean separation of concerns:

```
Client Request
      │
      ▼
   Routes          ─── Define URL endpoints and attach middleware
      │
      ▼
  Middleware        ─── Auth, validation, rate limiting, file upload, error handling
      │
      ▼
  Controllers      ─── Business logic and response handling → next(error) on failure
      │
      ▼
   Models           ─── Database schemas and data operations
      │
      ▼
  MongoDB           ─── Persistent data storage (Atlas)
  Firebase          ─── Profile picture storage
```

| Layer | Location | Responsibility |
|-------|----------|---------------|
| **Model** | `models/*.model.js` | Define database schemas, data validation rules, and Mongoose hooks |
| **View** | `frontend/**/*.html` | Render the user interface (served as static files by Express) |
| **Controller** | `controllers/*.controller.js` | Process requests, execute business logic, call `next(error)` on failures |
| **Routes** | `routes/*.routes.js` | Map URL endpoints to controllers with middleware chains |
| **Middleware** | `middleware/*.middleware.js` | Auth, validation, rate limiting, file uploads, error handling |
| **Config** | `config/db.js`, `config/passport.js` | Database connection + Google OAuth strategy |
| **Utils** | `utils/` | OCR processing, Firebase Storage, SMTP email |

### RESTful API Design Principles

| Principle | Implementation |
|-----------|---------------|
| **Resource-Based URIs** | Nouns for resource names (`/users`, `/history`, `/notifications`) |
| **HTTP Methods** | `GET` (read), `POST` (create), `DELETE` (remove), `PATCH` (update) |
| **API Prefix** | All data endpoints grouped under `/api` |
| **Consistent Responses** | Uniform JSON: `{ success: true/false, data/error, message }` |
| **Status Codes** | `200`, `201`, `400`, `401`, `403`, `404`, `429`, `500` |
| **Pagination** | Query parameters `?page=1&limit=10` for list endpoints |
| **Clean URLs** | Page routes without `.html` extensions (e.g., `/auth/login`) |
| **Input Validation** | express-validator rules with structured field-level error responses |
| **Rate Limiting** | Per-IP request limits with standard RateLimit-* headers |

---

## 🗄 Database Schema

### User Model (`User.model.js`)

| Field | Type | Description |
|-------|------|-------------|
| `username` | String | Unique display name (3-30 chars, required) |
| `email` | String | Unique email address (required, indexed) |
| `password` | String | Bcrypt-hashed password (required for local auth, optional for Google OAuth) |
| `role` | String | Access level: `user`, `admin`, or `superadmin` (default: `user`) |
| `isActive` | Boolean | Account status flag (default: `true`) |
| `googleId` | String | Google OAuth unique identifier (optional) |
| `profilePicture` | String | Firebase Storage URL for user's profile picture (optional) |
| `createdAt` | Date | Account creation timestamp (auto-generated) |
| `updatedAt` | Date | Last modification timestamp (auto-generated) |

### ConversionLog Model (`ConversionLog.model.js`)

| Field | Type | Description |
|-------|------|-------------|
| `userId` | ObjectId | Reference to the User who performed the conversion |
| `originalFileName` | String | Name of the uploaded file |
| `extractedText` | String | OCR-extracted text content |
| `conversionDate` | Date | Conversion timestamp (auto-generated) |

### Notification Model (`Notification.model.js`)

| Field | Type | Description |
|-------|------|-------------|
| `userId` | ObjectId | Reference to the user receiving the notification |
| `type` | String | Notification type: `conversion`, `profile_update`, `new_user` |
| `message` | String | Notification content text |
| `read` | Boolean | Whether the user has read the notification (default: `false`) |
| `referenceIds` | [ObjectId] | Array of ConversionLog IDs linked to this notification |
| `createdAt` | Date | Notification timestamp (auto-generated) |

### PasswordResetToken Model (`PasswordResetToken.model.js`)

| Field | Type | Description |
|-------|------|-------------|
| `userId` | ObjectId | Reference to the user requesting the reset |
| `token` | String | Bcrypt-hashed reset token |
| `expiresAt` | Date | Token expiration timestamp (1 hour from creation) |
| `createdAt` | Date | Token creation timestamp (auto-generated) |

---

## 📡 REST API Endpoints

**Base URL:** `http://localhost:3000/api`

### Authentication Endpoints

| # | Feature | Endpoint | Method | Parameters | Response Fields |
|---|---------|----------|--------|-----------|----------------|
| 1 | User Registration | `/auth/register` | `POST` | username, email, password, confirmPassword (body) | success, token (cookie), user (_id, username, email, role, isActive, profilePicture, createdAt) |
| 2 | User Login | `/auth/login` | `POST` | email, password (body) | success, token (cookie), user (_id, username, email, role, isActive, profilePicture, createdAt) |
| 3 | User Logout | `/auth/logout` | `POST` | None (requires auth cookie) | success, message |
| 4 | Get Current User | `/auth/me` | `GET` | None (requires auth cookie) | success, user (_id, username, email, role, isActive, profilePicture, hasPassword, isGoogleUser, createdAt) |
| 5 | Check Email Exists | `/auth/check-email` | `POST` | email (body) | success, exists (boolean) |
| 6 | Forgot Password | `/auth/forgot-password` | `POST` | email (body) | success, message |
| 7 | Reset Password | `/auth/reset-password` | `POST` | token, email, password (body) | success, message |

### Google OAuth Endpoints

| # | Feature | Endpoint | Method | Parameters | Response Fields |
|---|---------|----------|--------|-----------|----------------|
| 8 | Initiate Google Login | `/auth/google` | `GET` | None (browser redirect) | Redirects to Google consent screen |
| 9 | Google OAuth Callback | `/auth/google/callback` | `GET` | code (query, auto from Google) | Sets JWT cookie, redirects to /admin/dashboard |

### Profile Management Endpoints (Requires Authentication)

| # | Feature | Endpoint | Method | Parameters | Response Fields |
|---|---------|----------|--------|-----------|----------------|
| 10 | Update Username | `/auth/update-username` | `PATCH` | username (body) | success, user |
| 11 | Update Email | `/auth/update-email` | `PATCH` | email (body) | success, user |
| 12 | Update Password | `/auth/update-password` | `PATCH` | currentPassword, newPassword, confirmNewPassword (body) | success, message |
| 13 | Verify Password | `/auth/verify-password` | `POST` | password (body) | success, valid (boolean) |
| 14 | Upload Profile Picture | `/auth/profile-picture` | `POST` | profilePicture (multipart/form-data, max 2MB) | success, profilePicture (URL) |
| 15 | Delete Profile Picture | `/auth/profile-picture` | `DELETE` | None | success, message |

### OCR Endpoint

| # | Feature | Endpoint | Method | Parameters | Response Fields |
|---|---------|----------|--------|-----------|----------------|
| 16 | OCR Image Conversion | `/ocr/convert` | `POST` | images (multipart/form-data, max 5 files, 10MB each) | success, message, summary, results[] |

### History Endpoints (Requires Authentication)

| # | Feature | Endpoint | Method | Parameters | Response Fields |
|---|---------|----------|--------|-----------|----------------|
| 17 | Get Conversion History | `/history` | `GET` | page, limit (query params) | success, history[], pagination |
| 18 | Get Single History Item | `/history/:id` | `GET` | id (URL param) | success, history |
| 19 | Delete History Item | `/history/:id` | `DELETE` | id (URL param) | success, message |
| 20 | Bulk Delete History | `/history/bulk-delete` | `POST` | ids (body, array of ObjectId strings) | success, message, deletedCount |
| 21 | Clear All History | `/history` | `DELETE` | None | success, message, deletedCount |

### Notification Endpoints (Requires Authentication)

| # | Feature | Endpoint | Method | Parameters | Response Fields |
|---|---------|----------|--------|-----------|----------------|
| 22 | Get Notifications | `/notifications` | `GET` | page, limit (query params) | success, notifications[], pagination |
| 23 | Get Unread Count | `/notifications/unread-count` | `GET` | None | success, count, latestUnreadAt |
| 24 | Mark All as Read | `/notifications/read-all` | `PATCH` | None | success, message |
| 25 | Mark Single as Read | `/notifications/:id/read` | `PATCH` | id (URL param) | success, notification |

### Admin Endpoints (Requires Admin Role)

| # | Feature | Endpoint | Method | Parameters | Response Fields |
|---|---------|----------|--------|-----------|----------------|
| 26 | Get Dashboard Stats | `/admin/stats` | `GET` | None | success, data.users (total, active, admins, new), data.conversions (total, recent, daily[]) |
| 27 | Get All Users | `/admin/users` | `GET` | page, limit (query params) | success, data[] (users), pagination |
| 28 | Get Single User | `/admin/users/:id` | `GET` | id (URL param) | success, data (user + conversionCount) |
| 29 | Toggle User Status | `/admin/users/:id/status` | `PATCH` | id (URL param) | success, message, data (isActive) |
| 30 | Change User Role | `/admin/users/:id/role` | `PATCH` | id (URL param), role (body). **Superadmin only** | success, message, data (role) |

### Utility Endpoint

| # | Feature | Endpoint | Method | Parameters | Response Fields |
|---|---------|----------|--------|-----------|----------------|
| 31 | Health Check | `/health` | `GET` | None | status, timestamp, environment |

---

## 🚀 Setup & Installation

### Prerequisites

Ensure the following are available before proceeding:

1. **Node.js** (v18 or higher) — [https://nodejs.org/](https://nodejs.org/)
2. **npm** (included with Node.js)
3. **Git** — [https://git-scm.com/](https://git-scm.com/)
4. **MongoDB Atlas Account** — [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
5. **Firebase Project** — [https://console.firebase.google.com/](https://console.firebase.google.com/) (for profile picture storage)
6. **Google Cloud OAuth 2.0 Credentials** — [https://console.cloud.google.com/](https://console.cloud.google.com/) (for Google sign-in)

### Step 1: Clone the Repository

```bash
git clone https://github.com/kleinborre/web-tech-app.git
cd web-tech-app
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 3: Add Firebase Service Account Key

Download the Firebase service account JSON file and place it in the `backend/` directory:

- **File name:** `firebase-service-account.json`
- **Location:** `backend/firebase-service-account.json`
- **Download link:** [Firebase Service Account Key (Google Drive)](https://drive.google.com/file/d/1XDrP_eZ6B_mfM_7tkojuM3uLD_dbP0cX/view?usp=sharing)

> **Important:** This file is excluded from version control via `.gitignore`. It provides the backend with access to `imagetotextonline.firebasestorage.app` for profile picture storage.

### Step 4: Configure Environment Variables

Create a `.env` file inside the `backend/` directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# File Upload Configuration
MAX_FILE_SIZE=10485760
MAX_FILES=5

# MongoDB Configuration
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# SMTP Configuration (Password Reset Emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
BASE_URL=http://localhost:3000

# Firebase Storage (Profile Pictures)
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./firebase-service-account.json
FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

> **Important:** Replace all placeholder values with your actual credentials. The `.env` file is excluded from version control via `.gitignore`.

#### Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `NODE_ENV` | Environment mode (`development` or `production`) |
| `MAX_FILE_SIZE` | Maximum upload file size in bytes (default: 10MB) |
| `MAX_FILES` | Maximum files per OCR request (default: 5) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXPIRE` | JWT token expiration (default: 7d) |
| `JWT_COOKIE_EXPIRE` | Cookie expiration in days (default: 7) |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP server port |
| `SMTP_SECURE` | Use TLS directly (false for STARTTLS on port 587) |
| `SMTP_USER` | SMTP email address (sender) |
| `SMTP_PASS` | SMTP password or Gmail App Password |
| `BASE_URL` | Application base URL for email links |
| `FIREBASE_SERVICE_ACCOUNT_KEY_PATH` | Path to Firebase service account JSON |
| `FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket name |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 client secret |

### Step 5: Seed Default Accounts

```bash
node seeder.js
```

This populates the database with the accounts listed in [Default User Accounts](#-default-user-accounts--role-access).

### Step 6: Start the Server

```bash
# Production mode
npm start

# Development mode (auto-restart on file changes)
npm run dev
```

The server will be accessible at `http://localhost:3000`.

---

## 🌐 Accessing the Application

| Page | URL |
|------|-----|
| **Home / OCR Converter** | `http://localhost:3000` |
| **Login** | `http://localhost:3000/auth/login` |
| **Register** | `http://localhost:3000/auth/register` |
| **Google Sign-In** | `http://localhost:3000/api/auth/google` |
| **Forgot Password** | `http://localhost:3000/auth/forgot-password` |
| **Admin Dashboard** | `http://localhost:3000/admin/dashboard` |
| **User Management** | `http://localhost:3000/admin/users` |
| **Account Settings** | `http://localhost:3000/admin/settings` |
| **API Health Check** | `http://localhost:3000/api/health` |

---

## 📄 Project Documentation Links

| Document | Link |
|----------|------|
| API Testing Evidence Document | [Google Docs](https://docs.google.com/document/d/1Dy_AZTZUmfaXDNUsZJ2sT2C8Ql5BlMrPPcbbarUE2aY/edit?usp=sharing) |
| Postman Collection & Environment Files | [Google Drive](https://drive.google.com/drive/folders/161GvthrYjIRRU98gUH0n_Kk2WSjGz86x?usp=sharing) |
| UML Class Diagram | [Google Drive](https://drive.google.com/file/d/1N6aiYrpLr0-uCCgnmWqELqAG6obFmbSI/view?usp=sharing) |
| Use Case Diagram | [Google Drive](https://drive.google.com/file/d/1qijDwGLEIh7zaWLz7aWpQWt5eAUfguC2/view?usp=sharing) |
| Firebase Service Account Key | [Google Drive](https://drive.google.com/file/d/1XDrP_eZ6B_mfM_7tkojuM3uLD_dbP0cX/view?usp=sharing) |

> **Note:** The Postman Collection folder also contains the `.env` configuration file and MongoDB URI text files. These files are not committed to the repository and have restricted access outside the organization.

---

## 🔒 Security Implementation

| Feature | Implementation |
|---------|---------------|
| **Password Hashing** | bcrypt with salt rounds for irreversible password storage |
| **JWT Authentication** | JSON Web Tokens stored in HTTPOnly cookies (not localStorage) |
| **HTTPOnly Cookies** | Prevents client-side JavaScript from accessing authentication tokens (XSS protection) |
| **Google OAuth 2.0** | Passport.js with Google strategy; cookies set with `sameSite: 'lax'` for OAuth redirect compatibility |
| **Helmet.js** | HTTP security headers: X-Frame-Options, HSTS, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, X-Powered-By removal |
| **Rate Limiting** | Global: 100 req/15min per IP. Auth: 10 req/15min. Login: 5 req/15min (brute-force protection) |
| **Input Validation** | express-validator rules on all endpoints with structured field-level error responses |
| **Centralized Error Handler** | AppError class with Mongoose, JWT, Multer, and JSON parse error mapping; stack traces in development only |
| **Role-Based Access Control** | Four-tier middleware authorization chain (guest → user → admin → superadmin) |
| **File Type Validation** | Whitelist-based MIME type verification for uploaded files |
| **File Size Limits** | Max 10MB per OCR file, 2MB per profile picture, 5 files per OCR request |
| **CORS Configuration** | Configurable cross-origin policy (permissive in dev, restrictive in production) |
| **Password Reset Tokens** | Bcrypt-hashed tokens with 1-hour expiration, single-use |
| **Environment Variables** | Sensitive credentials stored in `.env` + `firebase-service-account.json`, excluded from version control |

---

## 📌 Development Phases

| Phase | Description |
|-------|-------------|
| Phase 1 | Project initialization, folder structure, Express server setup, MongoDB Atlas configuration |
| Phase 2 | User authentication system — registration, login, logout, JWT token management with HTTPOnly cookies |
| Phase 3 | OCR engine integration with Tesseract.js, multi-format image support (HEIC, PDF, BMP, WebP) |
| Phase 4 | Conversion history API with pagination, admin dashboard statistics, and user management endpoints |
| Phase 5 | Frontend implementation — responsive UI, admin panel, user management interface with Bootstrap 5 |
| Phase 6 | Documentation (README), RESTful clean URL routing, GitHub Pages deployment, PDF engine optimization, UI/UX refinements, responsive design for tablets and mobile, admin dashboard enhancements, and account settings page |
| Phase 7 | Firebase Storage integration for profile picture upload, change, and deletion with automatic cleanup of old images |
| Phase 8 | Google OAuth 2.0 integration via Passport.js — one-click login/register with Google, auto-user creation, JWT cookie on callback |
| Phase 9 | Forgot password flow — SMTP email integration (Gmail), password reset tokens with bcrypt hashing and 1-hour expiration, update-password page |
| Phase 10 | Google OAuth session persistence fix, real-time notification deletion sync (referenceIds), bulk selection for conversion history (v2.0), loading overlay transitions, confirmation dialogs, and UI bug fixes |
| Phase 11 | Middleware validation enhancement — express-validator rules for all endpoints (register, login, profile updates, password reset), express-rate-limit (global 100/15min, auth 10/15min, login 5/15min), MongoDB ObjectId param validation, enhanced JWT error handling |
| Phase 12 | RBAC refinement — added `superadminOnly` middleware to role change route, verified user-scoped history access, confirmed frontend hides role buttons for non-superadmins |
| Phase 13 | Security & error handling — Helmet.js for HTTP security headers, centralized error handler (`AppError` class) covering Mongoose/JWT/Multer/JSON errors, refactored all 28 controller functions to use `next(error)` |
| Phase 14 | Documentation update — comprehensive README rewrite, updated API endpoint table (31 endpoints), project directory structure, database schema, environment variables reference, and development phase history |

---

<div align="center">
  <p><strong>ImageToTextOnline</strong> — Built with ☕ by Oliver Jann Klein Borre</p>
  <p><em>MO-IT149 - Web Technology Application — Mapua Malayan Digital College</em></p>
  <p>© 2026 Oliver Jann Klein Borre. All rights reserved.</p>
</div>
