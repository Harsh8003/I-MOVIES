const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  genre: [{ type: String }],
  language: { type: String, default: 'English' },
  duration: { type: Number, required: true }, // minutes
  rating: { type: Number, default: 0, min: 0, max: 10 },
  posterUrl: { type: String, default: '' },
  trailerUrl: { type: String, default: '' },
  cast: [{ type: String }],
  director: { type: String, default: '' },
  releaseDate: { type: Date },
  isActive: { type: Boolean, default: true },
  featured: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Movie', movieSchema);
