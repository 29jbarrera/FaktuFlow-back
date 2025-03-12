const express = require('express');
const { verifyToken } = require('../middlewares/authMiddleware');
const { createFactura, getFacturasByUser } = require('../controllers/facturaController');

const router = express.Router();

// Crear una factura (Solo usuarios autenticados)
router.post('/', verifyToken, createFactura);

// 📌 Obtener todas las facturas del usuario autenticado
router.get('/', verifyToken, getFacturasByUser);

module.exports = router;
