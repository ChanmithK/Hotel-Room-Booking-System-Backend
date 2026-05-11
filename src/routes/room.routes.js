const express = require('express');
const router = express.Router();
const { getAllRooms, getAvailableRooms, getRoomById, createRoom, updateRoom, deleteRoom } = require('../controllers/room.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

// All roles can view rooms
router.get('/', getAllRooms);
router.get('/available', getAvailableRooms);
router.get('/:id', getRoomById);

// Manager only can manage rooms
router.post('/', authorize('manager'), createRoom);
router.put('/:id', authorize('manager'), updateRoom);
router.delete('/:id', authorize('manager'), deleteRoom);

module.exports = router;
