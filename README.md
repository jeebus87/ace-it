# Ace-It Study Assistant

AI-powered study assistant that searches reliable sources, generates expert answers, creates educational visuals, and tests your mastery with quizzes.

## Architecture

- **Frontend**: Next.js 15 on Vercel
- **Backend**: Modal (serverless Python)
- **AI**: Google Gemini API
- **Search**: DuckDuckGo

## Features

- Web search with reliability filtering (prioritizes .edu, .gov, Wikipedia, etc.)
- Expert-level answers with ELI5 explanations
- AI-generated educational visuals
- 10-question mastery quizzes (100% required)
- Mobile-friendly responsive design

## Setup

### Backend (Modal)

```bash
cd backend
pip install modal
modal token new
modal secret create gemini-api-key GEMINI_API_KEY=<your-key>
modal deploy main.py
```

### Frontend (Vercel)

```bash
cd frontend
npm install
npm run dev
```

Set `MODAL_API_URL` environment variable to your Modal deployment URL.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key (Modal secret) |
| `MODAL_API_URL` | Modal backend URL (Vercel env) |

## License

MIT
