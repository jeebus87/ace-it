"""
Ace-It Backend - Modal serverless functions for study assistance.
Features: Google Search grounding, TTS, PDF upload, URL context, code execution, and more.
"""

import modal
import os
import json
import base64
import time

app = modal.App("ace-it-backend")

# Shared image with all dependencies
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "google-genai>=1.0.0",
        "pydantic",
        "fastapi[standard]",
    )
    .add_local_file("llm.py", "/root/llm.py", copy=True)
    .add_local_file("quiz.py", "/root/quiz.py", copy=True)
    .add_local_file("image_gen.py", "/root/image_gen.py", copy=True)
)


# =============================================================================
# CORE ENDPOINTS
# =============================================================================

@app.function(image=image, secrets=[modal.Secret.from_name("gemini-api-key")])
@modal.fastapi_endpoint(method="POST")
def generate(data: dict) -> dict:
    """
    Generate an answer using Gemini with Google Search grounding.
    No longer requires separate search - uses built-in Google Search tool.
    """
    import sys
    sys.path.insert(0, "/root")
    from llm import generate_answer
    question = data.get("question", "")
    return generate_answer(question)


@app.function(image=image, secrets=[modal.Secret.from_name("gemini-api-key")])
@modal.fastapi_endpoint(method="POST")
def image_gen(data: dict) -> dict:
    """Generate an educational image using Gemini."""
    import sys
    sys.path.insert(0, "/root")
    from image_gen import generate_image
    question = data.get("question", "")
    summary = data.get("summary", "")
    return generate_image(question, summary)


@app.function(image=image, secrets=[modal.Secret.from_name("gemini-api-key")])
@modal.fastapi_endpoint(method="POST")
def quiz(data: dict) -> dict:
    """Generate a 10-question mastery quiz with structured output."""
    import sys
    sys.path.insert(0, "/root")
    from quiz import generate_quiz
    question = data.get("question", "")
    answer = data.get("answer", "")
    difficulty = data.get("difficulty", "intermediate")
    return generate_quiz(question, answer, difficulty)


@app.function(image=image, secrets=[modal.Secret.from_name("gemini-api-key")])
@modal.fastapi_endpoint(method="POST")
def validate_answer(data: dict) -> dict:
    """
    Validate if a typed answer is acceptable using Gemini Flash.
    Used when user types answer after getting a quiz question wrong.

    Args:
        typed: The user's typed answer
        correct: The correct answer text
        question: The quiz question (for context)

    Returns:
        Dict with is_correct boolean and explanation
    """
    from google import genai
    from google.genai import types

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"error": "GEMINI_API_KEY not configured"}

    typed = data.get("typed", "").strip()
    correct = data.get("correct", "").strip()
    question = data.get("question", "").strip()

    if not typed or not correct:
        return {"error": "typed and correct are required"}

    # Quick exact match check (case-insensitive)
    if typed.lower() == correct.lower():
        return {"is_correct": True, "reason": "Exact match"}

    try:
        client = genai.Client(api_key=api_key)

        prompt = f"""You are a LENIENT quiz grader evaluating a student's typed answer.

QUIZ QUESTION: {question}
CORRECT ANSWER: {correct}
STUDENT'S ANSWER: {typed}

Your job is to determine if the student KNOWS the answer, not if they typed it perfectly.

ACCEPT the answer (say YES) if ANY of these apply:
- The core concept/meaning matches (even if worded differently)
- Contains typos or spelling errors but the intent is clear
- Missing or extra words (articles, prepositions) but meaning is preserved
- Informal or simplified language that conveys the same idea
- Abbreviations or alternate forms of the same term
- The answer contains the key terms from the correct answer
- A reasonable person would recognize they mean the same thing

REJECT the answer (say NO) ONLY if:
- The answer is factually incorrect or contradicts the correct answer
- The answer is completely unrelated or nonsensical
- The answer names a different concept entirely

IMPORTANT: Be generous! Students are learning. If they demonstrate understanding of the concept, accept it.

Examples of what to ACCEPT:
- "mitocondria" for "mitochondria" (typo)
- "powerhouse of cell" for "mitochondria" (description)
- "cell energy maker" for "mitochondria" (simplified)
- "PHOTOSYNTHESIS" for "photosynthesis" (case)
- "the cell membrane" for "cell membrane" (extra article)

Reply with ONLY: YES or NO"""

        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt
        )

        # Extract text from response
        response_text = ""
        if hasattr(response, 'text') and response.text:
            response_text = response.text
        elif hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, 'content') and candidate.content:
                if hasattr(candidate.content, 'parts') and candidate.content.parts:
                    response_text = candidate.content.parts[0].text

        answer = response_text.strip().upper() if response_text else ""
        is_correct = answer.startswith("YES")

        return {
            "is_correct": is_correct,
            "typed": typed,
            "correct": correct
        }

    except Exception as e:
        # On error, fall back to simple comparison
        return {
            "is_correct": typed.lower() == correct.lower(),
            "error": str(e),
            "fallback": True
        }


