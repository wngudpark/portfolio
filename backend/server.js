const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const careerRoutes = require('./routes/careers');

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// The frontend is served from this same server, so same-origin requests need no CORS.
// CORS is enabled only for the configured origin (useful for a separate dev frontend).
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || `http://localhost:${PORT}`,
    credentials: true
  })
);

app.use(express.json());
app.use(cookieParser());

app.set('trust proxy', 1); // needed if later placed behind a reverse proxy

app.use(
  session({
    name: 'portfolio.sid',
    secret: process.env.SESSION_SECRET || 'dev_insecure_secret_change_me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd, // requires HTTPS in production
      maxAge: 1000 * 60 * 60 * 8 // 8 hours
    }
  })
);

// API routes
app.use('/api', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/careers', careerRoutes);

// Serve uploaded thumbnail images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve the static frontend
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));

// SPA fallback: any non-API GET route returns index.html
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\nPortfolio server running:  http://localhost:${PORT}`);
  console.log(`Admin panel:               http://localhost:${PORT}/admin\n`);
});
