const pool = require("../db");
const fs = require("fs");
const path = require("path");
const { cloudinary } = require("../utils/cloudinary");
const streamifier = require("streamifier");

const createFactura = async (req, res) => {
  const { cliente_id, fecha_emision, importe, estado, numero, descripcion } =
    req.body;
  const usuario_id = req.user.id;

  let archivo = null;
  let archivo_url = null;

  if (req.file) {
    try {
      const ext = path.extname(req.file.originalname).toLowerCase();
      const esPDF = ext === ".pdf";
      const resourceType = esPDF ? "raw" : "image";

      const fileName = path
        .parse(req.file.originalname)
        .name.replace(/\s+/g, "-")
        .replace(/[^\w\-]/g, "");

      const folder = `faktuflow/${usuario_id}`;
      const public_id = `${folder}/${fileName}`;

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id,
          resource_type: resourceType,
          use_filename: false,
          unique_filename: false,
          overwrite: true,
        },
        (error, result) => {
          if (error) {
            console.error(
              "Cloudinary upload error:",
              JSON.stringify(error, null, 2)
            );

            return res
              .status(500)
              .json({ message: "Error al procesar archivo" });
          }

          archivo = result.public_id;
          archivo_url = result.secure_url;

          continuarInsert();
        }
      );

      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    } catch (error) {
      return res.status(500).json({ message: "Error al procesar archivo" });
    }
  } else {
    continuarInsert();
  }

  async function continuarInsert() {
    try {
      const user = await pool.query("SELECT rol FROM usuarios WHERE id = $1", [
        usuario_id,
      ]);
      const rol = user.rows[0]?.rol;

      if (rol !== "admin") {
        const facturaCount = await pool.query(
          `SELECT COUNT(*) FROM facturas WHERE usuario_id = $1`,
          [usuario_id]
        );

        if (parseInt(facturaCount.rows[0].count) >= 250) {
          return res.status(400).json({
            message:
              "Has alcanzado el límite de 250 facturas. Si necesitas más capacidad, contacta al administrador.",
          });
        }
      }

      if (!fecha_emision || !importe || estado === undefined || !cliente_id) {
        return res.status(400).json({
          message:
            "Fecha de emisión, importe, cliente y estado son obligatorios",
        });
      }

      const newFactura = await pool.query(
        `INSERT INTO facturas 
          (usuario_id, cliente_id, fecha_emision, importe, estado, numero, descripcion, archivo, archivo_url) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
         RETURNING *`,
        [
          usuario_id,
          cliente_id,
          fecha_emision,
          importe,
          estado,
          numero || null,
          descripcion || null,
          archivo,
          archivo_url,
        ]
      );

      res.status(201).json({
        message: "Factura creada con éxito",
        factura: newFactura.rows[0],
      });
    } catch (error) {
      if (
        error.code === "23505" &&
        error.constraint === "facturas_numero_key"
      ) {
        return res
          .status(400)
          .json({ message: "Ya existe una factura con ese número." });
      }
      return res.status(500).json({
        message: "Error en el servidor",
        error: error.message,
      });
    }
  }
};

