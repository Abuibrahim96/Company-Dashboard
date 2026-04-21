import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { COMPANY_INFO } from "@/lib/company-info";

const SYSTEM_PROMPT = `You are the recruitment assistant for Elite Truck Lines. Your job is to answer questions from prospective owner-operators about driving with Elite Truck Lines and to guide interested drivers toward submitting an application.

Use the company information below as your only source of truth. Do not invent facts. If a question isn't covered by the information — e.g. specific current freight rates, lane availability on a given date, legal questions, or account-specific details — say something like: "That's a great question — someone on our team can answer that better. You can call us at (503) 309-5090, email info@elitetrucklines.com, or start an application at /drive-with-us and we'll follow up." Never make up specific numbers, policies, lanes, or timelines.

Tone and style:
- Warm, direct, and professional. Talk like a dispatcher who respects drivers' time, not a corporate chatbot.
- Keep answers short. 2–4 sentences is usually enough. Drivers often read this on a phone.
- No emojis. No marketing fluff or buzzwords.
- Use plain, practical language.

Behavior:
- When a driver seems interested, point them to /drive-with-us or the phone number.
- If asked about a specific load, current rates, or anything account-specific, direct them to our team.
- Do not ask for personal information (SSN, license number, banking info). If a driver volunteers any, don't repeat it back — just direct them to the application form or phone.
- Only discuss Elite Truck Lines and trucking-related questions. If asked about unrelated topics, politely redirect.

---

${COMPANY_INFO}`;

const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 2000;

type ChatRequestMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: NextRequest) {
  let messages: ChatRequestMessage[];
  try {
    const body = await request.json();
    if (!Array.isArray(body?.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }
    messages = body.messages;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (messages.length > MAX_MESSAGES) {
    return NextResponse.json(
      { error: "Conversation is too long. Please refresh to start over." },
      { status: 400 }
    );
  }
  for (const m of messages) {
    if (
      (m.role !== "user" && m.role !== "assistant") ||
      typeof m.content !== "string" ||
      m.content.length > MAX_MESSAGE_CHARS
    ) {
      return NextResponse.json(
        { error: "Invalid message format." },
        { status: 400 }
      );
    }
  }

  let client: Anthropic;
  try {
    client = new Anthropic();
  } catch (e) {
    console.error("Anthropic client init failed:", e);
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return NextResponse.json({
      response:
        text ||
        "Sorry, I didn't catch that. Can you rephrase, or call us at (503) 309-5090?",
    });
  } catch (err) {
    console.error("Recruitment chat API error:", err);
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        {
          error:
            "We're getting a lot of questions right now. Try again in a minute.",
        },
        { status: 429 }
      );
    }
    return NextResponse.json(
      {
        error:
          "Something went wrong on our end. Please try again or call us at (503) 309-5090.",
      },
      { status: 500 }
    );
  }
}
