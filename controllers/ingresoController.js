const pool = require("../db");

const createIngreso = async (req, res) => {
  const usuario_id = req.user.id;
  const {
    nombre_ingreso,
    categoria,
    fecha_ingreso,
    importe_total,
    descripcion,
  } = req.body;

  try {
    if (!nombre_ingreso || !categoria || !importe_total) {
      return res.status(400).json({
        message: "El nombre, categoría e importe total son obligatorios",
      });
    }

    const newIngreso = await pool.query(
      `INSERT INTO ingresos (nombre_ingreso, usuario_id, categoria, fecha_ingreso, importe_total, descripcion) 
       VALUES ($1, $2, $3, COALESCE($4, NOW()), $5, COALESCE($6, NULL)) 
       RETURNING *`,
      [
        nombre_ingreso,
        usuario_id,
        categoria,
        fecha_ingreso || null,
        importe_total,
        descripcion || null,
      ]
    );

    res.status(201).json({
      message: "Ingreso registrado con éxito",
      ingreso: newIngreso.rows[0],
    });
  } catch (error) {
    console.error("❌ Error al registrar ingreso:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const getIngresos = async (req, res) => {
  const usuario_id = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const ingresos = await pool.query(
      "SELECT * FROM ingresos WHERE usuario_id = $1 ORDER BY fecha_ingreso DESC LIMIT $2 OFFSET $3",
      [usuario_id, limit, offset]
    );

    const totalCountResult = await pool.query(
      "SELECT COUNT(*) FROM ingresos WHERE usuario_id = $1",
      [usuario_id]
    );
    const totalCount = totalCountResult.rows[0].count;
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      ingresos: ingresos.rows,
      total: totalCount,
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("❌ Error al obtener ingresos:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const updateIngreso = async (req, res) => {
  const { id } = req.params;
  const {
    nombre_ingreso,
    categoria,
    fecha_ingreso,
    importe_total,
    descripcion,
  } = req.body;
  const usuario_id = req.user.id;

  try {
    const ingreso = await pool.query(
      "SELECT * FROM ingresos WHERE id = $1 AND usuario_id = $2",
      [id, usuario_id]
    );
    if (ingreso.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Ingreso no encontrado o no autorizado" });
    }

    const updatedIngreso = await pool.query(
      `UPDATE ingresos
       SET nombre_ingreso = $1, categoria = $2, fecha_ingreso = $3, importe_total = $4, descripcion = $5
       WHERE id = $6 AND usuario_id = $7
       RETURNING *`,
      [
        nombre_ingreso || ingreso.rows[0].nombre_ingreso,
        categoria || ingreso.rows[0].categoria,
        fecha_ingreso || ingreso.rows[0].fecha_ingreso,
        importe_total || ingreso.rows[0].importe_total,
        descripcion || ingreso.rows[0].descripcion,
        id,
        usuario_id,
      ]
    );

    res.status(200).json({
      message: "Ingreso actualizado con éxito",
      ingreso: updatedIngreso.rows[0],
    });
  } catch (error) {
    console.error("❌ Error al actualizar ingreso:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const deleteIngreso = async (req, res) => {
  const { id } = req.params;
  const usuario_id = req.user.id;

  try {
    const ingreso = await pool.query(
      "SELECT * FROM ingresos WHERE id = $1 AND usuario_id = $2",
      [id, usuario_id]
    );
    if (ingreso.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Ingreso no encontrado o no autorizado" });
    }

    await pool.query("DELETE FROM ingresos WHERE id = $1 AND usuario_id = $2", [
      id,
      usuario_id,
    ]);

    res.status(200).json({ message: "Ingreso eliminado con éxito" });
  } catch (error) {
    console.error("❌ Error al eliminar ingreso:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

module.exports = { createIngreso, getIngresos, deleteIngreso, updateIngreso };
