const express = require('express');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');
const { getAdminDashboardStats, getUsersWithStats } = require('../controllers/adminController');

const router = express.Router();

// 📌 Endpoint para obtener estadísticas generales (Solo Admin)
router.get('/', verifyToken, verifyAdmin, getAdminDashboardStats);

// 📌 Endpoint para obtener usuarios con estadísticas (Solo Admin)
router.get('/usuarios', verifyToken, verifyAdmin, getUsersWithStats);

module.exports = router;
