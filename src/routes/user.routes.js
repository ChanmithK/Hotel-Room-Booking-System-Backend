const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  updateRole,
} = require("../controllers/user.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

// All user routes require authentication
router.use(protect);

// Admin only
router.get("/", authorize("admin"), getAllUsers);
router.post("/", authorize("admin"), createUser);
router.put("/:id", authorize("admin"), updateUser);
router.delete("/:id", authorize("admin"), deleteUser);

// Admin & Manager can change roles
router.patch("/:id/role", authorize("admin", "manager"), updateRole);

module.exports = router;
