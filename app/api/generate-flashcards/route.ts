import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import * as yaml from "js-yaml";
import { createClient } from "@/lib/supabase/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { syllabusText, className, topic } = await req.json();

    const topicInstruction = topic
      ? `Focus specifically on this topic: ${topic}`
      : "Cover the most important concepts from the syllabus.";

    const systemPrompt = `You are an expert academic flashcard generator for ${className}. Your task is to create exactly 8 high-quality, focused flashcards that are ideal for spaced repetition learning.

${syllabusText ? `Course syllabus for context:\n${syllabusText}` : "No syllabus available — generate well-designed study flashcards for this course."}

${topicInstruction}

Guidelines for each card:
- Front: A clear, specific question or prompt (one concept per card)
- Back: A concise, accurate, memorable answer
- Include a mix of: definitions, conceptual understanding, application, and key facts
- Difficulty should match the course level appropriately
- Answers should be complete but brief (1-3 sentences max)

Respond with ONLY YAML format (no markdown, no code blocks, just raw YAML):
- front: "First question?"
  back: "First answer"
- front: "Second question?"
  back: "Second answer"`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 3000,
      messages: [{ role: "user", content: "Generate the 8 flashcards now." }],
      system: systemPrompt,
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();

    console.log("Raw API response:", text.substring(0, 200));

    // Try to extract YAML array from response
    let parsed;
    try {
      // First try direct YAML parsing
      const yamlContent = text.replace(/^```(?:yaml)?\n?/, "").replace(/\n?```$/, "");
      parsed = yaml.load(yamlContent);
      console.log("Successfully parsed as YAML, got:", Array.isArray(parsed) ? `array with ${(parsed as unknown[]).length} items` : typeof parsed);
    } catch (yamlError) {
      console.log("YAML parsing failed, trying JSON...", yamlError);
      try {
        parsed = JSON.parse(text);
        console.log("Successfully parsed as JSON");
      } catch (jsonError) {
        throw new Error(`Failed to parse response as YAML or JSON. Response: ${text.substring(0, 100)}`);
      }
    }

    const flashcards = (Array.isArray(parsed) ? parsed : parsed?.flashcards || []) as {
      front: string;
      back: string;
    }[];

    if (flashcards.length === 0) {
      throw new Error("No flashcards were generated");
    }

    // Validate each flashcard has required fields
    const validCards = flashcards.filter(
      (card) => card.front?.trim() && card.back?.trim()
    );

    if (validCards.length === 0) {
      throw new Error("Generated flashcards were invalid or empty");
    }

    return NextResponse.json({ flashcards: validCards });
  } catch (error) {
    console.error("Generate flashcards error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate flashcards: ${errorMessage}` },
      { status: 500 }
    );
  }
}
