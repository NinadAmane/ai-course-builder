const mongoose = require('mongoose');

const videoEmbeddingSchema = new mongoose.Schema({
  videoId: { type: String, required: true, unique: true },
  // vector length depends on model; store as Number[]
  embedding: { type: [Number], required: true },
  // minimal metadata for reuse/filtering
  title: String,
  description: String,
  channelId: String,
  channelTitle: String,
  publishedAt: Date,
  durationSec: Number,
  viewCount: Number,
  likeCount: Number,
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('VideoEmbedding', videoEmbeddingSchema);
