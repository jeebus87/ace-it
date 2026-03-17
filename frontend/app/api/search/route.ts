import { NextRequest, NextResponse } from "next/server";

const MODAL_SEARCH_URL = process.env.MODAL_SEARCH_URL || "https://jeebus87--ace-it-backend-search.modal.run";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(MODAL_SEARCH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Search failed", results: [] },
      { status: 500 }
    );
  }
}
