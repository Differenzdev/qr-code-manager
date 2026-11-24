const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth');
const qrcodeRoutes = require('./routes/qrcodes');
const redirectRoutes = require('./routes/redirect');

const app = express();

// Enable CORS for all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint (matches both /api/health and /health)
app.get(['/api/health', '/health', '/api', '/'], (req, res, next) => {
  if (req.path === '/' && !process.env.VERCEL) {
    return next(); // Let static handler handle root in local mode
  }
  if (req.path === '/api/health' || req.path === '/health' || req.path === '/api') {
    return res.json({ 
      status: 'ok', 
      platform: process.env.VERCEL ? 'vercel' : 'node',
      timestamp: new Date().toISOString() 
    });
  }
  next();
});

// API Routes: mount both /api/xxx and /xxx to handle Vercel proxying
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/qrcodes', '/qrcodes'], qrcodeRoutes);

// Dynamic redirection route: /r/:shortCode
app.use(['/api/r', '/r'], redirectRoutes);

// Serve built frontend if dist folder exists (local mode)
const clientDistPath = path.join(__dirname, '..', '..', 'dist');
if (require('fs').existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

module.exports = app;
