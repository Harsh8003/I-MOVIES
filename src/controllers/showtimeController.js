const Showtime = require('../models/Showtime');

exports.getShowtimes = async (req, res, next) => {
  try {
    const { movieId, date } = req.query;
    let filter = { status: 'scheduled' };
    if (movieId) filter.movie = movieId;
    if (date) filter.date = date;
    const showtimes = await Showtime.find(filter).populate('movie', 'title duration posterUrl');
    res.json({ success: true, data: showtimes });
  } catch (err) { next(err); }
};

exports.getShowtime = async (req, res, next) => {
  try {
    const showtime = await Showtime.findById(req.params.id).populate('movie');
    if (!showtime) return res.status(404).json({ success: false, message: 'Showtime not found' });

    // Clean expired locks
    const now = new Date();
    showtime.lockedSeats = showtime.lockedSeats.filter(l => l.lockedUntil > now);
    await showtime.save();

    res.json({ success: true, data: showtime });
  } catch (err) { next(err); }
};

exports.createShowtime = async (req, res, next) => {
  try {
    const showtime = await Showtime.create(req.body);
    res.status(201).json({ success: true, data: showtime });
  } catch (err) { next(err); }
};

exports.updateShowtime = async (req, res, next) => {
  try {
    const showtime = await Showtime.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: showtime });
  } catch (err) { next(err); }
};

exports.lockSeats = async (req, res, next) => {
  try {
    const { showtimeId, seats } = req.body;
    const showtime = await Showtime.findById(showtimeId);
    if (!showtime) return res.status(404).json({ success: false, message: 'Showtime not found' });

    const now = new Date();
    showtime.lockedSeats = showtime.lockedSeats.filter(l => l.lockedUntil > now);

    const unavailable = seats.filter(s =>
      showtime.bookedSeats.includes(s) ||
      showtime.lockedSeats.some(l => l.seat === s && l.userId.toString() !== req.user._id.toString())
    );
    if (unavailable.length > 0)
      return res.status(409).json({ success: false, message: `Seats unavailable: ${unavailable.join(', ')}` });

    const lockUntil = new Date(now.getTime() + 10 * 60 * 1000);
    // Remove previous locks by this user
    showtime.lockedSeats = showtime.lockedSeats.filter(l => l.userId.toString() !== req.user._id.toString());
    seats.forEach(seat => showtime.lockedSeats.push({ seat, userId: req.user._id, lockedUntil: lockUntil }));
    await showtime.save();

    res.json({ success: true, message: 'Seats locked for 10 minutes', lockedUntil: lockUntil });
  } catch (err) { next(err); }
};
