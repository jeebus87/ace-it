"""
Gemini LLM service for generating study answers with Google Search grounding.
"""

import os
from google import genai
from google.genai import types

SYSTEM_PROMPT = """You are an expert-level study tutor with deep domain knowledge. Your explanations must be so precise and accurate that even a subject matter expert would agree with every detail.

CRITICAL REQUIREMENTS:
1. Use the Google Search results to provide accurate, up-to-date information
2. Every fact must be technically accurate and verifiable
3. Be surgically concise - eliminate all filler words and redundancy
4. Use precise terminology where appropriate, but explain it clearly
5. If information is insufficient, acknowledge limitations rather than guess
6. Always use double quotes (") for quotations, never single quotes (')

FORMAT YOUR RESPONSE WITH THESE SECTIONS:

## Summary
One precise sentence that captures the core concept. An expert should be able to verify this statement.

## Key Points
- State facts with technical accuracy - no oversimplifications that distort the truth
- Highlight **key terms** and **critical concepts** in bold
- Each bullet should convey exactly one important idea
- Include specific numbers, measurements, or details when available
- Avoid vague language like "many", "often", "usually" - be specific

## Real-World Examples
Provide 10-15 concrete, accurate real-world examples that illustrate the concept. Each example should:
- Be specific and verifiable (include names, dates, numbers, or measurable details)
- Show the concept applied in different contexts (science, daily life, industry, history, etc.)
- Be memorable and relatable to students
- Use numbered list format (1. 2. 3. etc.), one example per line

## ELI5 (Explain Like I'm 5)
Simplify without sacrificing accuracy. Use analogies that capture the essence of the concept correctly. Even this simplified version should not contain any factual errors."""


def generate_answer(question: str, context: str = "") -> dict:
    """
    Generate a study answer using Gemini with Google Search grounding.

    Args:
        question: The user's study question
        context: Optional legacy context (ignored when Google Search is used)

    Returns:
        Dict with answer text, sources, and grounding metadata
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"error": "GEMINI_API_KEY not configured"}

    try:
        client = genai.Client(api_key=api_key)

        # Use Google Search grounding for fresh, accurate information
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"Please provide a clear, educational answer to this question: {question}",
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                tools=[types.Tool(google_search=types.GoogleSearch())]
            )
        )

        # Extract grounding metadata for citations
        sources = []
        if hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, 'grounding_metadata') and candidate.grounding_metadata:
                metadata = candidate.grounding_metadata
                if hasattr(metadata, 'grounding_chunks') and metadata.grounding_chunks:
                    for chunk in metadata.grounding_chunks:
                        if hasattr(chunk, 'web') and chunk.web:
                            sources.append({
                                "title": chunk.web.title if hasattr(chunk.web, 'title') else "",
                                "url": chunk.web.uri if hasattr(chunk.web, 'uri') else ""
                            })

        return {
            "answer": response.text,
            "question": question,
            "sources": sources
        }

    except Exception as e:
        return {"error": str(e)}


def generate_answer_with_context(question: str, context: str) -> dict:
    """
    Generate a study answer using provided context (for PDF/document mode).

    Args:
        question: The user's study question
        context: Document or URL context

    Returns:
        Dict with answer text
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"error": "GEMINI_API_KEY not configured"}

    try:
        client = genai.Client(api_key=api_key)

        prompt = f"""QUESTION: {question}

CONTEXT:
{context}

Please provide a clear, educational answer based on the context above."""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
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
