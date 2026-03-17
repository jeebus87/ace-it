"""
Ace-It Backend - Modal serverless functions for study assistance.
"""

import modal

app = modal.App("ace-it-backend")

# Shared image with all dependencies
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "google-genai",
        "ddgs",
        "pydantic",
        "fastapi[standard]",
    )
    .add_local_file("search.py", "/root/search.py")
    .add_local_file("llm.py", "/root/llm.py")
    .add_local_file("quiz.py", "/root/quiz.py")
    .add_local_file("image_gen.py", "/root/image_gen.py")
)


@app.function(image=image, secrets=[modal.Secret.from_name("gemini-api-key")])
@modal.fastapi_endpoint(method="POST")
def search(data: dict) -> dict:
    """Search the web using DuckDuckGo."""
    import sys
    sys.path.insert(0, "/root")
    from search import perform_search
    query = data.get("query", "")
    return perform_search(query)


@app.function(image=image, secrets=[modal.Secret.from_name("gemini-api-key")])
@modal.fastapi_endpoint(method="POST")
def generate(data: dict) -> dict:
    """Generate an answer using Gemini."""
    import sys
    sys.path.insert(0, "/root")
    from llm import generate_answer
    question = data.get("question", "")
    context = data.get("context", "")
    return generate_answer(question, context)


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
    """Generate a 10-question mastery quiz with difficulty selection."""
    import sys
    sys.path.insert(0, "/root")
    from quiz import generate_quiz
    question = data.get("question", "")
    answer = data.get("answer", "")
    difficulty = data.get("difficulty", "intermediate")
    return generate_quiz(question, answer, difficulty)
