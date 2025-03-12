const express = require('express');
const { verifyToken } = require('../middlewares/authMiddleware');
const { createFactura } = require('../controllers/facturaController');

const router = express.Router();

// Crear una factura (Solo usuarios autenticados)
router.post('/', verifyToken, createFactura);

module.exports = router;
