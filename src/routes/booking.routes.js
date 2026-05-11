const express = require('express');
const router = express.Router();
const { getAllBookings, getBookingById, createBooking, cancelBooking, updateBookingStatus } = require('../controllers/booking.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

// Manager & Receptionist can view and manage bookings
router.get('/', authorize('manager', 'receptionist'), getAllBookings);
router.get('/:id', authorize('manager', 'receptionist'), getBookingById);
router.post('/', authorize('manager', 'receptionist'), createBooking);
router.patch('/:id/cancel', authorize('manager', 'receptionist'), cancelBooking);
router.patch('/:id/status', authorize('manager', 'receptionist'), updateBookingStatus);

module.exports = router;
