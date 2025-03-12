const express = require('express');
const { verifyToken } = require('../middlewares/authMiddleware');
const { createGasto, getGastos, updateGasto, deleteGasto } = require('../controllers/gastoController');

const router = express.Router();

// Registrar un gasto (Solo usuarios autenticados)
router.post('/', verifyToken, createGasto);

// Obtener gastos del usuario autenticado
router.get('/', verifyToken, getGastos);

// Actualizar un gasto (Solo usuario autenticado)
router.put('/:id', verifyToken, updateGasto);

// Eliminar un gasto (Solo usuario autenticado)
router.delete('/:id', verifyToken, deleteGasto);

module.exports = router;
