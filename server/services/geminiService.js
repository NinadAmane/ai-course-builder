const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Gemini model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

exports.generateCourseOutline = async (topic) => {
  const prompt = `
    Create a concise course outline for the topic: "${topic}".
    The course should be structured into logical modules.
    For each module, provide a "title" and a brief "learningObjective".
    
    Return the response as a valid JSON object with a single key "modules" which is an array of module objects. 
    Do not include any text or markdown formatting before or after the JSON object.
    
    Example format:
    {
      "modules": [
        {
          "title": "Module 1: Introduction",
          "learningObjective": "Understand the basic concepts."
        },
        {
          "title": "Module 2: Advanced Topics",
          "learningObjective": "Explore advanced techniques."
        }
      ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error generating course outline from Gemini:", error);
    throw new Error("Failed to generate course outline.");
  }
};

exports.summarizeText = async function (text) {
  if (!text) {
    return "No summary available for this module.";
  }

  const prompt = `
    Please provide a concise, easy-to-understand summary of the following text.
    Focus on the key concepts, main ideas, and any important definitions or steps.
    Present the summary in a few clear paragraphs.

    Text to summarize:
    ---
    ${text}
    ---
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error summarizing text with Gemini:", error);
    return "Summary could not be generated at this time.";
  }
};