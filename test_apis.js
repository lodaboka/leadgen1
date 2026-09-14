require('dotenv').config({ path: '.env.local' });
const { Groq } = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testAPIs() {
  const groqApiKey = process.env.GROQ_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  console.log("=== Testing Groq ===");
  try {
    if (!groqApiKey) throw new Error("No Groq Key");
    const groq = new Groq({ apiKey: groqApiKey });
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: "Say 'Groq is working' in exactly 3 words." }],
      model: "llama-3.1-70b-versatile",
      temperature: 0.1,
    });
    console.log("Groq Output:", chatCompletion.choices[0]?.message?.content);
  } catch (e) {
    console.error("Groq Error:", e.message);
  }

  console.log("\n=== Testing Gemini ===");
  try {
    if (!geminiApiKey) throw new Error("No Gemini Key");
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Say 'Gemini is working' in exactly 3 words.");
    console.log("Gemini Output:", result.response.text());
  } catch (e) {
    console.error("Gemini Error:", e.message);
  }
}

testAPIs();
