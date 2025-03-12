const express = require('express');
const { verifyToken } = require('../middlewares/authMiddleware');
const { createIngreso } = require('../controllers/ingresoController');

const router = express.Router();

// Crear un ingreso (Solo usuario autenticado)
router.post('/', verifyToken, createIngreso);

module.exports = router;
