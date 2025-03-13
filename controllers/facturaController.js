const pool = require("../db");

// 📌 Crear una factura
const createFactura = async (req, res) => {
  const { cliente_id, fecha_emision, importe, estado, numero, descripcion } =
    req.body;
  const usuario_id = req.user.id; // Extraer el usuario autenticado del token

  try {
    // Validar que los campos obligatorios estén presentes
    if (!fecha_emision || !importe || estado === undefined) {
      return res
        .status(400)
        .json({
          message: "Fecha de emisión, importe y estado son obligatorios",
        });
    }

    // Insertar la factura en la base de datos
    const newFactura = await pool.query(
      `INSERT INTO facturas (usuario_id, cliente_id, fecha_emision, importe, estado, numero, descripcion) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        usuario_id,
        cliente_id || null,
        fecha_emision,
        importe,
        estado,
        numero || null,
        descripcion || null,
      ]
    );

    res
      .status(201)
      .json({
        message: "Factura creada con éxito",
        factura: newFactura.rows[0],
      });
  } catch (error) {
    console.error("❌ Error al crear factura:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// 📌 Obtener todas las facturas del usuario autenticado
const getFacturasByUser = async (req, res) => {
  const usuarioId = req.user.id; // Obtener el id del usuario desde el token JWT
  const page = parseInt(req.query.page) || 1; // Página actual
  const limit = parseInt(req.query.limit) || 10; // Límites por página
  const offset = (page - 1) * limit; // Calcular el offset para la consulta

  try {
    // Consultar las facturas con LIMIT y OFFSET
    const result = await pool.query(
      `SELECT * FROM facturas WHERE usuario_id = $1 LIMIT $2 OFFSET $3`,
      [usuarioId, limit, offset]
    );

    // Contar el número total de facturas para el cálculo de las páginas
    const totalCountResult = await pool.query(
      `SELECT COUNT(*) FROM facturas WHERE usuario_id = $1`,
      [usuarioId]
    );

    const totalCount = totalCountResult.rows[0].count; // Total de registros
    const totalPages = Math.ceil(totalCount / limit); // Calcular el número total de páginas

    res.status(200).json({
      facturas: result.rows, // Facturas de la página actual
      total: totalCount, // Total de facturas (para calcular el número de páginas)
      totalPages: totalPages, // Total de páginas
    });
  } catch (error) {
    console.error("❌ Error al obtener las facturas:", error);
    res.status(500).json({ message: "Error al obtener las facturas." });
  }
};

const getFacturaById = async (req, res) => {
  const usuario_id = req.user.id; // Usuario autenticado
  const { id } = req.params; // ID de la factura

  try {
    const factura = await pool.query(
      `SELECT * FROM facturas WHERE id = $1 AND usuario_id = $2`,
      [id, usuario_id]
    );

    if (factura.rows.length === 0) {
      return res.status(404).json({ message: "Factura no encontrada" });
    }

    res.json({ factura: factura.rows[0] });
  } catch (error) {
    console.error("❌ Error al obtener factura:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const updateFactura = async (req, res) => {
  const usuario_id = req.user.id;
  const { id } = req.params;
  const { cliente_id, fecha_emision, importe, estado, numero, descripcion } =
    req.body;

  try {
    // Verificar si la factura existe y pertenece al usuario
    const factura = await pool.query(
      `SELECT * FROM facturas WHERE id = $1 AND usuario_id = $2`,
      [id, usuario_id]
    );

    if (factura.rows.length === 0) {
      return res.status(404).json({ message: "Factura no encontrada" });
    }

    // Actualizar la factura
    const updatedFactura = await pool.query(
      `UPDATE facturas 
       SET cliente_id = $1, fecha_emision = $2, importe = $3, estado = $4, numero = $5, descripcion = $6
       WHERE id = $7 AND usuario_id = $8
       RETURNING *`,
      [
        cliente_id || null,
        fecha_emision,
        importe,
        estado,
        numero || null,
        descripcion || null,
        id,
        usuario_id,
      ]
    );

    res.json({
      message: "Factura actualizada con éxito",
      factura: updatedFactura.rows[0],
    });
  } catch (error) {
    console.error("❌ Error al actualizar factura:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const deleteFactura = async (req, res) => {
  const usuario_id = req.user.id;
  const { id } = req.params;

  try {
    // Verificar si la factura existe y pertenece al usuario
    const factura = await pool.query(
      `SELECT * FROM facturas WHERE id = $1 AND usuario_id = $2`,
      [id, usuario_id]
    );

    if (factura.rows.length === 0) {
      return res.status(404).json({ message: "Factura no encontrada" });
    }

    // Eliminar la factura
    await pool.query(`DELETE FROM facturas WHERE id = $1 AND usuario_id = $2`, [
      id,
      usuario_id,
    ]);

    res.json({ message: "Factura eliminada con éxito" });
  } catch (error) {
    console.error("❌ Error al eliminar factura:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

module.exports = {
  createFactura,
  getFacturasByUser,
  getFacturaById,
  updateFactura,
  deleteFactura,
};
