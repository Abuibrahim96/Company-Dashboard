import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "../../../../agent/system-prompt";
import { TOOLS } from "../../../../agent/tools";
import { handleToolCall } from "../../../../agent/tool-handlers";

const anthropic = new Anthropic();

const MAX_ITERATIONS = 10;

export async function POST(request: NextRequest) {
  try {
    const { messages } = (await request.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Build the conversation messages for Anthropic
    const conversationMessages: Anthropic.MessageParam[] = messages.map(
      (m) => ({
        role: m.role,
        content: m.content,
      })
    );

    let finalText = "";

    // Agent loop: keep going until we get a text response with no tool calls
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages: conversationMessages,
      });

      // Check if there are any tool_use blocks
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ContentBlock & { type: "tool_use" } =>
          block.type === "tool_use"
      );

      // Extract any text blocks
      const textBlocks = response.content.filter(
        (block): block is Anthropic.TextBlock => block.type === "text"
      );

      if (toolUseBlocks.length === 0) {
        // No tool calls — extract text and finish
        finalText = textBlocks.map((b) => b.text).join("\n");
        break;
      }

      // Append the assistant message (with tool_use blocks) to the conversation
      conversationMessages.push({
        role: "assistant",
        content: response.content,
      });

      // Execute each tool call and collect results
      const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
        toolUseBlocks.map(async (toolUse) => {
          const result = await handleToolCall(
            toolUse.name,
            toolUse.input as Record<string, unknown>
          );
          return {
            type: "tool_result" as const,
            tool_use_id: toolUse.id,
            content: result,
          };
        })
      );

      // Append tool results as a user message
      conversationMessages.push({
        role: "user",
        content: toolResults,
      });

      // If this is the last iteration and we still have tool calls, grab any text
      if (i === MAX_ITERATIONS - 1) {
        finalText =
          textBlocks.map((b) => b.text).join("\n") ||
          "I completed the requested actions.";
      }
    }

    return NextResponse.json({ response: finalText });
  } catch (err) {
    console.error("Chat API error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
