require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// Security & middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limit auth
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/auth', authLimiter);

// API Routes
app.use('/api/auth',      require('./src/routes/authRoutes'));
app.use('/api/movies',    require('./src/routes/movieRoutes'));
app.use('/api/showtimes', require('./src/routes/showtimeRoutes'));
app.use('/api/bookings',  require('./src/routes/bookingRoutes'));

// Live Backend Health & Telemetry
app.get('/api/health', async (req, res) => {
  const mongoose = require('mongoose');
  try {
    const Movie = require('./src/models/Movie');
    const Booking = require('./src/models/Booking');
    const Showtime = require('./src/models/Showtime');
    const [movieCount, bookingCount, showtimeCount] = await Promise.all([
      Movie.countDocuments(),
      Booking.countDocuments(),
      Showtime.countDocuments()
    ]);
    res.json({
      status: 'online',
      message: 'IMovies Backend & Database Operational 🟢',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        engine: 'MongoDB Memory Server + Physical JSON Disk Persistence',
        connected: mongoose.connection.readyState === 1,
        host: mongoose.connection.host || '127.0.0.1',
        diskStorage: 'Service now/data/bookings.json'
      },
      stats: {
        movies: movieCount,
        showtimes: showtimeCount,
        bookings: bookingCount
      },
      ports: [5000, 3000, 8080]
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(errorHandler);

const PORTS = [5000, 3000, 8080];

const startServer = async () => {
  // Connect to in-memory MongoDB
  await connectDB();

  // Auto-seed demo data
  await require('./src/utils/seed').seedData();

  const activeUrls = [];

  for (const port of PORTS) {
    try {
      const server = app.listen(port, () => {
        activeUrls.push(`http://localhost:${port}`);
        console.log(`🌐  Localhost server active on port ${port} -> http://localhost:${port}`);
      });
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`⚠️  Port ${port} in use, trying next port...`);
        } else {
          console.error(`❌  Server error on port ${port}:`, err.message);
        }
      });
    } catch (e) {
      console.warn(`Could not start on port ${port}:`, e.message);
    }
  }

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║           🎬  IMovies Cinema Ready!                  ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║  🌐  Host 1:  http://localhost:5000                   ║');
  console.log('║  🌐  Host 2:  http://localhost:3000                   ║');
  console.log('║  🌐  Host 3:  http://localhost:8080                   ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║  👤  Demo: admin@imovies.com / admin123              ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');
};

startServer();
