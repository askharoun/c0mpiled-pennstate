import { NextRequest, NextResponse } from "next/server";

const REDUCTO_API_KEY = process.env.REDUCTO_API_KEY;
const REDUCTO_BASE = "https://platform.reducto.ai";

export async function POST(req: NextRequest) {
  try {
    if (!REDUCTO_API_KEY) {
      return NextResponse.json(
        { error: "REDUCTO_API_KEY not configured" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Step 1: Upload file to Reducto
    const uploadForm = new FormData();
    uploadForm.append("file", file);

    const uploadRes = await fetch(`${REDUCTO_BASE}/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${REDUCTO_API_KEY}` },
      body: uploadForm,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.error("Reducto upload error:", err);
      return NextResponse.json({ error: "Failed to upload PDF" }, { status: 500 });
    }

    const { file_id } = await uploadRes.json();

    // Step 2: Parse the uploaded file
    const parseRes = await fetch(`${REDUCTO_BASE}/parse`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDUCTO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        document_url: file_id,
        advanced_options: { table_output_format: "md" },
      }),
    });

    if (!parseRes.ok) {
      const err = await parseRes.text();
      console.error("Reducto parse error:", err);
      return NextResponse.json({ error: "Failed to parse PDF" }, { status: 500 });
    }

    const parseData = await parseRes.json();

    // Extract text from all chunks
    const text = parseData.result.chunks
      .map((chunk: { content: string }) => chunk.content)
      .join("\n\n");

    return NextResponse.json({ text });
  } catch (error) {
    console.error("PDF parse error:", error);
    return NextResponse.json({ error: "Failed to parse PDF" }, { status: 500 });
  }
}
