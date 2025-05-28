const pool = require("../db");
const { encrypt, decrypt } = require("../utils/encryption");

const createIngreso = async (req, res) => {
  const usuario_id = req.user.id;
  let { nombre_ingreso, categoria, fecha_ingreso, importe_total, descripcion } =
    req.body;

  try {
    const user = await pool.query("SELECT rol FROM usuarios WHERE id = $1", [
      usuario_id,
    ]);

    if (user.rows[0].rol !== "admin") {
      const result = await pool.query(
        "SELECT COUNT(*) FROM ingresos WHERE usuario_id = $1",
        [usuario_id]
      );

      const cantidadIngresos = parseInt(result.rows[0].count, 10);
      if (cantidadIngresos >= 1000) {
        return res.status(400).json({
          message:
            "Has alcanzado el límite de 1000 ingresos por usuario. Si necesitas más capacidad, contacta al administrador.",
        });
      }
    }

    if (!nombre_ingreso || !categoria || !importe_total) {
      return res.status(400).json({
        message: "El nombre, categoría e importe total son obligatorios",
      });
    }
    const nombre_ingreso_encrypted = encrypt(nombre_ingreso);

    const fecha_valor = fecha_ingreso ? new Date(fecha_ingreso) : new Date();

    const newIngreso = await pool.query(
      `INSERT INTO ingresos 
        (nombre_ingreso, usuario_id, categoria, fecha_ingreso, importe_total, descripcion) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        nombre_ingreso_encrypted,
        usuario_id,
        categoria,
        fecha_valor,
        importe_total,
        descripcion,
      ]
    );

    const ingreso = newIngreso.rows[0];
    ingreso.nombre_ingreso = decrypt(ingreso.nombre_ingreso);

    res.status(201).json({
      message: "Ingreso registrado con éxito",
      ingreso,
    });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const getIngresos = async (req, res) => {
  const usuario_id = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;

  const sortField = req.query.sortField || "fecha_ingreso";
  const sortOrder = req.query.sortOrder === "1" ? "ASC" : "DESC";

  const search = req.query.search?.toLowerCase()?.trim() || "";

  const allowedFields = [
    "nombre_ingreso",
    "categoria",
    "fecha_ingreso",
    "importe_total",
  ];
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
          LOWER(categoria) ILIKE $2 OR
          LOWER(descripcion) ILIKE $2 OR
          TO_CHAR(fecha_ingreso, 'DD/MM/YYYY') LIKE $2
        )
      `;
    }

    const paginatedQuery = `
      SELECT id, nombre_ingreso, categoria, fecha_ingreso, importe_total, descripcion
      FROM ingresos
      ${whereClause}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    const totalQuery = `
      SELECT COUNT(*) FROM ingresos
      ${whereClause}
    `;

    const paginatedParams = [...queryParams, limit, offset];

    const result = await pool.query(paginatedQuery, paginatedParams);
    const totalCountResult = await pool.query(totalQuery, queryParams);
    const totalCount = parseInt(totalCountResult.rows[0].count);

    const ingresosDesencriptados = result.rows.map((ingreso) => ({
      ...ingreso,
      nombre_ingreso: decrypt(ingreso.nombre_ingreso),
    }));

    res.status(200).json({
      ingresos: ingresosDesencriptados,
      total: totalCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los ingresos." });
  }
};

const updateIngreso = async (req, res) => {
  const { id } = req.params;
  let { nombre_ingreso, categoria, fecha_ingreso, importe_total, descripcion } =
    req.body;
  const usuario_id = req.user.id;

  try {
    const ingresoQuery = await pool.query(
      "SELECT * FROM ingresos WHERE id = $1 AND usuario_id = $2",
      [id, usuario_id]
    );

    if (ingresoQuery.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Ingreso no encontrado o no autorizado" });
    }

    const ingreso = ingresoQuery.rows[0];

    const nombre_ingreso_encrypted =
      nombre_ingreso !== undefined
        ? encrypt(nombre_ingreso)
        : ingreso.nombre_ingreso;

    const categoria_actual =
      categoria !== undefined ? categoria : ingreso.categoria;
    const fecha_ingreso_actual =
      fecha_ingreso !== undefined ? fecha_ingreso : ingreso.fecha_ingreso;
    const importe_total_actual =
      importe_total !== undefined ? importe_total : ingreso.importe_total;
    const descripcion_actual =
      descripcion !== undefined ? descripcion : ingreso.descripcion;

    const updatedIngreso = await pool.query(
      `UPDATE ingresos
       SET nombre_ingreso = $1,
           categoria = $2,
           fecha_ingreso = $3,
           importe_total = $4,
           descripcion = $5
       WHERE id = $6 AND usuario_id = $7
       RETURNING *`,
      [
        nombre_ingreso_encrypted,
        categoria_actual,
        fecha_ingreso_actual,
        importe_total_actual,
        descripcion_actual,
        id,
        usuario_id,
      ]
    );

    const ingresoActualizado = updatedIngreso.rows[0];

    ingresoActualizado.nombre_ingreso = decrypt(
      ingresoActualizado.nombre_ingreso
    );

    res.status(200).json({
      message: "Ingreso actualizado con éxito",
      ingreso: ingresoActualizado,
    });
  } catch (error) {
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

    await pool.query("DELETE FROM ingresos WHERE id = $1", [id]);
    res.status(200).json({ message: "Ingreso eliminado con éxito" });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const getResumenIngresos = async (req, res) => {
  const usuario_id = req.user.id;
  const year = parseInt(req.query.year);

  if (!year || isNaN(year)) {
    return res.status(400).json({ message: "Año inválido" });
  }

  try {
    const resumenQuery = await pool.query(
      `SELECT 
        COUNT(*) AS total_ingresos,
        SUM(importe_total) AS total_importe,
        ROUND(AVG(importe_total), 2) AS promedio_importe
      FROM ingresos
      WHERE usuario_id = $1 AND EXTRACT(YEAR FROM fecha_ingreso) = $2`,
      [usuario_id, year]
    );

    const resumen = resumenQuery.rows[0];

    const mensualQuery = await pool.query(
      `SELECT 
        TO_CHAR(fecha_ingreso, 'MM') AS mes,
        COUNT(*) AS total,
        SUM(importe_total) AS total_importe
      FROM ingresos
      WHERE usuario_id = $1 AND EXTRACT(YEAR FROM fecha_ingreso) = $2
      GROUP BY mes
      ORDER BY mes`,
      [usuario_id, year]
    );

    const meses = [
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "07",
      "08",
      "09",
      "10",
      "11",
      "12",
    ];

    const agrupadoMensual = meses.map((mes) => {
      const found = mensualQuery.rows.find((row) => row.mes === mes);
      return {
        mes,
        total: found ? parseInt(found.total) : 0,
        totalImporte: found ? parseFloat(found.total_importe) : 0,
      };
    });

    res.status(200).json({
      year,
      resumen: {
        totalIngresos: parseInt(resumen.total_ingresos) || 0,
        totalImporte: parseFloat(resumen.total_importe) || 0,
        promedioImporte: parseFloat(resumen.promedio_importe) || 0,
      },
      mensual: agrupadoMensual,
    });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor" });
  }
};

module.exports = {
  createIngreso,
  getIngresos,
  deleteIngreso,
  updateIngreso,
  getResumenIngresos,
};
