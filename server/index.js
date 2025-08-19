const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// CORS – restrict to env origins if provided
const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true,
  })
);

// Security headers
app.use(helmet());

// JSON parsing
app.use(express.json());

// Basic rate limit for API routes
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// Request timeout safeguard (server-side). External calls should also use timeouts.
app.use((req, res, next) => {
  // 65s to be slightly higher than client timeout
  res.setTimeout(65 * 1000);
  next();
});

// Health check
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// API Routes
const courseRoutes = require("./routes/courseRoutes");
const summaryRoutes = require("./routes/summaryRoutes");
app.use("/api", courseRoutes);
app.use("/api", summaryRoutes);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Centralized error handler (must be after routes)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[error]", err?.message || err);
  if (err?.stack) console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({ message: status === 500 ? "Internal Server Error" : err.message });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});