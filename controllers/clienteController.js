const pool = require("../db");

const createCliente = async (req, res) => {
  const { nombre, email, telefono, direccion_fiscal } = req.body;

  try {
    const emailExists = await pool.query(
      "SELECT * FROM clientes WHERE email = $1",
      [email]
    );

    if (emailExists.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "El correo electrónico ya está en uso" });
    }

    const newCliente = await pool.query(
      `INSERT INTO clientes (nombre, email, telefono, direccion_fiscal) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [nombre, email || null, telefono || null, direccion_fiscal || null]
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

const getClientesByUser = async (req, res) => {
  const usuario_id = req.user.id;

  try {
    const result = await pool.query(
      "SELECT id, nombre FROM clientes WHERE usuario_id = $1 ORDER BY nombre ASC",
      [usuario_id]
    );

    res.status(200).json({
      clientes: result.rows,
    });
  } catch (error) {
    console.error("❌ Error al obtener clientes:", error);
    res.status(500).json({ message: "Error al obtener los clientes." });
  }
};

const getClientesByUserTable = async (req, res) => {
  const usuarioId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;

  const sortField = req.query.sortField || "nombre";
  const sortOrder = req.query.sortOrder === "1" ? "ASC" : "DESC";

  const allowedFields = ["nombre", "email", "telefono", "direccion_fiscal"];
  if (!allowedFields.includes(sortField)) {
    return res.status(400).json({ message: "Campo de ordenación no válido." });
  }

  try {
    const result = await pool.query(
      `
      SELECT id, nombre, email, telefono, direccion_fiscal
      FROM clientes
      WHERE usuario_id = $1
      ORDER BY ${sortField} ${sortOrder}
      LIMIT $2 OFFSET $3
      `,
      [usuarioId, limit, offset]
    );

    const totalCountResult = await pool.query(
      `SELECT COUNT(*) FROM clientes WHERE usuario_id = $1`,
      [usuarioId]
    );

    const totalCount = parseInt(totalCountResult.rows[0].count);

    res.status(200).json({
      clientes: result.rows,
      total: totalCount,
    });
  } catch (error) {
    console.error("❌ Error al obtener los clientes paginados:", error);
    res.status(500).json({ message: "Error al obtener los clientes." });
  }
};

const deleteCliente = async (req, res) => {
  const { id } = req.params;
  const usuario_id = req.user.id;

  try {
    const cliente = await pool.query(
      "SELECT * FROM clientes WHERE id = $1 AND usuario_id = $2",
      [id, usuario_id]
    );

    if (cliente.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Cliente no encontrado o no autorizado" });
    }

    await pool.query("DELETE FROM clientes WHERE id = $1", [id]);

    res.json({ message: "Cliente eliminado con éxito" });
  } catch (error) {
    console.error("❌ Error al eliminar cliente:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const updateCliente = async (req, res) => {
  const { id } = req.params;
  const { nombre, email, telefono, direccion_fiscal } = req.body;

  try {
    const cliente = await pool.query("SELECT * FROM clientes WHERE id = $1", [
      id,
    ]);

    if (cliente.rows.length === 0) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

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
  getClientesByUserTable,
};
