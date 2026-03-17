import { NextRequest, NextResponse } from "next/server";

const MODAL_QUIZ_URL = process.env.MODAL_QUIZ_URL || "https://jeebus87--ace-it-backend-quiz.modal.run";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(MODAL_QUIZ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Quiz API error:", error);
    return NextResponse.json(
      { error: "Quiz generation failed", questions: [] },
      { status: 500 }
    );
  }
}
