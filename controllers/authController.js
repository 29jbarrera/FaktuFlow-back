const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { sendVerificationEmail } = require("../utils/sendEmail");

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

    const verificationCode = Math.floor(100000 + Math.random() * 900000); // 6 dígitos
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

    // Enviar el correo de verificación
    const emailSent = await sendVerificationEmail(email, verificationCode);
    if (!emailSent) {
      return res
        .status(500)
        .json({ message: "Error al enviar el correo de verificación." });
    }

    res.status(201).json({
      message:
        "Usuario registrado con éxito. Revisa tu correo para verificar tu cuenta.",
      user: newUser.rows[0],
    });
  } catch (error) {
    console.error("❌ Error en registro:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query("SELECT * FROM usuarios WHERE email = $1", [
      email,
    ]);
    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Credenciales inválidas" });
    }

    // Verificar si el usuario está verificado
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
    console.error("❌ Error en login:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const changePassword = async (req, res) => {
  const { usuario_id, currentPassword, newPassword } = req.body;

  if (!usuario_id || !currentPassword || !newPassword) {
    return res.status(400).json({ message: "Faltan campos obligatorios." });
  }

  try {
    // Obtener el usuario
    const userQuery = await pool.query("SELECT * FROM usuarios WHERE id = $1", [
      usuario_id,
    ]);
    const user = userQuery.rows[0];

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    // Validar contraseña actual
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Contraseña actual incorrecta." });
    }

    // Verificar que la nueva contraseña sea diferente a la actual
    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "La nueva contraseña no puede ser igual a la actual.",
      });
    }

    // Encriptar nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Actualizar contraseña
    await pool.query("UPDATE usuarios SET password = $1 WHERE id = $2", [
      hashedNewPassword,
      usuario_id,
    ]);

    res.status(200).json({ message: "Contraseña actualizada con éxito." });
  } catch (error) {
    console.error("❌ Error al cambiar contraseña:", error);
    res.status(500).json({ message: "Error en el servidor." });
  }
};

const updateUserInfo = async (req, res) => {
  const { usuario_id, nombre, apellidos, email } = req.body;

  if (!usuario_id || !nombre || !apellidos || !email) {
    return res.status(400).json({ message: "Faltan campos obligatorios." });
  }

  try {
    // Validar si el nuevo email ya está en uso por otro usuario
    const emailCheck = await pool.query(
      "SELECT id FROM usuarios WHERE email = $1 AND id <> $2",
      [email, usuario_id]
    );

    if (emailCheck.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "El correo ya está siendo usado por otro usuario." });
    }

    // Actualizar datos del usuario
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
    console.error("❌ Error al actualizar datos personales:", error);
    res.status(500).json({ message: "Error en el servidor." });
  }
};

// Endpoint para verificar el código de verificación
const verifyCode = async (req, res) => {
  const { email, codigo_verificacion } = req.body;

  try {
    // Verificar si el usuario existe
    const user = await pool.query("SELECT * FROM usuarios WHERE email = $1", [
      email,
    ]);

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const existingUser = user.rows[0];

    // Verificar si el usuario ya ha sido verificado
    if (existingUser.verificado) {
      return res.status(200).json({
        message: "La cuenta ya está verificada. Puedes iniciar sesión",
      });
    }

    // Verificar si el código de verificación coincide
    if (existingUser.codigo_verificacion !== codigo_verificacion) {
      return res
        .status(400)
        .json({ message: "Código de verificación incorrecto" });
    }

    // Verificar si el código ha expirado
    const currentTime = new Date();
    if (new Date(existingUser.verification_code_expiry) < currentTime) {
      return res
        .status(400)
        .json({ message: "El código de verificación ha expirado" });
    }

    // Marcar al usuario como verificado
    await pool.query("UPDATE usuarios SET verificado = true WHERE email = $1", [
      email,
    ]);

    // Responder con éxito
    res.status(200).json({ message: "Cuenta verificada con éxito" });
  } catch (error) {
    console.error("❌ Error en la verificación del código:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const resendVerificationCode = async (req, res) => {
  const { email } = req.body;

  try {
    // Buscar al usuario por email
    const user = await pool.query("SELECT * FROM usuarios WHERE email = $1", [
      email,
    ]);

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "El usuario no existe" });
    }

    // Comprobar si el usuario ya está verificado
    if (user.rows[0].verificado) {
      return res.status(400).json({
        message: "Tu cuenta ya está verificada. Puedes iniciar sesión.",
      });
    }

    // Verificar si el código ha expirado
    const currentTime = new Date();
    const verificationCodeExpiry = user.rows[0].verification_code_expiry;

    if (currentTime < verificationCodeExpiry) {
      return res.status(400).json({
        message:
          "Aún no ha expirado el código de verificación. Intentelo de nuevo más tarde.",
      });
    }

    // Generar un nuevo código de verificación
    const newVerificationCode = Math.floor(100000 + Math.random() * 900000); // 6 dígitos
    const newVerificationCodeExpiry = new Date();
    newVerificationCodeExpiry.setHours(
      newVerificationCodeExpiry.getHours() + 1
    ); // Expira en 1 hora

    // Actualizar el código de verificación y la expiración en la base de datos
    await pool.query(
      "UPDATE usuarios SET codigo_verificacion = $1, verification_code_expiry = $2 WHERE email = $3",
      [newVerificationCode, newVerificationCodeExpiry, email]
    );

    // Enviar el nuevo código de verificación por correo
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
    console.error("❌ Error al reenviar código de verificación:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

module.exports = {
  register,
  login,
  changePassword,
  updateUserInfo,
  verifyCode,
  resendVerificationCode,
};
