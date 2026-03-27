"""
Gemini quiz generation service for mastery testing.
"""

import os
import json
from google import genai
from google.genai import types


# JSON Schema for guaranteed valid quiz structure
QUIZ_SCHEMA = {
    "type": "object",
    "properties": {
        "questions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "integer"},
                    "question": {"type": "string"},
                    "choices": {
                        "type": "object",
                        "properties": {
                            "A": {"type": "string"},
                            "B": {"type": "string"},
                            "C": {"type": "string"},
                            "D": {"type": "string"}
                        },
                        "required": ["A", "B", "C", "D"]
                    },
                    "correct": {"type": "string", "enum": ["A", "B", "C", "D"]},
                    "explanation": {"type": "string"}
                },
                "required": ["id", "question", "choices", "correct", "explanation"]
            }
        }
    },
    "required": ["questions"]
}


DIFFICULTY_GUIDELINES = {
    "beginner": """
- Focus on basic comprehension and recall
- Use simple, direct questions
- Avoid complex scenarios or edge cases
- Test fundamental understanding
- Questions should be approachable for someone new to the topic""",
    "intermediate": """
- Test application of concepts
- Include some analysis questions
- Mix of straightforward and moderately challenging
- Require connecting ideas
- Some questions should require thinking beyond surface-level understanding""",
    "advanced": """
- Deep critical thinking required
- Complex scenarios and edge cases
- Synthesis of multiple concepts
- Nuanced distinctions between similar ideas
- Questions that challenge even those familiar with the topic""",
}


def generate_quiz(question: str, answer: str, difficulty: str = "intermediate") -> dict:
    """
    Generate a 10-question multiple choice quiz.

    Args:
        question: The original study question
        answer: The generated answer text
        difficulty: Quiz difficulty level (beginner, intermediate, advanced)

    Returns:
        Dict with quiz questions or error
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"error": "GEMINI_API_KEY not configured"}

    difficulty_instruction = DIFFICULTY_GUIDELINES.get(
        difficulty.lower(), DIFFICULTY_GUIDELINES["intermediate"]
    )

    try:
        client = genai.Client(api_key=api_key)

        quiz_prompt = f"""Based on this study material, create exactly 10 quiz questions with a mix of question types.

TOPIC: {question}

DIFFICULTY LEVEL: {difficulty.upper()}
{difficulty_instruction}

STUDY MATERIAL:
{answer}

QUESTION TYPES - Mix these throughout the quiz:
1. MULTIPLE CHOICE (6-7 questions): Standard 4-option questions
2. TRUE/FALSE (3-4 questions): Statement verification questions

REQUIREMENTS:
- Each question tests understanding, not memorization
- 4 answer choices (A, B, C, D) per question
- Only ONE correct answer per question
- Include plausible distractors (wrong answers that seem reasonable)
- Follow the difficulty guidelines above

FOR TRUE/FALSE QUESTIONS:
- Format the question as a statement to evaluate (e.g., "The mitochondria is the powerhouse of the cell.")
- Use choices: A="True", B="False", C="It depends on context", D="Cannot be determined"
- The correct answer should only be A or B (True or False)

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
        }},
        {{
            "id": 2,
            "question": "The Earth revolves around the Sun in approximately 365 days.",
            "choices": {{
                "A": "True",
                "B": "False",
                "C": "It depends on context",
                "D": "Cannot be determined"
            }},
            "correct": "A",
            "explanation": "This is true! The Earth takes about 365.25 days to complete one orbit around the Sun."
        }}
    ]
}}

CRITICAL: The "choices" field MUST be an object with keys "A", "B", "C", "D" where each value is the answer text string.

QUOTATION MARK RULES (IMPORTANT):
- Use double quotes (") for all quotations, cited text, and titles
- Use apostrophes (') ONLY for contractions (don't, it's, can't) and possessives (Newton's)
- Example correct: He said, "Hello there!"
- Example correct: It's important to understand Newton's laws.
- Example WRONG: He said, 'Hello there!'

IMPORTANT FOR EXPLANATIONS:
- Be casual and friendly, like a tutor helping a friend
- For wrong answers, explain WHY that choice seems appealing but is incorrect
- Guide them to the right thinking with simple analogies
- Keep it conversational - use "you", contractions, and encouraging language

Return ONLY valid JSON, no other text."""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=quiz_prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=QUIZ_SCHEMA
            )
        )

        quiz_data = json.loads(response.text)
        quiz_data["topic"] = question
        quiz_data["total"] = len(quiz_data.get("questions", []))
        quiz_data["difficulty"] = difficulty

        return quiz_data

    except json.JSONDecodeError as e:
        return {"error": f"Invalid JSON response: {e}", "questions": []}
    except Exception as e:
        return {"error": str(e), "questions": []}
