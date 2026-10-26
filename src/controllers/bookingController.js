const Booking = require('../models/Booking');
const Showtime = require('../models/Showtime');

exports.createBooking = async (req, res, next) => {
  try {
    const { showtimeId, seats, seatCategory, paymentMethod, addons, totalAmount: reqTotal, convenienceFee, upiId, paymentRef, theater } = req.body;
    const showtime = await Showtime.findById(showtimeId).populate('movie');
    if (!showtime) return res.status(404).json({ success: false, message: 'Showtime not found' });

    // Verify seats are locked by this user
    const now = new Date();
    const userLocks = showtime.lockedSeats.filter(l =>
      l.userId.toString() === req.user._id.toString() && l.lockedUntil > now
    );
    const lockedByUser = userLocks.map(l => l.seat);
    const allLocked = seats.every(s => lockedByUser.includes(s));
    if (!allLocked) return res.status(409).json({ success: false, message: 'Seats not locked or lock expired' });

    const priceMap = showtime.price;
    const price = priceMap[seatCategory] || priceMap.standard;
    const ticketAmount = price * seats.length;
    const addonsTotal = (addons || []).reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
    const fee = convenienceFee !== undefined ? convenienceFee : Math.round(ticketAmount * 0.08);
    const calculatedTotal = reqTotal || (ticketAmount + addonsTotal + fee);

    const booking = await Booking.create({
      user: req.user._id,
      showtime: showtimeId,
      seats,
      seatCategory,
      ticketAmount,
      convenienceFee: fee,
      addons: addons || [],
      totalAmount: calculatedTotal,
      theater: theater || 'IMovies Grand Luxe Cineplex',
      paymentMethod: paymentMethod || 'upi',
      upiId: upiId || '',
      paymentRef: paymentRef || ('TXN' + Math.floor(1000000000 + Math.random() * 9000000000))
    });

    // Confirm seats
    showtime.bookedSeats.push(...seats);
    showtime.lockedSeats = showtime.lockedSeats.filter(l => l.userId.toString() !== req.user._id.toString());
    await showtime.save();

    await booking.populate([{ path: 'showtime', populate: { path: 'movie' } }]);

    // Persist to physical disk file so user can inspect data folder
    try {
      const fs = require('fs');
      const path = require('path');
      const dataDir = path.join(__dirname, '../../data');
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      const filePath = path.join(dataDir, 'bookings.json');
      let diskBookings = [];
      if (fs.existsSync(filePath)) {
        try { diskBookings = JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch (e) {}
      }
      diskBookings.unshift({
        bookingRef: booking.bookingRef,
        movie: showtime.movie?.title || 'Movie',
        date: showtime.date,
        time: showtime.startTime,
        hall: showtime.hall,
        seats: booking.seats,
        seatCategory: booking.seatCategory,
        addons: booking.addons,
        totalAmount: booking.totalAmount,
        paymentMethod: booking.paymentMethod,
        userEmail: req.user.email,
        userName: req.user.name,
        bookedAt: new Date().toISOString(),
        status: 'confirmed'
      });
      fs.writeFileSync(filePath, JSON.stringify(diskBookings, null, 2));
    } catch (diskErr) {
      console.warn('⚠️ Disk sync error:', diskErr.message);
    }

    res.status(201).json({ success: true, data: booking });
  } catch (err) { next(err); }
};

exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate({ path: 'showtime', populate: { path: 'movie', select: 'title posterUrl' } })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
  } catch (err) { next(err); }
};

exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({ path: 'showtime', populate: { path: 'movie' } })
      .populate('user', 'name email');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });
    if (booking.status === 'cancelled') return res.status(400).json({ success: false, message: 'Already cancelled' });

    booking.status = 'cancelled';
    await booking.save();

    // Release seats
    const showtime = await Showtime.findById(booking.showtime);
    if (showtime) {
      showtime.bookedSeats = showtime.bookedSeats.filter(s => !booking.seats.includes(s));
      await showtime.save();
    }

    res.json({ success: true, message: 'Booking cancelled', data: booking });
  } catch (err) { next(err); }
};

exports.getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate({ path: 'showtime', populate: { path: 'movie', select: 'title' } })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
  } catch (err) { next(err); }
};
