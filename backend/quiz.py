"""
Gemini quiz generation service for mastery testing.
"""

import os
import json
from google import genai
from google.genai import types


def generate_quiz(question: str, answer: str) -> dict:
    """
    Generate a 10-question multiple choice quiz.

    Args:
        question: The original study question
        answer: The generated answer text

    Returns:
        Dict with quiz questions or error
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"error": "GEMINI_API_KEY not configured"}

    try:
        client = genai.Client(api_key=api_key)

        quiz_prompt = f"""Based on this study material, create exactly 10 multiple choice questions.

TOPIC: {question}

STUDY MATERIAL:
{answer}

REQUIREMENTS:
- Each question tests understanding, not memorization
- 4 answer choices (A, B, C, D) per question
- Only ONE correct answer per question
- Include plausible distractors (wrong answers that seem reasonable)
- Questions should progress from basic to more challenging

OUTPUT FORMAT (valid JSON only, no markdown, no code blocks):
{{
    "questions": [
        {{
            "id": 1,
            "question": "What is the main cause of X?",
            "choices": {{
                "A": "The first possible answer text here",
                "B": "The second possible answer text here",
                "C": "The third possible answer text here",
                "D": "The fourth possible answer text here"
            }},
            "correct": "A",
            "explanation": "A is correct because... The other options are wrong because..."
        }}
    ]
}}

CRITICAL: The "choices" field MUST be an object with keys "A", "B", "C", "D" where each value is the answer text string.

IMPORTANT FOR EXPLANATIONS:
- Be casual and friendly, like a tutor helping a friend
- For wrong answers, explain WHY that choice seems appealing but is incorrect
- Guide them to the right thinking with simple analogies
- Keep it conversational - use "you", contractions, and encouraging language

Return ONLY valid JSON, no other text."""

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=quiz_prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )

        quiz_data = json.loads(response.text)
        quiz_data["topic"] = question
        quiz_data["total"] = len(quiz_data.get("questions", []))

        return quiz_data

    except json.JSONDecodeError as e:
        return {"error": f"Invalid JSON response: {e}", "questions": []}
    except Exception as e:
        return {"error": str(e), "questions": []}
