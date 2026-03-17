"""
Ace-It Backend - Modal serverless functions for study assistance.
"""

import modal

app = modal.App("ace-it-backend")

# Shared image with all dependencies
image = modal.Image.debian_slim(python_version="3.11").pip_install(
    "google-genai",
    "ddgs",
    "pydantic",
)


@app.function(image=image, secrets=[modal.Secret.from_name("gemini-api-key")])
@modal.web_endpoint(method="POST")
def search(data: dict) -> dict:
    """Search the web using DuckDuckGo."""
    from search import perform_search
    query = data.get("query", "")
    return perform_search(query)


@app.function(image=image, secrets=[modal.Secret.from_name("gemini-api-key")])
@modal.web_endpoint(method="POST")
def generate(data: dict) -> dict:
    """Generate an answer using Gemini."""
    from llm import generate_answer
    question = data.get("question", "")
    context = data.get("context", "")
    return generate_answer(question, context)


@app.function(image=image, secrets=[modal.Secret.from_name("gemini-api-key")])
@modal.web_endpoint(method="POST")
def image_gen(data: dict) -> dict:
    """Generate an educational image using Gemini."""
    from image_gen import generate_image
    question = data.get("question", "")
    summary = data.get("summary", "")
    return generate_image(question, summary)


@app.function(image=image, secrets=[modal.Secret.from_name("gemini-api-key")])
@modal.web_endpoint(method="POST")
def quiz(data: dict) -> dict:
    """Generate a 10-question mastery quiz."""
    from quiz import generate_quiz
    question = data.get("question", "")
    answer = data.get("answer", "")
    return generate_quiz(question, answer)
