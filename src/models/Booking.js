const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    guestName: { type: String, required: true, trim: true },
    guestEmail: { type: String, required: true, trim: true, lowercase: true },
    guestPhone: { type: String, trim: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["confirmed", "checked_in", "checked_out", "cancelled"],
      default: "confirmed",
    },
    specialRequests: { type: String, trim: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cancelledAt: { type: Date },
    cancellationReason: { type: String, trim: true },
  },
  { timestamps: true },
);

// Validate check-out is after check-in
bookingSchema.pre("save", function (next) {
  if (this.checkOut <= this.checkIn) {
    return next(new Error("Check-out date must be after check-in date"));
  }
  next();
});

module.exports = mongoose.model("Booking", bookingSchema);
