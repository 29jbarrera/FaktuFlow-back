const express = require('express');
const { verifyToken } = require('../middlewares/authMiddleware');
const { createGasto } = require('../controllers/gastoController');

const router = express.Router();

// Registrar un gasto (Solo usuarios autenticados)
router.post('/', verifyToken, createGasto);

module.exports = router;
