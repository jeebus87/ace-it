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


def add_citations_from_grounding(text: str, sources: list, grounding_supports: list) -> str:
    """Add citations using Gemini's grounding_supports for accurate source mapping.

    Args:
        text: The response text
        sources: List of source dicts with title/url
        grounding_supports: List of grounding support objects from Gemini API

    Returns:
        Text with accurate inline citations based on grounding metadata.
    """
    import re

    if not grounding_supports:
        logger.info("[CITATION] No grounding_supports available")
        return text

    # Build list of (end_position, [source_indices]) from grounding_supports
    citations_to_insert = []

    for support in grounding_supports:
        if not hasattr(support, 'segment') or not support.segment:
            continue
        if not hasattr(support, 'grounding_chunk_indices'):
            continue

        segment = support.segment
        end_idx = getattr(segment, 'end_index', None)
        if end_idx is None:
            continue

        chunk_indices = list(support.grounding_chunk_indices)
        if chunk_indices:
            citation_nums = [i + 1 for i in chunk_indices if i < len(sources)]
            if citation_nums:
                citations_to_insert.append((int(end_idx), citation_nums))

    if not citations_to_insert:
        logger.info("[CITATION] No valid citation positions from grounding")
        return text

    # Sort by position
    citations_to_insert.sort(key=lambda x: x[0])

    # Merge citations at same or very close positions
    merged = []
    for pos, nums in citations_to_insert:
        if merged and abs(merged[-1][0] - pos) < 10:
            existing_nums = set(merged[-1][1])
            existing_nums.update(nums)
            merged[-1] = (max(merged[-1][0], pos), sorted(existing_nums))
        else:
            merged.append((pos, nums))

    # Find safe insertion points (after punctuation or at word boundaries)
    # For each citation position, find the nearest safe spot
    safe_positions = []
    for raw_pos, citation_nums in merged:
        # Clamp to text length
        pos = min(raw_pos, len(text))

        # Look for nearest sentence end or word boundary within ~50 chars
        search_start = max(0, pos - 30)
        search_end = min(len(text), pos + 30)
        search_region = text[search_start:search_end]

        # Find punctuation positions relative to our target
        best_pos = pos
        best_dist = float('inf')

        # Look for sentence-ending punctuation
        for match in re.finditer(r'[.!?](?=\s|$|"|\'|\*)', search_region):
            abs_pos = search_start + match.end()
            dist = abs(abs_pos - pos)
            if dist < best_dist:
                best_dist = dist
                best_pos = abs_pos

        # If no punctuation found nearby, look for word boundary
        if best_dist > 20:
            for match in re.finditer(r'\s', search_region):
                abs_pos = search_start + match.start()
                dist = abs(abs_pos - pos)
                if dist < best_dist:
                    best_dist = dist
                    best_pos = abs_pos

        safe_positions.append((best_pos, citation_nums))

    # Dedupe positions that ended up at same spot
    final_positions = {}
    for pos, nums in safe_positions:
        if pos in final_positions:
            final_positions[pos] = sorted(set(final_positions[pos]) | set(nums))
        else:
            final_positions[pos] = nums

    # Insert citations in reverse order to preserve positions
    result = text
    for pos in sorted(final_positions.keys(), reverse=True):
        citation_nums = final_positions[pos]
        superscripts = ''.join(to_superscript(n) for n in citation_nums)
        result = result[:pos] + superscripts + result[pos:]

    cited_indices = set()
    for nums in final_positions.values():
        cited_indices.update(nums)

    logger.info(f"[CITATION] Inserted {len(final_positions)} citation markers for {len(cited_indices)} unique sources")

    return result


def add_citations_fallback(text: str, num_sources: int) -> str:
    """Fallback: distribute citations evenly when grounding_supports unavailable."""
    import re

    if num_sources == 0:
        return text

    # Find sentence-ending positions
    pattern = r'([.!?])(?=\s|$|"|\*\*|\))'
    matches = list(re.finditer(pattern, text))

    valid_positions = []
    for match in matches:
        pos = match.end()
        start = max(0, pos - 100)
        context = text[start:pos]
        lines = context.split('\n')
        current_line = lines[-1] if lines else ""

        if current_line.strip().startswith('#') or len(current_line.strip()) < 20:
            continue
        valid_positions.append(pos)

    if not valid_positions:
        return text

    result = text

    if len(valid_positions) >= num_sources:
        step = len(valid_positions) / num_sources
        for i in range(num_sources - 1, -1, -1):
            idx = int(i * step)
            pos = valid_positions[idx]
            superscript = to_superscript(i + 1)
            result = result[:pos] + superscript + result[pos:]
    else:
        sources_per_pos = num_sources / len(valid_positions)
        source_idx = num_sources
        for i in range(len(valid_positions) - 1, -1, -1):
            pos = valid_positions[i]
            start_idx = int(i * sources_per_pos) + 1
            end_idx = source_idx
            superscripts = ''.join(to_superscript(n) for n in range(start_idx, end_idx + 1))
            result = result[:pos] + superscripts + result[pos:]
            source_idx = start_idx - 1

    logger.info(f"[CITATION] Fallback: distributed {num_sources} citations")
    return result


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

        grounding_supports = []

        if hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            has_metadata = hasattr(candidate, 'grounding_metadata') and candidate.grounding_metadata
            logger.info(f"Candidate has grounding_metadata: {has_metadata}")

            if has_metadata:
                metadata = candidate.grounding_metadata

                # Extract grounding_supports for accurate citation placement
                if hasattr(metadata, 'grounding_supports') and metadata.grounding_supports:
                    grounding_supports = list(metadata.grounding_supports)
                    logger.info(f"Found {len(grounding_supports)} grounding_supports")

                # Extract sources from grounding chunks
                if hasattr(metadata, 'grounding_chunks') and metadata.grounding_chunks:
                    for chunk in metadata.grounding_chunks:
                        if hasattr(chunk, 'web') and chunk.web:
                            sources.append({
                                "title": chunk.web.title if hasattr(chunk.web, 'title') else "",
                                "url": chunk.web.uri if hasattr(chunk.web, 'uri') else ""
                            })

                logger.info(f"Extracted {len(sources)} sources total")

        # Add inline citations - distribute evenly at sentence boundaries
        # Note: grounding_supports positions are often unreliable, so we use
        # the fallback approach which places citations at proper sentence ends
        if sources:
            text = add_citations_fallback(text, len(sources))

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
