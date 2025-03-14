const express = require("express");
const { body, param, validationResult } = require("express-validator");
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/usuariosController");
const { verifyToken, verifyAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.get("/", verifyToken, verifyAdmin, getAllUsers);

router.get(
  "/:id",
  verifyToken,
  [param("id").isInt().withMessage("El ID debe ser un número entero válido")],
  validateRequest,
  getUserById
);

router.put(
  "/:id",
  verifyToken,
  [
    param("id").isInt().withMessage("El ID debe ser un número entero válido"),
    body("email")
      .optional()
      .isEmail()
      .withMessage("El correo electrónico no es válido"),
    body("nombre")
      .optional()
      .notEmpty()
      .withMessage("El nombre no puede estar vacío"),
    body("telefono")
      .optional()
      .matches(/^\d{9}$/)
      .withMessage("El teléfono debe tener exactamente 9 dígitos numéricos"),
  ],
  validateRequest,
  updateUser
);

router.delete(
  "/:id",
  verifyToken,
  verifyAdmin,
  [param("id").isInt().withMessage("El ID debe ser un número entero válido")],
  validateRequest,
  deleteUser
);

module.exports = router;
