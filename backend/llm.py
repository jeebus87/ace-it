"""
Gemini LLM service for generating study answers with Google Search grounding.
"""

import os
import logging
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

# Unicode superscript digits
SUPERSCRIPTS = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']


def to_superscript(n: int) -> str:
    """Convert number to superscript unicode."""
    return ''.join(SUPERSCRIPTS[int(d)] for d in str(n))


def add_citations_to_text(text: str, sources: list) -> tuple[str, list]:
    """Add citations by inserting superscripts after sentences in order.

    Returns:
        Tuple of (modified_text, cited_sources) where cited_sources only
        contains sources that were actually referenced in the text.
    """
    if not sources or len(sources) == 0:
        logger.info("[CITATION] No sources to cite")
        return text, []

    import re

    max_citations = min(len(sources), 9)

    # Find all citation positions in the full text first
    # Pattern: sentence ending punctuation followed by space, end, quotes, or markdown
    pattern = r'([.!?])(?=\s|$|"|\*\*|\))'

    # Find positions in sections we want to cite (Summary and Key Points mainly)
    matches = list(re.finditer(pattern, text))

    # Filter to substantive positions (not in headers, not too short context)
    valid_positions = []
    for match in matches:
        pos = match.end()
        # Check context - skip if near a header
        start = max(0, pos - 100)
        context = text[start:pos]

        # Skip if this is in a header line or Real-World Examples section
        lines_before = context.split('\n')
        current_line = lines_before[-1] if lines_before else ""

        # Skip headers, short lines, and example sections
        if current_line.strip().startswith('#'):
            continue
        if len(current_line.strip()) < 25:
            continue
        if '## Real-World' in context or '## ELI5' in context:
            continue

        valid_positions.append(pos)

    # Limit to max citations, spread across the content
    if len(valid_positions) > max_citations:
        # Take evenly spaced positions
        step = len(valid_positions) // max_citations
        valid_positions = valid_positions[::step][:max_citations]

    # Insert citations in reverse order to preserve positions, but number in forward order
    result = text
    cited_sources = []

    for i, pos in enumerate(reversed(valid_positions)):
        citation_num = len(valid_positions) - i  # Forward numbering
        superscript = to_superscript(citation_num)
        result = result[:pos] + superscript + result[pos:]

    # Collect the sources that were cited (in order)
    for i in range(min(len(valid_positions), len(sources))):
        cited_sources.append(sources[i])

    logger.info(f"[CITATION] Inserted {len(valid_positions)} citations")

    return result, cited_sources


SYSTEM_PROMPT = """You are an expert-level study tutor with deep domain knowledge. Your explanations must be so precise and accurate that even a subject matter expert would agree with every detail.

CRITICAL REQUIREMENTS:
1. Use the Google Search results to provide accurate, up-to-date information
2. Every fact must be technically accurate and verifiable
3. Be surgically concise - eliminate all filler words and redundancy
4. Use precise terminology where appropriate, but explain it clearly
5. If information is insufficient, acknowledge limitations rather than guess
6. QUOTATION MARKS: Use double quotes (") for all quotations, cited text, and titles. Use apostrophes (') ONLY for contractions (don't, it's) and possessives (Newton's). Example correct: Einstein said, "Imagination is more important than knowledge." Example WRONG: Einstein said, 'Imagination is more important than knowledge.'

FORMAT YOUR RESPONSE WITH THESE SECTIONS:

## Summary
One precise sentence that captures the core concept.

## Key Points
- State facts with technical accuracy
- Highlight **key terms** and **critical concepts** in bold
- Include specific numbers, measurements, or details when available

## Real-World Examples
Provide 10-15 concrete, accurate real-world examples that illustrate the concept.
IMPORTANT: Format as a NUMBERED LIST like this:
1. First example with specific details
2. Second example with specific details
3. Third example with specific details
...and so on up to 10-15 examples.

Each example must be specific and verifiable (include names, dates, numbers, or measurable details) and show the concept in different contexts.

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
        contents = f"Please provide a clear, educational answer to this question: {question}"
        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            tools=[types.Tool(google_search=types.GoogleSearch())]
        )

        # Try pro model first, fall back to flash if unavailable
        try:
            response = client.models.generate_content(
                model="gemini-2.5-pro",
                contents=contents,
                config=config
            )
        except Exception as model_error:
            logger.warning(f"Pro model failed, falling back to flash: {model_error}")
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents,
                config=config
            )

        # Extract grounding metadata for citations
        text = response.text
        sources = []

        logger.info(f"Response has candidates: {hasattr(response, 'candidates') and bool(response.candidates)}")

        if hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            has_metadata = hasattr(candidate, 'grounding_metadata') and candidate.grounding_metadata
            logger.info(f"Candidate has grounding_metadata: {has_metadata}")

            if has_metadata:
                metadata = candidate.grounding_metadata
                has_chunks = hasattr(metadata, 'grounding_chunks') and metadata.grounding_chunks
                logger.info(f"Metadata has grounding_chunks: {has_chunks}")

                # Extract unique sources from grounding chunks
                chunks = []
                if has_chunks:
                    chunks = metadata.grounding_chunks
                    logger.info(f"Found {len(chunks)} grounding chunks")
                    for chunk in chunks:
                        if hasattr(chunk, 'web') and chunk.web:
                            sources.append({
                                "title": chunk.web.title if hasattr(chunk.web, 'title') else "",
                                "url": chunk.web.uri if hasattr(chunk.web, 'uri') else ""
                            })
                            logger.info(f"Added source: {sources[-1]['title'][:50] if sources[-1]['title'] else 'No title'}")

                logger.info(f"Extracted {len(sources)} sources total")

        # Post-process to add inline citations
        if sources:
            text, sources = add_citations_to_text(text, sources)

        return {
            "answer": text,
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

        config = types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT)

        # Try pro model first, fall back to flash if unavailable
        try:
            response = client.models.generate_content(
                model="gemini-2.5-pro",
                contents=prompt,
                config=config
            )
        except Exception as model_error:
            logger.warning(f"Pro model failed, falling back to flash: {model_error}")
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=config
            )

        return {
            "answer": response.text,
            "question": question
        }

    except Exception as e:
        return {"error": str(e)}
