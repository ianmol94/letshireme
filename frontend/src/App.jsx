import { useEffect, useRef, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
// Edit this to your name, or set VITE_CANDIDATE_NAME in your .env
const CANDIDATE_NAME = import.meta.env.VITE_CANDIDATE_NAME || 'Anmol Singh'

const STARTER_PROMPTS = [
  'What projects have you worked on?',
  'What are your strongest technical skills?',
  'Why should we hire you?',
]

function Seal() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <circle cx="17" cy="17" r="16" stroke="var(--gold)" strokeWidth="1.2" />
      <circle cx="17" cy="17" r="12.5" stroke="var(--gold)" strokeWidth="0.6" strokeDasharray="1.5 2.5" />
      <path d="M11 17.5L15 21.5L23 12.5" stroke="var(--gold)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Ask me anything about ${CANDIDATE_NAME}'s background, projects, or skills — I'll answer straight from the resume.`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [waking, setWaking] = useState(false)
  const [error, setError] = useState(null)
  const scrollRef = useRef(null)

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

  return (
    <div className="page">
      <header className="masthead">
        <Seal />
        <div className="masthead-text">
          <p className="eyebrow">Candidate Q&amp;A</p>
          <h1>{CANDIDATE_NAME}</h1>
        </div>
      </header>

      <main className="chat-panel">
        <div className="transcript" ref={scrollRef}>
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

        {messages.length === 1 && (
          <div className="starters">
            {STARTER_PROMPTS.map((p) => (
              <button key={p} className="starter-chip" onClick={() => sendMessage(p)}>
                {p}
              </button>
            ))}
          </div>
        )}

        <form className="composer" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question…"
            aria-label="Ask a question about the resume"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            Ask
          </button>
        </form>
      </main>

      <footer className="foot-note">Answers are generated from a resume on file — verify specifics in an interview.</footer>
    </div>
  )
}
