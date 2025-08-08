const Course = require("../models/Course");
const geminiService = require("../services/geminiService");
const youtubeService = require("../services/youtubeService");
const transcriptService = require("../services/transcriptService");

exports.generateCourse = async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ message: "Topic is required" });
    }

    // 1. Generate course outline from Gemini AI
    const aiResponse = await geminiService.generateCourseOutline(topic);

    // 2. For each module, fetch YouTube videos, transcript, and AI summary (with fallback)
    const modulesWithContent = await Promise.all(
      aiResponse.modules.map(async (module) => {
        const videos = await youtubeService.searchVideos(module.title);
        const transcript = await transcriptService.getTranscriptForModule(videos);

        // Debug logs to understand why transcript may be empty
        console.log(
          `[generateCourse] module="${module.title}" videos=`,
          videos?.length || 0,
          " transcriptLength=",
          transcript ? transcript.length : 0
        );

        let summary;
        if (transcript && transcript.trim().length > 0) {
          summary = await geminiService.summarizeText(transcript);
        } else {
          // Fallback: craft a context summary using module info and available video titles
          const videoTitles = (videos || []).map((v) => `- ${v.title}`).join("\n");
          const fallbackContext = `No transcript was available. Please provide a helpful, concise learning summary based on the following context.

Module Title: ${module.title}
Learning Objective: ${module.learningObjective || "N/A"}
${videos && videos.length ? `Suggested Videos:\n${videoTitles}` : "No videos could be found."}`;
          summary = await geminiService.summarizeText(fallbackContext);
        }

        return {
          ...module,
          videos,
          summary, // AI-generated summary or fallback
        };
      })
    );

    // 3. Create and save the new course with modules containing videos + summaries
    const newCourse = new Course({
      title: topic,
      modules: modulesWithContent,
    });
    await newCourse.save();

    // 4. Send the complete course back to the frontend
    res.status(201).json(newCourse);
  } catch (error) {
    console.error("Error in generateCourse:", error);
    res.status(500).json({ message: "Failed to generate course" });
  }
};