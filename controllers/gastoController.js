const pool = require("../db");

// 📌 Registrar un gasto
const createGasto = async (req, res) => {
  const { nombre_gasto, categoria, fecha, importe_total, descripcion } =
    req.body;
  const usuario_id = req.user.id; // Obtener ID del usuario autenticado desde el token

  try {
    // Validar campos obligatorios
    if (!nombre_gasto || !categoria || !importe_total) {
      return res.status(400).json({
        message: "Nombre del gasto, categoría e importe total son obligatorios",
      });
    }

    // Insertar gasto en la base de datos con valores opcionales
    const newGasto = await pool.query(
      `INSERT INTO gastos (nombre_gasto, usuario_id, categoria, fecha, importe_total, descripcion) 
       VALUES ($1, $2, $3, COALESCE($4, NOW()), $5, $6) |
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

// 📌 Obtener gastos del usuario autenticado con paginación
const getGastos = async (req, res) => {
  const usuario_id = req.user.id; // Obtener ID del usuario autenticado desde el token
  const page = parseInt(req.query.page) || 1; // Página actual
  const limit = parseInt(req.query.limit) || 10; // Límites por página
  const offset = (page - 1) * limit; // Calcular el offset para la consulta

  try {
    // Consultar gastos del usuario autenticado con LIMIT y OFFSET
    const result = await pool.query(
      "SELECT * FROM gastos WHERE usuario_id = $1 ORDER BY fecha DESC LIMIT $2 OFFSET $3",
      [usuario_id, limit, offset]
    );

    // Contar el número total de gastos para el cálculo de las páginas
    const totalCountResult = await pool.query(
      "SELECT COUNT(*) FROM gastos WHERE usuario_id = $1",
      [usuario_id]
    );

    const totalCount = totalCountResult.rows[0].count; // Total de registros
    const totalPages = Math.ceil(totalCount / limit); // Calcular el número total de páginas

    res.status(200).json({
      gastos: result.rows, // Gastos de la página actual
      total: totalCount, // Total de gastos (para calcular el número de páginas)
      totalPages: totalPages, // Total de páginas
    });
  } catch (error) {
    console.error("❌ Error al obtener gastos:", error);
    res.status(500).json({ message: "Error al obtener los gastos." });
  }
};

// 📌 Actualizar un gasto
const updateGasto = async (req, res) => {
  const usuario_id = req.user.id; // ID del usuario autenticado desde el token
  const { id } = req.params;
  const { nombre_gasto, categoria, fecha, importe_total, descripcion } =
    req.body;

  try {
    // Verificar si el gasto pertenece al usuario
    const gasto = await pool.query(
      "SELECT * FROM gastos WHERE id = $1 AND usuario_id = $2",
      [id, usuario_id]
    );
    if (gasto.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Gasto no encontrado o no autorizado" });
    }

    // Actualizar gasto en la base de datos
    const updatedGasto = await pool.query(
      `UPDATE gastos 
         SET nombre_gasto = $1, categoria = $2, fecha = COALESCE($3, fecha), 
             importe_total = $4, descripcion = COALESCE($5, descripcion) 
         WHERE id = $6 RETURNING *`,
      [
        nombre_gasto,
        categoria,
        fecha || null,
        importe_total,
        descripcion || null,
        id,
      ]
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

// 📌 Eliminar un gasto
const deleteGasto = async (req, res) => {
  const usuario_id = req.user.id; // ID del usuario autenticado
  const { id } = req.params;

  try {
    // Verificar si el gasto pertenece al usuario
    const gasto = await pool.query(
      "SELECT * FROM gastos WHERE id = $1 AND usuario_id = $2",
      [id, usuario_id]
    );
    if (gasto.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Gasto no encontrado o no autorizado" });
    }

    // Eliminar gasto de la base de datos
    await pool.query("DELETE FROM gastos WHERE id = $1", [id]);

    res.json({ message: "Gasto eliminado con éxito" });
  } catch (error) {
    console.error("❌ Error al eliminar gasto:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

module.exports = { createGasto, getGastos, updateGasto, deleteGasto };
