const { google } = require("googleapis");

// The client is initialized here as 'youtube' (lowercase)
const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

function scoreItem(item, query) {
  const title = (item.snippet?.title || "").toLowerCase();
  const desc = (item.snippet?.description || "").toLowerCase();
  const tokens = Array.from(
    new Set(query.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 4))
  );
  let s = 0;
  for (const t of tokens) {
    if (title.includes(t)) s += 3;
    if (desc.includes(t)) s += 1;
  }
  // denylist to avoid common irrelevant genres seen in results
  const deny = [
    "song",
    "music",
    "piano",
    "guitar",
    "cover",
    "lyrics",
    "asmr",
    "knot",
    "tying",
    "finger independence",
  ];
  for (const d of deny) {
    if (title.includes(d)) s -= 6;
  }
  return s;
}

exports.searchVideos = async (query) => {
  try {
    const response = await youtube.search.list({
      part: "snippet",
      q: query, // pass in contextualized query from controller
      type: "video",
      maxResults: 10,
      videoEmbeddable: true,
      order: "relevance",
      relevanceLanguage: "en",
      safeSearch: "moderate",
      regionCode: "US",
    });

    const items = response.data.items || [];

    // Score and sort by relevance
    const sorted = items
      .map((item) => ({ item, score: scoreItem(item, query) }))
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);

    const pick = (sorted.length ? sorted : items).slice(0, 3);

    // We only need specific fields, not the whole API response
    const videos = pick.map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
    }));

    return videos;
  } catch (error) {
    console.error("Error searching YouTube videos:", error.message);
    // Return an empty array so the course generation doesn't fail
    return [];
  }
};
