const mongoose = require('mongoose');

const showtimeSchema = new mongoose.Schema({
  movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  hall: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  startTime: { type: String, required: true }, // HH:MM
  endTime: { type: String },
  totalSeats: { type: Number, default: 60 },
  bookedSeats: [{ type: String }],
  lockedSeats: [{
    seat: String,
    userId: mongoose.Schema.Types.ObjectId,
    lockedUntil: Date
  }],
  price: {
    standard: { type: Number, default: 150 },
    premium: { type: Number, default: 250 },
    vip: { type: Number, default: 400 }
  },
  status: { type: String, enum: ['scheduled', 'cancelled', 'completed'], default: 'scheduled' }
}, { timestamps: true });

module.exports = mongoose.model('Showtime', showtimeSchema);
