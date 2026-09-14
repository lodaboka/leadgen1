require('dotenv').config({ path: '.env.local' });
const { Groq } = require('groq-sdk');

async function testGroq() {
  const groqApiKey = process.env.GROQ_API_KEY;
  try {
    const groq = new Groq({ apiKey: groqApiKey });
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: "Say 'Groq is working' in exactly 3 words." }],
      model: "openai/gpt-oss-120b",
      temperature: 0.1,
    });
    console.log("Groq Output:", chatCompletion.choices[0]?.message?.content);
  } catch (e) {
    console.error("Groq Error:", e.message);
  }
}

testGroq();
