const crypto = require("crypto");
const pool = require("../db");
const bcrypt = require("bcryptjs");
const { hash } = require("../utils/encryption");
const moment = require("moment");
const { sendResetPasswordEmail } = require("../utils/sendEmail");

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const emailHash = hash(email);

    const userResult = await pool.query(
      "SELECT * FROM usuarios WHERE email_hash = $1",
      [emailHash]
    );
    const user = userResult.rows[0];
    if (!user) {
      return res.status(400).json({ message: "Usuario no encontrado" });
    }

    if (
      user.ultimo_reset &&
      moment(user.ultimo_reset).isAfter(moment().subtract(7, "days"))
    ) {
      return res.status(429).json({
        message:
          "Solo puedes solicitar un restablecimiento de contraseña una vez cada 7 días.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 3600000);

    await pool.query(
      "UPDATE usuarios SET reset_token = $1, reset_token_expiry = $2, ultimo_reset = $3 WHERE email_hash = $4",
      [token, expiry, new Date(), emailHash]
    );

    const resetLink = `${process.env.FRONTEND_URL_PROD}/reset-password?token=${token}&email=${email}`;

    const emailSent = await sendResetPasswordEmail(email, resetLink);
    if (!emailSent) {
      return res
        .status(500)
        .json({ message: "Error al enviar el correo de recuperación." });
    }

    res.json({
      message: "Correo de recuperación enviado. Revisa tu bandeja de entrada.",
    });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor." });
  }
};

const resetPassword = async (req, res) => {
  const { email, token, newPassword } = req.body;

  try {
    const emailHash = hash(email);

    const userQuery = await pool.query(
      "SELECT * FROM usuarios WHERE email_hash = $1",
      [emailHash]
    );
    const user = userQuery.rows[0];
    if (!user || user.reset_token !== token) {
      return res.status(400).json({ message: "Token inválido." });
    }

    if (new Date(user.reset_token_expiry) < new Date()) {
      return res.status(400).json({ message: "Token expirado." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    await pool.query(
      "UPDATE usuarios SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE email_hash = $2",
      [hashed, emailHash]
    );

    res.json({ message: "Contraseña restablecida con éxito." });
  } catch (err) {
    res.status(500).json({ message: "Error en el servidor." });
  }
};

module.exports = {
  forgotPassword,
  resetPassword,
};
