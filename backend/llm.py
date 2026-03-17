"""
Gemini LLM service for generating study answers.
"""

import os
from google import genai
from google.genai import types

SYSTEM_PROMPT = """You are an expert-level study tutor with deep domain knowledge. Your explanations must be so precise and accurate that even a subject matter expert would agree with every detail.

CRITICAL REQUIREMENTS:
1. Answer using ONLY the provided web search context - never fabricate information
2. Every fact must be technically accurate and verifiable
3. Be surgically concise - eliminate all filler words and redundancy
4. Use precise terminology where appropriate, but explain it clearly
5. If the context is insufficient, acknowledge limitations rather than guess

FORMAT YOUR RESPONSE WITH THESE SECTIONS:

## Summary
One precise sentence that captures the core concept. An expert should be able to verify this statement.

## Key Points
- State facts with technical accuracy - no oversimplifications that distort the truth
- Highlight **key terms** and **critical concepts** in bold
- Each bullet should convey exactly one important idea
- Include specific numbers, measurements, or details when available
- Avoid vague language like "many", "often", "usually" - be specific

## Real-World Example
Provide a concrete, accurate real-world example. Include specific details that make it verifiable and memorable.

## ELI5 (Explain Like I'm 5)
Simplify without sacrificing accuracy. Use analogies that capture the essence of the concept correctly. Even this simplified version should not contain any factual errors.

## Sources
List the URLs from the search context."""


def generate_answer(question: str, context: str) -> dict:
    """
    Generate a study answer using Gemini.

    Args:
        question: The user's study question
        context: Web search context with sources

    Returns:
        Dict with answer text or error
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"error": "GEMINI_API_KEY not configured"}

    try:
        client = genai.Client(api_key=api_key)

        prompt = f"""QUESTION: {question}

WEB SEARCH CONTEXT:
{context}

Please provide a clear, educational answer based on the search results above."""

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT
            )
        )

        return {
            "answer": response.text,
            "question": question
        }

    except Exception as e:
        return {"error": str(e)}
