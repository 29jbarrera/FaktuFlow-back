const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.get('/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: 'Conexión exitosa', time: result.rows[0] });
  } catch (error) {
    console.error('❌ Error ejecutando la consulta', error);
    res.status(500).send('Error en la base de datos');
  }
});

// Rutas
app.use('/api/auth', authRoutes); 

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
