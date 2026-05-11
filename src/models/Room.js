import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: true,
      unique: true,
    },
    roomType: {
      type: String,
      required: true,
    },
    floor: {
      type: Number,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
    },
    pricePerNight: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["AVAILABLE", "OCCUPIED", "CLEANING", "MAINTENANCE"],
      default: "AVAILABLE",
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const Room = mongoose.model("Room", roomSchema);

export default Room;