const getFacturasByUser = async (req, res) => {
  const usuarioId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;

  const sortField = req.query.sortField || "fecha_emision";
  const sortOrder = req.query.sortOrder === "1" ? "ASC" : "DESC";

  const search = req.query.search?.toLowerCase().trim() || "";
  const searchPattern = `%${search.replace(/\s/g, "")}%`;

  try {
    const queryParams = [usuarioId];
    let whereClause = `WHERE f.usuario_id = $1`;

    if (search) {
      queryParams.push(searchPattern);
      whereClause += `
        AND (
          REPLACE(LOWER(f.numero), ' ', '') LIKE $2 OR
          REPLACE(LOWER(f.descripcion), ' ', '') LIKE $2 OR
          TO_CHAR(f.fecha_emision, 'DD/MM/YYYY') LIKE $2
        )
      `;
    }

    const orderClause = `ORDER BY ${sortField} ${sortOrder}`;
    const paginatedQuery = `
      SELECT f.*, c.nombre AS cliente_nombre
      FROM facturas f
      LEFT JOIN clientes c ON f.cliente_id = c.id
      ${whereClause}
      ${orderClause}
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    const paginatedParams = [...queryParams, limit, offset];

    const result = await pool.query(paginatedQuery, paginatedParams);

    const totalCountResult = await pool.query(
      `SELECT COUNT(*) FROM facturas WHERE usuario_id = $1`,
      [usuarioId]
    );
    const totalCount = parseInt(totalCountResult.rows[0].count);

    const facturasConUrl = result.rows.map((factura) => {
      let archivo_url = factura.archivo_url;

      if (factura.archivo) {
        const folder = `faktuflow/${usuarioId}`;
        const public_id = factura.archivo;
        const extension = factura.archivo.split(".").pop().toLowerCase();

        if (["jpg", "jpeg", "png"].includes(extension)) {
          archivo_url = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v${public_id}.${extension}`;
        } else if (extension === "pdf") {
          archivo_url = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/v${public_id}.pdf`;
        }
      }

      return {
        ...factura,
        archivo_url,
      };
    });

    res.status(200).json({
      facturas: facturasConUrl,
      total: totalCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las facturas." });
  }
};

const getFacturaById = async (req, res) => {
  const usuario_id = req.user.id;
  const { id } = req.params;

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
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const updateFactura = async (req, res) => {
  const usuario_id = req.user.id;
  const { id } = req.params;
  const { cliente_id, fecha_emision, importe, estado, numero, descripcion } =
    req.body;

  try {
    const facturaResult = await pool.query(
      `SELECT * FROM facturas WHERE id = $1 AND usuario_id = $2`,
      [id, usuario_id]
    );

    if (facturaResult.rows.length === 0) {
      return res.status(404).json({ message: "Factura no encontrada" });
    }

    let archivoActual = facturaResult.rows[0].archivo;
    let archivoUrl = facturaResult.rows[0].archivo_url;

    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase();
      const esPDF = ext === ".pdf";
      const resourceType = esPDF ? "raw" : "image";

      const fileName = path
        .parse(req.file.originalname)
        .name.replace(/\s+/g, "-")
        .replace(/[^\w\-]/g, "");

      const folder = `faktuflow/${usuario_id}`;
      const public_id = `${folder}/${fileName}`;

      if (archivoActual && archivoUrl) {
        const oldResourceType = archivoUrl.includes("/raw/") ? "raw" : "image";

        try {
          const deleteResult = await cloudinary.uploader.destroy(
            archivoActual,
            {
              resource_type: oldResourceType,
              invalidate: true,
            }
          );

          if (deleteResult.result !== "ok") {
            console.warn(
              "Advertencia: el archivo anterior no fue eliminado correctamente"
            );
          }
        } catch (err) {
          console.error("Error al eliminar archivo anterior:", err);
        }
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id,
          resource_type: resourceType,
          use_filename: false,
          unique_filename: false,
          overwrite: true,
        },
        async (error, result) => {
          if (error) {
            return res
              .status(500)
              .json({ message: "Error al subir nuevo archivo" });
          }

          archivoActual = result.public_id;
          archivoUrl = result.secure_url;

          await actualizarFactura();
        }
      );

      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    } else {
      await actualizarFactura();
    }

    async function actualizarFactura() {
      const updatedFacturaResult = await pool.query(
        `UPDATE facturas 
         SET cliente_id = $1,
             fecha_emision = $2,
             importe = $3,
             estado = $4,
             numero = $5,
             descripcion = $6,
             archivo = $7,
             archivo_url = $8
         WHERE id = $9 AND usuario_id = $10
         RETURNING *`,
        [
          cliente_id ?? facturaResult.rows[0].cliente_id,
          fecha_emision ?? facturaResult.rows[0].fecha_emision,
          importe ?? facturaResult.rows[0].importe,
          estado ?? facturaResult.rows[0].estado,
          numero ?? facturaResult.rows[0].numero,
          descripcion ?? facturaResult.rows[0].descripcion,
          archivoActual,
          archivoUrl,
          id,
          usuario_id,
        ]
      );

      res.status(200).json({
        message: "Factura actualizada con éxito",
        factura: updatedFacturaResult.rows[0],
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

const deleteFactura = async (req, res) => {
  const usuario_id = req.user.id;
  const { id } = req.params;

  try {
    const facturaResult = await pool.query(
      `SELECT * FROM facturas WHERE id = $1 AND usuario_id = $2`,
      [id, usuario_id]
    );

    if (facturaResult.rows.length === 0) {
      return res.status(404).json({ message: "Factura no encontrada" });
    }

    const { archivo_url, archivo } = facturaResult.rows[0];

    if (archivo_url && archivo) {
      let resourceType;

      if (archivo_url.includes("/raw/")) {
        resourceType = "raw";
      } else if (archivo_url.includes("/image/")) {
        resourceType = "image";
      } else {
        return res
          .status(400)
          .json({ message: "Tipo de archivo no soportado en Cloudinary" });
      }

      const result = await cloudinary.uploader.destroy(archivo, {
        resource_type: resourceType,
        invalidate: true,
      });

      if (result.result === "not found") {
        return res.status(404).json({
          message: "Archivo no encontrado en Cloudinary",
        });
      }
    }

    await pool.query(`DELETE FROM facturas WHERE id = $1 AND usuario_id = $2`, [
      id,
      usuario_id,
    ]);

    res.json({ message: "Factura y archivo eliminados correctamente" });
  } catch (error) {
    res.status(500).json({
      message: "Error en el servidor",
      error: error.message,
    });
  }
};

const deleteArchivoFactura = async (req, res) => {
  const usuario_id = req.user.id;
  const { id } = req.params;

  try {
    const facturaResult = await pool.query(
      `SELECT * FROM facturas WHERE id = $1 AND usuario_id = $2`,
      [id, usuario_id]
    );

    if (facturaResult.rows.length === 0) {
      return res.status(404).json({ message: "Factura no encontrada" });
    }

    const { archivo, archivo_url } = facturaResult.rows[0];

    if (!archivo || !archivo_url) {
      return res
        .status(400)
        .json({ message: "La factura no tiene archivo asociado" });
    }

    let resourceType;
    if (archivo_url.includes("/raw/")) {
      resourceType = "raw";
    } else if (archivo_url.includes("/image/")) {
      resourceType = "image";
    } else {
      return res
        .status(400)
        .json({ message: "Tipo de archivo no soportado en Cloudinary" });
    }

    const result = await cloudinary.uploader.destroy(archivo, {
      resource_type: resourceType,
      invalidate: true,
    });

    if (result.result === "not found") {
      return res.status(404).json({
        message: "Archivo no encontrado en Cloudinary",
      });
    }

    await pool.query(
      `UPDATE facturas SET archivo = NULL, archivo_url = NULL WHERE id = $1 AND usuario_id = $2`,
      [id, usuario_id]
    );

    res.json({ message: "Archivo eliminado correctamente de la factura" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error en el servidor", error: error.message });
  }
};

const getResumenFacturasPorYear = async (req, res) => {
  const usuario_id = req.user.id;
  const year = parseInt(req.query.year);

  if (!year || isNaN(year)) {
    return res.status(400).json({ message: "Año inválido" });
  }

  try {
    const resumenQuery = await pool.query(
      `
      SELECT
        COUNT(*) AS total_facturas,
        COUNT(*) FILTER (WHERE estado = true) AS pagadas,
        COUNT(*) FILTER (WHERE estado = false) AS no_pagadas,
        COALESCE(SUM(importe), 0) AS total_importe,
        COALESCE(SUM(importe) FILTER (WHERE estado = true), 0) AS importe_pagadas,
        COALESCE(SUM(importe) FILTER (WHERE estado = false), 0) AS importe_no_pagadas,
        ROUND(AVG(importe)::numeric, 2) AS promedio_importe,
        ROUND(AVG(importe) FILTER (WHERE estado = true)::numeric, 2) AS promedio_pagadas,
        ROUND(AVG(importe) FILTER (WHERE estado = false)::numeric, 2) AS promedio_no_pagadas
      FROM facturas
      WHERE usuario_id = $1 AND EXTRACT(YEAR FROM fecha_emision) = $2
      `,
      [usuario_id, year]
    );

    const resumen = resumenQuery.rows[0];

    const mensualQuery = await pool.query(
      `
      SELECT 
        TO_CHAR(fecha_emision, 'MM') AS mes,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE estado = true) AS pagadas,
        COUNT(*) FILTER (WHERE estado = false) AS no_pagadas,
        COALESCE(SUM(importe), 0) AS total_importe
      FROM facturas
      WHERE usuario_id = $1 AND EXTRACT(YEAR FROM fecha_emision) = $2
      GROUP BY mes
      ORDER BY mes
      `,
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
        pagadas: found ? parseInt(found.pagadas) : 0,
        noPagadas: found ? parseInt(found.no_pagadas) : 0,
        totalImporte: found ? parseFloat(found.total_importe) : 0,
      };
    });

    res.json({
      year,
      resumen: {
        totalFacturas: parseInt(resumen.total_facturas),
        pagadas: parseInt(resumen.pagadas),
        noPagadas: parseInt(resumen.no_pagadas),
        totalImporte: parseFloat(resumen.total_importe),
        importePagadas: parseFloat(resumen.importe_pagadas),
        importeNoPagadas: parseFloat(resumen.importe_no_pagadas),
        promedioImporte: parseFloat(resumen.promedio_importe || 0),
        promedioPagadas: parseFloat(resumen.promedio_pagadas || 0),
        promedioNoPagadas: parseFloat(resumen.promedio_no_pagadas || 0),
      },
      mensual: agrupadoMensual,
    });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor" });
  }
};

module.exports = {
  createFactura,
  getFacturasByUser,
  getFacturaById,
  updateFactura,
  deleteFactura,
  deleteArchivoFactura,
  getResumenFacturasPorYear,
};
