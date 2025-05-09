const express = require("express");
const cors = require("cors");
require("dotenv").config();
const pool = require("./db");
const authRoutes = require("./routes/authRoutes");
const usuariosRoutes = require("./routes/usuariosRoutes");
const clientesRoutes = require("./routes/clientesRoutes");
const facturasRoutes = require("./routes/facturasRoutes");
const gastosRoutes = require("./routes/gastosRoutes");
const ingresosRoutes = require("./routes/ingresosRoutes");
const adminRoutes = require("./routes/adminRoutes");
const renderRoutes = require("./routes/renderRoutes");
const resetPassword = require("./routes/resetPasswordRoutes");

const app = express();
const PORT = process.env.PORT || 3000;
const path = require("path");

app.use(express.json());
app.use(cors());
app.use("/static", express.static(path.join(__dirname, "assets")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ message: "Conexión exitosa", time: result.rows[0] });
  } catch (error) {
    res.status(500).send("Error en la base de datos");
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/facturas", facturasRoutes);
app.use("/api/gastos", gastosRoutes);
app.use("/api/ingresos", ingresosRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", renderRoutes);
app.use("/api", resetPassword);

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
