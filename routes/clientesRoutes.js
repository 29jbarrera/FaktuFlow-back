const express = require("express");
const { verifyToken } = require("../middlewares/authMiddleware");
const {
  createCliente,
  getClientesByUser,
  deleteCliente,
  updateCliente,
  getClientesByUserTable,
} = require("../controllers/clienteController");
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
    body("nombre").notEmpty().withMessage("El nombre es obligatorio"),
    body("email")
      .optional()
      .isEmail()
      .withMessage("El formato del email no es válido"),
    body("telefono")
      .optional()
      .matches(/^\d{9}$/)
      .withMessage("El teléfono debe tener exactamente 9 dígitos numéricos"),
  ],
  validateRequest,
  createCliente
);

router.get("/", verifyToken, getClientesByUser);

router.get("/table", verifyToken, getClientesByUserTable);

router.delete(
  "/:id",
  verifyToken,
  [param("id").isInt().withMessage("El ID debe ser un número entero")],
  validateRequest,
  deleteCliente
);

router.put(
  "/:id",
  verifyToken,
  [
    param("id").isInt().withMessage("El ID debe ser un número entero"),
    body("nombre").notEmpty().withMessage("El nombre es obligatorio"),
    body("email")
      .optional()
      .isEmail()
      .withMessage("El formato del email no es válido"),
    body("telefono")
      .optional()
      .matches(/^\d{9}$/)
      .withMessage("El teléfono debe tener exactamente 9 dígitos numéricos"),
  ],
  validateRequest,
  updateCliente
);

module.exports = router;
