import { useEffect, useRef, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const CANDIDATE_NAME = import.meta.env.VITE_CANDIDATE_NAME || 'Anmol Singh'

const STARTER_PROMPTS = [
  'What projects have you worked on?',
  'What are your strongest technical skills?',
  'Why should we hire you?',
]

function Seal() {
  return (
    <svg width="30" height="30" viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <circle cx="17" cy="17" r="16" stroke="var(--gold)" strokeWidth="1.2" />
      <circle cx="17" cy="17" r="12.5" stroke="var(--gold)" strokeWidth="0.6" strokeDasharray="1.5 2.5" />
      <path d="M11 17.5L15 21.5L23 12.5" stroke="var(--gold)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [waking, setWaking] = useState(false)
  const [error, setError] = useState(null)
  const scrollRef = useRef(null)

  const started = messages.length > 0

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(question) {
    const q = question.trim()
    if (!q || loading) return

    setMessages((prev) => [...prev, { role: 'user', text: q }])
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
      setMessages((prev) => [...prev, { role: 'assistant', text: data.answer }])
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

  // Landing view: centered, like Claude's empty-chat screen
  if (!started) {
    return (
      <div className="landing">
        <Seal />
        <p className="eyebrow">Candidate Q&amp;A</p>
        <h1>{CANDIDATE_NAME}</h1>
        <p className="landing-sub">
          Ask me anything about {CANDIDATE_NAME}'s background, projects, or skills —
          I'll answer straight from the resume.
        </p>

        <div className="landing-composer">{composer}</div>

        <div className="starters">
          {STARTER_PROMPTS.map((p) => (
            <button key={p} className="starter-chip" onClick={() => sendMessage(p)}>
              {p}
            </button>
          ))}
        </div>

        {error && <div className="error-note">{error}</div>}
      </div>
    )
  }

  // Chat view: messages fill the page, composer pinned to bottom
  return (
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
          {messages.map((m, i) => (
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
        <p className="foot-note">Answers are generated from a resume on file — verify specifics in an interview.</p>
      </div>
    </div>
  )
}