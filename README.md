# 🔍 ImageToTextOnline — OCR Web Application

> A full-stack web application that converts images to editable text using Optical Character Recognition (OCR) technology, built with Node.js, Express.js, MongoDB, and Tesseract.js.

| | |
|---|---|
| **Course** | MO-IT149 - Web Technology Application |
| **Term / Section** | Term 2 — Section A3101 |
| **Institution** | Mapua Malayan Digital College |
| **Mentor** | Sir Mario Pison Jr. |
| **Developer** | Oliver Jann Klein Borre |
| **Version** | 1.0.0 |

---

## 📋 Table of Contents

1. [Description](#-description)
2. [Purpose & Goal](#-purpose--goal)
3. [Features](#-features)
4. [Tech Stack](#-tech-stack)
5. [Project Directory Structure](#-project-directory-structure)
6. [Architecture & Design Patterns](#-architecture--design-patterns)
7. [Database Schema](#-database-schema)
8. [REST API Endpoints](#-rest-api-endpoints)
9. [Setup & Installation](#-setup--installation)
10. [Accessing the Application](#-accessing-the-application)
11. [Default User Accounts & Role Access](#-default-user-accounts--role-access)
12. [Project Documentation Links](#-project-documentation-links)
13. [Security Implementation](#-security-implementation)
14. [Development Phases](#-development-phases)

---

## 📝 Description

**ImageToTextOnline** is a web-based OCR (Optical Character Recognition) application that enables users to upload images and extract text from them instantly. The application supports a wide range of image formats including **JPG, PNG, GIF, BMP, WebP, JFIF, HEIC, and PDF** files. It features a complete user authentication system with role-based access control, conversion history tracking with pagination, and a fully featured admin dashboard for user management and system monitoring.

The project is built on a **client-server architecture** with a RESTful API backend powered by Node.js and Express.js, a MongoDB database layer managed through Mongoose ODM, and a responsive frontend built with vanilla HTML, CSS, and JavaScript enhanced by the Bootstrap 5 framework.

All API endpoints adhere to **REST conventions** with clean URL routing, proper HTTP methods, consistent JSON response formatting, and industry-standard status codes. Authentication is handled through **JWT tokens** stored in secure HTTPOnly cookies, ensuring protection against common web vulnerabilities.

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
| **RESTful Architecture** | Implement industry-standard REST API design principles for maintainability and scalability |

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
- ✅ **Conversion History** — View, search, and manage past conversions with pagination support
- ✅ **Auto-Save** — Authenticated users' conversions are automatically persisted to history
- ✅ **Guest Mode** — Unauthenticated users can perform OCR conversions without an account (history not saved)

### Admin Features
- ✅ **Admin Dashboard** — Real-time statistics including total users, conversions, and today's activity
- ✅ **Conversions Chart** — Visual bar chart displaying conversion trends over the last 7 days
- ✅ **User Management** — View, search, activate/deactivate, and manage all user accounts
- ✅ **Role Management** — Superadmins can promote or demote user roles across the platform

### Technical Features
- ✅ **RESTful API** — Clean, standardized REST endpoints organized under the `/api` prefix
- ✅ **Clean URL Routing** — Industry-standard page URLs without `.html` extensions
- ✅ **JWT Authentication** — Secure token-based authentication stored in HTTPOnly cookies
- ✅ **Role-Based Access Control (RBAC)** — Three-tier authorization: user, admin, superadmin
- ✅ **Server-Side Validation** — Input validation and sanitization for all API endpoints
- ✅ **HEIC Conversion** — Automatic HEIC-to-JPEG conversion for Apple device photographs
- ✅ **PDF Processing** — Multi-page PDF extraction with page-by-page OCR
- ✅ **Responsive Design** — Mobile-friendly layout utilizing the Bootstrap 5 grid system

---

## 🛠 Tech Stack

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime environment |
| **Express.js** | 5.2.1 | Web application framework for routing and middleware |
| **MongoDB** | Cloud (Atlas) | NoSQL document database for persistent data storage |
| **Mongoose** | 9.1.6 | MongoDB Object Data Modeling (ODM) library |
| **Tesseract.js** | 7.0.0 | OCR engine for optical character recognition |
| **bcrypt** | 6.0.0 | Cryptographic password hashing with salt rounds |
| **jsonwebtoken** | 9.0.3 | JWT token generation, signing, and verification |
| **multer** | 2.0.2 | Multipart form-data file upload handling |
| **heic-convert** | 2.1.0 | HEIC/HEIF to JPEG image format conversion |
| **pdf-to-img** | 5.0.0 | PDF document to image conversion for OCR processing |
| **cookie-parser** | 1.4.7 | HTTP cookie parsing middleware |
| **cors** | 2.8.6 | Cross-Origin Resource Sharing policy management |
| **dotenv** | 17.2.4 | Environment variable configuration loader |

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
| **npm** | Package management and script execution |

---

## 📁 Project Directory Structure

```
web-tech-app/
├── .gitignore                          # Git ignore configuration
├── README.md                           # Project documentation (this file)
│
├── backend/                            # Server-side application
│   ├── .env                            # Environment variables (not committed)
│   ├── package.json                    # Node.js dependencies and scripts
│   ├── package-lock.json               # Dependency lock file (not committed)
│   ├── server.js                       # Main Express server entry point
│   ├── seeder.js                       # Database seeder for default accounts
│   ├── eng.traineddata                 # Tesseract OCR English language data
│   │
│   ├── config/                         # Configuration files
│   │   └── db.js                       # MongoDB connection with retry logic
│   │
│   ├── controllers/                    # Business logic layer (request handlers)
│   │   ├── admin.controller.js         # Admin operations (stats, user management)
│   │   ├── auth.controller.js          # Authentication (register, login, logout)
│   │   ├── history.controller.js       # Conversion history CRUD operations
│   │   └── ocr.controller.js           # OCR image processing and text extraction
│   │
│   ├── middleware/                      # Express middleware functions
│   │   ├── admin.middleware.js          # Admin & superadmin role authorization
│   │   ├── auth.middleware.js           # JWT authentication & optional auth
│   │   ├── upload.middleware.js         # Multer file upload configuration
│   │   └── validateFile.middleware.js   # File type and size validation
│   │
│   ├── models/                         # Mongoose database schemas
│   │   ├── User.model.js               # User schema (name, email, password, role)
│   │   └── ConversionLog.model.js      # Conversion history schema
│   │
│   ├── routes/                         # API route definitions
│   │   ├── admin.routes.js             # /api/admin/* route endpoints
│   │   ├── auth.routes.js              # /api/auth/* route endpoints
│   │   ├── history.routes.js           # /api/history/* route endpoints
│   │   └── ocr.routes.js               # /api/ocr/* route endpoints
│   │
│   └── utils/                          # Utility functions and helpers
│       └── ocrProcessor.js             # Tesseract.js worker pool and OCR engine
│
└── frontend/                           # Client-side application
    ├── index.html                      # Landing page and OCR converter interface
    │
    ├── admin/                          # Admin panel pages
    │   ├── dashboard.html              # Admin dashboard with stats and charts
    │   └── users.html                  # User management and role administration
    │
    ├── auth/                           # Authentication pages
    │   ├── login.html                  # User login form
    │   ├── register.html               # User registration form
    │   └── forgot-password.html        # Password recovery form
    │
    ├── css/                            # Stylesheets
    │   └── style.css                   # Main application stylesheet
    │
    ├── js/                             # JavaScript modules
    │   ├── main.js                     # Core application logic (OCR, UI, utilities)
    │   ├── auth.js                     # Authentication logic (login, register, session)
    │   └── dashboard.js                # Admin dashboard logic (stats, charts, users)
    │
    └── assets/                         # Static assets (images, icons, media)
```

---

## 🏗 Architecture & Design Patterns

### MVC Architecture (Model-View-Controller)

The backend follows the **MVC pattern** to maintain a clean separation of concerns across the application:

```
Client Request
      │
      ▼
   Routes          ─── Define URL endpoints and attach middleware
      │
      ▼
  Middleware        ─── Authentication, file upload, validation
      │
      ▼
  Controllers      ─── Business logic and response handling
      │
      ▼
   Models           ─── Database schemas and data operations
      │
      ▼
  MongoDB           ─── Persistent data storage (Atlas)
```

| Layer | Location | Responsibility |
|-------|----------|---------------|
| **Model** | `models/*.model.js` | Define database schemas, data validation rules, and Mongoose hooks |
| **View** | `frontend/**/*.html` | Render the user interface (served as static files by Express) |
| **Controller** | `controllers/*.controller.js` | Process requests, execute business logic, and return responses |
| **Routes** | `routes/*.routes.js` | Map URL endpoints to controllers with middleware chains |
| **Middleware** | `middleware/*.middleware.js` | Handle cross-cutting concerns (authentication, file uploads, validation) |
| **Config** | `config/db.js` | Manage database connection lifecycle and retry logic |
| **Utils** | `utils/ocrProcessor.js` | Encapsulate the OCR worker pool and image processing pipeline |

### RESTful API Design Principles

All API endpoints follow REST architectural conventions:

| Principle | Implementation |
|-----------|---------------|
| **Resource-Based URIs** | Nouns for resource names (`/users`, `/history`, `/admin/stats`) |
| **HTTP Methods** | `GET` (read), `POST` (create), `DELETE` (remove), `PATCH` (update) |
| **API Prefix** | All data endpoints grouped under `/api` to separate from page routes |
| **Consistent Responses** | Uniform JSON format: `{ success: true/false, data/error, message }` |
| **Status Codes** | Proper HTTP codes: `200`, `201`, `400`, `401`, `403`, `404`, `500` |
| **Pagination** | Query parameters `?page=1&limit=10` for list endpoints |
| **Clean URLs** | Page routes without `.html` extensions (e.g., `/auth/login`) |

---

## 🗄 Database Schema

### User Model (`User.model.js`)

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | User's display name (required) |
| `email` | String | Unique email address (required, indexed) |
| `password` | String | Bcrypt-hashed password (required) |
| `role` | String | Access level: `user`, `admin`, or `superadmin` (default: `user`) |
| `isActive` | Boolean | Account status flag (default: `true`) |
| `createdAt` | Date | Account creation timestamp (auto-generated) |
| `updatedAt` | Date | Last modification timestamp (auto-generated) |

### ConversionLog Model (`ConversionLog.model.js`)

| Field | Type | Description |
|-------|------|-------------|
| `userId` | ObjectId | Reference to the User who performed the conversion |
| `originalFileName` | String | Name of the uploaded file |
| `extractedText` | String | OCR-extracted text content |
| `confidence` | Number | OCR accuracy confidence score (0–100) |
| `fileType` | String | MIME type of the uploaded file |
| `fileSize` | Number | File size in bytes |
| `createdAt` | Date | Conversion timestamp (auto-generated) |

---

## 📡 REST API Endpoints

**Base URL:** `http://localhost:3000/api`

### Authentication Endpoints

| # | Feature | Endpoint | Method | Parameters | Response Fields |
|---|---------|----------|--------|-----------|----------------|
| 1 | User Registration | `/auth/register` | `POST` | name, email, password (body) | success, user (id, name, email, role), token (cookie) |
| 2 | User Login | `/auth/login` | `POST` | email, password (body) | success, user (id, name, email, role), token (cookie) |
| 3 | User Logout | `/auth/logout` | `POST` | None (requires auth cookie) | success, message |
| 4 | Get Current User | `/auth/me` | `GET` | None (requires auth cookie) | success, user (id, name, email, role, createdAt) |
| 5 | Check Email Exists | `/auth/check-email` | `POST` | email (body) | success, exists (boolean) |

### OCR Endpoint

| # | Feature | Endpoint | Method | Parameters | Response Fields |
|---|---------|----------|--------|-----------|----------------|
| 6 | OCR Image Conversion | `/ocr/convert` | `POST` | images (multipart/form-data) Max 5 files, 10MB each | success, message, summary (total, successful, failed), results[] (filename, success, text, confidence, error) |

### History Endpoints (Requires Authentication)

| # | Feature | Endpoint | Method | Parameters | Response Fields |
|---|---------|----------|--------|-----------|----------------|
| 7 | Get Conversion History | `/history` | `GET` | page, limit (query params) | success, history[], pagination (page, limit, total, pages) |
| 8 | Get Single History Item | `/history/:id` | `GET` | id (URL param) | success, history (id, originalFileName, extractedText, createdAt) |
| 9 | Delete History Item | `/history/:id` | `DELETE` | id (URL param) | success, message |
| 10 | Clear All History | `/history` | `DELETE` | None | success, message, deletedCount |

### Admin Endpoints (Requires Admin Role)

| # | Feature | Endpoint | Method | Parameters | Response Fields |
|---|---------|----------|--------|-----------|----------------|
| 11 | Get Dashboard Stats | `/admin/stats` | `GET` | None (requires admin cookie) | success, stats (totalUsers, totalConversions, todayConversions, recentConversions[]) |
| 12 | Get All Users | `/admin/users` | `GET` | page, limit (query params) | success, users[], pagination (page, limit, total, pages) |
| 13 | Get Single User | `/admin/users/:id` | `GET` | id (URL param) | success, user (id, name, email, role, isActive, createdAt) |
| 14 | Toggle User Status | `/admin/users/:id/status` | `PATCH` | id (URL param) | success, user (id, isActive), message |
| 15 | Change User Role | `/admin/users/:id/role` | `PATCH` | id (URL param), role (body) | success, user (id, role), message |

---

## 🚀 Setup & Installation

### Prerequisites

Ensure the following software is installed on your machine before proceeding:

1. **Node.js** (v18 or higher) — [https://nodejs.org/](https://nodejs.org/)
2. **npm** (included with Node.js installation)
3. **Git** — [https://git-scm.com/](https://git-scm.com/)
4. **MongoDB Atlas Account** (or a local MongoDB instance) — [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)

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

This command installs all required Node.js packages as defined in `package.json`.

### Step 3: Configure Environment Variables

Create a `.env` file inside the `backend/` directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Connection String
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
```

> **Important:** Replace the placeholder values in `MONGO_URI` with your actual MongoDB Atlas credentials. The `.env` file is excluded from version control via `.gitignore` to protect sensitive information.

### Step 4: Seed Default Accounts

Run the database seeder to create the default admin and test user accounts:

```bash
node seeder.js
```

This will populate the database with the pre-configured accounts listed in the [Default User Accounts](#-default-user-accounts--role-access) section.

### Step 5: Start the Server

```bash
# Production mode
npm start

# Development mode (auto-restart on file changes)
npm run dev
```

Once started, the server will be accessible at `http://localhost:3000`.

---

## 🌐 Accessing the Application

After starting the server, open a web browser and navigate to any of the following pages:

| Page | URL |
|------|-----|
| **Home / OCR Converter** | `http://localhost:3000` |
| **Login** | `http://localhost:3000/auth/login` |
| **Register** | `http://localhost:3000/auth/register` |
| **Forgot Password** | `http://localhost:3000/auth/forgot-password` |
| **Admin Dashboard** | `http://localhost:3000/admin/dashboard` |
| **User Management** | `http://localhost:3000/admin/users` |
| **API Health Check** | `http://localhost:3000/api/health` |

---

## 👤 Default User Accounts & Role Access

The following accounts are created by the database seeder (`seeder.js`):

| Username | Role | Password |
|----------|------|----------|
| admin-user | **superadmin** | `eX6LooLPiVfCuZF6` |
| test-user | **user** | `VitBxRJVNwqdHLsQ` |

### Role-Based Access Control Matrix

| Permission | User | Admin | Superadmin |
|-----------|:----:|:-----:|:----------:|
| Perform OCR Image Conversion | ✅ | ✅ | ✅ |
| View Own Conversion History | ✅ | ✅ | ✅ |
| Delete Own Conversion History | ✅ | ✅ | ✅ |
| Access Admin Dashboard | ❌ | ✅ | ✅ |
| View All Registered Users | ❌ | ✅ | ✅ |
| Activate / Deactivate Users | ❌ | ✅ | ✅ |
| View Platform Statistics | ❌ | ✅ | ✅ |
| Change User Roles | ❌ | ❌ | ✅ |

---

## 📄 Project Documentation Links

| Document | Link |
|----------|------|
| API Testing Evidence Document | [Google Docs](https://docs.google.com/document/d/1Dy_AZTZUmfaXDNUsZJ2sT2C8Ql5BlMrPPcbbarUE2aY/edit?usp=sharing) |
| Postman Collection & Environment Files | [Google Drive](https://drive.google.com/drive/folders/161GvthrYjIRRU98gUH0n_Kk2WSjGz86x?usp=sharing) |
| UML Class Diagram | [Google Drive](https://drive.google.com/file/d/1N6aiYrpLr0-uCCgnmWqELqAG6obFmbSI/view?usp=sharing) |
| Use Case Diagram | [Google Drive](https://drive.google.com/file/d/1qijDwGLEIh7zaWLz7aWpQWt5eAUfguC2/view?usp=sharing) |

> **Note:** The Postman Collection folder also contains the `.env` configuration file and MongoDB URI text files. These files are not committed to the repository and have restricted access outside the organization.

---

## 🔒 Security Implementation

| Feature | Implementation |
|---------|---------------|
| **Password Hashing** | bcrypt with salt rounds for irreversible password storage |
| **JWT Authentication** | JSON Web Tokens stored in HTTPOnly cookies (not localStorage) |
| **HTTPOnly Cookies** | Prevents client-side JavaScript from accessing authentication tokens (XSS protection) |
| **Role-Based Access Control** | Three-tier middleware authorization chain (user → admin → superadmin) |
| **Input Validation** | Server-side validation and sanitization for all user inputs and file uploads |
| **File Type Validation** | Whitelist-based MIME type verification for uploaded files |
| **File Size Limits** | Maximum 10MB per file, 5 files per request to prevent abuse |
| **CORS Configuration** | Configurable cross-origin policy (permissive in development, restrictive in production) |
| **Environment Variables** | Sensitive credentials stored in `.env` files excluded from version control |
| **DNS Configuration** | Google DNS (8.8.8.8) configured for reliable MongoDB Atlas SRV lookups on Windows |

---

## 📌 Development Phases

| Phase | Description |
|-------|-------------|
| Phase 1 | Project initialization, folder structure, Express server setup, MongoDB configuration |
| Phase 2 | User authentication system — registration, login, logout, JWT token management |
| Phase 3 | OCR engine integration with Tesseract.js, multi-format image support (HEIC, PDF) |
| Phase 4 | Conversion history API, admin dashboard statistics, and user management endpoints |
| Phase 5 | Frontend implementation — responsive UI, admin panel, user management interface |
| Phase 6 | Project documentation (README), RESTful clean URL routing, API integration plan |

---

<div align="center">
  <p><strong>ImageToTextOnline</strong> — Built with ☕ by Oliver Jann Klein Borre</p>
  <p><em>MO-IT149 - Web Technology Application — Mapua Malayan Digital College</em></p>
  <p>© 2026 Oliver Jann Klein Borre. All rights reserved.</p>
</div>
