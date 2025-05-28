const pool = require("../db");
const { decrypt } = require("../utils/encryption");

const getAdminDashboardStats = async (req, res) => {
  try {
    const totalUsuarios = await pool.query("SELECT COUNT(*) FROM usuarios");
    const totalGastos = await pool.query("SELECT COUNT(*) FROM gastos");
    const totalFacturas = await pool.query("SELECT COUNT(*) FROM facturas");
    const totalClientes = await pool.query("SELECT COUNT(*) FROM clientes");

    res.status(200).json({
      totalUsuarios: parseInt(totalUsuarios.rows[0].count),
      totalGastos: parseInt(totalGastos.rows[0].count),
      totalFacturas: parseInt(totalFacturas.rows[0].count),
      totalClientes: parseInt(totalClientes.rows[0].count),
    });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const getUsersWithStats = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const users = await pool.query(
      "SELECT id, nombre, apellidos, email, rol FROM usuarios ORDER BY nombre ASC LIMIT $1 OFFSET $2",
      [limit, offset]
    );

    if (users.rows.length === 0) {
      return res
        .status(200)
        .json({ message: "No hay usuarios registrados", users: [] });
    }

    const usersWithStats = await Promise.all(
      users.rows.map(async (user) => {
        const userId = user.id;

        let decryptedEmail;
        try {
          decryptedEmail = decrypt(user.email);
        } catch (err) {
          decryptedEmail = "[ERROR AL DESENCRIPTAR]";
        }

        const totalFacturas = await pool.query(
          "SELECT COUNT(*) FROM facturas WHERE usuario_id = $1",
          [userId]
        );
        const totalGastos = await pool.query(
          "SELECT COUNT(*) FROM gastos WHERE usuario_id = $1",
          [userId]
        );
        const totalIngresos = await pool.query(
          "SELECT COUNT(*) FROM ingresos WHERE usuario_id = $1",
          [userId]
        );
        const totalClientes = await pool.query(
          "SELECT COUNT(*) FROM clientes WHERE usuario_id = $1",
          [userId]
        );

        return {
          id: user.id,
          nombre: user.nombre,
          apellidos: user.apellidos,
          email: decryptedEmail,
          rol: user.rol,
          totalFacturas: parseInt(totalFacturas.rows[0].count),
          totalGastos: parseInt(totalGastos.rows[0].count),
          totalIngresos: parseInt(totalIngresos.rows[0].count),
          totalClientes: parseInt(totalClientes.rows[0].count),
        };
      })
    );

    const totalCountResult = await pool.query("SELECT COUNT(*) FROM usuarios");
    const totalCount = totalCountResult.rows[0].count;
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      users: usersWithStats,
      total: totalCount,
      totalPages: totalPages,
    });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const getTotalUsuarios = async (req, res) => {
  try {
    const [
      usuariosResult,
      facturasResult,
      gastosResult,
      ingresosResult,
      clientesResult,
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) AS total_usuarios FROM usuarios"),
      pool.query("SELECT COUNT(*) AS total_facturas FROM facturas"),
      pool.query("SELECT COUNT(*) AS total_gastos FROM gastos"),
      pool.query("SELECT COUNT(*) AS total_ingresos FROM ingresos"),
      pool.query("SELECT COUNT(*) AS total_clientes FROM clientes"),
    ]);

    res.status(200).json({
      totalUsuarios: parseInt(usuariosResult.rows[0].total_usuarios, 10),
      totalFacturas: parseInt(facturasResult.rows[0].total_facturas, 10),
      totalGastos: parseInt(gastosResult.rows[0].total_gastos, 10),
      totalIngresos: parseInt(ingresosResult.rows[0].total_ingresos, 10),
      totalClientes: parseInt(clientesResult.rows[0].total_clientes, 10),
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error en el servidor", error: error.message });
  }
};

const getStatsByUser = async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id,
        u.nombre,
        u.apellidos,
        COALESCE(f.total_facturas, 0) AS total_facturas,
        COALESCE(g.total_gastos, 0) AS total_gastos,
        COALESCE(i.total_ingresos, 0) AS total_ingresos,
        COALESCE(c.total_clientes, 0) AS total_clientes
      FROM usuarios u
      LEFT JOIN (
        SELECT usuario_id, COUNT(*) AS total_facturas
        FROM facturas
        GROUP BY usuario_id
      ) f ON f.usuario_id = u.id
      LEFT JOIN (
        SELECT usuario_id, COUNT(*) AS total_gastos
        FROM gastos
        GROUP BY usuario_id
      ) g ON g.usuario_id = u.id
      LEFT JOIN (
        SELECT usuario_id, COUNT(*) AS total_ingresos
        FROM ingresos
        GROUP BY usuario_id
      ) i ON i.usuario_id = u.id
      LEFT JOIN (
        SELECT usuario_id, COUNT(*) AS total_clientes
        FROM clientes
        GROUP BY usuario_id
      ) c ON c.usuario_id = u.id
      ORDER BY u.nombre, u.apellidos;
    `;

    const result = await pool.query(query);

    res.status(200).json({ usuarios: result.rows });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error en el servidor", error: error.message });
  }
};

module.exports = {
  getAdminDashboardStats,
  getUsersWithStats,
  getTotalUsuarios,
  getStatsByUser,
};
