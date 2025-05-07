const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const axios = require("axios");
const { sendVerificationEmail } = require("../utils/sendEmail");
require("dotenv").config();
const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;

const register = async (req, res) => {
  const { nombre, apellidos, email, password, rol } = req.body;

  try {
    const userExists = await pool.query(
      "SELECT * FROM usuarios WHERE email = $1",
      [email]
    );
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "El usuario ya está registrado" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const fecha_registro = new Date();

    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    const verificationCodeExpiry = new Date();
    verificationCodeExpiry.setHours(verificationCodeExpiry.getHours() + 1);

    const newUser = await pool.query(
      "INSERT INTO usuarios (nombre, apellidos, email, password, rol, fecha_registro, verificado, codigo_verificacion, verification_code_expiry) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, nombre, apellidos, email, rol, fecha_registro, codigo_verificacion, verification_code_expiry",
      [
        nombre,
        apellidos,
        email,
        hashedPassword,
        rol || "autonomo",
        fecha_registro,
        false,
        verificationCode,
        verificationCodeExpiry,
      ]
    );

    try {
      const emailSent = await sendVerificationEmail(email, verificationCode);
      if (!emailSent || emailSent.error) {
        return res.status(500).json({
          message: "Error al enviar el correo de verificación.",
        });
      }

      return res.status(201).json({
        message:
          "Usuario registrado correctamente. Revisa tu correo para verificar tu cuenta.",
        user: newUser.rows[0],
      });
    } catch (err) {
      return res.status(500).json({ message: "Fallo al enviar el correo." });
    }
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor." });
  }
};

