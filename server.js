// server.js
require('dotenv').config();
require('express-async-errors');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const { authMiddleware } = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes); 
app.use('/api/users', authMiddleware, userRoutes);

// IMPORTANT: Apply products routes WITHOUT global auth middleware
// Let the individual routes handle their own authentication
app.use('/api/products', productRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve product detail pages for clean URLs
app.get('/:slug([a-zA-Z0-9-]+)', (req, res, next) => {
  const excludedRoutes = [
    'api', 'index.html', 'dashboard.html', 'users.html', 
    'products.html', 'admin', 'login', 'product-detail.html'
  ];
  
  if (excludedRoutes.includes(req.params.slug)) {
    return next();
  }
  
  res.sendFile(path.join(__dirname, 'public', 'product-detail.html'));
});

// Serve frontend files
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// Serve admin page explicitly
app.get(['/admin', '/admin.html'], (req, res) => {
  res.sendFile(path.join(publicPath, 'admin.html'));
});

// Handle 404 for all other unknown routes
app.use((req, res) => {
  res.status(404).sendFile(path.join(publicPath, '404.html'));
});


// Error handler
app.use((err, req, res, next) => {
  console.error('🚨 Global error handler:', err);
  res.status(err.status || 500).json({ 
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// MongoDB connect + server start
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB Atlas');
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});