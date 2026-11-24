const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth');
const qrcodeRoutes = require('./routes/qrcodes');
const redirectRoutes = require('./routes/redirect');

const app = express();

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/qrcodes', qrcodeRoutes);

// Dynamic redirection route: /r/:shortCode
app.use('/r', redirectRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    platform: process.env.VERCEL ? 'vercel' : 'node',
    timestamp: new Date().toISOString() 
  });
});

// Serve built frontend if dist folder exists (local mode)
const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');
if (require('fs').existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/r')) return next();
    const indexPath = path.join(clientDistPath, 'index.html');
    if (require('fs').existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });
}

module.exports = app;
