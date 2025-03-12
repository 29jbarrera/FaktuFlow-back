const pool = require('../db');

// 📌 Crear una factura
const createFactura = async (req, res) => {
  const { cliente_id, fecha_emision, importe, estado, numero, descripcion } = req.body;
  const usuario_id = req.user.id; // Extraer el usuario autenticado del token

  try {
    // Validar que los campos obligatorios estén presentes
    if (!fecha_emision || !importe || estado === undefined) {
      return res.status(400).json({ message: 'Fecha de emisión, importe y estado son obligatorios' });
    }

    // Insertar la factura en la base de datos
    const newFactura = await pool.query(
      `INSERT INTO facturas (usuario_id, cliente_id, fecha_emision, importe, estado, numero, descripcion) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [usuario_id, cliente_id || null, fecha_emision, importe, estado, numero || null, descripcion || null]
    );

    res.status(201).json({ message: 'Factura creada con éxito', factura: newFactura.rows[0] });

  } catch (error) {
    console.error('❌ Error al crear factura:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = { createFactura };
