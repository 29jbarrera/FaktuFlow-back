const express = require("express");
const { verifyToken } = require("../middlewares/authMiddleware");
const {
  createIngreso,
  getIngresos,
  updateIngreso,
  deleteIngreso,
} = require("../controllers/ingresoController");
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

// 📌 Crear un ingreso (Solo usuarios autenticados)
router.post(
  "/",
  verifyToken,
  [
    body("nombre_ingreso")
      .notEmpty()
      .withMessage("El nombre del ingreso es obligatorio")
      .isString()
      .withMessage("El nombre del ingreso debe ser una cadena de caracteres"),
    body("categoria")
      .notEmpty()
      .withMessage("La categoría del ingreso es obligatoria"),
    body("importe_total")
      .isFloat({ min: 0 })
      .withMessage("El importe total debe ser un número mayor o igual a 0"),
    body("fecha_ingreso")
      .optional()
      .isISO8601()
      .withMessage("La fecha debe tener un formato válido (YYYY-MM-DD)"),
    body("descripcion")
      .optional()
      .isString()
      .withMessage("La descripción debe ser una cadena de caracteres"),
  ],
  validateRequest,
  createIngreso
);

// 📌 Obtener los ingresos del usuario autenticado
router.get("/", verifyToken, getIngresos);

// 📌 Actualizar un ingreso (Solo usuarios autenticados)
router.put(
  "/:id",
  verifyToken,
  [
    param("id")
      .isInt()
      .withMessage("El ID del ingreso debe ser un número entero"),
    body("nombre_ingreso")
      .optional()
      .isString()
      .withMessage("El nombre del ingreso debe ser una cadena de caracteres"),
    body("categoria")
      .optional()
      .isIn(["salario", "venta", "otros"])
      .withMessage(
        "La categoría debe ser uno de los siguientes valores: 'salario', 'venta', 'otros'"
      ),
    body("importe_total")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("El importe total debe ser un número mayor o igual a 0"),
    body("fecha_ingreso")
      .optional()
      .isISO8601()
      .withMessage("La fecha debe tener un formato válido (YYYY-MM-DD)"),
    body("descripcion")
      .optional()
      .isString()
      .withMessage("La descripción debe ser una cadena de caracteres"),
  ],
  validateRequest,
  updateIngreso
);

// 📌 Eliminar un ingreso (Solo usuarios autenticados)
router.delete(
  "/:id",
  verifyToken,
  [
    param("id")
      .isInt()
      .withMessage("El ID del ingreso debe ser un número entero"),
  ],
  validateRequest,
  deleteIngreso
);

module.exports = router;
