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
  const prompt = `You are an expert course writer. Write a comprehensive module explanation in the style of a high-quality Udemy lesson, with textbook-level depth.

Requirements:
- Write primarily in paragraphs (around 80–90% of the content).
- You may include a single short bullet list only if it clarifies steps, pitfalls, or key takeaways.
- Add relevant code snippets if it helps explain the topic.
- Use clear, engaging, student-friendly language with smooth transitions.
- Bold a few important keywords using **markdown**.
- Target length: 700–1100 words (aim for depth and specificity, not fluff).
- Do not include meta commentary, disclaimers, or refer to transcripts or prompts.
- Separate paragraphs with a blank line.
- If the source is incomplete, infer reasonable context and stitch a coherent narrative.

Coverage checklist (weave these into cohesive prose, not headings):
- Concise definition, motivation, and when to use it.
- Mental model and core building blocks.
- Step-by-step workflow or algorithm with rationale.
- A non-trivial, end-to-end example; include a short annotated code snippet if applicable.
- Common pitfalls and edge cases, with fixes.
- Contrast with related concepts and when to prefer each.
- Practical tips for production use (performance, reliability, maintainability).

Source transcript/context (may be partial):\n\n${text || ''}`;

  function sanitizeOut(s = '') {
    return (s || '')
      .replace(/no transcript[^\n]*\n?/gi, '')
      .replace(/please provide[^\n]*\n?/gi, '')
      .replace(/based on the following context[^\n]*\n?/gi, '')
      .replace(/this module provides a clear, end-to-end narrative[^\n]*\n?/gi, '')
      .replace(/by the end, you should be able to[^\n]*\n?/gi, '')
      .trim();
  }

  function tooGeneric(s = '') {
    const lc = (s || '').toLowerCase();
    const wc = lc.split(/\s+/).filter(Boolean).length;
    const boiler = [
      'this module provides a clear, end-to-end narrative',
      'we then transition into the workflow you will actually use',
      'by the end, you should be able to explain the concept to others',
    ];
    const hasBoiler = boiler.some(p => lc.includes(p));
    return wc < 350 || hasBoiler; // below our minimum or contains boilerplate
  }

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let out = sanitizeOut(response.text() || '');

    // If too short or generic, force a rewrite with stronger constraints
    if (tooGeneric(out)) {
      const forcePrompt = `Rewrite the following to be textbook-level (700–1100 words), highly specific to the topic and context, with an annotated example and concrete pitfalls.
Do not use generic phrases like “This module provides a clear narrative” or “By the end, you should be able…”.
Maintain paragraph-first style and keep only one short bullet list if necessary.

Original draft:\n\n${out || '(empty)'}\n\nContext again for grounding:\n\n${text || ''}`;
      try {
        const second = await model.generateContent(forcePrompt);
        const secondText = sanitizeOut(second.response?.text?.() || second.response?.text?.call(second.response) || '');
        if (secondText && !tooGeneric(secondText)) return secondText;
        if (secondText) out = secondText; // take better of the two
      } catch {}
    }
    return out;
  } catch (error) {
    const status = error?.status || error?.code;
    const serverError = (typeof status === 'number' && status >= 500 && status < 600) || error?.statusText === 'Internal Server Error';
    if (status === 429 || error?.statusText === 'Too Many Requests' ||
        status === 503 || error?.statusText === 'Service Unavailable' || serverError) {
      console.warn('Gemini 4xx/5xx in summarizeText: using heuristic summary.');
      const snippet = typeof text === 'string' ? text.slice(0, 600) : '';
      const para1 = `This module provides a clear, end‑to‑end narrative that introduces the core idea, situates it in real projects, and frames why it matters now. You will first connect the concept to familiar problems, then unpack the building blocks and mental models that make it practical. Along the way, we clarify terminology and dispel common misconceptions so you can think about the topic with precision.`;
      const para2 = `We then transition into the workflow you will actually use: how to set things up, what decisions to make at each step, and how to evaluate trade‑offs. Short, concrete examples show how the pieces fit together, and we call out subtle details that typically trip learners up. Where relevant, we highlight performance, reliability, and maintainability considerations that distinguish a quick demo from production‑grade work.`;
      const para3 = `By the end, you should be able to explain the concept to others, implement it confidently in a small project, and identify the next areas to deepen your skill. ${snippet ? `Key ideas emphasized here are grounded in the following source material: "${snippet.slice(0, 200)}${snippet.length > 200 ? '…' : ''}".` : ''}`;
      return [para1, '', para2, '', para3].join('\n');
    }
    console.error('Error summarizing text with Gemini:', error);
    return 'Summary could not be generated at this time.';
  }
};

// simple sleep helper used above
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}