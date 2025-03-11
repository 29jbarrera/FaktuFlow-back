const pool = require('../db');

// 📌 Crear un cliente (Asociado al usuario autenticado)
const createCliente = async (req, res) => {
  const { nombre, email, telefono, direccion_fiscal } = req.body;
  const usuario_id = req.user.id; // Obtenemos el ID del usuario autenticado desde el token

  try {
    if (!nombre) {
      return res.status(400).json({ message: 'El nombre es obligatorio' });
    }

    // Insertar el cliente con el usuario_id del usuario autenticado
    const newCliente = await pool.query(
      `INSERT INTO clientes (nombre, email, telefono, direccion_fiscal, usuario_id) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [nombre, email || null, telefono || null, direccion_fiscal || null, usuario_id]
    );

    res.status(201).json({ message: 'Cliente creado con éxito', cliente: newCliente.rows[0] });

  } catch (error) {
    console.error('❌ Error al crear cliente:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// 📌 Obtener todos los clientes del usuario autenticado
const getClientesByUser = async (req, res) => {
    const usuario_id = req.user.id; // Obtenemos el ID del usuario autenticado
  
    try {
      const clientes = await pool.query(
        'SELECT * FROM clientes WHERE usuario_id = $1',
        [usuario_id]
      );
  
      res.json({ clientes: clientes.rows });
  
    } catch (error) {
      console.error('❌ Error al obtener clientes:', error);
      res.status(500).json({ message: 'Error en el servidor' });
    }
};

module.exports = { createCliente, getClientesByUser  };
