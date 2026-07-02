# DocQuery AI

Upload a PDF or paste in some text, then have a natural back-and-forth conversation
with that document. Ask what the payment terms are, whether there's a termination
clause, what the main findings were — and get concise, grounded answers with the
exact supporting quote pulled straight from your document. It's a focused reading
assistant: it only answers from what you gave it, and it tells you plainly when the
answer isn't there.

## How it works — no embeddings, no vector database

Most "chat with your document" tools chop the document into fragments, turn each one
into an embedding, store them in a vector database, and retrieve a handful of
fragments per question. DocQuery AI skips all of that. It hands the **entire
document** to Claude as context and lets Claude's long context window do the reading.

That means:

- **Simpler.** No embedding pipeline, no vector store, no chunk-and-retrieve step to
  tune or get wrong.
- **More coherent.** Claude sees the whole document at once, so it can reason across
  sections instead of stitching together isolated snippets.
- **Cheaper on repeat questions.** The document is sent in a cached system prompt, so
  every follow-up question about the same document reads it from cache instead of
  reprocessing the full text.

The trade-off is document size: very large documents are truncated to 180,000
characters (roughly a short book). For typical contracts, manuals, and reports,
the whole thing fits comfortably.

## Architecture

```
frontend/  React + Vite single-page app (two-panel layout)
backend/   FastAPI service that extracts PDF text and calls Claude
```

- **`POST /extract-pdf`** — accepts a PDF upload, extracts its text with `pypdf`,
  returns the text plus page and character counts.
- **`POST /ask`** — takes the document text, the current question, and the
  conversation history, and returns Claude's answer.

## Local setup

You'll need Python 3.10+ and Node 18+.

### 1. Backend

```bash
cd backend
python -m venv .venv
# Windows:  .venv\Scripts\activate
# macOS/Linux:  source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env        # then edit .env and add your ANTHROPIC_API_KEY
uvicorn main:app --reload --port 8000
```

The API is now running at `http://localhost:8000`.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install

cp .env.example .env        # VITE_API_URL defaults to http://localhost:8000
npm run dev
```

Open `http://localhost:5173`.

## Environment variables

**Backend**

| Variable            | Required | Description                                              |
| ------------------- | -------- | ------------------------------------------------------- |
| `ANTHROPIC_API_KEY` | Yes      | Your Anthropic API key.                                 |
| `FRONTEND_URL`      | No       | Deployed frontend URL, added to the CORS allowlist.     |

**Frontend**

| Variable       | Required | Description                                              |
| -------------- | -------- | ------------------------------------------------------- |
| `VITE_API_URL` | Yes      | Base URL of the backend (e.g. `http://localhost:8000`). |

## Good documents to try

- **A short contract** — ask about payment terms, termination clauses, or liability.
  Great for showing the exact-quote answers.
- **A product manual** — ask "how do I reset it?" or "what's the warranty period?"
- **A research summary or paper abstract** — ask for the key findings, the sample
  size, or the limitations the authors mention.

Then try asking something the document _doesn't_ cover — it will tell you it doesn't
see that information rather than making something up.

## Deployment

Both services are configured for [Railway](https://railway.app) via the `railway.toml`
files in each directory.

1. Push to GitHub: `git push`
2. Set environment variables in Railway:
   - Backend service: `ANTHROPIC_API_KEY`, `FRONTEND_URL`
   - Frontend service: `VITE_API_URL`
3. Redeploy both services.
