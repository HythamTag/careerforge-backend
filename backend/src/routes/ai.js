const express = require("express");
const router = express.Router();
const AIController = require("../controllers/aiController");

/**
 * AI enhancement routes
 * Owner: Backend Leader
 * Routes: POST /ai/enhance
 */

router.post("/enhance", AIController.enhanceSection);

module.exports = router;
