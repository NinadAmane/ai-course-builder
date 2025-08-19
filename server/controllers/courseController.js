const Course = require("../models/Course");
const geminiService = require("../services/geminiService");
const youtubeService = require("../services/youtubeService");
const transcriptService = require("../services/transcriptService");
const webSearchService = require("../services/webSearchService");
const { embedText } = require("../services/embeddingService");
const VideoEmbedding = require("../models/VideoEmbedding");

function cosineSim(a = [], b = []) {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i], y = b[i];
    dot += x * y; na += x * x; nb += y * y;
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// Extract core keywords from a module title/objective to improve web search relevance
function refineQuery(text = '', objective = '') {
  const stop = new Set(['introduction','intro','basics','fundamentals','overview','module','lesson','guide','tutorial','for','beginners','beginner','what','is','and','of','to','the','a','an']);
  const tokens = `${text} ${objective}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t && !stop.has(t) && t.length > 2);
  // Prefer the first meaningful 3–6 terms
  const picked = Array.from(new Set(tokens)).slice(0, 6);
  return picked.join(' ')
    || text
    || objective
    || '';
}

exports.generateCourse = async (req, res) => {
  try {
    const { topic, refresh, semantic = true, filters = {} } = req.body;
    if (!topic) {
      return res.status(400).json({ message: "Topic is required" });
    }

    // 0. If we've already generated this course, reuse it to avoid hitting LLM quota
    let existing = await Course.findOne({ title: topic });
    if (existing && !refresh) {
      // If resources are missing or contain unresolved duckduckgo links (older saved course), sanitize/enrich now
      const enrichedModules = await Promise.all(
        (existing.modules || []).map(async (module) => {
          let resources = Array.isArray(module.resources) ? module.resources : [];
          // sanitize existing resources (remove duckduckgo redirects, decode, etc.)
          if (resources.length) {
            resources = webSearchService.sanitizeResources(resources);
          }

          // determine if resources look generic/low quality
          const looksGeneric = (items = []) => {
            return (items || []).some((r) => {
              const t = (r?.title || '').toLowerCase();
              const u = (r?.url || '').toLowerCase();
              return /\bsearch\b/.test(t) || /[?&]q=/.test(u) || /duckduckgo\.com|google\.com|bing\.com/.test(u);
            });
          };

          const refined = refineQuery(module.title, module.learningObjective);
          const query = `${refined} tutorial guide documentation examples`;

          // Replace if empty or generic
          if (!resources.length || looksGeneric(resources)) {
            resources = await webSearchService.searchResources(query, 10);
          }

          // Summary quality gate – regenerate if too short or boilerplatey
          const badSummary = (s = '') => {
            const lc = (s || '').toLowerCase();
            const wc = lc.split(/\s+/).filter(Boolean).length;
            const boiler = [
              'this module provides a clear, end-to-end narrative',
              'we then transition into the workflow you will actually use',
              'by the end, you should be able to explain the concept to others',
            ];
            return wc < 350 || boiler.some(p => lc.includes(p));
          };

          let summary = module.summary || '';
          if (badSummary(summary)) {
            const context = [
              `Module: ${module.title}`,
              `Objective: ${module.learningObjective || 'N/A'}`,
              resources && resources.length ? `Key resources:\n${resources.slice(0,5).map(r => `- ${r.title} (${(() => { try {return new URL(r.url).hostname.replace(/^www\./,'')} catch {return ''}})()}) — ${(r.snippet||'').replace(/\s+/g,' ').slice(0,120)}`).join('\n')}` : ''
            ].filter(Boolean).join('\n\n');
            try {
              summary = await geminiService.summarizeText(context);
            } catch {}
          }

          return { ...module.toObject?.() ?? module, resources, summary };
        })
      );
      existing.modules = enrichedModules;
      await existing.save();
      const totalRes = existing.modules.reduce((n, m) => n + ((m.resources||[]).length), 0);
      console.log('[enrich][done]', topic, 'modules=', existing.modules.length, 'totalResources=', totalRes);
      return res.status(200).json(existing);
    }

    // 1. Generate course outline from Gemini AI
    const aiResponse = await geminiService.generateCourseOutline(topic);

    // 2. For each module, fetch YouTube videos, transcript, AI summary, and web resources
    const modulesWithContent = await Promise.all(
      aiResponse.modules.map(async (module) => {
        // Use a refined query derived from the module itself to reduce ambiguity (no domain bias)
        const refinedTopic = refineQuery(module.title, module.learningObjective);
        const ytQuery = `${refinedTopic} tutorial`;
        const [videosDetailed, rawResources] = await Promise.all([
          youtubeService.searchVideosWithDetails(ytQuery, 12),
          // refined, keyword-focused query yields more relevant results
          (async () => {
            const refined = refineQuery(module.title, module.learningObjective);
            const query = `${refined} tutorial guide documentation examples`;
            return webSearchService.searchResources(query, 10);
          })(),
        ]);
        const resources = webSearchService.sanitizeResources(rawResources);

        // Apply optional filters (free, client-provided)
        let filtered = videosDetailed;
        try {
          const { minViews, minMinutes, maxMinutes, uploadedAfter, channelAllow = [], channelBlock = [] } = filters || {};
          if (typeof minViews === 'number') filtered = filtered.filter(v => (v.viewCount || 0) >= minViews);
          if (typeof minMinutes === 'number') filtered = filtered.filter(v => (v.durationSec || 0) >= minMinutes * 60);
          if (typeof maxMinutes === 'number') filtered = filtered.filter(v => (v.durationSec || 0) <= maxMinutes * 60);
          if (uploadedAfter) {
            const cutoff = new Date(uploadedAfter);
            if (!isNaN(cutoff)) filtered = filtered.filter(v => v.publishedAt && v.publishedAt >= cutoff);
          }
          if (Array.isArray(channelAllow) && channelAllow.length) filtered = filtered.filter(v => channelAllow.includes(v.channelId));
          if (Array.isArray(channelBlock) && channelBlock.length) filtered = filtered.filter(v => !channelBlock.includes(v.channelId));
        } catch {}

        // Semantic reranking using local embeddings (free)
        let videos = filtered;
        if (semantic && filtered.length) {
          const intent = `${module.title}. ${module.learningObjective || ''}`;
          const queryVec = await embedText(intent);
          const ranked = [];
          for (const v of filtered) {
            let rec = await VideoEmbedding.findOne({ videoId: v.videoId }).lean();
            if (!rec) {
              // try transcript first (may be empty), fallback to title+description
              let text = '';
              try {
                text = await transcriptService.getTranscript(v.videoId);
                if (!text || text.length < 200) {
                  // quick retry to mitigate intermittent fetch failures
                  text = await transcriptService.getTranscript(v.videoId);
                }
              } catch {}
              if (!text || text.length < 200) {
                const summaryText = [v.title || '', v.description || ''].join('\n');
                text = summaryText;
              }
              const vec = await embedText(text);
              rec = await VideoEmbedding.findOneAndUpdate(
                { videoId: v.videoId },
                {
                  videoId: v.videoId,
                  embedding: vec,
                  title: v.title,
                  description: v.description || '',
                  channelId: v.channelId,
                  channelTitle: v.channelTitle,
                  publishedAt: v.publishedAt,
                  durationSec: v.durationSec,
                  viewCount: v.viewCount,
                  likeCount: v.likeCount,
                  updatedAt: new Date(),
                },
                { upsert: true, new: true }
              ).lean();
            }
            // Base semantic similarity
            let base = cosineSim(queryVec, rec?.embedding || []);

            // Neutral disambiguation: modest penalty for office/chart content to reduce "graph" (chart) collisions
            const lc = (s = '') => (s || '').toLowerCase();
            const txt = lc(`${rec?.title || v.title || ''} ${rec?.description || v.description || ''}`);
            const DISAMBIGUATE_OFFICE = ['excel','spreadsheet','google sheet','google sheets','chart','charts','tableau','powerpoint','ppt'];
            if (DISAMBIGUATE_OFFICE.some(k => txt.includes(k))) base -= 0.12;

            // Light boost for tokens from refinedTopic that appear in the video text (module-driven, not global bias)
            const tokens = (refinedTopic || '').split(/\s+/).filter(Boolean);
            const matches = tokens.reduce((n, t) => n + (txt.includes(lc(t)) ? 1 : 0), 0);
            const boost = Math.min(0.10, matches * 0.02);
            const score = base + boost;
            ranked.push({ v, score });
          }
          ranked.sort((a,b) => b.score - a.score);
          videos = ranked.slice(0, 3).map(x => ({ ...x.v, relevanceScore: x.score }));
        } else {
          videos = filtered.slice(0, 3);
        }

        const transcript = await transcriptService.getTranscriptForModule(videos);

        console.log(
          `[generateCourse] module="${module.title}" videos=`,
          videos?.length || 0,
          ' resources=', resources?.length || 0,
          ' transcriptLength=',
          transcript ? transcript.length : 0
        );

        let summary;
        if (transcript && transcript.trim().length > 0) {
          const combined = `Module: ${module.title}\nObjective: ${module.learningObjective || 'N/A'}\n\nTranscript (may be partial):\n\n${transcript}`;
          summary = await geminiService.summarizeText(combined);
        } else {
          const videoLines = (videos || []).map((v) => `- ${v.title}`).join("\n");
          const fallbackContext = `No transcript was available. Please provide a helpful, concise learning summary based on the following context.\n\nModule Title: ${module.title}\nLearning Objective: ${module.learningObjective || "N/A"}\n${videos && videos.length ? `Suggested Videos:\n${videoLines}` : "No videos could be found."}`;
          summary = await geminiService.summarizeText(fallbackContext);
        }

        return {
          ...module,
          videos,
          resources,
          summary,
        };
      })
    );

    // 3. Create and save the new course with modules containing videos + summaries
    const newCourse = new Course({
      title: topic,
      modules: modulesWithContent,
    });
    await newCourse.save();

    const totalResNew = newCourse.modules.reduce((n, m) => n + ((m.resources||[]).length), 0);
    console.log('[newCourse]', topic, 'modules=', newCourse.modules.length, 'totalResources=', totalResNew);

    // 4. Send the complete course back to the frontend
    res.status(201).json(newCourse);
  } catch (error) {
    console.error("Error in generateCourse:", error);
    res.status(500).json({ message: "Failed to generate course" });
  }
};