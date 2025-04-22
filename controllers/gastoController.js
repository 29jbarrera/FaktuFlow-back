const pool = require("../db");

const createGasto = async (req, res) => {
  const { nombre_gasto, categoria, fecha, importe_total, descripcion } =
    req.body;
  const usuario_id = req.user.id;

  try {
    if (!nombre_gasto || !categoria || !importe_total) {
      return res.status(400).json({
        message: "Nombre del gasto, categoría e importe total son obligatorios",
      });
    }

    const newGasto = await pool.query(
      `INSERT INTO gastos (nombre_gasto, usuario_id, categoria, fecha, importe_total, descripcion) 
       VALUES ($1, $2, $3, COALESCE($4, NOW()), $5, $6)
       RETURNING *`,
      [
        nombre_gasto,
        usuario_id,
        categoria,
        fecha || null,
        importe_total,
        descripcion || null,
      ]
    );

    res
      .status(201)
      .json({ message: "Gasto registrado con éxito", gasto: newGasto.rows[0] });
  } catch (error) {
    console.error("❌ Error al registrar gasto:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const getGastos = async (req, res) => {
  const usuario_id = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;

  const sortField = req.query.sortField || "fecha";
  const sortOrder = req.query.sortOrder === "1" ? "ASC" : "DESC";

  const search = req.query.search?.toLowerCase()?.trim() || "";

  // Campos válidos para ordenar (según tu base de datos)
  const allowedFields = ["nombre_gasto", "categoria", "fecha", "importe_total"];
  if (!allowedFields.includes(sortField)) {
    return res.status(400).json({ message: "Campo de ordenación no válido." });
  }

  try {
    const queryParams = [usuario_id];
    let whereClause = `WHERE usuario_id = $1`;

    if (search) {
      queryParams.push(`%${search}%`);
      whereClause += `
        AND (
          LOWER(nombre_gasto) ILIKE $2 OR
          LOWER(categoria) ILIKE $2 OR
          LOWER(descripcion) ILIKE $2 OR
          TO_CHAR(fecha, 'DD/MM/YYYY') LIKE $2
        )
      `;
    }

    const paginatedQuery = `
      SELECT id, nombre_gasto, categoria, fecha, importe_total, descripcion
      FROM gastos
      ${whereClause}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    const totalQuery = `
      SELECT COUNT(*) FROM gastos
      ${whereClause}
    `;

    const paginatedParams = [...queryParams, limit, offset];

    const result = await pool.query(paginatedQuery, paginatedParams);
    const totalCountResult = await pool.query(totalQuery, queryParams);
    const totalCount = parseInt(totalCountResult.rows[0].count);

    res.status(200).json({
      gastos: result.rows,
      total: totalCount,
    });
  } catch (error) {
    console.error("❌ Error al obtener los gastos paginados:", error);
    res.status(500).json({ message: "Error al obtener los gastos." });
  }
};

const updateGasto = async (req, res) => {
  const usuario_id = req.user.id;
  const { id } = req.params;
  const { nombre_gasto, categoria, fecha, importe_total, descripcion } =
    req.body;

  try {
    const gasto = await pool.query(
      "SELECT * FROM gastos WHERE id = $1 AND usuario_id = $2",
      [id, usuario_id]
    );
    if (gasto.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Gasto no encontrado o no autorizado" });
    }

    const updatedGasto = await pool.query(
      `UPDATE gastos 
         SET nombre_gasto = $1, categoria = $2, fecha = COALESCE($3, fecha), 
             importe_total = $4, descripcion = COALESCE($5, descripcion) 
         WHERE id = $6 RETURNING *`,
      [nombre_gasto, categoria, fecha || null, importe_total, descripcion, id]
    );

    res.json({
      message: "Gasto actualizado con éxito",
      gasto: updatedGasto.rows[0],
    });
  } catch (error) {
    console.error("❌ Error al actualizar gasto:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const deleteGasto = async (req, res) => {
  const usuario_id = req.user.id;
  const { id } = req.params;

  try {
    const gasto = await pool.query(
      "SELECT * FROM gastos WHERE id = $1 AND usuario_id = $2",
      [id, usuario_id]
    );
    if (gasto.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Gasto no encontrado o no autorizado" });
    }

    await pool.query("DELETE FROM gastos WHERE id = $1", [id]);

    res.json({ message: "Gasto eliminado con éxito" });
  } catch (error) {
    console.error("❌ Error al eliminar gasto:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

module.exports = { createGasto, getGastos, updateGasto, deleteGasto };
