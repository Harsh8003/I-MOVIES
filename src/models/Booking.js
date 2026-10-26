const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  showtime: { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime', required: true },
  seats: [{ type: String }],
  seatCategory: { type: String, enum: ['standard', 'premium', 'vip'], default: 'standard' },
  totalAmount: { type: Number, required: true },
  ticketAmount: { type: Number },
  convenienceFee: { type: Number, default: 0 },
  addons: [{
    name: { type: String },
    qty: { type: Number, default: 1 },
    price: { type: Number, default: 0 }
  }],
  theater: { type: String, default: 'IMovies Grand Luxe Cineplex' },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  bookingRef: { type: String, unique: true },
  paymentMethod: { type: String, default: 'upi' },
  upiId: { type: String },
  paymentRef: { type: String }
}, { timestamps: true });

bookingSchema.pre('save', function (next) {
  if (!this.bookingRef) {
    this.bookingRef = 'IMV-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
