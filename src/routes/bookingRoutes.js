const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, getBooking, cancelBooking, getAllBookings } = require('../controllers/bookingController');
const { protect, protectOrGuest, adminOnly } = require('../middleware/auth');

router.post('/', protectOrGuest, createBooking);
router.get('/', protectOrGuest, getMyBookings);
router.get('/my', protectOrGuest, getMyBookings);
router.get('/admin/all', protect, adminOnly, getAllBookings);
router.get('/:id', protectOrGuest, getBooking);
router.post('/:id/cancel', protectOrGuest, cancelBooking);
router.delete('/:id', protectOrGuest, cancelBooking);

module.exports = router;
