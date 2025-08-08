const { google } = require("googleapis");

// The client is initialized here as 'youtube' (lowercase)
const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

exports.searchVideos = async (query) => {
  try {
    // FIX: We must use 'Youtube.list' (lowercase and with '.search')
    const response = await youtube.search.list({
      part: "snippet",
      q: `${query} tutorial for beginners`, // We add context to get better results
      type: "video",
      maxResults: 3, // Let's fetch 3 videos per module
      videoEmbeddable: true,
    });

    // We only need specific fields, not the whole API response
    const videos = response.data.items.map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      thumbnailUrl: item.snippet.thumbnails.medium.url,
    }));

    return videos;
  } catch (error) {
    console.error("Error searching YouTube videos:", error.message);
    // Return an empty array so the course generation doesn't fail
    return [];
  }
};
