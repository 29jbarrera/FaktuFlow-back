const express = require('express');
const { verifyToken } = require('../middlewares/authMiddleware');
const { createCliente, getClientesByUser  } = require('../controllers/clienteController');

const router = express.Router();

// Crear un cliente (Solo usuarios autenticados)
router.post('/', verifyToken, createCliente);

// Obtener clientes del usuario autenticado
router.get('/', verifyToken, getClientesByUser);

module.exports = router;
