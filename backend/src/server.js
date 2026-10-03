require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Sadeem E-Commerce API',
    region: 'Central Gaza',
    timestamp: new Date(),
  });
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/merchants', require('./routes/merchant.routes'));
app.use('/api/categories', require('./routes/category.routes'));

// Seed default categories asynchronously
const { seedDefaultCategories } = require('./controllers/category.controller');
seedDefaultCategories();

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'المسار المطلوب غير موجود على خادم سَدِيم',
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err);
  res.status(500).json({
    success: false,
    message: 'حدث خطأ غير متوقع في الخادم',
  });
});

app.listen(PORT, () => {
  console.log(`[Sadeem API] Server running on http://localhost:${PORT}`);
});
