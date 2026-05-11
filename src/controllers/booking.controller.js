const Booking = require("../models/Booking");
const Room = require("../models/Room");
const mongoose = require("mongoose");

// Fetch all bookings with optional filters and linked data
const getAllBookings = async (req, res) => {
  try {
    const { status, roomId, guestEmail } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (roomId) filter.room = roomId;
    if (guestEmail) filter.guestEmail = { $regex: guestEmail, $options: "i" };

    const bookings = await Booking.find(filter)
      .populate("room", "roomNumber type floor pricePerNight")
      .populate("createdBy", "name email role")
      .populate("cancelledBy", "name email")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single booking details by ID
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("room")
      .populate("createdBy", "name email role")
      .populate("cancelledBy", "name email");

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new booking with a transaction to prevent double booking
const createBooking = async (req, res) => {
  // Use a session for atomic doublebooking prevention
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      roomId,
      guestName,
      guestEmail,
      guestPhone,
      checkIn,
      checkOut,
      specialRequests,
    } = req.body;

    if (!roomId || !guestName || !guestEmail || !checkIn || !checkOut) {
      await session.abortTransaction();
      return res.status(400).json({
        message:
          "roomId, guestName, guestEmail, checkIn, checkOut are required",
      });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkOutDate <= checkInDate) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ message: "checkOut must be after checkIn" });
    }

    // Lock: check for overlapping bookings within the transaction
    const overlap = await Booking.findOne({
      room: roomId,
      status: { $in: ["confirmed", "checked_in"] },
      $or: [{ checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } }],
    }).session(session);

    if (overlap) {
      await session.abortTransaction();
      return res
        .status(409)
        .json({ message: "Room is already booked for the selected dates" });
    }

    // Get room price
    const room = await Room.findById(roomId).session(session);
    if (!room || !room.isActive) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Room not found or inactive" });
    }

    const nights = Math.ceil(
      (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24),
    );
    const totalPrice = nights * room.pricePerNight;

    const [booking] = await Booking.create(
      [
        {
          room: roomId,
          guestName,
          guestEmail,
          guestPhone,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          totalPrice,
          specialRequests,
          createdBy: req.user._id,
        },
      ],
      { session },
    );

    await session.commitTransaction();

    const populated = await Booking.findById(booking._id)
      .populate("room", "roomNumber type floor pricePerNight")
      .populate("createdBy", "name email role");

    res.status(201).json(populated);
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

// Cancel an existing booking and record who did it and why  — Manager & Receptionist
const cancelBooking = async (req, res) => {
  try {
    const { cancellationReason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }
    if (booking.status === "checked_out") {
      return res
        .status(400)
        .json({ message: "Cannot cancel a checked-out booking" });
    }

    booking.status = "cancelled";
    booking.cancelledBy = req.user._id;
    booking.cancelledAt = new Date();
    booking.cancellationReason = cancellationReason || "";
    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate("room", "roomNumber type floor")
      .populate("createdBy", "name email")
      .populate("cancelledBy", "name email");

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/bookings/:id/status  — Manager & Receptionist
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["confirmed", "checked_in", "checked_out"];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Use: confirmed, checked_in, checked_out",
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    )
      .populate("room", "roomNumber type floor")
      .populate("createdBy", "name email");

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllBookings,
  getBookingById,
  createBooking,
  cancelBooking,
  updateBookingStatus,
};