# =============================================================================
# TEXT-TO-SPEECH
# =============================================================================

@app.function(image=image, secrets=[modal.Secret.from_name("gemini-api-key")])
@modal.fastapi_endpoint(method="POST")
def speak(data: dict) -> dict:
    """
    Convert text to speech using Gemini Live API.

    Args:
        text: Text to convert to speech
        voice: Voice name (default: "Puck" - upbeat)
               Options: Aoede, Charon, Fenrir, Kore, Puck, etc.

    Returns:
        Dict with base64-encoded audio data
    """
    import asyncio
    from google import genai
    from google.genai import types

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"error": "GEMINI_API_KEY not configured"}

    text = data.get("text", "")
    voice = data.get("voice", "Puck")

    if not text:
        return {"error": "No text provided"}

    # Limit text length for TTS
    if len(text) > 1000:
        text = text[:1000] + "..."

    async def generate_speech():
        client = genai.Client(api_key=api_key)

        config = {
            "response_modalities": ["AUDIO"],
            "speech_config": {
                "voice_config": {
                    "prebuilt_voice_config": {
                        "voice_name": voice
                    }
                }
            }
        }

        audio_chunks = []

        async with client.aio.live.connect(
            model="gemini-live-2.5-flash-preview",
            config=config
        ) as session:
            # Send the text to be spoken
            await session.send_client_content(
                turns=[{"role": "user", "parts": [{"text": f"Please read this text aloud: {text}"}]}],
                turn_complete=True
            )

            # Collect audio response
            async for msg in session.receive():
                if msg.server_content and msg.server_content.model_turn:
                    for part in msg.server_content.model_turn.parts:
                        if hasattr(part, 'inline_data') and part.inline_data:
                            audio_chunks.append(part.inline_data.data)
                if msg.server_content and msg.server_content.turn_complete:
                    break

        if audio_chunks:
            combined_audio = b''.join(audio_chunks)
            return {
                "audio": base64.b64encode(combined_audio).decode('utf-8'),
                "mime_type": "audio/pcm;rate=24000"
            }
        return {"error": "No audio generated"}

    try:
        return asyncio.run(generate_speech())
    except Exception as e:
        return {"error": str(e)}


# =============================================================================
# URL CONTEXT - Study web articles
# =============================================================================

@app.function(image=image, secrets=[modal.Secret.from_name("gemini-api-key")])
@modal.fastapi_endpoint(method="POST")
def study_url(data: dict) -> dict:
    """
    Study a web article by URL - summarize and optionally generate quiz.

    Args:
        url: URL of the article to study
        question: Optional specific question about the article
        generate_quiz: Whether to also generate quiz questions

    Returns:
        Dict with answer, sources, and optional quiz
    """
    from google import genai
    from google.genai import types

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"error": "GEMINI_API_KEY not configured"}

    url = data.get("url", "")
    question = data.get("question", "Summarize this article and explain the key concepts")

    if not url:
        return {"error": "No URL provided"}

    try:
        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Content(
                    parts=[
                        types.Part.from_uri(file_uri=url, mime_type="text/html"),
                        types.Part.from_text(question)
                    ]
                )
            ],
            config=types.GenerateContentConfig(
                tools=[types.Tool(url_context=types.UrlContext())]
            )
        )

        return {
            "answer": response.text,
            "url": url,
            "question": question
        }

    except Exception as e:
        return {"error": str(e)}


