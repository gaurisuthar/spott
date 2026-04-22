import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// simple in-memory rate limiter (prevents spam in dev)
let lastCallTime = 0;

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // ⛔ Rate limit protection (very important for your issue)
    const now = Date.now();
    if (now - lastCallTime < 5000) {
      return NextResponse.json(
        { error: "Please wait a few seconds before generating again." },
        { status: 429 }
      );
    }
    lastCallTime = now;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const systemPrompt = `
You are an event planning assistant.

Return ONLY valid JSON (no markdown, no explanation).

Format:
{
  "title": "short catchy event title",
  "description": "2-3 sentence paragraph without line breaks",
  "category": "tech | music | sports | art | food | business | health | education | gaming | networking | outdoor | community",
  "suggestedCapacity": 50,
  "suggestedTicketType": "free"
}

Rules:
- No line breaks in any string
- Description must be a single paragraph
- Title max 80 characters
- Return ONLY JSON
User input: ${prompt}
`;

    let result;

    try {
      result = await model.generateContent(systemPrompt);
    } catch (error) {
      // Handle Gemini quota error
      if (error?.status === 429) {
        return NextResponse.json(
          {
            error:
              "AI limit reached. Please wait a few seconds and try again.",
          },
          { status: 429 }
        );
      }
      throw error;
    }

    const response = await result.response;
    let text = response.text().trim();

    // remove markdown formatting safely
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let eventData;

    try {
      eventData = JSON.parse(text);
    } catch (err) {
      console.error("JSON parse failed:", text);
      return NextResponse.json(
        { error: "AI returned invalid JSON format" },
        { status: 500 }
      );
    }

    return NextResponse.json(eventData);
  } catch (error) {
    console.error("Error generating event:", error);

    return NextResponse.json(
      { error: "Failed to generate event" },
      { status: 500 }
    );
  }
}