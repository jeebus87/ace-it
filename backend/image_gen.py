"""
Gemini image generation service for educational visuals.
"""

import os
import base64
from google import genai
from google.genai import types


def generate_image(question: str, summary: str) -> dict:
    """
    Generate an educational image using Gemini.

    Args:
        question: The original study question
        summary: Brief summary of the answer for context

    Returns:
        Dict with base64-encoded image or error
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"error": "GEMINI_API_KEY not configured"}

    try:
        client = genai.Client(api_key=api_key)

        image_prompt = f"""Create an educational, visually clear illustration that helps explain this concept:

Topic: {question}
Context: {summary}

Style: Clean, educational diagram or illustration. Use clear labels, simple shapes, and easy-to-understand visuals. Make it look like something from a textbook or educational website. Colorful but not cluttered."""

        response = client.models.generate_content(
            model="gemini-3.1-flash-image-preview",
            contents=image_prompt,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"]
            )
        )

        # Extract image from response
        if response.candidates:
            for part in response.candidates[0].content.parts:
                if hasattr(part, "inline_data") and part.inline_data:
                    image_data = part.inline_data.data
                    image_base64 = base64.b64encode(image_data).decode("utf-8")
                    mime_type = part.inline_data.mime_type or "image/png"
                    return {
                        "image": f"data:{mime_type};base64,{image_base64}",
                        "success": True
                    }

        return {"error": "No image generated", "success": False}

    except Exception as e:
        return {"error": str(e), "success": False}
