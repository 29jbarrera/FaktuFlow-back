const pool = require("../db");
const fs = require("fs");
const path = require("path");
const UPLOADS_BASE_URL = process.env.UPLOADS_BASE_URL;

const createFactura = async (req, res) => {
  const { cliente_id, fecha_emision, importe, estado, numero, descripcion } =
    req.body;
  const usuario_id = req.user.id;
  const archivo = req.file ? req.file.filename : null;

  try {
    if (!fecha_emision || !importe || estado === undefined || !cliente_id) {
      return res.status(400).json({
        message: "Fecha de emisión, importe, cliente y estado son obligatorios",
      });
    }

    const newFactura = await pool.query(
      `INSERT INTO facturas (usuario_id, cliente_id, fecha_emision, importe, estado, numero, descripcion, archivo) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [
        usuario_id,
        cliente_id,
        fecha_emision,
        importe,
        estado,
        numero || null,
        descripcion || null,
        archivo || null,
      ]
    );

    res.status(201).json({
      message: "Factura creada con éxito",
      factura: newFactura.rows[0],
    });
  } catch (error) {
    console.error("❌ Error al crear factura:", error);

    // Detectar violación de restricción UNIQUE en PostgreSQL
    if (error.code === "23505" && error.constraint === "facturas_numero_key") {
      return res.status(400).json({
        message: "Ya existe una factura con ese número.",
      });
    }

    res.status(500).json({ message: "Error en el servidor" });
  }
};

const getFacturasByUser = async (req, res) => {
  const usuarioId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;

  const sortField = req.query.sortField || "fecha_emision";
  const sortOrder = req.query.sortOrder === "1" ? "ASC" : "DESC";

  try {
    const result = await pool.query(
      `
      SELECT f.*, c.nombre AS cliente_nombre
      FROM facturas f
      LEFT JOIN clientes c ON f.cliente_id = c.id
      WHERE f.usuario_id = $1
      ORDER BY ${sortField} ${sortOrder}
      LIMIT $2 OFFSET $3
      `,
      [usuarioId, limit, offset]
    );

    const totalCountResult = await pool.query(
      `SELECT COUNT(*) FROM facturas WHERE usuario_id = $1`,
      [usuarioId]
    );

    const totalCount = totalCountResult.rows[0].count;

    const facturasConUrl = result.rows.map((factura) => ({
      ...factura,
      archivo_url: factura.archivo
        ? `${UPLOADS_BASE_URL}/${factura.usuario_id}/${factura.archivo}`
        : null,
    }));

    res.status(200).json({
      facturas: facturasConUrl,
      total: totalCount,
    });
  } catch (error) {
    console.error("❌ Error al obtener las facturas:", error);
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
    console.error("❌ Error al obtener factura:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const updateFactura = async (req, res) => {
  const usuario_id = req.user.id;
  const { id } = req.params;
  // Extraemos del body los campos que se pueden actualizar
  const { cliente_id, fecha_emision, importe, estado, numero, descripcion } =
    req.body;

  try {
    // Primero obtenemos la factura para validar que existe y obtener el archivo actual
    const facturaResult = await pool.query(
      `SELECT * FROM facturas WHERE id = $1 AND usuario_id = $2`,
      [id, usuario_id]
    );

    if (facturaResult.rows.length === 0) {
      return res.status(404).json({ message: "Factura no encontrada" });
    }

    // Determinamos el nombre actual del archivo
    let archivoActual = facturaResult.rows[0].archivo;

    // Si existe un archivo en el request, lo usaremos para reemplazarlo
    // De lo contrario, se mantiene el archivo existente
    if (req.file) {
      // Opcionalmente, elimina el archivo antiguo del sistema de archivos (si existe)
      if (archivoActual) {
        const oldFilePath = path.join(
          __dirname,
          "..",
          "uploads",
          String(usuario_id),
          archivoActual
        );
        fs.unlink(oldFilePath, (err) => {
          if (err) {
            console.error("❌ Error al eliminar el archivo antiguo:", err);
          }
        });
      }
      archivoActual = req.file.filename;
    }

    // Actualizar factura en la base de datos. Se considera que si alguno de los campos es undefined se mantiene su valor anterior.
    // Podrías usar una consulta dinámica o actualizar todos los campos. Aquí se usa UPDATE con todos los parámetros.
    const updatedFacturaResult = await pool.query(
      `UPDATE facturas 
       SET cliente_id = $1,
           fecha_emision = $2,
           importe = $3,
           estado = $4,
           numero = $5,
           descripcion = $6,
           archivo = $7
       WHERE id = $8 AND usuario_id = $9
       RETURNING *`,
      [
        cliente_id || facturaResult.rows[0].cliente_id,
        fecha_emision || facturaResult.rows[0].fecha_emision,
        importe || facturaResult.rows[0].importe,
        estado !== undefined ? estado : facturaResult.rows[0].estado,
        numero !== undefined ? numero : facturaResult.rows[0].numero,
        descripcion !== undefined
          ? descripcion
          : facturaResult.rows[0].descripcion,
        archivoActual || null,
        id,
        usuario_id,
      ]
    );

    res.status(200).json({
      message: "Factura actualizada con éxito",
      factura: updatedFacturaResult.rows[0],
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
    const factura = await pool.query(
      `SELECT * FROM facturas WHERE id = $1 AND usuario_id = $2`,
      [id, usuario_id]
    );

    if (factura.rows.length === 0) {
      return res.status(404).json({ message: "Factura no encontrada" });
    }

    const archivo = factura.rows[0].archivo;

    if (archivo) {
      const filePath = path.join(
        __dirname,
        "..",
        "uploads",
        String(usuario_id),
        archivo
      );

      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("❌ Error al eliminar el archivo:", err);
          return res
            .status(500)
            .json({ message: "Error al eliminar el archivo" });
        }
      });
    }

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

    const factura = facturaResult.rows[0];

    if (!factura.archivo) {
      return res
        .status(400)
        .json({ message: "La factura no tiene archivo asociado" });
    }

    const filePath = path.join(
      __dirname,
      "..",
      "uploads",
      String(usuario_id),
      factura.archivo
    );

    // Intentamos borrar el archivo del disco
    fs.unlink(filePath, async (err) => {
      if (err) {
        console.error("❌ Error al eliminar archivo:", err);
        return res
          .status(500)
          .json({ message: "Error al eliminar el archivo del sistema" });
      }

      // Luego actualizamos la base de datos para dejar el campo archivo en null
      await pool.query(
        `UPDATE facturas SET archivo = NULL WHERE id = $1 AND usuario_id = $2`,
        [id, usuario_id]
      );

      res.json({ message: "Archivo eliminado correctamente" });
    });
  } catch (error) {
    console.error("❌ Error al eliminar el archivo de la factura:", error);
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
};