# =============================================================================
# PDF/DOCUMENT UPLOAD
# =============================================================================

@app.function(image=image, secrets=[modal.Secret.from_name("gemini-api-key")])
@modal.fastapi_endpoint(method="POST")
def upload_document(data: dict) -> dict:
    """
    Upload a PDF document for study.

    Args:
        file_base64: Base64-encoded PDF file
        filename: Original filename

    Returns:
        Dict with file_id for subsequent queries
    """
    from google import genai

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"error": "GEMINI_API_KEY not configured"}

    file_base64 = data.get("file_base64", "")
    filename = data.get("filename", "document.pdf")

    if not file_base64:
        return {"error": "No file provided"}

    try:
        client = genai.Client(api_key=api_key)

        # Decode and upload file
        file_bytes = base64.b64decode(file_base64)

        uploaded_file = client.files.upload(
            file=file_bytes,
            config={"display_name": filename, "mime_type": "application/pdf"}
        )

        return {
            "file_id": uploaded_file.name,
            "filename": filename,
            "state": uploaded_file.state.name if hasattr(uploaded_file, 'state') else "ACTIVE",
            "expires": "48 hours"
        }

    except Exception as e:
        return {"error": str(e)}


@app.function(image=image, secrets=[modal.Secret.from_name("gemini-api-key")])
@modal.fastapi_endpoint(method="POST")
def study_document(data: dict) -> dict:
    """
    Ask questions about an uploaded document.

    Args:
        file_id: File ID from upload_document
        question: Question about the document

    Returns:
        Dict with answer
    """
    from google import genai
    from google.genai import types

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"error": "GEMINI_API_KEY not configured"}

    file_id = data.get("file_id", "")
    question = data.get("question", "")

    if not file_id or not question:
        return {"error": "file_id and question are required"}

    try:
        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Part.from_uri(file_uri=file_id, mime_type="application/pdf"),
                question
            ]
        )

        return {
            "answer": response.text,
            "file_id": file_id,
            "question": question
        }

    except Exception as e:
        return {"error": str(e)}


# =============================================================================
# CODE EXECUTION - Math & Science
# =============================================================================

@app.function(image=image, secrets=[modal.Secret.from_name("gemini-api-key")])
@modal.fastapi_endpoint(method="POST")
def solve(data: dict) -> dict:
    """
    Solve math/science problems with code execution.
    Uses Python with NumPy, Pandas, SymPy, Matplotlib, etc.

    Args:
        problem: Math or science problem to solve

    Returns:
        Dict with explanation, code, result, and optional plot
    """
    from google import genai

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"error": "GEMINI_API_KEY not configured"}

    problem = data.get("problem", "")

    if not problem:
        return {"error": "No problem provided"}

    try:
        client = genai.Client(api_key=api_key)

        # Use Interactions API with code_execution tool
        interaction = client.interactions.create(
            model="gemini-2.5-flash",
            input=f"""Solve this problem step by step. Use Python code to verify calculations.

Problem: {problem}

Provide:
1. Step-by-step explanation
2. Python code to solve/verify
3. Final answer""",
            tools=[{"type": "code_execution"}]
        )

        # Extract the response
        result = {
            "explanation": "",
            "code": "",
            "output": "",
            "problem": problem
        }

        # Get the final output from interaction
        if interaction.outputs:
            for output in interaction.outputs:
                if hasattr(output, 'text') and output.text:
                    result["explanation"] += output.text + "\n"
                if hasattr(output, 'code') and output.code:
                    result["code"] = output.code
                if hasattr(output, 'code_execution_result') and output.code_execution_result:
                    result["output"] = output.code_execution_result

        # If no structured output, use the last text output
        if not result["explanation"] and interaction.outputs:
            last_output = interaction.outputs[-1]
            if hasattr(last_output, 'text'):
                result["explanation"] = last_output.text

        return result

    except Exception as e:
        return {"error": str(e)}


