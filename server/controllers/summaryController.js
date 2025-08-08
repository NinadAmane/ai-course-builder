const { getTranscript } = require("../services/transcriptService");
const { summarizeText } = require("../services/geminiService");

exports.getVideoSummary = async (req, res) => {
  const { id } = req.params;
  try {
    const transcript = await getTranscript(id);
    const summary = await summarizeText(transcript);
    res.json({ transcript, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};