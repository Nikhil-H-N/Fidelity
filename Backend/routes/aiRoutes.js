const express = require("express");
const router = express.Router();
const { optionalProtect } = require("../middleware/authMiddleware");
const { chat } = require("../controllers/aiController");

router.post("/chat", optionalProtect, chat);

module.exports = router;
