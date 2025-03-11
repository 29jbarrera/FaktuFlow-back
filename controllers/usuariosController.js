const pool = require('../db');
const bcrypt = require('bcryptjs');

// Obtener todos los usuarios (solo admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await pool.query('SELECT id, nombre, apellidos, email, rol FROM usuarios');
    res.json(users.rows);
  } catch (error) {
    console.error('❌ Error obteniendo usuarios:', error);
    res.status(500).json({ message: 'Error en el servidor' });
}
};

// Obtener un usuario por ID (usuario autenticado)
const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    // Un usuario solo puede ver sus propios datos o un admin puede ver cualquier usuario
    if (req.user.rol !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const user = await pool.query('SELECT id, nombre, apellidos, email, rol FROM usuarios WHERE id = $1', [id]);

    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(user.rows[0]);
  } catch (error) {
    console.error('❌ Error obteniendo usuario:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// 📌 Actualizar datos de usuario
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { nombre, apellidos, email, password } = req.body;

  try {
    // Verificar si el usuario autenticado está actualizando su propio perfil
    if (req.user.id !== parseInt(id) && req.user.rol !== 'admin') {
      return res.status(403).json({ message: 'No tienes permiso para actualizar este usuario' });
    }

    // Encriptar nueva contraseña si se proporciona
    let hashedPassword = undefined;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    // Actualizar usuario en la base de datos
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
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario actualizado con éxito', user: updatedUser.rows[0] });

  } catch (error) {
    console.error('❌ Error actualizando usuario:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// 📌 Eliminar usuario (Solo Admin)
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM usuarios WHERE id = $1 RETURNING id', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario eliminado con éxito' });

  } catch (error) {
    console.error('❌ Error eliminando usuario:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = { getAllUsers, getUserById,updateUser, deleteUser };
