const express = require("express");
const { verifyToken } = require("../middlewares/authMiddleware");
const {
  createCliente,
  getClientesByUser,
  deleteCliente,
  updateCliente,
} = require("../controllers/clienteController");
const { body, param, validationResult } = require("express-validator");

const router = express.Router();

// Middleware para manejar errores de validación
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// 📌 Crear un cliente (Solo usuarios autenticados)
router.post(
  "/",
  verifyToken,
  [
    body("nombre").notEmpty().withMessage("El nombre es obligatorio"),
    body("email").optional().isEmail().withMessage("El email no es válido"),
    body("telefono")
      .optional()
      .matches(/^\d{9}$/) // Expresión regular para validar exactamente 9 dígitos
      .withMessage("El teléfono debe tener exactamente 9 dígitos numéricos"),
  ],
  validateRequest,
  createCliente
);

// Obtener clientes del usuario autenticado
router.get("/", verifyToken, getClientesByUser);

// 📌 Eliminar un cliente (Solo el usuario autenticado puede eliminar sus clientes)
router.delete(
  "/:id",
  verifyToken,
  [param("id").isInt().withMessage("El ID debe ser un número entero")],
  validateRequest,
  deleteCliente
);

// 📌 Actualizar un cliente (Solo usuarios autenticados)
router.put(
  "/:id",
  verifyToken,
  [
    param("id").isInt().withMessage("El ID debe ser un número entero"),
    body("nombre")
      .optional()
      .notEmpty()
      .withMessage("El nombre no puede estar vacío"),
    body("email").optional().isEmail().withMessage("El email no es válido"),
    body("telefono")
      .optional()
      .isString()
      .withMessage("El teléfono debe ser una cadena de caracteres") // Solo cadena de caracteres
      .isLength({ min: 6 })
      .withMessage("El teléfono debe tener al menos 6 caracteres"), // Longitud mínima de teléfono
  ],
  validateRequest,
  updateCliente
);

module.exports = router;
