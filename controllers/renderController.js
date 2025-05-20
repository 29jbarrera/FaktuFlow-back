const pool = require("../db");

const ping = (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "ok",
  });
};

const keepAlive = async (req, res) => {
  const apiKey = req.query.key;
  console.log("Received key:", apiKey);
  console.log("Expected key:", process.env.KEEP_ALIVE_KEY);

  if (apiKey !== process.env.KEEP_ALIVE_KEY) {
    return res.status(403).send("No autorizado");
  }

  try {
    await pool.query("SELECT 1");
    res.status(200).send("Alive");
  } catch (err) {
    console.error("Error en consulta DB en /keep-alive:", err);
    res.status(500).send("Error");
  }
};

module.exports = {
  ping,
  keepAlive,
};
