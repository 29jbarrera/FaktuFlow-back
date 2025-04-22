const pool = require("../db");

const createCliente = async (req, res) => {
  const { nombre, email, telefono, direccion_fiscal, usuario_id } = req.body;

  try {
    if (!usuario_id) {
      return res
        .status(400)
        .json({ message: "El usuario no está autenticado" });
    }

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
      `INSERT INTO clientes (nombre, email, telefono, direccion_fiscal,usuario_id) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [
        nombre,
        email || null,
        telefono || null,
        direccion_fiscal || null,
        usuario_id,
      ]
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

  const search = req.query.search?.toLowerCase()?.trim() || "";

  const allowedFields = ["nombre", "email", "telefono", "direccion_fiscal"];
  if (!allowedFields.includes(sortField)) {
    return res.status(400).json({ message: "Campo de ordenación no válido." });
  }

  try {
    const queryParams = [usuarioId];
    let whereClause = `WHERE usuario_id = $1`;

    if (search) {
      queryParams.push(`%${search}%`);
      whereClause += ` AND LOWER(nombre) ILIKE $2`;
    }

    const paginatedQuery = `
      SELECT *
      FROM clientes
      ${whereClause}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    const totalQuery = `
      SELECT COUNT(*) FROM clientes
      ${whereClause}
    `;

    const paginatedParams = [...queryParams, limit, offset];

    const result = await pool.query(paginatedQuery, paginatedParams);
    const totalCountResult = await pool.query(totalQuery, queryParams);
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
  let { nombre, email, telefono, direccion_fiscal } = req.body;

  try {
    const cliente = await pool.query("SELECT * FROM clientes WHERE id = $1", [
      id,
    ]);

    if (cliente.rows.length === 0) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    email = email?.trim() === "" ? null : email;
    telefono = telefono === 0 || telefono === "" ? null : telefono;
    direccion_fiscal =
      direccion_fiscal?.trim() === "" ? null : direccion_fiscal;

    const updatedCliente = await pool.query(
      `UPDATE clientes 
       SET nombre = COALESCE($1, nombre),
           email = $2,
           telefono = $3,
           direccion_fiscal = $4
       WHERE id = $5
       RETURNING *`,
      [nombre, email, telefono, direccion_fiscal, id]
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
