const express = require('express');
const { verifyToken } = require('../middlewares/authMiddleware');
const { createGasto } = require('../controllers/gastoController');
const { getGastos } = require('../controllers/gastoController');

const router = express.Router();

// Registrar un gasto (Solo usuarios autenticados)
router.post('/', verifyToken, createGasto);

// Obtener gastos del usuario autenticado
router.get('/', verifyToken, getGastos);

module.exports = router;
