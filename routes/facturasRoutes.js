const express = require('express');
const { verifyToken } = require('../middlewares/authMiddleware');
const { createFactura, getFacturasByUser, getFacturaById, updateFactura, deleteFactura } = require('../controllers/facturaController');

const router = express.Router();

// Crear una factura (Solo usuarios autenticados)
router.post('/', verifyToken, createFactura);

// Obtener todas las facturas del usuario autenticado
router.get('/', verifyToken, getFacturasByUser);

// Obtener detalles de una factura
router.get('/:id', verifyToken, getFacturaById); 

 // Actualizar una factura
router.put('/:id', verifyToken, updateFactura);

// Eliminar una factura
router.delete('/:id', verifyToken, deleteFactura); 


module.exports = router;
