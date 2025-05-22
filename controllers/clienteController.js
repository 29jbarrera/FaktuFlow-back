const pool = require("../db");
const { encrypt, decrypt } = require("../utils/encryption");

const createCliente = async (req, res) => {
  const { nombre, email, telefono, direccion_fiscal, usuario_id } = req.body;

  if (!usuario_id) {
    return res.status(400).json({ message: "El usuario no está autenticado" });
  }

  try {
    // Verificar el rol del usuario
    const userResult = await pool.query(
      "SELECT rol FROM usuarios WHERE id = $1",
      [usuario_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const rol = userResult.rows[0].rol;

    if (rol !== "admin") {
      const clienteCountResult = await pool.query(
        "SELECT COUNT(*) FROM clientes WHERE usuario_id = $1",
        [usuario_id]
      );

      const clienteCount = parseInt(clienteCountResult.rows[0].count, 10);

      if (clienteCount >= 500) {
        return res.status(400).json({
          message:
            "Has alcanzado el límite de 500 clientes por usuario. Si necesitas más capacidad, contacta al administrador.",
        });
      }
    }

    // Encriptar los campos antes de la inserción
    let encryptedNombre,
      encryptedEmail,
      encryptedTelefono,
      encryptedDireccionFiscal;
    try {
      encryptedNombre = encrypt(nombre);
      encryptedEmail = encrypt(email);
      encryptedTelefono = telefono ? encrypt(telefono) : null;
      encryptedDireccionFiscal = direccion_fiscal
        ? encrypt(direccion_fiscal)
        : null;
    } catch (encryptionError) {
      console.error("Error al encriptar los datos:", encryptionError);
      return res.status(500).json({ message: "Error al encriptar los datos." });
    }

    // Verificar si el email ya existe
    const emailExists = await pool.query(
      "SELECT * FROM clientes WHERE email = $1",
      [encryptedEmail]
    );

    if (emailExists.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "El correo electrónico ya está en uso" });
    }

    const newCliente = await pool.query(
      `INSERT INTO clientes (nombre, email, telefono, direccion_fiscal, usuario_id) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [
        encryptedNombre,
        encryptedEmail,
        encryptedTelefono,
        encryptedDireccionFiscal,
        usuario_id,
      ]
    );

    res.status(201).json({
      message: "Cliente creado con éxito",
      cliente: newCliente.rows[0],
    });
  } catch (error) {
    console.error("Error en createCliente:", error);
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

    const clientes = result.rows.map((cliente) => ({
      id: cliente.id,
      nombre: decrypt(cliente.nombre),
    }));

    res.status(200).json({
      clientes,
    });
  } catch (error) {
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

    const clientes = result.rows.map((cliente) => ({
      ...cliente,
      nombre: decrypt(cliente.nombre),
      email: cliente.email ? decrypt(cliente.email) : null,
      telefono: cliente.telefono ? decrypt(cliente.telefono) : null,
      direccion_fiscal: cliente.direccion_fiscal
        ? decrypt(cliente.direccion_fiscal)
        : null,
    }));

    res.status(200).json({
      clientes,
      total: totalCount,
    });
  } catch (error) {
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
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const updateCliente = async (req, res) => {
  const { id } = req.params;
  let { nombre, email, telefono, direccion_fiscal } = req.body;

  try {
    const clienteResult = await pool.query(
      "SELECT * FROM clientes WHERE id = $1",
      [id]
    );

    if (clienteResult.rows.length === 0) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    // Asegurarse de que los campos vacíos sean null (para borrar valores)
    nombre = nombre?.trim() || null;
    email = email?.trim() || null;
    direccion_fiscal = direccion_fiscal?.trim() || null;
    telefono = telefono?.toString().trim() || null;

    const nombreEncrypted = nombre ? encrypt(nombre) : null;
    const emailEncrypted = email ? encrypt(email) : null;
    const telefonoEncrypted = telefono ? encrypt(telefono) : null;
    const direccionFiscalEncrypted = direccion_fiscal
      ? encrypt(direccion_fiscal)
      : null;

    const updatedClienteResult = await pool.query(
      `UPDATE clientes 
       SET nombre = $1,
           email = $2,
           telefono = $3,
           direccion_fiscal = $4
       WHERE id = $5
       RETURNING *`,
      [
        nombreEncrypted,
        emailEncrypted,
        telefonoEncrypted,
        direccionFiscalEncrypted,
        id,
      ]
    );

    const updatedCliente = updatedClienteResult.rows[0];

    res.json({
      message: "Cliente actualizado con éxito",
      cliente: {
        ...updatedCliente,
        nombre: updatedCliente.nombre ? decrypt(updatedCliente.nombre) : null,
        email: updatedCliente.email ? decrypt(updatedCliente.email) : null,
        telefono: updatedCliente.telefono
          ? decrypt(updatedCliente.telefono)
          : null,
        direccion_fiscal: updatedCliente.direccion_fiscal
          ? decrypt(updatedCliente.direccion_fiscal)
          : null,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const getTotalClientesByUser = async (req, res) => {
  const usuario_id = req.user.id;

  try {
    const result = await pool.query(
      "SELECT COUNT(*) FROM clientes WHERE usuario_id = $1",
      [usuario_id]
    );

    res.status(200).json({
      totalClientes: parseInt(result.rows[0].count),
    });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el total de clientes." });
  }
};

module.exports = {
  createCliente,
  getClientesByUser,
  deleteCliente,
  updateCliente,
  getClientesByUserTable,
  getTotalClientesByUser,
};
