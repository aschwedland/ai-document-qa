import { useState } from 'react'
import DocumentPanel from './components/DocumentPanel'
import ChatPanel from './components/ChatPanel'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function App() {
  const [documentText, setDocumentText] = useState('')
  const [documentMeta, setDocumentMeta] = useState(null) // { filename, pageCount, charCount, truncated }
  const [messages, setMessages] = useState([]) // [{ role, content }]
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('upload') // "upload" | "paste"

  // UI-only state (not in the core spec, but needed for a real app).
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [pasteValue, setPasteValue] = useState('')
  const [askError, setAskError] = useState('')

  async function handleFileUpload(file) {
    if (!file) return
    setUploadError('')
    setIsUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${API_URL}/extract-pdf`, { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Something went wrong extracting the PDF.')
      }
      const data = await res.json()
      setDocumentText(data.text)
      setDocumentMeta({
        filename: data.filename,
        pageCount: data.page_count,
        charCount: data.char_count,
        truncated: data.truncated,
      })
      setMessages([])
      setAskError('')
    } catch (e) {
      setUploadError(e.message)
    } finally {
      setIsUploading(false)
    }
  }

  function handlePasteLoad() {
    const text = pasteValue.trim()
    if (!text) return
    setDocumentText(text)
    setDocumentMeta({
      filename: 'Pasted text',
      pageCount: null,
      charCount: text.length,
      truncated: false,
    })
    setMessages([])
    setAskError('')
  }

  function handleChangeDocument() {
    setDocumentText('')
    setDocumentMeta(null)
    setMessages([])
    setPasteValue('')
    setUploadError('')
    setAskError('')
    setActiveTab('upload')
  }

  async function handleAsk() {
    const question = inputValue.trim()
    if (!question || isLoading || !documentText) return
    setAskError('')

    const history = messages // history is everything before this question
    const optimistic = [...messages, { role: 'user', content: question }]
    setMessages(optimistic)
    setInputValue('')
    setIsLoading(true)

    try {
      const res = await fetch(`${API_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document: documentText, question, history }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'The request failed. Please try again.')
      }
      const data = await res.json()
      setMessages([...optimistic, { role: 'assistant', content: data.answer }])
    } catch (e) {
      setAskError(e.message)
      setMessages(optimistic) // keep the user's question visible
    } finally {
      setIsLoading(false)
    }
  }

  function handleClearConversation() {
    setMessages([])
    setAskError('')
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">C</span>
          <div>
            <div className="brand-name">DocQuery AI</div>
            <div className="brand-tagline">Chat with your documents — powered by Claude</div>
          </div>
        </div>
      </header>

      <main className="app-card">
        <DocumentPanel
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          documentMeta={documentMeta}
          documentText={documentText}
          onFileUpload={handleFileUpload}
          isUploading={isUploading}
          uploadError={uploadError}
          pasteValue={pasteValue}
          setPasteValue={setPasteValue}
          onPasteLoad={handlePasteLoad}
          onChangeDocument={handleChangeDocument}
        />
        <ChatPanel
          documentText={documentText}
          messages={messages}
          inputValue={inputValue}
          setInputValue={setInputValue}
          isLoading={isLoading}
          askError={askError}
          onAsk={handleAsk}
          onClearConversation={handleClearConversation}
        />
      </main>
    </div>
  )
}
