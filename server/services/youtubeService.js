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

// Parse ISO8601 duration (PT#M#S etc) to seconds
function parseISODurationToSeconds(iso) {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  const h = parseInt(m[1] || '0', 10);
  const min = parseInt(m[2] || '0', 10);
  const s = parseInt(m[3] || '0', 10);
  return h * 3600 + min * 60 + s;
}

async function getVideoDetails(videoIds = []) {
  if (!videoIds.length) return {};
  try {
    const resp = await youtube.videos.list({
      part: 'contentDetails,statistics,snippet',
      id: videoIds.join(','),
      maxResults: videoIds.length,
    });
    const map = {};
    for (const it of resp.data.items || []) {
      map[it.id] = {
        durationSec: parseISODurationToSeconds(it.contentDetails?.duration),
        publishedAt: it.snippet?.publishedAt ? new Date(it.snippet.publishedAt) : null,
        channelId: it.snippet?.channelId,
        channelTitle: it.snippet?.channelTitle,
        viewCount: Number(it.statistics?.viewCount || 0),
        likeCount: Number(it.statistics?.likeCount || 0),
        description: it.snippet?.description || '',
      };
    }
    return map;
  } catch (e) {
    console.warn('getVideoDetails failed:', e.message);
    return {};
  }
}

// New: search with enriched metadata for filtering and semantic steps
exports.searchVideosWithDetails = async (query, maxResults = 10) => {
  const base = await youtube.search.list({
    part: 'snippet', q: query, type: 'video', maxResults,
    videoEmbeddable: true, order: 'relevance', relevanceLanguage: 'en', safeSearch: 'moderate', regionCode: 'US'
  });
  const items = base.data.items || [];
  const sorted = items
    .map((item) => ({ item, score: scoreItem(item, query) }))
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
  const pick = (sorted.length ? sorted : items).slice(0, maxResults);
  const ids = pick.map((it) => it.id.videoId);
  const details = await getVideoDetails(ids);
  return pick.map((it) => ({
    videoId: it.id.videoId,
    title: it.snippet.title,
    thumbnailUrl: it.snippet.thumbnails?.medium?.url || it.snippet.thumbnails?.default?.url,
    ...details[it.id.videoId],
  }));
};
