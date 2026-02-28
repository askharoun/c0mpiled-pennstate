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

    const { className, syllabusText, difficulty, questionCount = 5, questionTypes = "both" } = await req.json();

    const typeInstruction = questionTypes === "multiple_choice"
      ? "Generate ONLY multiple choice questions."
      : questionTypes === "free_response"
        ? "Generate ONLY free response questions."
        : "Generate a mix of multiple choice and free response questions.";

    const difficultyGuide = {
      easy: "Keep questions foundational and straightforward. Test basic recall and simple understanding.",
      medium: "Include a mix of recall and application questions appropriate for the course level.",
      hard: "Challenge the student with application, analysis, and synthesis questions. Include edge cases.",
    };

    const systemPrompt = `You are an expert quiz generator for academic courses. Create exactly ${questionCount} high-quality quiz questions for: ${className}.

${syllabusText ? `Course syllabus for context:\n${syllabusText}` : "No syllabus available — generate well-balanced questions for this course."}

${typeInstruction}

Difficulty level: ${difficultyGuide[difficulty as keyof typeof difficultyGuide] || difficultyGuide.medium}

Requirements for each question:
- id: a unique identifier (q1, q2, q3, etc.)
- type: either "multiple_choice" or "free_response"
- question: clear, specific question text
- options: (ONLY for multiple_choice) list of 4 distinct answer choices
- correct_answer: the right answer (must match one option exactly for MC)
- explanation: brief 1-2 sentence explanation of why this is correct

Respond with ONLY YAML format (no markdown, no code blocks, just raw YAML):
questions:
  - id: "q1"
    type: "multiple_choice"
    question: "Question text here?"
    options:
      - "Option A"
      - "Option B"
      - "Option C"
      - "Option D"
    correct_answer: "Option A"
    explanation: "Explanation of why this answer is correct."`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 5000,
      system: systemPrompt,
      messages: [{ role: "user", content: `Generate exactly ${questionCount} quiz questions now.` }],
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();

    // Try to parse YAML first, then fallback to JSON
    let parsed;
    try {
      const yamlContent = text.replace(/^```(?:yaml)?\n?/, "").replace(/\n?```$/, "");
      parsed = yaml.load(yamlContent);
    } catch {
      parsed = JSON.parse(text);
    }

    const questions = (Array.isArray(parsed) ? parsed : parsed?.questions || []) as Array<{
      id: string;
      type: "multiple_choice" | "free_response";
      question: string;
      options?: string[];
      correct_answer: string;
      explanation: string;
    }>;

    if (questions.length === 0) {
      throw new Error("No questions were generated");
    }

    // Validate each question has required fields
    const validQuestions = questions.filter(
      (q) =>
        q.id &&
        q.type &&
        q.question?.trim() &&
        q.correct_answer?.trim() &&
        q.explanation?.trim()
    );

    if (validQuestions.length === 0) {
      throw new Error("Generated questions were invalid or incomplete");
    }

    return NextResponse.json({ questions: validQuestions });
  } catch (error) {
    console.error("Quiz generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate quiz: ${errorMessage}` },
      { status: 500 }
    );
  }
}
