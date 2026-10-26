const Movie = require('../models/Movie');

exports.getMovies = async (req, res, next) => {
  try {
    const { genre, search } = req.query;
    let filter = { isActive: true };
    if (genre) filter.genre = { $in: [genre] };
    if (search) filter.title = { $regex: search, $options: 'i' };
    const movies = await Movie.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: movies });
  } catch (err) { next(err); }
};

exports.getMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ success: false, message: 'Movie not found' });
    res.json({ success: true, data: movie });
  } catch (err) { next(err); }
};

exports.createMovie = async (req, res, next) => {
  try {
    const movie = await Movie.create(req.body);
    res.status(201).json({ success: true, data: movie });
  } catch (err) { next(err); }
};

exports.updateMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!movie) return res.status(404).json({ success: false, message: 'Movie not found' });
    res.json({ success: true, data: movie });
  } catch (err) { next(err); }
};

exports.deleteMovie = async (req, res, next) => {
  try {
    await Movie.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Movie removed' });
  } catch (err) { next(err); }
};
