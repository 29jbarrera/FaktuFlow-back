const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

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

    const newUser = await pool.query(
      "INSERT INTO usuarios (nombre, apellidos, email, password, rol, fecha_registro) VALUES ($1, $2, $3, $4, $5) RETURNING id, nombre, apellidos, email, rol, fecha_registro",
      [
        nombre,
        apellidos,
        email,
        hashedPassword,
        rol || "autonomo",
        fecha_registro,
      ]
    );

    res
      .status(201)
      .json({ message: "Usuario registrado con éxito", user: newUser.rows[0] });
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

module.exports = { register, login, changePassword, updateUserInfo };
