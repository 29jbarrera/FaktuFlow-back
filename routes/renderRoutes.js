const express = require("express");
const router = express.Router();
const healthController = require("../controllers/renderController");

router.get("/ping", healthController.ping);

module.exports = router;
