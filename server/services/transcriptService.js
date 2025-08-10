const { YoutubeTranscript } = require("youtube-transcript");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Fetch transcript for a single video
async function getTranscript(videoId) {
  const MAX_TRIES = 3;
  for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      return transcript.map((item) => item.text).join(" ");
    } catch (error) {
      if (attempt >= MAX_TRIES) {
        console.log(`Could not get transcript for video ${videoId}`);
        return "";
      }
      const backoff = 500 * Math.pow(2, attempt - 1); // 500ms, 1s
      await sleep(backoff);
    }
  }
}

// Fetch transcript for the first video in a module
exports.getTranscriptForModule = async function (videos) {
  if (!videos || videos.length === 0) {
    return "";
  }
  const firstVideoId = videos[0].videoId;
  return await getTranscript(firstVideoId);
};

exports.getTranscript = getTranscript;