# DocQuery AI — Claude Code Build Context

Build **"DocQuery AI"** — a demo web app that lets users upload a PDF or paste text, then have a multi-turn conversation with that document using Claude AI. No vector database, no embeddings — Claude's long context window handles the whole document. No auth, no persistence between sessions.

**Design reference:** The `design/README.md` in this repo has the claude_design MCP prompt. Run `/design-login` first, then use the MCP to pull the design. Three frames: desktop active conversation, desktop empty/upload state, mobile active state — use them as the source of truth for layout, colors, spacing, and component behavior.

---

## Repo Structure

```
ai-document-qa/
  backend/
    main.py
    requirements.txt
    Procfile
    railway.toml
    .env.example
  frontend/
    src/
      App.jsx
      components/
        DocumentPanel.jsx
        ChatPanel.jsx
        MessageBubble.jsx
        TypingIndicator.jsx
    index.html
    vite.config.js
    package.json
    railway.toml
    .env.example
  README.md
```

---

## Backend (FastAPI)

**`backend/main.py`** — two endpoints:

**`POST /extract-pdf`** — multipart file upload
- Accept PDF file via `UploadFile`
- Extract text using `pypdf` (PdfReader)
- Return: `{ "text": str, "page_count": int, "filename": str, "char_count": int }`
- If extraction fails or text is empty: return 400 with helpful error message
- If text > 180,000 characters: truncate to 180,000 and include `"truncated": true` in response

**`POST /ask`** — main Q&A endpoint
- Request body:
```python
class AskRequest(BaseModel):
    document: str          # full document text
    question: str          # current user question
    history: list[dict]    # [{"role": "user"|"assistant", "content": str}]
```
- Returns: `{ "answer": str }`
- Use `claude-sonnet-4-5` (larger context window for documents)
- System prompt:
```
You are a precise document analyst. You have been given a document to analyze. Answer questions based ONLY on the content of this document.

Rules:
1. If the answer is clearly in the document, answer directly and include a brief relevant quote from the document in this format: [Quote: "...exact text from document..."]
2. If you're inferring or the document only partially covers it, say so clearly before answering.
3. If the answer is not in the document at all, say: "I don't see that information in this document."
4. Keep answers concise — 2–4 sentences plus the quote.

Document:
---
{document}
---
```
- Build messages array: system prompt (with document injected) + history array + current question as final user message
- Pass `max_tokens=1024`

CORS: allow `FRONTEND_URL` env var + `http://localhost:5173`

**`backend/requirements.txt`:**
```
fastapi
uvicorn
anthropic
pypdf
python-multipart
pydantic
python-dotenv
```

**`backend/Procfile`:** `web: uvicorn main:app --host 0.0.0.0 --port $PORT`

**`backend/railway.toml`:**
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "uvicorn main:app --host 0.0.0.0 --port $PORT"
```

---

## Frontend (React + Vite)

**App state:**
```javascript
const [documentText, setDocumentText] = useState("")
const [documentMeta, setDocumentMeta] = useState(null) // { filename, pageCount, charCount, truncated }
const [messages, setMessages] = useState([]) // [{ role, content }]
const [inputValue, setInputValue] = useState("")
const [isLoading, setIsLoading] = useState(false)
const [activeTab, setActiveTab] = useState("upload") // "upload" | "paste"
```

**`DocumentPanel.jsx`:**
- Tab toggle: "Upload PDF" | "Paste Text"
- Upload tab: drag-and-drop zone + file input. On file drop/select: POST to `/extract-pdf` with FormData. On success: set `documentText` and `documentMeta`. Show loading state during upload.
- Paste tab: controlled textarea. "Load Document" button below: sets `documentText` from textarea value, sets basic `documentMeta` with char count.
- Document loaded state: show filename/page count card with green badge, "Change document" button that clears state and resets to upload tab
- Show truncation warning if `documentMeta.truncated === true`

**`ChatPanel.jsx`:**
- Locked overlay when `documentText === ""`
- Message list: scrollable div, auto-scroll to bottom on new message
- Renders `MessageBubble` for each message in `messages` array
- Input: text input + Ask button. On submit:
  1. Add user message to `messages` immediately
  2. Set `isLoading = true`, show `TypingIndicator`
  3. POST to `/ask` with `{ document: documentText, question: inputValue, history: messages }`
  4. On response: add assistant message to `messages`, set `isLoading = false`
- "Clear conversation" button: sets `messages = []`

**`MessageBubble.jsx`:**
- User messages: right-aligned, blue-50 bg (#EFF6FF), rounded-2xl, no avatar
- Assistant messages: left-aligned, white card, subtle shadow, blue "C" avatar circle
- Parse assistant content for `[Quote: "..."]` pattern — render quote blocks as styled blockquotes (gray-100 bg, left blue-400 border, italic text)

**`TypingIndicator.jsx`:** Three animated dots (CSS animation, staggered delay)

**`frontend/package.json`** start script: `"start": "npx serve@latest dist -l $PORT"`

**`frontend/railway.toml`:**
```toml
[build]
builder = "nixpacks"
buildCommand = "npm install && npm run build"

[deploy]
startCommand = "npx serve@latest dist -l $PORT"
```

---

## README.md

Include:
- What it does (non-technical paragraph)
- Note about the long-context approach (no embeddings — Claude reads the whole doc)
- Local setup instructions
- Env vars
- Good demo documents to test with: a short contract, a product manual, a research summary

---

## Railway Deployment (already configured)

Railway project: "DocQuery AI"
- Service `docquery-backend`: root directory = `backend`
- Service `docquery-frontend`: root directory = `frontend`

After building:
1. Push code to GitHub (`git push`)
2. Set env vars in Railway:
   - Backend: `ANTHROPIC_API_KEY`, `FRONTEND_URL`
   - Frontend: `VITE_API_URL`
3. Redeploy both services
