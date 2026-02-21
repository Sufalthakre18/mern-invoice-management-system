# Invoice Management System

A full-stack invoice management application built with the MERN stack for the Meru Technosoft Full Stack Development Internship Assignment.

## 🔗 Live Demo

| | Link |
|---|---|
| **Frontend** | https://invoice-management-system-sand.vercel.app/ |
| **Backend API** | https://invoice-management-system-fcf2.onrender.com/ |
| **Source Code** | https://github.com/Sufalthakre18/mern-invoice-management-system |
| **Demo Video** | https://drive.google.com/file/d/1iURiHbd-ypqvAKm2ayISfwPxY4_XmVEa/view?usp=sharing |


![Demo](./demo.gif)


> **Demo Credentials**
> Email: `demo@example.com` | Password: `password123`

---

## 📋 Assignment Coverage

### ✅ Core Requirements

| Requirement | Status |
|---|---|
| Invoice, InvoiceLine, Payment database models | ✅ Done |
| `GET /api/invoices/:id` — invoice with line items & payments | ✅ Done |
| `POST /api/invoices/:id/payments` — add payment with business rules | ✅ Done |
| `POST /api/invoices/archive` — archive invoice | ✅ Done |
| `POST /api/invoices/restore` — restore invoice | ✅ Done |
| Invoice detail page at `/invoices/:id` | ✅ Done |
| Header: number, customer, status badge, dates | ✅ Done |
| Line items table | ✅ Done |
| Totals section | ✅ Done |
| Payments section with Add Payment modal | ✅ Done |
| Business rules: no overpayment, auto PAID status | ✅ Done |

### ✅ Bonus Features

| Bonus | Status |
|---|---|
| JWT Authentication (register / login) | ✅ Done |
| PDF generation and download | ✅ Done |
| Tax logic (configurable GST %) | ✅ Done |
| Multi-currency (INR, USD, EUR, GBP, AED) | ✅ Done |
| Currency converter endpoint + UI | ✅ Done |
| Overdue logic (auto-detects past due date) | ✅ Done |

---

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js**
- **MongoDB** + **Mongoose**
- **JWT** + **bcryptjs** for authentication
- **PDFKit** for PDF generation

### Frontend
- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **Tailwind CSS v4**
- **Axios** — HTTP client with JWT interceptors
- **React Hook Form** — form validation
- **Context API** — auth state management
- **TypeScript**

---

## 📁 Project Structure

```
├── backend/
│   └── src/
│       ├── config/db.js
│       ├── controllers/
│       │   ├── authController.js
│       │   └── invoiceController.js
│       ├── middleware/authMiddleware.js
│       ├── models/
│       │   ├── User.js
│       │   ├── Invoice.js
│       │   ├── InvoiceLine.js
│       │   └── Payment.js
│       ├── routes/
│       │   ├── authRoutes.js
│       │   └── invoiceRoutes.js
│       ├── utils/pdfGenerator.js
│       └── server.js
│
└── frontend/
    └── src/
        ├── app/
        │   ├── login/
        │   ├── register/
        │   └── invoices/
        │       ├── page.tsx          ← Invoice list
        │       ├── new/page.tsx      ← Create invoice
        │       └── [id]/page.tsx     ← Invoice detail
        ├── components
        │   ├── StatusBadge.tsx
        │   ├── PaymentModal.tsx
        │   └── CurrencyConverter.tsx
        ├── context/AuthContext.tsx
        └── lib/api.ts
```

---

## ⚙️ How to Run Backend

### Prerequisites
- Node.js v18+
- MongoDB running locally or a MongoDB Atlas URI

### Steps

```bash
# 1. Enter backend folder
cd backend

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/invoice_db
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
```

```bash
# 4. (Optional) Seed demo data
npm run seed
# Creates: demo@example.com / password123 + 3 sample invoices

# 5. Start the server
npm run dev        # development
npm start          # production
```

Server runs at: `http://localhost:5000`

---

## 🖥️ How to Run Frontend

### Prerequisites
- Node.js v18+
- Backend running on port 5000

### Steps

```bash
# 1. Enter frontend folder
cd frontend

# 2. Install dependencies
npm install

# 3. Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local

# 4. Start dev server
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## 🔌 API Reference

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |

### Invoices (all require `Authorization: Bearer <token>`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invoices` | Get all invoices |
| POST | `/api/invoices` | Create invoice with line items |
| GET | `/api/invoices/:id` | Get invoice details, line items, payments |
| POST | `/api/invoices/:id/payments` | Add payment |
| GET | `/api/invoices/:id/pdf` | Download PDF |
| GET | `/api/invoices/:id/convert?to=USD` | Convert to another currency |
| POST | `/api/invoices/archive` | Archive invoice |
| POST | `/api/invoices/restore` | Restore archived invoice |

### Business Rules
- `lineTotal = quantity × unitPrice`
- `taxAmount = subtotal × taxRate / 100`
- `total = subtotal + taxAmount`
- `balanceDue = total − amountPaid`
- Payment amount must be `> 0` and `≤ balanceDue` (no overpayment)
- When `balanceDue = 0` → status automatically set to `PAID`
- When `dueDate` has passed and balance remains → status set to `OVERDUE`

---

## 🌍 Supported Currencies

`INR` `USD` `EUR` `GBP` `AED`

---

## 📦 Environment Variables

### Backend `.env`
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/invoice_db
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
```