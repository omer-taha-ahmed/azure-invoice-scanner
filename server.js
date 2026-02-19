// ============================================================
// Azure Invoice Scanner — Main Server
// ============================================================
// Tech Stack: Express.js + Azure SQL + AI Document Intelligence + Key Vault
// ============================================================

require('dotenv').config();
const express = require('express');
const path = require('path');
const { initializeDatabase } = require('./db/connection');

const app = express();
const PORT = process.env.PORT || 8080;

// ── Middleware ───────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// ── API Routes ──────────────────────────────────────────────
const documentsRouter = require('./routes/documents');
const analyzeRouter = require('./routes/analyze');
const dashboardRouter = require('./routes/dashboard');

app.use('/api/documents', documentsRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/dashboard', dashboardRouter);

// ── Health Check Endpoint ───────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ── Catch-all: serve frontend for any non-API route ─────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Error Handler ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ── Start Server ────────────────────────────────────────────
async function start() {
  try {
    // Initialize database connection and create tables if needed
    await initializeDatabase();
    console.log('✅ Database initialized successfully');

    app.listen(PORT, () => {
      console.log(`🚀 Invoice Scanner running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
