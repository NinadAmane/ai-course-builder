const express = require("express");
const { getVideoSummary } = require("../controllers/summaryController");

const router = express.Router();

router.get("/video-summary/:id", getVideoSummary);

module.exports = router;