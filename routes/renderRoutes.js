const express = require("express");
const router = express.Router();
const { ping, keepAlive } = require("../controllers/renderController");

router.get("/ping", ping);

router.get("/keep-alive", keepAlive);

module.exports = router;
