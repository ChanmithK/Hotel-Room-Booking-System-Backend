const express = require("express");
const router = express.Router();
const { login, getMe, seedAdmin } = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/login", login);
router.get("/me", protect, getMe);
router.post("/seed", seedAdmin);

module.exports = router;
