import io
import os

from anthropic import Anthropic
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader

load_dotenv()

# Model per the project spec. claude-sonnet-5 is the current Sonnet alias if you
# want to upgrade — the request shape below is unchanged.
MODEL = "claude-sonnet-4-5"
MAX_DOC_CHARS = 180_000

app = FastAPI(title="DocQuery AI")

# CORS: local dev + the deployed frontend (set via FRONTEND_URL).
allowed_origins = ["http://localhost:5173"]
frontend_url = os.getenv("FRONTEND_URL", "").strip()
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Claude reads ANTHROPIC_API_KEY from the environment.
client = Anthropic()

SYSTEM_PROMPT_TEMPLATE = """You are a precise document analyst. You have been given a document to analyze. Answer questions based ONLY on the content of this document.

Rules:
1. If the answer is clearly in the document, answer directly and include a brief relevant quote from the document in this format: [Quote: "...exact text from document..."]
2. If you're inferring or the document only partially covers it, say so clearly before answering.
3. If the answer is not in the document at all, say: "I don't see that information in this document."
4. Keep answers concise — 2–4 sentences plus the quote.
5. Write in plain prose. Do not use Markdown formatting (no **bold**, headings, or bullet symbols) — only the [Quote: "..."] markers above.

Document:
---
{document}
---"""


class AskRequest(BaseModel):
    document: str
    question: str
    history: list[dict] = []


@app.get("/")
def health():
    return {"status": "ok", "service": "DocQuery AI"}


@app.post("/extract-pdf")
async def extract_pdf(file: UploadFile = File(...)):
    filename = file.filename or "document.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file.")

    try:
        raw = await file.read()
        reader = PdfReader(io.BytesIO(raw))
        pages = [page.extract_text() or "" for page in reader.pages]
        text = "\n\n".join(pages).strip()
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Could not read this PDF. It may be corrupted or password-protected.",
        )

    if not text:
        raise HTTPException(
            status_code=400,
            detail="No text could be extracted. This PDF may contain only scanned images.",
        )

    truncated = False
    if len(text) > MAX_DOC_CHARS:
        text = text[:MAX_DOC_CHARS]
        truncated = True

    return {
        "text": text,
        "page_count": len(reader.pages),
        "filename": filename,
        "char_count": len(text),
        "truncated": truncated,
    }


@app.post("/ask")
async def ask(req: AskRequest):
    if not req.document.strip():
        raise HTTPException(status_code=400, detail="No document loaded.")
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Please enter a question.")

    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(document=req.document)

    # Rebuild the conversation: prior turns + the current question.
    messages = []
    for turn in req.history:
        role = turn.get("role")
        content = turn.get("content", "")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": req.question})

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=1024,
            # The document sits in a stable system prefix, so we cache it: every
            # follow-up question about the same document reads from cache (~90%
            # cheaper on the document tokens) instead of reprocessing it.
            system=[
                {
                    "type": "text",
                    "text": system_prompt,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=messages,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"The AI request failed: {e}")

    answer = "".join(block.text for block in response.content if block.type == "text")
    return {"answer": answer}
