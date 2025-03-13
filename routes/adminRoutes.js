const express = require('express');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');
const { getAdminDashboardStats } = require('../controllers/adminController');

const router = express.Router();

// 📌 Endpoint para obtener estadísticas generales (Solo Admin)
router.get('/', verifyToken, verifyAdmin, getAdminDashboardStats);

module.exports = router;
