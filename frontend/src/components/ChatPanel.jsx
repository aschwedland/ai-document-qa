import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'

export default function ChatPanel({
  documentText,
  messages,
  inputValue,
  setInputValue,
  isLoading,
  askError,
  onAsk,
  onClearConversation,
}) {
  const scrollRef = useRef(null)
  const locked = !documentText

  // Auto-scroll to the newest message / typing indicator.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages, isLoading])

  function handleSubmit(e) {
    e.preventDefault()
    onAsk()
  }

  return (
    <section className="chat-panel">
      <div className="chat-header">
        <h2 className="panel-title">Conversation</h2>
        {!locked && messages.length > 0 && (
          <button className="link-btn muted" onClick={onClearConversation}>
            Clear
          </button>
        )}
      </div>

      {locked ? (
        <div className="chat-locked">
          <LockIcon />
          <div className="chat-locked-text">Load a document to start asking questions</div>
        </div>
      ) : (
        <>
          <div className="chat-messages" ref={scrollRef}>
            {messages.length === 0 && !isLoading && (
              <div className="chat-empty">
                <div className="chat-empty-title">Ask anything about your document</div>
                <div className="chat-empty-hint">
                  Try “What are the key terms?” or “Summarize the main points.”
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <MessageBubble key={i} role={m.role} content={m.content} />
            ))}
            {isLoading && <TypingIndicator />}
            {askError && <div className="error-banner">{askError}</div>}
          </div>

          <form className="chat-input" onSubmit={handleSubmit}>
            <div className="chat-input-row">
              <input
                className="chat-text"
                placeholder="Ask a question about your document…"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
              />
              <button
                className="btn-primary ask"
                type="submit"
                disabled={isLoading || !inputValue.trim()}
              >
                Ask
                <ArrowIcon />
              </button>
            </div>
            <div className="chat-disclaimer">Answers are based solely on the document above.</div>
          </form>
        </>
      )}
    </section>
  )
}

function LockIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="7" y="14" width="18" height="13" rx="3" stroke="#9CA3AF" strokeWidth="2" />
      <path d="M11 14v-3a5 5 0 0 1 10 0v3" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="20.5" r="1.8" fill="#9CA3AF" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 8h11M9 4l4 4-4 4"
        stroke="#fff"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
