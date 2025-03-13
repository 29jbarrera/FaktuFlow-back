const pool = require("../db");

const getAdminDashboardStats = async (req, res) => {
  try {
    // Consultas para obtener el total de registros en cada tabla
    const totalUsuarios = await pool.query("SELECT COUNT(*) FROM usuarios");
    const totalGastos = await pool.query("SELECT COUNT(*) FROM gastos");
    const totalFacturas = await pool.query("SELECT COUNT(*) FROM facturas");
    const totalClientes = await pool.query("SELECT COUNT(*) FROM clientes");

    // Enviar respuesta con los totales
    res.status(200).json({
      totalUsuarios: parseInt(totalUsuarios.rows[0].count),
      totalGastos: parseInt(totalGastos.rows[0].count),
      totalFacturas: parseInt(totalFacturas.rows[0].count),
      totalClientes: parseInt(totalClientes.rows[0].count),
    });
  } catch (error) {
    console.error("❌ Error obteniendo estadísticas de admin:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const getUsersWithStats = async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Página actual
  const limit = parseInt(req.query.limit) || 10; // Límite de usuarios por página
  const offset = (page - 1) * limit; // Calcular el OFFSET para la consulta

  try {
    // Consultar usuarios con paginación
    const users = await pool.query(
      "SELECT id, nombre, apellidos, email, rol FROM usuarios ORDER BY nombre ASC LIMIT $1 OFFSET $2",
      [limit, offset]
    );

    // Si no hay usuarios, devolver una respuesta vacía
    if (users.rows.length === 0) {
      return res
        .status(200)
        .json({ message: "No hay usuarios registrados", users: [] });
    }

    // Recorremos cada usuario y obtenemos sus estadísticas
    const usersWithStats = await Promise.all(
      users.rows.map(async (user) => {
        const userId = user.id;

        // Consultas para obtener la cantidad de registros por usuario
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
          email: user.email,
          rol: user.rol,
          totalFacturas: parseInt(totalFacturas.rows[0].count),
          totalGastos: parseInt(totalGastos.rows[0].count),
          totalIngresos: parseInt(totalIngresos.rows[0].count),
          totalClientes: parseInt(totalClientes.rows[0].count),
        };
      })
    );

    // Contar el número total de usuarios para el cálculo de las páginas
    const totalCountResult = await pool.query("SELECT COUNT(*) FROM usuarios");
    const totalCount = totalCountResult.rows[0].count; // Total de registros
    const totalPages = Math.ceil(totalCount / limit); // Calcular el número total de páginas

    res.status(200).json({
      users: usersWithStats, // Usuarios con estadísticas de la página actual
      total: totalCount, // Total de usuarios (para calcular el número de páginas)
      totalPages: totalPages, // Total de páginas
    });
  } catch (error) {
    console.error("❌ Error obteniendo usuarios con estadísticas:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

module.exports = { getAdminDashboardStats, getUsersWithStats };
