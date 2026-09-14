require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
    const result = await model.generateContent("Say 'Gemini is working' in exactly 3 words.");
    console.log("Gemini 3.6 Output:", result.response.text());
  } catch (e) {
    console.error("Gemini Error:", e.message);
  }
}

testGemini();