const login = async (req, res) => {
  const { email, password, recaptchaResponse } = req.body;

  if (!recaptchaResponse) {
    return res
      .status(400)
      .json({ message: "Por favor, verifica que no eres un robot" });
  }

  try {
    const recaptchaVerificationResponse = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      {
        params: {
          secret: recaptchaSecretKey,
          response: recaptchaResponse,
        },
      }
    );

    if (!recaptchaVerificationResponse.data.success) {
      return res.status(400).json({
        message: "reCAPTCHA inválido. Por favor, intenta nuevamente.",
      });
    }

    const user = await pool.query("SELECT * FROM usuarios WHERE email = $1", [
      email,
    ]);
    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Credenciales inválidas" });
    }

    if (!user.rows[0].verificado) {
      return res.status(400).json({
        message: "Por favor verifica tu cuenta antes de iniciar sesión.",
      });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(400).json({ message: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      {
        id: user.rows[0].id,
        nombre: user.rows[0].nombre,
        apellidos: user.rows[0].apellidos,
        rol: user.rows[0].rol,
      },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.json({
      message: "Inicio de sesión exitoso",
      token,
      usuario_id: user.rows[0].id,
      email: user.rows[0].email,
      rol: user.rows[0].rol,
      nombre: user.rows[0].nombre,
      apellidos: user.rows[0].apellidos,
    });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const changePassword = async (req, res) => {
  const { usuario_id, currentPassword, newPassword } = req.body;

  if (!usuario_id || !currentPassword || !newPassword) {
    return res.status(400).json({ message: "Faltan campos obligatorios." });
  }

  try {
    const userQuery = await pool.query("SELECT * FROM usuarios WHERE id = $1", [
      usuario_id,
    ]);
    const user = userQuery.rows[0];

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Contraseña actual incorrecta." });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "La nueva contraseña no puede ser igual a la actual.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    await pool.query("UPDATE usuarios SET password = $1 WHERE id = $2", [
      hashedNewPassword,
      usuario_id,
    ]);

    res.status(200).json({ message: "Contraseña actualizada con éxito." });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor." });
  }
};

const updateUserInfo = async (req, res) => {
  const { usuario_id, nombre, apellidos, email } = req.body;

  if (!usuario_id || !nombre || !apellidos || !email) {
    return res.status(400).json({ message: "Faltan campos obligatorios." });
  }

  try {
    const emailCheck = await pool.query(
      "SELECT id FROM usuarios WHERE email = $1 AND id <> $2",
      [email, usuario_id]
    );

    if (emailCheck.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "El correo ya está siendo usado por otro usuario." });
    }

    const updateQuery = await pool.query(
      `UPDATE usuarios 
       SET nombre = $1, apellidos = $2, email = $3 
       WHERE id = $4 
       RETURNING id, nombre, apellidos, email`,
      [nombre, apellidos, email, usuario_id]
    );

    res.status(200).json({
      message: "Información actualizada con éxito.",
      user: updateQuery.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor." });
  }
};

const verifyCode = async (req, res) => {
  const { email, codigo_verificacion } = req.body;

  try {
    const user = await pool.query("SELECT * FROM usuarios WHERE email = $1", [
      email,
    ]);

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const existingUser = user.rows[0];

    if (existingUser.verificado) {
      return res.status(200).json({
        message: "La cuenta ya está verificada. Puedes iniciar sesión",
      });
    }

    if (existingUser.codigo_verificacion !== codigo_verificacion) {
      return res
        .status(400)
        .json({ message: "Código de verificación incorrecto" });
    }

    const currentTime = new Date();
    if (new Date(existingUser.verification_code_expiry) < currentTime) {
      return res
        .status(400)
        .json({ message: "El código de verificación ha expirado" });
    }

    await pool.query("UPDATE usuarios SET verificado = true WHERE email = $1", [
      email,
    ]);
    res
      .status(200)
      .json({ message: "Cuenta verificada con éxito. Puedes iniciar sesión." });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const resendVerificationCode = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await pool.query("SELECT * FROM usuarios WHERE email = $1", [
      email,
    ]);

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "El usuario no existe" });
    }

    if (user.rows[0].verificado) {
      return res.status(400).json({
        message: "Tu cuenta ya está verificada. Puedes iniciar sesión.",
      });
    }

    const currentTime = new Date();
    const verificationCodeExpiry = user.rows[0].verification_code_expiry;

    if (currentTime < verificationCodeExpiry) {
      return res.status(400).json({
        message:
          "Aún no ha expirado el código de verificación. Intentelo de nuevo más tarde.",
      });
    }

    const newVerificationCode = Math.floor(100000 + Math.random() * 900000);
    const newVerificationCodeExpiry = new Date();
    newVerificationCodeExpiry.setHours(
      newVerificationCodeExpiry.getHours() + 1
    );

    await pool.query(
      "UPDATE usuarios SET codigo_verificacion = $1, verification_code_expiry = $2 WHERE email = $3",
      [newVerificationCode, newVerificationCodeExpiry, email]
    );

    const emailSent = await sendVerificationEmail(email, newVerificationCode);
    if (!emailSent) {
      return res
        .status(500)
        .json({ message: "Error al enviar el correo de verificación." });
    }

    res.status(200).json({
      message: "Nuevo código de verificación enviado. Revisa tu correo.",
    });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const deleteUser = async (req, res) => {
  const { usuario_id } = req.body;

  if (!usuario_id) {
    return res.status(400).json({ message: "Falta el ID del usuario." });
  }

  try {
    await pool.query("DELETE FROM facturas WHERE usuario_id = $1", [
      usuario_id,
    ]);

    await pool.query("DELETE FROM gastos WHERE usuario_id = $1", [usuario_id]);

    await pool.query("DELETE FROM ingresos WHERE usuario_id = $1", [
      usuario_id,
    ]);

    await pool.query("DELETE FROM clientes WHERE usuario_id = $1", [
      usuario_id,
    ]);

    await pool.query("DELETE FROM usuarios WHERE id = $1", [usuario_id]);

    res
      .status(200)
      .json({ message: "Usuario y todos sus datos eliminados correctamente." });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el usuario." });
  }
};

module.exports = {
  register,
  login,
  changePassword,
  updateUserInfo,
  verifyCode,
  resendVerificationCode,
  deleteUser,
};
