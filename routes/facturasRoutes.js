const express = require("express");
const { verifyToken } = require("../middlewares/authMiddleware");
const { upload } = require("../middlewares/multer");
const {
  createFactura,
  getFacturasByUser,
  getFacturaById,
  updateFactura,
  deleteFactura,
  deleteArchivoFactura,
} = require("../controllers/facturaController");
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
  upload.single("archivo"),
  [
    body("importe")
      .isFloat({ min: 0 })
      .withMessage("El importe debe ser un número mayor o igual a 0"),
    body("estado")
      .isBoolean()
      .withMessage("El estado debe ser un valor booleano"),
    body("numero")
      .optional()
      .isString()
      .withMessage("El número de la factura debe ser una cadena de caracteres"),
    body("cliente_id")
      .optional()
      .isInt()
      .withMessage("El cliente_id debe ser un número entero"),
    body("descripcion")
      .optional()
      .isString()
      .withMessage("La descripción debe ser una cadena de caracteres"),
    body("fecha_emision")
      .optional()
      .isISO8601()
      .withMessage(
        "La fecha de emisión debe tener un formato válido (YYYY-MM-DD)"
      ),
  ],
  validateRequest,
  createFactura
);

router.get("/", verifyToken, getFacturasByUser);

router.get(
  "/:id",
  verifyToken,
  [
    param("id")
      .isInt()
      .withMessage("El ID de la factura debe ser un número entero"),
  ],
  validateRequest,
  getFacturaById
);

router.put(
  "/:id",
  verifyToken,
  upload.single("archivo"),
  [
    param("id")
      .isInt()
      .withMessage("El ID de la factura debe ser un número entero"),
    body("importe")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("El importe debe ser un número mayor o igual a 0"),
    body("estado")
      .optional()
      .isBoolean()
      .withMessage("El estado debe ser un valor booleano"),
    body("numero")
      .optional()
      .isString()
      .withMessage("El número de la factura debe ser una cadena de caracteres"),
    body("cliente_id")
      .optional()
      .isInt()
      .withMessage("El cliente_id debe ser un número entero"),
    body("descripcion")
      .optional()
      .isString()
      .withMessage("La descripción debe ser una cadena de caracteres"),
    body("fecha_emision")
      .optional()
      .isISO8601()
      .withMessage(
        "La fecha de emisión debe tener un formato válido (YYYY-MM-DD)"
      ),
  ],
  validateRequest,
  updateFactura
);

router.delete(
  "/:id",
  verifyToken,
  [
    param("id")
      .isInt()
      .withMessage("El ID de la factura debe ser un número entero"),
  ],
  validateRequest,
  deleteFactura
);

router.delete("/:id/archivo", verifyToken, deleteArchivoFactura);

module.exports = router;
