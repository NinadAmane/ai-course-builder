const Course = require("../models/Course");
const geminiService = require("../services/geminiService");
const youtubeService = require("../services/youtubeService");
const transcriptService = require("../services/transcriptService");
const webSearchService = require("../services/webSearchService");

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
    const { topic, refresh } = req.body;
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
          const needsResources = !resources.length;
          if (needsResources) {
            const refined = refineQuery(module.title, module.learningObjective);
            const query = `${refined} tutorial guide documentation pdf`;
            resources = await webSearchService.searchResources(query, 10);
            console.log('[enrich][resources]', module.title, '=>', resources?.length || 0);
          }
          return { ...module.toObject?.() ?? module, resources };
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
        const ytQuery = `${module.title} tutorial for beginners programming development`;
        const [videos, rawResources] = await Promise.all([
          youtubeService.searchVideos(ytQuery),
          // refined, keyword-focused query yields more relevant results
          (async () => {
            const refined = refineQuery(module.title, module.learningObjective);
            const q = `${refined} tutorial guide documentation pdf`;
            return webSearchService.searchResources(q, 10);
          })(),
        ]);
        const resources = webSearchService.sanitizeResources(rawResources);
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
          summary = await geminiService.summarizeText(transcript);
        } else {
          const videoTitles = (videos || []).map((v) => `- ${v.title}`).join("\n");
          const fallbackContext = `No transcript was available. Please provide a helpful, concise learning summary based on the following context.\n\nModule Title: ${module.title}\nLearning Objective: ${module.learningObjective || "N/A"}\n${videos && videos.length ? `Suggested Videos:\n${videoTitles}` : "No videos could be found."}`;
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