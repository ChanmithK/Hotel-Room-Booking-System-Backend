const Room = require("../models/Room");
const Booking = require("../models/Booking");

// Fetch all active rooms with optional filters
const getAllRooms = async (req, res) => {
  try {
    const { type, floor, capacity, status } = req.query;
    const filter = { isActive: true };

    if (type) filter.type = type;
    if (floor) filter.floor = Number(floor);
    if (capacity) filter.capacity = { $gte: Number(capacity) };
    if (status) filter.status = status;

    const rooms = await Room.find(filter).sort({ floor: 1, roomNumber: 1 });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Find rooms that aren't booked for a specific date range
const getAvailableRooms = async (req, res) => {
  try {
    const { checkIn, checkOut, type, capacity, floor } = req.query;

    if (!checkIn || !checkOut) {
      return res
        .status(400)
        .json({ message: "checkIn and checkOut dates are required" });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkOutDate <= checkInDate) {
      return res
        .status(400)
        .json({ message: "checkOut must be after checkIn" });
    }

    // Find rooms that have overlapping confirmed/checked_in bookings
    const bookedRoomIds = await Booking.distinct("room", {
      status: { $in: ["confirmed", "checked_in"] },
      $or: [{ checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } }],
    });

    const filter = {
      isActive: true,

      // cleaning rooms might be available by check-in
      status: { $in: ["available", "cleaning"] },
      _id: { $nin: bookedRoomIds },
    };

    if (type) filter.type = type;
    if (capacity) filter.capacity = { $gte: Number(capacity) };
    if (floor) filter.floor = Number(floor);

    const rooms = await Room.find(filter).sort({ floor: 1, roomNumber: 1 });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get detailed info for a single room by ID
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a new room to the system — Manager only
const createRoom = async (req, res) => {
  try {
    const {
      roomNumber,
      type,
      floor,
      capacity,
      pricePerNight,
      status,
      amenities,
      description,
    } = req.body;

    const exists = await Room.findOne({ roomNumber });
    if (exists)
      return res.status(400).json({ message: "Room number already exists" });

    const room = await Room.create({
      roomNumber,
      type,
      floor,
      capacity,
      pricePerNight,
      status,
      amenities,
      description,
    });
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update existing room details — Manager only
const updateRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Soft delete a room after checking for active bookings — Manager only
const deleteRoom = async (req, res) => {
  try {
    // Check for active bookings
    const activeBookings = await Booking.findOne({
      room: req.params.id,
      status: { $in: ["confirmed", "checked_in"] },
    });
    if (activeBookings) {
      return res
        .status(400)
        .json({ message: "Cannot delete room with active bookings" });
    }

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );
    if (!room) return res.status(404).json({ message: "Room not found" });

    res.json({ message: "Room removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllRooms,
  getAvailableRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
};
