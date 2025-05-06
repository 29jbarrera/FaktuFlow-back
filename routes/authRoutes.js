const express = require("express");
const { verifyToken } = require("../middlewares/authMiddleware");
const {
  register,
  login,
  changePassword,
  updateUserInfo,
  verifyCode,
  resendVerificationCode,
  deleteUser,
} = require("../controllers/authController");
const { body, validationResult } = require("express-validator");
const router = express.Router();

router.post(
  "/register",
  [
    body("nombre").notEmpty().withMessage("El nombre es obligatorio"),
    body("email").isEmail().withMessage("El email no es válido"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("La contraseña debe tener al menos 6 caracteres"),
    body("rol")
      .optional()
      .isIn(["admin", "autonomo"])
      .withMessage("Rol inválido"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    register(req, res);
  }
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("El email no es válido"),
    body("password").notEmpty().withMessage("La contraseña es obligatoria"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    login(req, res);
  }
);

router.post(
  "/change-password",
  verifyToken,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("La contraseña actual es obligatoria"),
    body("newPassword")
      .isLength({ min: 4 })
      .withMessage("La nueva contraseña debe tener al menos 4 caracteres"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    changePassword(req, res);
  }
);

router.post("/verify-code", verifyCode);

router.post("/resend-code", resendVerificationCode);

router.put(
  "/update-info",
  verifyToken,
  [
    body("usuario_id")
      .notEmpty()
      .withMessage("El ID de usuario es obligatorio."),
    body("nombre").notEmpty().withMessage("El nombre es obligatorio."),
    body("apellidos").notEmpty().withMessage("Los apellidos son obligatorios."),
    body("email")
      .notEmpty()
      .withMessage("El email es obligatorio.")
      .isEmail()
      .withMessage("El formato del email no es válido."),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    updateUserInfo(req, res);
  }
);

router.delete(
  "/delete-user",
  verifyToken,
  [
    body("usuario_id")
      .notEmpty()
      .withMessage("El ID de usuario es obligatorio."),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    deleteUser(req, res);
  }
);

module.exports = router;
