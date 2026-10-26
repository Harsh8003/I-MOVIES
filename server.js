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
    const isDbConnected = mongoose.connection.readyState === 1;
    let movieCount = 0, bookingCount = 0, showtimeCount = 0;
    if (isDbConnected) {
      try {
        const Movie = require('./src/models/Movie');
        const Booking = require('./src/models/Booking');
        const Showtime = require('./src/models/Showtime');
        [movieCount, bookingCount, showtimeCount] = await Promise.all([
          Movie.countDocuments(),
          Booking.countDocuments(),
          Showtime.countDocuments()
        ]);
      } catch (countErr) {
        // Safe to ignore during initial sync
      }
    }
    res.json({
      status: 'online',
      message: 'IMovies Backend & Database Operational 🟢',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        engine: mongoose.connection.host ? `MongoDB (${mongoose.connection.host})` : 'MongoDB In-Memory',
        connected: isDbConnected,
        host: mongoose.connection.host || 'active',
      },
      stats: {
        movies: movieCount,
        showtimes: showtimeCount,
        bookings: bookingCount
      },
      port: PORT
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(errorHandler);

const PORT = parseInt(process.env.PORT, 10) || 5000;
const HOST = '0.0.0.0';

const startServer = async () => {
  // Connect to MongoDB (Atlas or In-Memory)
  await connectDB();

  // Auto-seed demo data
  await require('./src/utils/seed').seedData();

  const server = app.listen(PORT, HOST, () => {
    console.log(`\n╔══════════════════════════════════════════════════════╗`);
    console.log(`║           🎬  IMovies Cinema Ready!                  ║`);
    console.log(`╠══════════════════════════════════════════════════════╣`);
    console.log(`║  🌐  Server active:  http://${HOST}:${PORT}              ║`);
    console.log(`║  ⚙️  Environment:    ${process.env.NODE_ENV || 'development'}                     ║`);
    console.log(`╠══════════════════════════════════════════════════════╣`);
    console.log(`║  👤  Demo: admin@imovies.com / admin123              ║`);
    console.log(`╚══════════════════════════════════════════════════════╝\n`);
  });

  server.on('error', (err) => {
    console.error(`❌ Server startup error on port ${PORT}:`, err.message);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('Shutting down server gracefully...');
    server.close(() => {
      const mongoose = require('mongoose');
      mongoose.connection.close(false).then(() => {
        console.log('Database connection closed.');
        process.exit(0);
      });
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();

