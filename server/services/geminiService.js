const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Gemini model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Best-effort extractor for JSON from LLM text
function extractJsonBlock(text) {
  if (!text || typeof text !== 'string') return null;

  // 1) Strip code fences ```json ... ``` or ``` ... ```
  const fence = /```(?:json)?\n([\s\S]*?)\n```/i;
  const fenceMatch = text.match(fence);
  const fenced = fenceMatch ? fenceMatch[1].trim() : null;
  if (fenced) return fenced;

  // 2) Try to find the first JSON object by braces balance
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1).trim();
  }

  return null;
}

// Fallback outline if Gemini quota is exceeded or unavailable
function generateFallbackOutline(topic) {
  const sections = [
    { title: `Introduction to ${topic}`, objective: `Understand what ${topic} is and where it is used.` },
    { title: `${topic} Fundamentals`, objective: `Learn core terminology and key concepts.` },
    { title: `Hands-on Setup`, objective: `Set up tools and environment to practice ${topic}.` },
    { title: `${topic} Core Techniques`, objective: `Apply essential methods and workflows with examples.` },
    { title: `Advanced Topics in ${topic}`, objective: `Explore deeper ideas, patterns, and best practices.` },
    { title: `Project & Next Steps`, objective: `Build a small project and find resources to continue learning.` },
  ];
  return {
    title: topic,
    modules: sections.map(s => ({ title: s.title, learningObjective: s.objective })),
  };
}

// Returns an outline; never throws on 429/503 — uses fallback instead
exports.generateCourseOutline = async (topic) => {
  const prompt = `Create a structured course outline for the topic: "${topic}".
Return JSON with an array 'modules' where each module has 'title' and 'learningObjective'.`;

  // small retry for 503 overloads
  const MAX_TRIES = 3;
  let attempt = 0;
  while (attempt < MAX_TRIES) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Try direct parse first
      try {
        const parsedDirect = JSON.parse(text);
        if (!parsedDirect?.modules || !Array.isArray(parsedDirect.modules)) {
          throw new Error('Invalid outline JSON shape');
        }
        return parsedDirect;
      } catch (e1) {
        // Try extracting JSON block from fenced/prosey output
        const candidate = extractJsonBlock(text);
        if (!candidate) throw e1;
        const parsedExtracted = JSON.parse(candidate);
        if (!parsedExtracted?.modules || !Array.isArray(parsedExtracted.modules)) {
          throw new Error('Invalid outline JSON shape (extracted)');
        }
        return parsedExtracted;
      }
    } catch (error) {
      const status = error?.status || error?.code;
      const tooMany = status === 429 || error?.statusText === 'Too Many Requests';
      const overloaded = status === 503 || error?.statusText === 'Service Unavailable';

      if (tooMany) {
        console.warn('Gemini 429: using fallback outline.');
        return generateFallbackOutline(topic);
      }

      if (overloaded) {
        attempt += 1;
        if (attempt >= MAX_TRIES) {
          console.warn('Gemini 503 after retries: using fallback outline.');
          return generateFallbackOutline(topic);
        }
        const backoff = 1000 * Math.pow(2, attempt - 1); // 1s, 2s
        console.warn(`Gemini 503: retrying in ${backoff}ms (attempt ${attempt}/${MAX_TRIES})`);
        await sleep(backoff);
        continue;
      }

      // other errors: log and fallback
      console.error('Gemini outline error (non-429/503). Using fallback.', error);
      return generateFallbackOutline(topic);
    }
  }

  // safety
  return generateFallbackOutline(topic);
};

exports.summarizeText = async (text) => {
  const prompt = `You are writing an attractive learning brief for a course module.
Return a short, scannable Markdown section with:
- A one-sentence hook.
- 10-15 bullet points grouped under clear subheadings (e.g., Key Concepts, Hands‑on, Outcomes, Prereqs) using bold section labels.
- Crisp, student-friendly phrasing. No fluff. Avoid repeating the module title. Do not include code fences.

Source transcript/context (may be partial):\n\n${text || ''}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    const status = error?.status || error?.code;
    const serverError = (typeof status === 'number' && status >= 500 && status < 600) || error?.statusText === 'Internal Server Error';
    if (status === 429 || error?.statusText === 'Too Many Requests' ||
        status === 503 || error?.statusText === 'Service Unavailable' || serverError) {
      console.warn('Gemini 4xx/5xx in summarizeText: using heuristic summary.');
      const snippet = typeof text === 'string' ? text.slice(0, 600) : '';
      return [
        '**Why this matters:** Build a strong foundation with practical, modern examples.',
        '',
        '**Key concepts**',
        '- Core terminology and mental models',
        '- Real-world applications and trade-offs',
        '- Common pitfalls to avoid',
        '',
        '**Hands-on**',
        '- Step-by-step walkthroughs and mini-exercises',
        '- Quick checks to verify understanding',
        '',
        '**You will be able to**',
        '- Explain the idea clearly to others',
        '- Apply it on a small project/task',
        '- Identify what to learn next',
        '',
        `**Highlights**`,
        `- ${snippet ? snippet.slice(0, 160) + (snippet.length > 160 ? '…' : '') : 'context not available'}`,
      ].join('\n');
    }
    console.error('Error summarizing text with Gemini:', error);
    return 'Summary could not be generated at this time.';
  }
};

// simple sleep helper used above
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}