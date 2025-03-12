const pool = require('../db');

// 📌 Registrar un gasto
const createGasto = async (req, res) => {
  const { nombre_gasto, categoria, fecha, importe_total, descripcion } = req.body;
  const usuario_id = req.user.id; // Obtener ID del usuario autenticado desde el token

  try {
    // Validar campos obligatorios
    if (!nombre_gasto || !categoria || !importe_total) {
      return res.status(400).json({ message: 'Nombre del gasto, categoría e importe total son obligatorios' });
    }

    // Insertar gasto en la base de datos con valores opcionales
    const newGasto = await pool.query(
      `INSERT INTO gastos (nombre_gasto, usuario_id, categoria, fecha, importe_total, descripcion) 
       VALUES ($1, $2, $3, COALESCE($4, NOW()), $5, $6) 
       RETURNING *`,
      [nombre_gasto, usuario_id, categoria, fecha || null, importe_total, descripcion || null]
    );

    res.status(201).json({ message: 'Gasto registrado con éxito', gasto: newGasto.rows[0] });

  } catch (error) {
    console.error('❌ Error al registrar gasto:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = { createGasto };
