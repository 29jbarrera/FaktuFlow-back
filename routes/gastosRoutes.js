const express = require("express");
const { verifyToken } = require("../middlewares/authMiddleware");
const {
  createGasto,
  getGastos,
  updateGasto,
  deleteGasto,
} = require("../controllers/gastoController");
const { body, param, validationResult } = require("express-validator");

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post(
  "/",
  verifyToken,
  [
    body("nombre_gasto")
      .notEmpty()
      .withMessage("El nombre del gasto es obligatorio")
      .isString()
      .withMessage("El nombre del gasto debe ser una cadena de caracteres"),
    body("categoria")
      .notEmpty()
      .withMessage("La categoría del gasto es obligatoria")
      .isIn(["alimentación", "transporte", "otros"])
      .withMessage(
        "La categoría debe ser uno de los siguientes valores: 'alimentación', 'transporte', 'otros'"
      ),
    body("importe_total")
      .isFloat({ min: 0 })
      .withMessage("El importe total debe ser un número mayor o igual a 0"),
    body("fecha")
      .optional()
      .isISO8601()
      .withMessage("La fecha debe tener un formato válido (YYYY-MM-DD)"),
    body("descripcion")
      .optional()
      .isString()
      .withMessage("La descripción debe ser una cadena de caracteres"),
  ],
  validateRequest,
  createGasto
);

router.get("/", verifyToken, getGastos);

router.put(
  "/:id",
  verifyToken,
  [
    param("id")
      .isInt()
      .withMessage("El ID del gasto debe ser un número entero"),
    body("nombre_gasto")
      .optional()
      .isString()
      .withMessage("El nombre del gasto debe ser una cadena de caracteres"),
    body("categoria")
      .optional()
      .isIn(["alimentación", "transporte", "otros"])
      .withMessage(
        "La categoría debe ser uno de los siguientes valores: 'alimentación', 'transporte', 'otros'"
      ),
    body("importe_total")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("El importe total debe ser un número mayor o igual a 0"),
    body("fecha")
      .optional()
      .isISO8601()
      .withMessage("La fecha debe tener un formato válido (YYYY-MM-DD)"),
    body("descripcion")
      .optional()
      .isString()
      .withMessage("La descripción debe ser una cadena de caracteres"),
  ],
  validateRequest,
  updateGasto
);

router.delete(
  "/:id",
  verifyToken,
  [
    param("id")
      .isInt()
      .withMessage("El ID del gasto debe ser un número entero"),
  ],
  validateRequest,
  deleteGasto
);

module.exports = router;
