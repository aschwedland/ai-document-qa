// Splits assistant content into text segments and [Quote: "..."] blocks.
// Handles both straight (") and curly (“ ”) quotation marks.
function parseContent(content) {
  const regex = /\[Quote:\s*["“]([\s\S]*?)["”]\]/g
  const parts = []
  let lastIndex = 0
  let match

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: content.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'quote', value: match[1] })
    lastIndex = regex.lastIndex
  }
  if (lastIndex < content.length) {
    parts.push({ type: 'text', value: content.slice(lastIndex) })
  }
  return parts
}

export default function MessageBubble({ role, content }) {
  if (role === 'user') {
    return (
      <div className="msg-user">
        <div className="msg-user-bubble">{content}</div>
      </div>
    )
  }

  const parts = parseContent(content)

  return (
    <div className="msg-assistant">
      <div className="avatar">C</div>
      <div className="msg-assistant-bubble">
        {parts.map((part, i) => {
          if (part.type === 'quote') {
            return (
              <blockquote key={i} className="msg-quote">
                “{part.value.trim()}”
              </blockquote>
            )
          }
          const text = part.value.trim()
          return text ? (
            <div key={i} className="msg-text">
              {text}
            </div>
          ) : null
        })}
      </div>
    </div>
  )
}
