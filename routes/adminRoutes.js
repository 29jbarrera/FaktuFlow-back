const express = require("express");
const { verifyToken, verifyAdmin } = require("../middlewares/authMiddleware");
const {
  getAdminDashboardStats,
  getUsersWithStats,
} = require("../controllers/adminController");

const router = express.Router();

router.get("/", verifyToken, verifyAdmin, getAdminDashboardStats);

router.get("/usuarios", verifyToken, verifyAdmin, getUsersWithStats);

module.exports = router;
