const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");

// Define the route: POST /api/generate
router.post("/generate", courseController.generateCourse);

module.exports = router;
