import { useRef, useState } from 'react'

function formatCount(n) {
  return n.toLocaleString()
}

export default function DocumentPanel({
  activeTab,
  setActiveTab,
  documentMeta,
  documentText,
  onFileUpload,
  isUploading,
  uploadError,
  pasteValue,
  setPasteValue,
  onPasteLoad,
  onChangeDocument,
}) {
  const fileInputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const loaded = !!documentMeta

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFileUpload(file)
  }

  return (
    <section className="doc-panel">
      <h2 className="panel-title">Your Document</h2>

      {!loaded && (
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'upload' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload PDF
          </button>
          <button
            className={`tab ${activeTab === 'paste' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('paste')}
          >
            Paste Text
          </button>
        </div>
      )}

      {/* Upload tab */}
      {!loaded && activeTab === 'upload' && (
        <div className="doc-panel-body">
          <div
            className={`dropzone ${dragOver ? 'dropzone-active' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            {isUploading ? (
              <>
                <div className="spinner" />
                <div className="dropzone-text">Extracting text…</div>
              </>
            ) : (
              <>
                <UploadIcon />
                <div className="dropzone-text">Drop a PDF here or click to browse</div>
                <div className="dropzone-hint">Max 10MB</div>
              </>
            )}
          </div>
          <button
            className="link-btn center"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            Or browse files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            hidden
            onChange={(e) => {
              onFileUpload(e.target.files?.[0])
              e.target.value = '' // allow re-selecting the same file
            }}
          />
          {uploadError && <div className="error-banner">{uploadError}</div>}
        </div>
      )}

      {/* Paste tab */}
      {!loaded && activeTab === 'paste' && (
        <div className="doc-panel-body">
          <textarea
            className="paste-area"
            placeholder="Paste your document text here…"
            value={pasteValue}
            onChange={(e) => setPasteValue(e.target.value)}
          />
          <button className="btn-primary full" onClick={onPasteLoad} disabled={!pasteValue.trim()}>
            Load Document
          </button>
        </div>
      )}

      {/* Loaded state */}
      {loaded && (
        <div className="doc-panel-body">
          <div className="doc-card">
            <div className="doc-icon">
              <FileIcon />
            </div>
            <div className="doc-card-body">
              <div className="doc-name" title={documentMeta.filename}>
                {documentMeta.filename}
              </div>
              <div className="doc-meta-row">
                <span className="doc-meta">
                  {documentMeta.pageCount != null ? `${documentMeta.pageCount} pages · ` : ''}
                  {formatCount(documentMeta.charCount)} chars
                </span>
                <span className="badge-loaded">
                  <CheckIcon /> Loaded
                </span>
              </div>
              <button className="link-btn" onClick={onChangeDocument}>
                Change document
              </button>
            </div>
          </div>

          {documentMeta.truncated && (
            <div className="warn-banner">
              This document was truncated to 180,000 characters so it fits the model's context window.
            </div>
          )}

          <div className="preview">
            <div className="preview-label">Preview</div>
            <div className="preview-box">
              {documentText.slice(0, 320)}
              {documentText.length > 320 ? '…' : ''}
            </div>
          </div>

          <div className="doc-footer">
            {formatCount(documentMeta.charCount)} characters ready to query
          </div>
        </div>
      )}
    </section>
  )
}

function UploadIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M13 33a8 8 0 0 1-1-15.9A11 11 0 0 1 34 16.5 7.5 7.5 0 0 1 36 31"
        stroke="#9CA3AF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 24v13M18.5 29.5L24 24l5.5 5.5"
        stroke="#9CA3AF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg width="20" height="24" viewBox="0 0 20 24" fill="none" aria-hidden="true">
      <path
        d="M3 1h9l5 5v15a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2z"
        fill="#fff"
        stroke="#DC2626"
        strokeWidth="1.5"
      />
      <path d="M12 1v5h5" stroke="#DC2626" strokeWidth="1.5" fill="none" />
      <text
        x="10"
        y="19"
        fontFamily="Inter, sans-serif"
        fontSize="6"
        fontWeight="700"
        fill="#DC2626"
        textAnchor="middle"
      >
        PDF
      </text>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2.5 6.5l2.5 2.5 4.5-5"
        stroke="#15803D"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
