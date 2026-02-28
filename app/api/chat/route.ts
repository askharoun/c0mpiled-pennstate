import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { messages, syllabusText, className, difficulty, responseLength, practiceProblemsEnabled } = await req.json();

    const difficultyGuide = {
      easy: "Keep explanations foundational and accessible. Use simple examples and avoid advanced edge cases.",
      medium: "Provide standard-level explanations appropriate for the course level.",
      hard: "Challenge the student with advanced concepts, edge cases, and deeper analysis.",
    };

    const lengthGuide = responseLength === "concise"
      ? "Keep responses brief and focused. Use bullet points and short explanations."
      : "Provide thorough, detailed explanations with examples and context.";

    const practiceGuide = practiceProblemsEnabled !== false
      ? `- When appropriate, include a practice problem at the end of your response using this exact format:
  :::practice
  [Write the practice problem here]
  :::

- When the student asks for practice drills, guided problems, or step-by-step exercises, include an interactive drill using this exact JSON format:
  :::drill
  {"question":"Overall problem description","steps":[{"prompt":"Step 1 instruction","hint":"A helpful hint","answer":"The correct answer for this step"},{"prompt":"Step 2 instruction","hint":"Another hint","answer":"Correct answer"}],"difficulty":"medium","topic":"Topic Name"}
  :::
  Include 3-5 steps that build on each other. Each step should guide the student through solving the problem progressively.

- When the student asks about a topic and video resources would be helpful, or when they explicitly ask for video recommendations, include YouTube video suggestions using this exact JSON format:
  :::videos
  [{"title":"Descriptive video title","channel":"Known educational channel","searchQuery":"specific youtube search query","reason":"Why this video helps with the topic"}]
  :::
  Recommend 2-4 videos from well-known educational channels (Khan Academy, 3Blue1Brown, Professor Leonard, Organic Chemistry Tutor, CrashCourse, MIT OpenCourseWare, etc). Use specific search queries that will find real, relevant videos.`
      : "- Do NOT include practice problems, drills, or video recommendations in your responses.";

    const systemPrompt = `You are an expert academic tutor and study assistant for a student taking ${className}. Your role is to:
- Provide clear, accurate explanations matched to the student's level
- Help students understand core concepts, not just memorize
- Generate helpful practice problems and drills when requested
- Support active learning with appropriate difficulty

${syllabusText ? `Course Context (use this to tailor everything):\n${syllabusText}\n` : ""}
Difficulty: ${difficultyGuide[difficulty as keyof typeof difficultyGuide] || difficultyGuide.medium}
Response Style: ${lengthGuide}

Communication Guidelines:
- Use clear, structured explanations with examples
- Include markdown: headers, bold, lists, tables when appropriate
- Break complex topics into digestible steps
- Be encouraging, supportive, and constructive
- Match the course level and prerequisites from the syllabus
${practiceGuide}
- If the student mentions they're struggling, offer extra support and simpler explanations`;

    const anthropicMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => {
        if (block.type === "text") return block.text;
        return "";
      })
      .join("");

    if (!text.trim()) {
      throw new Error("Empty response from Claude");
    }

    return NextResponse.json({ content: text });
  } catch (error) {
    console.error("Chat API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate response: ${errorMessage}` },
      { status: 500 }
    );
  }
}
