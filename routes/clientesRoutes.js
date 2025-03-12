const express = require('express');
const { verifyToken } = require('../middlewares/authMiddleware');
const { createCliente, getClientesByUser, deleteCliente, updateCliente } = require('../controllers/clienteController');

const router = express.Router();

// Crear un cliente (Solo usuarios autenticados)
router.post('/', verifyToken, createCliente);

// Obtener clientes del usuario autenticado
router.get('/', verifyToken, getClientesByUser);

// Eliminar un cliente (Solo el usuario autenticado puede eliminar sus clientes)
router.delete('/:id', verifyToken, deleteCliente);

// Actualizar un cliente (Solo usuarios autenticados)
router.put('/:id', verifyToken, updateCliente);

module.exports = router;
