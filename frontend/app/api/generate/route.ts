import { NextRequest, NextResponse } from "next/server";

const MODAL_API_URL = process.env.MODAL_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${MODAL_API_URL}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json(
      { error: "Generation failed", answer: "" },
      { status: 500 }
    );
  }
}
