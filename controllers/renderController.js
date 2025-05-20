const ping = (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "ok",
  });
};

const keepAlive = async (req, res) => {
  const apiKey = req.query.key;
  if (apiKey !== process.env.KEEP_ALIVE_KEY) {
    return res.status(403).send("No autorizado");
  }

  try {
    await pool.query("SELECT 1");
    res.status(200).send("Alive");
  } catch (err) {
    res.status(500).send("Error");
  }
};

module.exports = {
  ping,
  keepAlive,
};
