import { useEffect, useRef, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const CANDIDATE_NAME = import.meta.env.VITE_CANDIDATE_NAME || 'Anmol Singh'
const STORAGE_KEY = 'letshire_conversations'

const STARTER_PROMPTS = [
  'What projects have you worked on?',
  'What are your strongest technical skills?',
  'Why should we hire you?',
]

function Seal({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <circle cx="17" cy="17" r="16" stroke="var(--gold)" strokeWidth="1.2" />
      <circle cx="17" cy="17" r="12.5" stroke="var(--gold)" strokeWidth="0.6" strokeDasharray="1.5 2.5" />
      <path d="M11 17.5L15 21.5L23 12.5" stroke="var(--gold)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 3v9m0 0l-3.5-3.5M10 12l3.5-3.5M4 15h12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DownloadResumeButton({ className }) {
  return (
    <a
      href={`${API_URL}/resume`}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
      download
    >
      <DownloadIcon />
      Download resume
    </a>
  )
}

function newConversation() {
  return {
    id: crypto.randomUUID(),
    title: 'New chat',
    messages: [],
    createdAt: Date.now(),
  }
}

function loadConversations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [newConversation()]
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length ? parsed : [newConversation()]
  } catch {
    return [newConversation()]
  }
}

export default function App() {
  const [conversations, setConversations] = useState(loadConversations)
  const [activeId, setActiveId] = useState(() => loadConversations()[0].id)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [waking, setWaking] = useState(false)
  const [error, setError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const scrollRef = useRef(null)

  const active = conversations.find((c) => c.id === activeId) || conversations[0]
  const started = active.messages.length > 0

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
  }, [conversations])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [active.messages, loading])

  function updateActive(updater) {
    setConversations((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, ...updater(c) } : c))
    )
  }

  function handleNewChat() {
    const conv = newConversation()
    setConversations((prev) => [conv, ...prev])
    setActiveId(conv.id)
    setInput('')
    setError(null)
  }

  function handleSelectConversation(id) {
    setActiveId(id)
    setInput('')
    setError(null)
  }

  function handleDeleteConversation(id, e) {
    e.stopPropagation()
    setConversations((prev) => {
      const rest = prev.filter((c) => c.id !== id)
      if (rest.length === 0) {
        const conv = newConversation()
        setActiveId(conv.id)
        return [conv]
      }
      if (id === activeId) setActiveId(rest[0].id)
      return rest
    })
  }

  async function sendMessage(question) {
    const q = question.trim()
    if (!q || loading) return

    const isFirstMessage = active.messages.length === 0

    updateActive((c) => ({
      messages: [...c.messages, { role: 'user', text: q }],
      title: isFirstMessage ? q.slice(0, 42) + (q.length > 42 ? '…' : '') : c.title,
    }))
    setInput('')
    setLoading(true)
    setError(null)

    const wakeTimer = setTimeout(() => setWaking(true), 4000)

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })

      if (!res.ok) throw new Error(`Server responded ${res.status}`)

      const data = await res.json()
      updateActive((c) => ({ messages: [...c.messages, { role: 'assistant', text: data.answer }] }))
    } catch (err) {
      setError('Could not reach the assistant. It may be waking up from idle — try again in a moment.')
    } finally {
      clearTimeout(wakeTimer)
      setWaking(false)
      setLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    sendMessage(input)
  }

  const composer = (
    <form className="composer" onSubmit={handleSubmit}>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={`Ask about ${CANDIDATE_NAME}'s experience…`}
        aria-label="Ask a question about the resume"
        disabled={loading}
        autoFocus
      />
      <button type="submit" disabled={loading || !input.trim()}>
        Ask
      </button>
    </form>
  )

  const sorted = [...conversations].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-top">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((s) => !s)}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          {sidebarOpen && (
            <button className="new-chat-btn" onClick={handleNewChat}>
              + New chat
            </button>
          )}
        </div>

        {sidebarOpen && (
          <div className="history-list">
            {sorted.map((c) => (
              <div
                key={c.id}
                className={`history-item ${c.id === activeId ? 'active' : ''}`}
                onClick={() => handleSelectConversation(c.id)}
              >
                <span className="history-title">{c.title}</span>
                <button
                  className="history-delete"
                  onClick={(e) => handleDeleteConversation(c.id, e)}
                  aria-label="Delete conversation"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </aside>

      <main className="main-area">
        {!started ? (
          <div className="landing">
            <Seal size={34} />
            <p className="eyebrow">Candidate Q&amp;A</p>
            <h1>{CANDIDATE_NAME}</h1>
            <p className="landing-sub">
              Ask me anything about {CANDIDATE_NAME}'s background, projects, or skills —
              I'll answer straight from the resume.
            </p>

            <div className="landing-composer">{composer}</div>

            <DownloadResumeButton className="download-btn below-composer" />

            <div className="starters">
              {STARTER_PROMPTS.map((p) => (
                <button key={p} className="starter-chip" onClick={() => sendMessage(p)}>
                  {p}
                </button>
              ))}
            </div>

            {error && <div className="error-note">{error}</div>}
          </div>
        ) : (
          <div className="chat-page">
            <header className="chat-header">
              <Seal />
              <div>
                <p className="eyebrow">Candidate Q&amp;A</p>
                <h2>{CANDIDATE_NAME}</h2>
              </div>
            </header>

            <div className="transcript" ref={scrollRef}>
              <div className="transcript-inner">
                {active.messages.map((m, i) => (
                  <div key={i} className={`bubble-row ${m.role}`}>
                    <div className="bubble">{m.text}</div>
                  </div>
                ))}

                {loading && (
                  <div className="bubble-row assistant">
                    <div className="bubble typing">
                      <span className="dot" />
                      <span className="dot" />
                      <span className="dot" />
                      {waking && <span className="waking-note">waking up the server, hang tight…</span>}
                    </div>
                  </div>
                )}

                {error && <div className="error-note">{error}</div>}
              </div>
            </div>

            <div className="composer-dock">
              <div className="composer-inner">{composer}</div>
              <DownloadResumeButton className="download-btn below-composer" />
              <p className="foot-note">Answers are generated from a resume on file — verify specifics in an interview.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}