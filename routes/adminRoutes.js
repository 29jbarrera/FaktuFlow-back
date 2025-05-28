const express = require("express");
const { verifyToken, verifyAdmin } = require("../middlewares/authMiddleware");
const {
  getAdminDashboardStats,
  getUsersWithStats,
  getTotalUsuarios,
  getStatsByUser,
} = require("../controllers/adminController");

const router = express.Router();

router.get("/", verifyToken, verifyAdmin, getAdminDashboardStats);

router.get("/usuarios", verifyToken, verifyAdmin, getUsersWithStats);

router.get("/total-usuarios", verifyToken, verifyAdmin, getTotalUsuarios);

router.get("/stats-usuarios", verifyToken, verifyAdmin, getStatsByUser);

module.exports = router;
