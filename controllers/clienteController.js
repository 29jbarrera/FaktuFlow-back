const pool = require("../db");

// 📌 Crear un cliente
const createCliente = async (req, res) => {
  const { nombre, email, telefono, direccion_fiscal } = req.body;

  try {
    // Verificar si ya existe un cliente con ese email
    const emailExists = await pool.query(
      "SELECT * FROM clientes WHERE email = $1",
      [email]
    );

    if (emailExists.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "El correo electrónico ya está en uso" });
    }

    // Insertar cliente en la base de datos
    const newCliente = await pool.query(
      `INSERT INTO clientes (nombre, email, telefono, direccion_fiscal) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [nombre, email || null, telefono || null, direccion_fiscal || null] // Si están vacíos, se guardan como NULL
    );

    res.status(201).json({
      message: "Cliente creado con éxito",
      cliente: newCliente.rows[0],
    });
  } catch (error) {
    console.error("❌ Error al crear cliente:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// 📌 Obtener todos los clientes del usuario autenticado con paginación
const getClientesByUser = async (req, res) => {
  const usuario_id = req.user.id; // Obtener ID del usuario autenticado desde el token
  const page = parseInt(req.query.page) || 1; // Página actual
  const limit = parseInt(req.query.limit) || 10; // Límites por página
  const offset = (page - 1) * limit; // Calcular el offset para la consulta

  try {
    // Consultar clientes del usuario autenticado con LIMIT y OFFSET
    const result = await pool.query(
      "SELECT * FROM clientes WHERE usuario_id = $1 ORDER BY nombre ASC LIMIT $2 OFFSET $3",
      [usuario_id, limit, offset]
    );

    // Contar el número total de clientes para el cálculo de las páginas
    const totalCountResult = await pool.query(
      "SELECT COUNT(*) FROM clientes WHERE usuario_id = $1",
      [usuario_id]
    );

    const totalCount = totalCountResult.rows[0].count; // Total de registros
    const totalPages = Math.ceil(totalCount / limit); // Calcular el número total de páginas

    res.status(200).json({
      clientes: result.rows, // Clientes de la página actual
      total: totalCount, // Total de clientes (para calcular el número de páginas)
      totalPages: totalPages, // Total de páginas
    });
  } catch (error) {
    console.error("❌ Error al obtener clientes:", error);
    res.status(500).json({ message: "Error al obtener los clientes." });
  }
};

// 📌 Eliminar un cliente
const deleteCliente = async (req, res) => {
  const { id } = req.params;
  const usuario_id = req.user.id; // Obtenemos el ID del usuario autenticado

  try {
    // Verificar si el cliente existe y si pertenece al usuario autenticado
    const cliente = await pool.query(
      "SELECT * FROM clientes WHERE id = $1 AND usuario_id = $2",
      [id, usuario_id]
    );

    if (cliente.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Cliente no encontrado o no autorizado" });
    }

    // Eliminar el cliente
    await pool.query("DELETE FROM clientes WHERE id = $1", [id]);

    res.json({ message: "Cliente eliminado con éxito" });
  } catch (error) {
    console.error("❌ Error al eliminar cliente:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// 📌 Actualizar un cliente
const updateCliente = async (req, res) => {
  const { id } = req.params;
  const { nombre, email, telefono, direccion_fiscal } = req.body;

  try {
    // Verificar si el cliente existe y pertenece al usuario autenticado
    const cliente = await pool.query("SELECT * FROM clientes WHERE id = $1", [
      id,
    ]);

    if (cliente.rows.length === 0) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    // Actualizar solo los campos proporcionados en la solicitud
    const updatedCliente = await pool.query(
      `UPDATE clientes 
       SET nombre = COALESCE($1, nombre),
           email = COALESCE($2, email),
           telefono = COALESCE($3, telefono),
           direccion_fiscal = COALESCE($4, direccion_fiscal)
       WHERE id = $5
       RETURNING *`,
      [
        nombre || null,
        email || null,
        telefono || null,
        direccion_fiscal || null,
        id,
      ]
    );

    res.json({
      message: "Cliente actualizado con éxito",
      cliente: updatedCliente.rows[0],
    });
  } catch (error) {
    console.error("❌ Error al actualizar cliente:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

module.exports = {
  createCliente,
  getClientesByUser,
  deleteCliente,
  updateCliente,
};
