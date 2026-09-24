import { useState, useEffect, useRef } from 'react'
import { sendMessageAPI, getSessionsAPI } from '../api/endpoints'
import { useAuth } from '../store/useAuth'
import { Send, ChevronDown, CheckCircle, Phone } from 'lucide-react'

const STRESS = {
  low: 'Low stress',
  medium: 'Moderate stress',
  high: 'High stress',
}

const RESOURCES = [
  { name: 'iCall (India)', contact: '9152987821', tel: '9152987821' },
  { name: 'Vandrevala Foundation', contact: '1860-2662-345', tel: '18602662345' },
  { name: 'AASRA', contact: '9820466627', tel: '9820466627' },
]

const firstName = (full = '') => {
  const f = full.split(/[\s._]+/)[0]
  return f ? f[0].toUpperCase() + f.slice(1) : ''
}

const fmtTime = (d) => d?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

export default function ChatPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [stressLevel, setStressLevel] = useState('low')
  const [intakeComplete, setIntakeComplete] = useState(false)
  const [mentorAssigned, setMentorAssigned] = useState(null)
  const [sessions, setSessions] = useState([])
  const [showSessions, setShowSessions] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    getSessionsAPI().then(r => setSessions(r.data)).catch(() => {})
    const name = firstName(user?.full_name)
    setMessages([{
      role: 'assistant',
      content: `Hi${name ? ` ${name}` : ''}. I’m Eunoia. How are you feeling today?`,
      time: new Date(),
    }])
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, loading])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: text, time: new Date() }])
    setLoading(true)

    try {
      const res = await sendMessageAPI(text, sessionId)
      const { reply, stress_level, session_id, intake_complete, mentor_assigned } = res.data
      setSessionId(session_id)
      setStressLevel(stress_level)
      if (intake_complete) setIntakeComplete(true)
      if (mentor_assigned?.assigned) setMentorAssigned(mentor_assigned)
      setMessages(prev => [...prev, { role: 'assistant', content: reply, time: new Date() }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I’m having trouble connecting right now. Please try again in a moment.',
        time: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const level = STRESS[stressLevel] ? stressLevel : 'low'

  return (
    <div className="chat">
      <section className="chat-main" aria-label="Conversation with Eunoia">
        <header className="chat-head">
          <div>
            <h1>Talk to Eunoia</h1>
            <p className="muted" style={{ fontSize: 13 }}>Private to you and your assigned mentor.</p>
          </div>
          <span className={`risk risk-${level}`}>{STRESS[level]}</span>
        </header>

        {mentorAssigned && (
          <div className="banner" role="status">
            <CheckCircle size={17} strokeWidth={1.75} style={{ flex: 'none', marginTop: 2 }} aria-hidden="true" />
            <span>
              <strong>{mentorAssigned.mentor_name}</strong> has been assigned as your mentor and notified.
              They will be in touch soon.
            </span>
          </div>
        )}

        <div className="chat-log" role="log" aria-live="polite">
          {messages.map((msg, i) => (
            <div key={i} className={`msg ${msg.role === 'user' ? 'msg-u' : 'msg-a'}`}>
              {msg.role === 'assistant' && <div className="msg-from">Eunoia</div>}
              <div className="msg-body">{msg.content}</div>
              <div className="msg-time">{fmtTime(msg.time)}</div>
            </div>
          ))}

          {loading && (
            <div className="msg msg-a" aria-label="Eunoia is typing">
              <div className="msg-from">Eunoia</div>
              <div className="typing">
                {[0, 1, 2].map(i => <span key={i} style={{ animationDelay: `${i * 0.2}s` }} />)}
              </div>
            </div>
          )}

          {intakeComplete && (
            <div className="banner" role="status">
              <CheckCircle size={17} strokeWidth={1.75} style={{ flex: 'none', marginTop: 2 }} aria-hidden="true" />
              <span>This session is complete. What you shared has been recorded securely.</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {!intakeComplete && (
          <div className="chat-input">
            <label htmlFor="chat-text" className="sr-only">Your message</label>
            <textarea
              id="chat-text" className="field" rows={1}
              value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Say what’s on your mind. Enter to send."
              disabled={loading}
            />
            <button
              className="btn btn-icon" onClick={sendMessage}
              disabled={!input.trim() || loading} aria-label="Send message"
            >
              <Send size={17} strokeWidth={1.75} />
            </button>
          </div>
        )}
      </section>

      <aside className="chat-rail">
        <section aria-labelledby="help-title">
          <h2 id="help-title" className="section-title">If you need to talk to someone now</h2>
          <ul className="help-list">
            {RESOURCES.map(r => (
              <li key={r.name}>
                <span>{r.name}</span>
                <a href={`tel:${r.tel}`}><Phone size={14} strokeWidth={1.75} aria-hidden="true" /> {r.contact}</a>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <button
            className="rail-toggle" onClick={() => setShowSessions(s => !s)}
            aria-expanded={showSessions}
          >
            Past sessions
            <ChevronDown size={17} strokeWidth={1.75} style={{ transform: showSessions ? 'rotate(180deg)' : 'none' }} />
          </button>

          {showSessions && (
            <div style={{ marginTop: 12 }}>
              {sessions.length === 0 && <p className="muted" style={{ fontSize: 14 }}>No previous sessions.</p>}
              {sessions.map(s => (
                <div key={s.session_id} className="sess">
                  <div className="sess-top">
                    <strong>
                      {new Date(s.started_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </strong>
                    <span className={`risk risk-${STRESS[s.stress_level] ? s.stress_level : 'low'}`}>
                      {STRESS[s.stress_level] || STRESS.low}
                    </span>
                  </div>
                  <div className="muted" style={{ textTransform: 'capitalize' }}>
                    {s.status}{s.mentor_assigned ? ' · Mentor assigned' : ''}
                  </div>
                  {s.summary?.primary_concern && <div className="muted">“{s.summary.primary_concern}”</div>}
                </div>
              ))}
            </div>
          )}
        </section>
      </aside>
    </div>
  )
}