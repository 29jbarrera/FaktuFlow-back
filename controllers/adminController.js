const pool = require('../db'); // Conexión a la base de datos

// 📌 Obtener estadísticas generales del sistema (Solo Admin)
const getAdminDashboardStats = async (req, res) => {
  try {
    // Consultas para obtener el total de registros en cada tabla
    const totalUsuarios = await pool.query('SELECT COUNT(*) FROM usuarios');
    const totalGastos = await pool.query('SELECT COUNT(*) FROM gastos');
    const totalFacturas = await pool.query('SELECT COUNT(*) FROM facturas');
    const totalClientes = await pool.query('SELECT COUNT(*) FROM clientes');

    // Enviar respuesta con los totales
    res.status(200).json({
      totalUsuarios: parseInt(totalUsuarios.rows[0].count),
      totalGastos: parseInt(totalGastos.rows[0].count),
      totalFacturas: parseInt(totalFacturas.rows[0].count),
      totalClientes: parseInt(totalClientes.rows[0].count),
    });
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de admin:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = { getAdminDashboardStats };
