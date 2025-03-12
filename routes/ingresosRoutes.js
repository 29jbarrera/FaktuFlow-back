const express = require('express');
const { verifyToken } = require('../middlewares/authMiddleware');
const { createIngreso, getIngresos, updateIngreso, deleteIngreso } = require('../controllers/ingresoController');

const router = express.Router();

// Crear un ingreso (Solo usuario autenticado)
router.post('/', verifyToken, createIngreso);

// Obtener ingresos del usuario autenticado
router.get('/', verifyToken, getIngresos);

// Actualizar un ingreso
router.put('/:id', verifyToken, updateIngreso);

// Eliminar un ingreso
router.delete('/:id', verifyToken, deleteIngreso);

module.exports = router;
