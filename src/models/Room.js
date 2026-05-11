const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, unique: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ["single", "double", "twin", "suite", "deluxe", "family"],
    },
    floor: { type: Number, required: true },
    capacity: { type: Number, required: true, min: 1 },
    pricePerNight: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: [
        "available",
        "occupied",
        "cleaning",
        "maintenance",
        "out_of_service",
      ],
      default: "available",
    },
    amenities: [{ type: String }],
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Room", roomSchema);
