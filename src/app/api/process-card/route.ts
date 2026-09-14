import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY || ""; 
    const groqApiKey = process.env.GROQ_API_KEY || "";
    
    const prompt = `
      You are an elite AI extraction assistant designed to process business cards and IDs with 100% accuracy.
      Analyze this image carefully. You MUST output a PERFECTLY FORMATTED, STRICT JSON OBJECT.
      
      Extraction Rules:
      1. **Name**: The person's full name. Capitalize the first letter of each name.
      2. **Company**: The company/brand name.
      3. **Mobile**: Extract the phone number. CLEAN the formatting: remove all spaces, brackets, or dashes. Format it cleanly like +1234567890 or 1234567890. Ensure NO letters or weird characters are in the number.
      4. **Email**: Extract the email address. Convert to all lowercase. Ensure absolutely flawless spelling.
      5. **Address**: Cleanly format the physical address, comma-separated.
      6. **Age & Gender**: Leave blank if not an ID.
      7. **face_detected**: true or false boolean.

      CRITICAL: Return ONLY a valid JSON object. No markdown, no backticks, no explanatory text.
      The JSON MUST have EXACTLY these keys: "Name", "Email", "Mobile", "Age", "Gender", "Address", "Company", "face_detected".
      If a field is missing, return an empty string "". 
    `;

    let extractedData;

    try {
      // 1st Attempt: Groq Primary
      const groq = new Groq({ apiKey: groqApiKey });
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: image },
              },
            ],
          },
        ],
        model: "qwen/qwen3.8-27b",
        temperature: 0.1,
        response_format: { type: "json_object" },
      });

      const responseText = chatCompletion.choices[0]?.message?.content || "{}";
      extractedData = JSON.parse(responseText);

    } catch (groqError) {
      console.warn("Groq API failed, falling back to Gemini 3.6 Flash:", groqError);

      // 2nd Attempt: Gemini Fallback
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });
      const base64Data = image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

      const imageParts = [
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg"
          },
        },
      ];

      const result = await model.generateContent([prompt, ...imageParts]);
      const responseText = result.response.text();
      const cleanedJsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      extractedData = JSON.parse(cleanedJsonString);
    }

    return NextResponse.json({
      result: {
        name: extractedData.Name || '',
        mobile: extractedData.Mobile || '',
        email: extractedData.Email || '',
        age: extractedData.Age || '',
        gender: extractedData.Gender || '',
        address: extractedData.Address || '',
        company: extractedData.Company || '',
        face_detected: extractedData.face_detected === true,
      }
    });

  } catch (error) {
    console.error("API Error (All Models Failed):", error);
    return NextResponse.json({ error: 'Failed to process card image via both APIs' }, { status: 500 });
  }
}