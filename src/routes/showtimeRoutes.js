const express = require('express');
const router = express.Router();
const { getShowtimes, getShowtime, createShowtime, updateShowtime, lockSeats } = require('../controllers/showtimeController');
const { protect, protectOrGuest, adminOnly } = require('../middleware/auth');

router.get('/', getShowtimes);
router.get('/:id', getShowtime);
router.post('/', protect, adminOnly, createShowtime);
router.put('/:id', protect, adminOnly, updateShowtime);
router.post('/action/lock', protectOrGuest, lockSeats);

module.exports = router;
