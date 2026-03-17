import { NextRequest, NextResponse } from "next/server";

// Extend timeout for image generation (can take 20-30 seconds)
export const maxDuration = 60;

const MODAL_IMAGE_URL = process.env.MODAL_IMAGE_URL || "https://jeebus87--ace-it-backend-image-gen.modal.run";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(MODAL_IMAGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Image API error:", error);
    return NextResponse.json(
      { error: "Image generation failed", success: false },
      { status: 500 }
    );
  }
}
