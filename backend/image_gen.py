"""
Gemini image generation service for educational visuals.
Supports optional Cloudflare R2 storage for production scalability.
"""

import os
import base64
import uuid
from google import genai
from google.genai import types


def upload_to_r2(image_data: bytes, mime_type: str) -> str | None:
    """
    Upload image to Cloudflare R2 and return public URL.
    Returns None if R2 is not configured.
    """
    r2_access_key = os.environ.get("R2_ACCESS_KEY_ID")
    r2_secret_key = os.environ.get("R2_SECRET_ACCESS_KEY")
    r2_bucket = os.environ.get("R2_BUCKET_NAME")
    r2_endpoint = os.environ.get("R2_ENDPOINT_URL")
    r2_public_url = os.environ.get("R2_PUBLIC_URL")

    if not all([r2_access_key, r2_secret_key, r2_bucket, r2_endpoint, r2_public_url]):
        return None

    try:
        import boto3
        from botocore.config import Config

        s3 = boto3.client(
            "s3",
            endpoint_url=r2_endpoint,
            aws_access_key_id=r2_access_key,
            aws_secret_access_key=r2_secret_key,
            config=Config(signature_version="s3v4"),
            region_name="auto",
        )

        # Generate unique filename
        ext = "png" if "png" in mime_type else "jpeg"
        filename = f"images/{uuid.uuid4()}.{ext}"

        # Upload to R2
        s3.put_object(
            Bucket=r2_bucket,
            Key=filename,
            Body=image_data,
            ContentType=mime_type,
            CacheControl="public, max-age=31536000",  # 1 year cache
        )

        return f"{r2_public_url}/{filename}"
    except Exception as e:
        print(f"R2 upload failed: {e}")
        return None


def generate_image(question: str, summary: str) -> dict:
    """
    Generate an educational image using Gemini.

    Args:
        question: The original study question
        summary: Brief summary of the answer for context

    Returns:
        Dict with image URL (R2) or base64-encoded image (fallback), or error
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
                response_modalities=["IMAGE"]
            )
        )

        # Extract image from response
        if response.parts:
            for part in response.parts:
                if part.inline_data is not None:
                    image_data = part.inline_data.data
                    mime_type = part.inline_data.mime_type or "image/png"

                    # Try to upload to R2 for better performance
                    r2_url = upload_to_r2(image_data, mime_type)
                    if r2_url:
                        return {
                            "image": r2_url,
                            "storage": "r2",
                            "success": True
                        }

                    # Fallback to base64
                    image_base64 = base64.b64encode(image_data).decode("utf-8")
                    return {
                        "image": f"data:{mime_type};base64,{image_base64}",
                        "storage": "base64",
                        "success": True
                    }

        # Check for block reason or text response
        block_reason = None
        text_response = None
        if response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, "finish_reason"):
                block_reason = str(candidate.finish_reason)
            if candidate.content and candidate.content.parts:
                for part in candidate.content.parts:
                    if hasattr(part, "text") and part.text:
                        text_response = part.text[:200]

        return {
            "error": "No image generated",
            "reason": block_reason,
            "text": text_response,
            "success": False
        }

    except Exception as e:
        return {"error": str(e), "success": False}
