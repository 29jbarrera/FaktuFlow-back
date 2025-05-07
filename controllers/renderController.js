const ping = (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "ok",
  });
};

module.exports = {
  ping,
};
