import { NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const requestSchema = z.object({
  action: z.enum(["summarize", "improve", "rewrite", "extractTasks"]).default("improve"),
  text: z.string().min(1),
  instructions: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = requestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const { action, text, instructions } = parsed.data;

    const systemPrompt = (() => {
      switch (action) {
        case "summarize":
          return "Summarize the following text clearly and concisely.";
        case "rewrite":
          return "Rewrite the text to be clearer, well-structured, and professional.";
        case "extractTasks":
          return "Extract actionable tasks from the text as a bullet list.";
        case "improve":
        default:
          return "Improve the writing for clarity, grammar, and readability without changing meaning.";
      }
    })();

    const prompt = `${systemPrompt}\n\n${instructions ? `Additional instructions: ${instructions}\n\n` : ""}Input:\n${text}`;

    const { text: output } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
    });

    return NextResponse.json({ result: output }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}