const pool = require('../db');

// 📌 Registrar un ingreso
const createIngreso = async (req, res) => {
  const usuario_id = req.user.id; // ID del usuario autenticado desde el token
  const { nombre_ingreso, categoria, fecha_ingreso, importe_total, descripcion } = req.body;

  try {
    // Validar que los campos obligatorios estén presentes
    if (!nombre_ingreso || !categoria || !importe_total) {
      return res.status(400).json({ message: 'El nombre, categoría e importe total son obligatorios' });
    }

    // Insertar ingreso en la base de datos
    const newIngreso = await pool.query(
      `INSERT INTO ingresos (nombre_ingreso, usuario_id, categoria, fecha_ingreso, importe_total, descripcion) 
       VALUES ($1, $2, $3, COALESCE($4, NOW()), $5, COALESCE($6, NULL)) 
       RETURNING *`,
      [nombre_ingreso, usuario_id, categoria, fecha_ingreso || null, importe_total, descripcion || null]
    );

    res.status(201).json({ message: 'Ingreso registrado con éxito', ingreso: newIngreso.rows[0] });

  } catch (error) {
    console.error('❌ Error al registrar ingreso:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = { createIngreso };