# =============================================================================
# CONTEXT CACHING - Follow-up questions
# =============================================================================

# In-memory cache for chat sessions (use Redis in production)
_chat_cache = {}

@app.function(image=image, secrets=[modal.Secret.from_name("gemini-api-key")])
@modal.fastapi_endpoint(method="POST")
def follow_up(data: dict) -> dict:
    """
    Ask follow-up questions using chat sessions.

    Args:
        session_id: Session ID from previous answer
        question: Follow-up question
        context: Optional initial context (for first question)

    Returns:
        Dict with answer and session_id
    """
    from google import genai
    from google.genai import types

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"error": "GEMINI_API_KEY not configured"}

    session_id = data.get("session_id", "")
    question = data.get("question", "")
    context = data.get("context", "")

    if not question:
        return {"error": "No question provided"}

    try:
        client = genai.Client(api_key=api_key)

        # Create or retrieve chat session
        if session_id and session_id in _chat_cache:
            # Retrieve existing chat history and create new chat with it
            history = _chat_cache[session_id]
            chat = client.chats.create(
                model="gemini-2.5-flash",
                history=history
            )
        else:
            # Create new session
            session_id = f"session-{int(time.time() * 1000)}"

            if context:
                # Create chat with system context
                chat = client.chats.create(
                    model="gemini-2.5-flash",
                    config=types.GenerateContentConfig(
                        system_instruction=f"You are a helpful study assistant. Use this context to answer questions:\n\n{context}"
                    )
                )
            else:
                chat = client.chats.create(model="gemini-2.5-flash")

        # Send the question
        response = chat.send_message(question)

        # Cache the chat history (limit to last 20 turns)
        history = chat.get_history()
        if len(history) > 20:
            history = history[-20:]
        _chat_cache[session_id] = history

        return {
            "answer": response.text,
            "session_id": session_id,
            "question": question
        }

    except Exception as e:
        return {"error": str(e)}


# =============================================================================
# FILE SEARCH / RAG - Multi-document courses
# =============================================================================

@app.function(image=image, secrets=[modal.Secret.from_name("gemini-api-key")])
@modal.fastapi_endpoint(method="POST")
def create_course(data: dict) -> dict:
    """
    Create a study course (file search store) for multiple documents.

    Args:
        name: Course name

    Returns:
        Dict with store_id
    """
    from google import genai

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"error": "GEMINI_API_KEY not configured"}

    name = data.get("name", "My Course")

    try:
        client = genai.Client(api_key=api_key)

        store = client.file_search.stores.create(name=name)

        return {
            "store_id": store.name,
            "name": name
        }

    except Exception as e:
        return {"error": str(e)}


@app.function(image=image, secrets=[modal.Secret.from_name("gemini-api-key")])
@modal.fastapi_endpoint(method="POST")
def add_to_course(data: dict) -> dict:
    """
    Add a document to a study course.

    Args:
        store_id: Course store ID
        file_id: File ID from upload_document

    Returns:
        Dict with status
    """
    from google import genai

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"error": "GEMINI_API_KEY not configured"}

    store_id = data.get("store_id", "")
    file_id = data.get("file_id", "")

    if not store_id or not file_id:
        return {"error": "store_id and file_id are required"}

    try:
        client = genai.Client(api_key=api_key)

        client.file_search.stores.import_files(
            store_name=store_id,
            files=[file_id]
        )

        return {
            "status": "added",
            "store_id": store_id,
            "file_id": file_id
        }

    except Exception as e:
        return {"error": str(e)}


