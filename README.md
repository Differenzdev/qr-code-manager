# QR Code Management System

A modern, full-stack QR Code Management System with authenticated multi-user access, real-time QR generation, persistent URL association, custom-named downloads (PNG/SVG), rich sharing options, and an interactive dashboard.

---

## Key Features & Requirements Matrix

| Requirement | Implementation Details |
| :--- | :--- |
| **1. Login Page** | Secure JWT authentication with bcrypt password hashing. Includes registration, login, and 1-click Demo Account login (`demo@example.com` / `demo1234`). |
| **2. QR Code Generation** | Real-time generation of multiple QR codes with live preview, error correction levels (L, M, Q, H), color palettes, and custom styling. |
| **3. Add URL** | Associate any target URL/link with each QR code. Includes URL validation and support for dynamic trackable routing or direct URL encoding. |
| **4. Save QR Codes** | Persistent save button stores all QR codes, metadata, categories, and styling directly into disk-backed storage. |
| **5. Share QR Codes** | Shareable direct links, Web Share API support, 1-click clipboard image copying, HTML embed snippets, and social sharing (WhatsApp, X, LinkedIn, Telegram, Email). |
| **6. Download QR Codes** | Users can specify a **custom, user-defined file name** (e.g. `summer-menu-qr`), format (PNG raster or SVG vector), and resolution (256px to 2048px). |
| **7. Multiple QR Codes** | High-density dashboard supporting grid and table views, real-time search, category filters, sorting, duplication, and statistics. |
| **8. Persistent URL Storage** | All URLs and QR configurations are permanently stored in `server/data/qrcode_db.json`. Changing browsers, logging out, restarting systems, or returning after long periods **never resets** or loses associated URLs. |

---

## Tech Stack

- **Backend**: Node.js, Express, `qrcode`, `jsonwebtoken`, `bcryptjs`, atomic disk persistence engine.
- **Frontend**: React 19, Vite, Tailwind CSS, `lucide-react`, `qrcode.react`, `canvas-confetti`.
- **Database**: Server-side disk-backed JSON database with atomic write locks and indexed queries.

---

## Quickstart Guide

### 1. Start the Backend API & Production Server
```bash
cd server
npm start
# Server runs on http://localhost:5000
```

### 2. (Optional) Run Frontend in Vite Development Mode
```bash
cd client
npm run dev
# Vite runs on http://localhost:5173 with automatic backend proxy
```

### 3. Build Frontend for Production
```bash
cd client
npm run build
# Built files are automatically served by the Express server at http://localhost:5000
```

---

## Demo Credentials
- **Email**: `demo@example.com`
- **Password**: `demo1234`
- *(Or click the "Instant 1-Click Demo Login" button on the login screen)*

---

## API Endpoints

- `POST /api/auth/register` - Create a new user account
- `POST /api/auth/login` - Authenticate and receive JWT token
- `GET /api/auth/me` - Get authenticated user profile
- `GET /api/qrcodes` - List QR codes (with query params: `search`, `category`, `sortBy`, `sortOrder`)
- `POST /api/qrcodes` - Create & save a new QR code with associated target URL
- `GET /api/qrcodes/:id` - Fetch details of a single QR code
- `PUT /api/qrcodes/:id` - Update title, category, or associated target URL
- `DELETE /api/qrcodes/:id` - Permanently remove a QR code
- `POST /api/qrcodes/:id/duplicate` - Duplicate an existing QR code
- `GET /api/qrcodes/:id/download` - Server-side PNG or SVG download
- `GET /api/qrcodes/public/:id` - Fetch public details for sharing
- `GET /r/:shortCode` - Dynamic redirect endpoint that tracks scans and redirects (HTTP 302) to the persistent target URL
