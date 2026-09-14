import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getGoogleClient } from '@/lib/google-auth';
import { google } from 'googleapis';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { eventId } = await req.json();
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required.' }, { status: 400 });
    }

    const masterSheetId = process.env.MASTER_AUTH_SHEET_ID;
    if (!masterSheetId) {
      return NextResponse.json({ error: 'Master sheet not configured.' }, { status: 500 });
    }

    const authClient = await getGoogleClient();
    if (!authClient) {
      return NextResponse.json({ error: 'Google credentials not configured.' }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });

    // Find the event in master sheet
    const masterRes = await sheets.spreadsheets.values.get({
      spreadsheetId: masterSheetId,
      range: 'Sheet1!A:I',
    });

    const masterRows = masterRes.data.values || [];
    let targetSheetId = '';
    let eventName = '';
    for (let i = 1; i < masterRows.length; i++) {
      if (masterRows[i][0] === eventId) {
        eventName = masterRows[i][1] || 'Unknown Event';
        targetSheetId = masterRows[i][4] || '';
        break;
      }
    }

    if (!targetSheetId) {
      return NextResponse.json({ error: 'Event not found or no target sheet.' }, { status: 404 });
    }

    // Read ALL rows from the target sheet
    let leadData: string[][] = [];
    try {
      const leadRes = await sheets.spreadsheets.values.get({
        spreadsheetId: targetSheetId,
        range: 'Sheet1!A:J',
      });
      leadData = leadRes.data.values || [];
    } catch {
      return NextResponse.json({ totalLeads: 0, totalNumbers: 0, summary: 'No leads captured yet. The sheet is empty.' });
    }

    if (leadData.length <= 1) {
      return NextResponse.json({ totalLeads: 0, totalNumbers: 0, summary: 'No data available yet.' });
    }

    // Build a text representation for the AI
    
    const headers = leadData[0].map(h => h.toLowerCase());
    const dataRows = leadData.slice(1);
    const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile'));
    let totalNumbers = 0;
    if (phoneIdx !== -1) {
      for (const row of dataRows) {
        if (row[phoneIdx] && row[phoneIdx].trim() !== '') totalNumbers++;
      }
    }

    // AI Summary (Groq -> Gemini)
    const csvText = [leadData[0].join(', '), ...dataRows.map(r => r.join(', '))].join('\n');
    const prompt = `You are a highly positive, professional event analytics assistant. Given the following event lead data for "${eventName}", generate a SHORT executive summary in exactly 2 sentences.
STRICT GUARDRAILS:
1. Focus ONLY on positive insights (e.g., top companies, industries, or geographic reach).
2. NEVER mention missing data, poor formatting, corrupted data, or empty fields. Do not complain about data quality.
3. NEVER use negative framing like "only 2 leads" or "just a few". If the lead count is low, focus excitedly on the companies captured so far.
4. Keep it extremely concise, hyping up the success of the event.

Data:
${csvText}`;
    
    let summary = `The "${eventName}" is showing excellent momentum with ${dataRows.length} high-quality leads captured so far. Attendee demographics indicate strong representation from key target companies, setting the stage for highly productive networking and future follow-ups.`;
    const groqApiKey = process.env.GROQ_API_KEY || '';
    const geminiApiKey = process.env.GEMINI_API_KEY || '';
    
    try {
        if (!groqApiKey) throw new Error("No Groq Key");
        const groq = new Groq({ apiKey: groqApiKey });
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "openai/gpt-oss-120b",
            temperature: 0.2,
        });
        summary = chatCompletion.choices[0]?.message?.content || summary;
    } catch (groqError) {
        console.warn("Groq Summary failed, falling back to Gemini:", groqError);
        try {
            if (!geminiApiKey) throw new Error("No Gemini Key");
            const genAI = new GoogleGenerativeAI(geminiApiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
            const result = await model.generateContent(prompt);
            summary = result.response.text();
        } catch (geminiError) {
            console.error("Both summary AIs failed");
        }
    }

    return NextResponse.json({ totalLeads: dataRows.length, totalNumbers, summary });

  } catch (error) {
    console.error('Event summary error:', error);
    return NextResponse.json({ error: 'Failed to generate summary.' }, { status: 500 });
  }
}