@app.function(image=image, secrets=[modal.Secret.from_name("gemini-api-key")])
@modal.fastapi_endpoint(method="POST")
def search_course(data: dict) -> dict:
    """
    Search across all documents in a course.

    Args:
        store_id: Course store ID
        question: Question to search for

    Returns:
        Dict with answer and citations
    """
    from google import genai
    from google.genai import types

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"error": "GEMINI_API_KEY not configured"}

    store_id = data.get("store_id", "")
    question = data.get("question", "")

    if not store_id or not question:
        return {"error": "store_id and question are required"}

    try:
        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=question,
            config=types.GenerateContentConfig(
                tools=[types.Tool(file_search=types.FileSearch(store=store_id))]
            )
        )

        # Extract citations
        citations = []
        if hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, 'grounding_metadata') and candidate.grounding_metadata:
                metadata = candidate.grounding_metadata
                if hasattr(metadata, 'grounding_chunks') and metadata.grounding_chunks:
                    for chunk in metadata.grounding_chunks:
                        citations.append({
                            "content": chunk.text if hasattr(chunk, 'text') else "",
                            "source": chunk.source if hasattr(chunk, 'source') else ""
                        })

        return {
            "answer": response.text,
            "store_id": store_id,
            "question": question,
            "citations": citations
        }

    except Exception as e:
        return {"error": str(e)}


# =============================================================================
# DEEP RESEARCH - Premium feature
# =============================================================================

@app.function(image=image, secrets=[modal.Secret.from_name("gemini-api-key")], timeout=3600)
@modal.fastapi_endpoint(method="POST")
def deep_research(data: dict) -> dict:
    """
    Perform deep research on a topic (async, can take several minutes).

    Args:
        topic: Research topic
        wait: Whether to wait for completion (default: False)

    Returns:
        Dict with research_id (if async) or report (if wait=True)
    """
    from google import genai

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"error": "GEMINI_API_KEY not configured"}

    topic = data.get("topic", "")
    wait = data.get("wait", False)

    if not topic:
        return {"error": "No topic provided"}

    try:
        client = genai.Client(api_key=api_key)

        # Start deep research task
        interaction = client.aio.interactions.create(
            agent="deep_research",
            user_content=f"Research this topic thoroughly and provide a comprehensive report: {topic}",
            config={"background": True}
        )

        if not wait:
            return {
                "research_id": interaction.id,
                "status": "started",
                "topic": topic,
                "message": "Research started. Poll /research-status for results."
            }

        # Wait for completion (with timeout)
        max_wait = 300  # 5 minutes max wait
        start_time = time.time()

        while time.time() - start_time < max_wait:
            result = client.interactions.get(interaction.id)
            if result.status == "completed":
                return {
                    "report": result.output,
                    "topic": topic,
                    "status": "completed"
                }
            time.sleep(10)

        return {
            "research_id": interaction.id,
            "status": "in_progress",
            "message": "Research still in progress. Poll /research-status for results."
        }

    except Exception as e:
        return {"error": str(e)}


@app.function(image=image, secrets=[modal.Secret.from_name("gemini-api-key")])
@modal.fastapi_endpoint(method="POST")
def research_status(data: dict) -> dict:
    """
    Check status of a deep research task.

    Args:
        research_id: Research task ID

    Returns:
        Dict with status and optional report
    """
    from google import genai

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"error": "GEMINI_API_KEY not configured"}

    research_id = data.get("research_id", "")

    if not research_id:
        return {"error": "No research_id provided"}

    try:
        client = genai.Client(api_key=api_key)

        result = client.interactions.get(research_id)

        if result.status == "completed":
            return {
                "status": "completed",
                "report": result.output,
                "research_id": research_id
            }
        else:
            return {
                "status": result.status,
                "research_id": research_id
            }

    except Exception as e:
        return {"error": str(e)}


# =============================================================================
# LEGACY ENDPOINT (for backward compatibility)
# =============================================================================

@app.function(image=image, secrets=[modal.Secret.from_name("gemini-api-key")])
@modal.fastapi_endpoint(method="POST")
def search(data: dict) -> dict:
    """
    Legacy search endpoint - now redirects to generate with Google Search.
    Kept for backward compatibility.
    """
    import sys
    sys.path.insert(0, "/root")
    from llm import generate_answer
    query = data.get("query", "")
    # Return minimal response for backward compatibility
    return {
        "results": [],
        "total": 0,
        "reliable_count": 0,
        "message": "Search is now integrated into /generate endpoint"
    }
