# Inventory Management System - Full Stack Setup

A complete backend (Node.js/Express + MongoDB) and frontend (HTML/CSS/JS) inventory management system.

## 📁 Project Structure

```
Inventory-Management-System_BE/
├── BE/                          # Backend (Node.js + Express)
│   ├── server.js
│   ├── package.json
│   ├── .env                     # Environment variables
│   ├── controllers/             # Route controllers
│   ├── services/                # Business logic
│   ├── models/                  # MongoDB schemas
│   ├── routes/                  # API endpoints
│   ├── middleware/              # Auth, validation
│   └── public/                  # Static files (served by BE)
│       ├── admin/               # Admin panel
│       ├── jsadmin/             # Admin JS modules
│       └── css/                 # Styles
│
├── FE/                          # Frontend (Static HTML/CSS/JS)
│   ├── index.html               # User login/dashboard
│   ├── admin.html               # Admin panel
│   ├── script.js                # Frontend JS logic
│   ├── jsadmin/                 # Admin modules
│   └── css/                     # Stylesheets
│
├── package.json                 # Root package for running both
└── SETUP.md                     # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** v14+ 
- **npm** or **yarn**
- **MongoDB** running locally (or connection string in `.env`)

### 1️⃣ Installation

```bash
# Install root dependencies (for concurrently script runner)
npm install

# Install backend dependencies
cd BE
npm install
cd ..

# OR use root command (if installed):
npm run install:all
```

### 2️⃣ Configure Environment

The backend `.env` file is already set up in `BE/.env`. Verify these settings:

```
PORT=5000
JWT_SECRET_KEY=your_secret_key
MONGO_URI=mongodb://localhost:27017/login
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
APP_URL=http://localhost:5000
```

**Frontend** uses relative URLs (no `.env` needed), but verify this in `FE/script.js`:

```javascript
const API_URL = 'http://localhost:5000/api'; // Update if backend port changes
```

### 3️⃣ Run the Application

#### **Option A: Backend Only (Production-like)**
```bash
npm run start:be
# Backend runs on http://localhost:5000
# Frontend is served from /public folder
# Access: http://localhost:5000
```

#### **Option B: Frontend with Local Server**
```bash
npm run start:fe
# Requires 'http-server' globally, opens browser at http://localhost:8080
```

#### **Option C: Development Mode (Both with Hot Reload)**
```bash
npm run dev:all
# Backend: http://localhost:5000 (with nodemon)
# Frontend: http://localhost:8080
```

---

## 🔗 API Endpoints

Base URL: `http://localhost:5000/api`

### Authentication
- `POST /auth/register` - Register user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout

### Users (Admin only)
- `GET /users` - List all users
- `POST /users` - Create user
- `GET /users/:id` - Get user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Products
- `GET /products` - List products
- `POST /products` - Create product
- `GET /products/:id` - Get product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product

### Product Types
- `GET /producttypes` - List product types
- `POST /producttypes` - Create product type
- `PUT /producttypes/:id` - Update product type
- `DELETE /producttypes/:id` - Delete product type

### Customers
- `GET /customers` - List customers
- `POST /customers` - Create customer
- `GET /customers/:id` - Get customer
- `PUT /customers/:id` - Update customer
- `DELETE /customers/:id` - Delete customer

### Orders
- `GET /orders` - List orders
- `POST /orders` - Create order
- `PUT /orders/:id` - Update order
- `DELETE /orders/:id` - Delete order

### Inventory
- `GET /inventory` - List transactions
- `POST /inventory` - Create transaction
- `PUT /inventory/:id` - Update transaction
- `DELETE /inventory/:id` - Delete transaction

---

## ✅ Testing Checklist

### 1. Backend Health
```bash
# Should return 200 and data
curl http://localhost:5000/api/producttypes \
  -H "authorization: YOUR_JWT_TOKEN"
```

### 2. Frontend Connectivity
- Open http://localhost:5000 (or http://localhost:8080 if using separate server)
- Try login/signup
- Check browser console for errors (F12)
- Check network tab for API calls

### 3. Admin Panel
- Login with admin account
- Navigate to each section (Products, Customers, Orders, etc.)
- Try CRUD operations (Create, Read, Update, Delete)
- Verify data appears correctly

### 4. Database
```bash
# If using MongoDB locally, check data:
mongo
use login
db.products.find()
db.producttypes.find()
```

---

## 🛠️ Development Tips

### Hot Reload Backend
Backend uses **nodemon** for auto-reload:
```bash
npm run dev:be
```

### Console Debugging
Both backend and frontend log to console:
- **Backend**: Check terminal where `npm run dev:be` runs
- **Frontend**: Browser DevTools (F12 → Console)

### Common Issues

**Issue: "Cannot GET /"**
- Ensure backend is running on port 5000
- Check `BE/public` folder exists
- Verify `app.use(express.static('public'))` in server.js

**Issue: "API call failed"**
- Check CORS is enabled in `server.js`
- Verify JWT token is being sent (check browser Network tab)
- Ensure backend `.env` has correct `PORT` and `MONGO_URI`

**Issue: "Token expired"**
- Token lifetime can be adjusted in auth middleware
- Clear browser localStorage and re-login

---

## 📦 Deployment

### Backend (Node.js)
- Deploy to **Heroku, Railway, Render**, or any Node.js host
- Set environment variables on hosting platform
- Update `FRONTEND_URL` in `.env` for CORS

### Frontend (Static)
- Deploy to **Netlify, Vercel, GitHub Pages**, or CDN
- Update `API_URL` in `script.js` to production backend URL
- Serve from public folder of backend for simplicity

---

## 📝 Project Features

✅ User authentication with JWT  
✅ Admin panel for CRUD operations  
✅ Product & Product Type management  
✅ Customer management  
✅ Order tracking with inventory updates  
✅ Inventory transaction logging  
✅ Email verification support  
✅ Google OAuth integration  
✅ Responsive UI  
✅ Clean architecture (Controllers → Services → Models)  

---

## 📞 Support

For issues or questions:
1. Check error messages in console/terminal
2. Verify `.env` configuration
3. Ensure MongoDB is running
4. Check network connectivity (http://localhost:5000/health)

---

**Last Updated:** December 18, 2025
