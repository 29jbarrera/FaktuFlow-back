const pool = require("../db");
const bcrypt = require("bcryptjs");
const { decrypt } = require("../utils/encryption");

const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    if (req.user.rol !== "admin" && req.user.id !== parseInt(id)) {
      return res.status(403).json({ message: "Acceso denegado" });
    }

    const result = await pool.query(
      "SELECT id, nombre, apellidos, email, rol, fecha_registro FROM usuarios WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const user = result.rows[0];

    if (user.email) {
      user.email = decrypt(user.email);
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { nombre, apellidos, email, password } = req.body;

  try {
    if (req.user.id !== parseInt(id) && req.user.rol !== "admin") {
      return res
        .status(403)
        .json({ message: "No tienes permiso para actualizar este usuario" });
    }

    let hashedPassword = undefined;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const updatedUser = await pool.query(
      `UPDATE usuarios 
       SET nombre = COALESCE($1, nombre), 
           apellidos = COALESCE($2, apellidos), 
           email = COALESCE($3, email), 
           password = COALESCE($4, password) 
       WHERE id = $5 
       RETURNING id, nombre, apellidos, email, rol`,
      [nombre, apellidos, email, hashedPassword, id]
    );

    if (updatedUser.rowCount === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({
      message: "Usuario actualizado con éxito",
      user: updatedUser.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor" });
  }
};

module.exports = { getAllUsers, getUserById, updateUser };
