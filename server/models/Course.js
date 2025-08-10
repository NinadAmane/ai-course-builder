const mongoose = require("mongoose"); // ✅ REQUIRED LINE

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  learningObjective: { type: String },
  videos: [
    {
      videoId: String,
      title: String,
      thumbnailUrl: String,
      // new optional metadata for smarter search
      channelId: String,
      channelTitle: String,
      publishedAt: Date,
      durationSec: Number,
      viewCount: Number,
      likeCount: Number,
      relevanceScore: Number,
      approved: { type: Boolean, default: true },
    },
  ],
  // New: web resources (articles, docs, PDFs) attached to this module
  resources: [
    {
      title: String,
      url: String,
      source: String,
      snippet: String,
    },
  ],
  summary: { type: String },
  quiz: [
    {
      question: String,
      options: [String],
      correctAnswer: String,
      explanation: String,
    },
  ],
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  modules: [moduleSchema],
  createdAt: { type: Date, default: Date.now },
});

const Course = mongoose.model("Course", courseSchema); // ✅ CREATE MODEL

module.exports = Course; // ✅ EXPORT IT
