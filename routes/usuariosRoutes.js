const express = require('express');
const { getAllUsers, getUserById } = require('../controllers/usuariosController');
const { updateUser, deleteUser } = require('../controllers/usuariosController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Ruta para obtener todos los usuarios (solo admin)
router.get('/', verifyToken, verifyAdmin, getAllUsers);

// Ruta para obtener un usuario por ID (cualquier usuario autenticado)
router.get('/:id', verifyToken, getUserById);

// Actualizar datos de usuario (Debe estar autenticado)
router.put('/:id', verifyToken, updateUser);

// Eliminar usuario (Solo Admin)
router.delete('/:id', verifyToken, verifyAdmin, deleteUser);

module.exports = router;
