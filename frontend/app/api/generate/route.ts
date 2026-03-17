import { NextRequest, NextResponse } from "next/server";

const MODAL_GENERATE_URL = process.env.MODAL_GENERATE_URL || "https://jeebus87--ace-it-backend-generate.modal.run";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(MODAL_GENERATE_URL, {
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
