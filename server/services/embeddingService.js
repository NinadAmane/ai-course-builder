const { pipeline } = require('@xenova/transformers');

let featureExtractor = null;

async function getExtractor() {
  if (!featureExtractor) {
    // Small, fast, free model. Downloads once and caches locally.
    featureExtractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return featureExtractor;
}

// Return a plain number array embedding for input text
exports.embedText = async function embedText(text) {
  if (!text || !text.trim()) return [];
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  // output is a Tensor; convert to JS array
  const arr = Array.from(output.data);
  return arr;
};
