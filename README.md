# 🛒 ShopKart - Full Stack E-Commerce App

A full-stack e-commerce shopping cart application built with **React (Vite)** on the frontend and **Node.js / Express / MongoDB** on the backend.

---

## 📁 Project Structure

```
Shop-kart/
├── backend/              # Express.js REST API
│   ├── config/           # Razorpay config
│   ├── controllers/      # Route controllers
│   ├── middlewares/      # Auth middleware (JWT)
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── utils/            # Token generation
│   ├── index.js          # Server entry point
│   └── .env.example      # Environment variable template
└── frontend/
    └── my-react-app/     # React + Vite frontend
        ├── src/
        │   ├── components/
        │   ├── context/
        │   ├── css/
        │   ├── pages/
        │   ├── services/
        │   └── utils/
        └── vite.config.js
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account
- Razorpay account (for payments)

---

### 🔧 Backend Setup

1. Navigate to the root directory:
   ```bash
   cd Shop-kart
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `backend/` folder based on the template:
   ```bash
   cp backend/.env.example backend/.env
   ```

4. Fill in your actual values in `backend/.env`:
   ```
   PORT=5001
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=7d
   COOKIE_MAX_AGE=604800000
   NODE_ENV=development
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```
   Server runs at `http://localhost:5001`

---

### 🎨 Frontend Setup

1. Navigate to the frontend:
   ```bash
   cd frontend/my-react-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   App runs at `http://localhost:5173`

---

## 🚀 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/customers/register` | Register a new user |
| POST | `/api/customers/login` | Login user |
| GET | `/api/products` | Get all products |
| GET | `/api/products/:id` | Get single product |
| GET | `/api/cart` | Get cart items |
| POST | `/api/cart` | Add to cart |
| DELETE | `/api/cart/:id` | Remove from cart |
| GET | `/api/wishlist` | Get wishlist |
| POST | `/api/wishlist` | Add to wishlist |
| GET | `/api/orders` | Get orders |
| POST | `/api/orders` | Place an order |

---

## 🧰 Tech Stack

### Frontend
- React 19 + Vite
- React Router DOM
- Axios
- CSS (custom)

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- bcrypt (password hashing)
- Razorpay (payment gateway)
- cookie-parser, cors, dotenv

---

## 🔒 Security Notes

- All secrets are stored in `.env` (not committed to git)
- JWT tokens are used for authentication
- Passwords are hashed using bcrypt

---

## 👨‍💻 Author

**starkss24** — [GitHub](https://github.com/starkss24)
