const pool = require("../db");
const { encrypt, decrypt } = require("../utils/encryption");

const createIngreso = async (req, res) => {
  const usuario_id = req.user.id;
  let { nombre_ingreso, categoria, fecha_ingreso, importe_total, descripcion } =
    req.body;

  try {
    // Verificar rol usuario
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

    // Validar campos obligatorios
    if (!nombre_ingreso || !categoria || !importe_total) {
      return res.status(400).json({
        message: "El nombre, categoría e importe total son obligatorios",
      });
    }

    // Encriptar solo nombre_ingreso
    const nombre_ingreso_encrypted = encrypt(nombre_ingreso);

    // Fecha sin encriptar, si no se pasa usamos fecha actual
    const fecha_valor = fecha_ingreso ? new Date(fecha_ingreso) : new Date();

    // Insertar en DB, solo nombre_ingreso encriptado
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
        importe_total, // importe sin encriptar
        descripcion, // descripcion sin encriptar
      ]
    );

    // Desencriptar nombre_ingreso para la respuesta
    const ingreso = newIngreso.rows[0];
    ingreso.nombre_ingreso = decrypt(ingreso.nombre_ingreso);

    res.status(201).json({
      message: "Ingreso registrado con éxito",
      ingreso,
    });
  } catch (error) {
    console.error("Error en createIngreso:", error);
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
      // NOTA: No se puede buscar en nombre_ingreso porque está encriptado
      // Si quieres buscar en nombre_ingreso, deberías desencriptar en backend
      // y filtrar, pero eso es poco eficiente para bases grandes.
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

    // Desencriptar nombre_ingreso en cada fila
    const ingresosDesencriptados = result.rows.map((ingreso) => ({
      ...ingreso,
      nombre_ingreso: decrypt(ingreso.nombre_ingreso),
    }));

    res.status(200).json({
      ingresos: ingresosDesencriptados,
      total: totalCount,
    });
  } catch (error) {
    console.error("Error en getIngresos:", error);
    res.status(500).json({ message: "Error al obtener los ingresos." });
  }
};

const updateIngreso = async (req, res) => {
  const { id } = req.params;
  let { nombre_ingreso, categoria, fecha_ingreso, importe_total, descripcion } =
    req.body;
  const usuario_id = req.user.id;

  try {
    // Obtener ingreso existente
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

    // Encriptar nombre_ingreso solo si viene en la actualización
    const nombre_ingreso_encrypted =
      nombre_ingreso !== undefined
        ? encrypt(nombre_ingreso)
        : ingreso.nombre_ingreso;

    // Mantener valores anteriores si no vienen en la actualización
    const categoria_actual =
      categoria !== undefined ? categoria : ingreso.categoria;
    const fecha_ingreso_actual =
      fecha_ingreso !== undefined ? fecha_ingreso : ingreso.fecha_ingreso;
    const importe_total_actual =
      importe_total !== undefined ? importe_total : ingreso.importe_total;
    const descripcion_actual =
      descripcion !== undefined ? descripcion : ingreso.descripcion;

    // Actualizar ingreso
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

    // Desencriptar nombre_ingreso antes de enviar la respuesta
    ingresoActualizado.nombre_ingreso = decrypt(
      ingresoActualizado.nombre_ingreso
    );

    res.status(200).json({
      message: "Ingreso actualizado con éxito",
      ingreso: ingresoActualizado,
    });
  } catch (error) {
    console.error("Error en updateIngreso:", error);
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
