const bcrypt = require("bcryptjs");
const { encrypt, decrypt, hash } = require("../utils/encryption");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const axios = require("axios");
const { sendVerificationEmail } = require("../utils/sendEmail");
require("dotenv").config();
const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;

const register = async (req, res) => {
  const { nombre, apellidos, email, password, rol } = req.body;

  try {
    const encryptedEmail = encrypt(email);
    const emailHash = hash(email); // hash SHA-256

    const userExists = await pool.query(
      "SELECT * FROM usuarios WHERE email_hash = $1",
      [emailHash]
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
      `INSERT INTO usuarios 
        (nombre, apellidos, email, email_hash, password, rol, fecha_registro, verificado, codigo_verificacion, verification_code_expiry) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING id, nombre, apellidos, email, rol, fecha_registro, codigo_verificacion, verification_code_expiry`,
      [
        nombre,
        apellidos,
        encryptedEmail,
        emailHash,
        hashedPassword,
        rol || "autonomo",
        fecha_registro,
        false,
        verificationCode,
        verificationCodeExpiry,
      ]
    );

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
  } catch (error) {
    console.error("Error en registro:", error);
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
    // Verificación reCAPTCHA
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

    const emailHash = hash(email); // Aquí usas hash para buscar

    const user = await pool.query(
      "SELECT * FROM usuarios WHERE email_hash = $1",
      [emailHash]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Credenciales inválidas" });
    }

    const userData = user.rows[0];

    if (!userData.verificado) {
      return res.status(400).json({
        message: "Por favor verifica tu cuenta antes de iniciar sesión.",
      });
    }

    const validPassword = await bcrypt.compare(password, userData.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      {
        id: userData.id,
        nombre: userData.nombre,
        apellidos: userData.apellidos,
        rol: userData.rol,
      },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.json({
      message: "Inicio de sesión exitoso",
      token,
      usuario_id: userData.id,
      email: decrypt(userData.email), // desencriptas para mostrar
      rol: userData.rol,
      nombre: userData.nombre,
      apellidos: userData.apellidos,
    });
  } catch (error) {
    console.error(error);
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
    const encryptedEmail = encrypt(email);
    const hashedEmail = hash(email); // aquí haces el hash SHA-256

    // Verificar que no exista otro usuario con el mismo email_hash, excepto el usuario actual
    const emailCheck = await pool.query(
      "SELECT id FROM usuarios WHERE email_hash = $1 AND id <> $2",
      [hashedEmail, usuario_id]
    );

    if (emailCheck.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "El correo ya está siendo usado por otro usuario." });
    }

    // Actualizar ambos campos, email y email_hash
    const updateQuery = await pool.query(
      `UPDATE usuarios 
       SET nombre = $1, apellidos = $2, email = $3, email_hash = $4
       WHERE id = $5 
       RETURNING id, nombre, apellidos, email`,
      [nombre, apellidos, encryptedEmail, hashedEmail, usuario_id]
    );

    if (!updateQuery.rows.length) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    const updatedUser = updateQuery.rows[0];

    if (updatedUser.email) {
      updatedUser.email = decrypt(updatedUser.email);
    } else {
      updatedUser.email = null;
    }

    res.status(200).json({
      message: "Información actualizada con éxito.",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor." });
  }
};

const verifyCode = async (req, res) => {
  const { email, codigo_verificacion } = req.body;

  if (!email || !codigo_verificacion) {
    return res.status(400).json({ message: "Faltan campos obligatorios." });
  }

  try {
    const hashedEmail = hash(email);

    const userQuery = await pool.query(
      "SELECT * FROM usuarios WHERE email_hash = $1",
      [hashedEmail]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const existingUser = userQuery.rows[0];

    if (existingUser.verificado) {
      return res.status(200).json({
        message: "La cuenta ya está verificada. Puedes iniciar sesión",
      });
    }
    const cleanCode = codigo_verificacion.toString().trim();

    if (existingUser.codigo_verificacion.toString() !== cleanCode) {
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

    await pool.query(
      `UPDATE usuarios 
        SET verificado = true, 
        codigo_verificacion = NULL, 
        verification_code_expiry = NULL 
        WHERE email_hash = $1`,
      [hashedEmail]
    );

    res
      .status(200)
      .json({ message: "Cuenta verificada con éxito. Puedes iniciar sesión." });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const resendVerificationCode = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Falta el email." });
  }

  try {
    const hashedEmail = hash(email);

    const userQuery = await pool.query(
      "SELECT * FROM usuarios WHERE email_hash = $1",
      [hashedEmail]
    );

    if (userQuery.rows.length === 0) {
      return res.status(400).json({ message: "El usuario no existe" });
    }

    const user = userQuery.rows[0];

    if (user.verificado) {
      return res.status(400).json({
        message: "Tu cuenta ya está verificada. Puedes iniciar sesión.",
      });
    }

    const currentTime = new Date();
    const verificationCodeExpiry = user.verification_code_expiry;

    if (currentTime < verificationCodeExpiry) {
      return res.status(400).json({
        message:
          "Aún no ha expirado el código de verificación. Inténtalo de nuevo más tarde.",
      });
    }

    const newVerificationCode = Math.floor(100000 + Math.random() * 900000);
    const newVerificationCodeExpiry = new Date();
    newVerificationCodeExpiry.setHours(
      newVerificationCodeExpiry.getHours() + 1
    );

    await pool.query(
      "UPDATE usuarios SET codigo_verificacion = $1, verification_code_expiry = $2 WHERE email_hash = $3",
      [newVerificationCode, newVerificationCodeExpiry, hashedEmail]
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
