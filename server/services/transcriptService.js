const { YoutubeTranscript } = require("youtube-transcript");

// Fetch transcript for a single video
async function getTranscript(videoId) {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    return transcript.map((item) => item.text).join(" ");
  } catch (error) {
    console.log(`Could not get transcript for video ${videoId}`);
    return "";
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