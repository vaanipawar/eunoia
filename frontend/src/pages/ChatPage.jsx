import { useState, useEffect, useRef } from 'react'
import { sendMessageAPI, getSessionsAPI } from '../api/endpoints'
import { useAuth } from '../store/useAuth'
import { Send, ChevronDown, CheckCircle } from 'lucide-react'

const STRESS_COLORS = {
  low:    { bg: 'var(--green-light)',  text: 'var(--green)',  label: 'Low stress' },
  medium: { bg: 'var(--amber-light)', text: 'var(--amber)',  label: 'Moderate stress' },
  high:   { bg: 'var(--red-light)',   text: 'var(--red)',    label: 'High stress' },
}

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
    // Load past sessions
    getSessionsAPI().then(r => setSessions(r.data)).catch(() => {})

    // Greeting message
    setMessages([{
      role: 'assistant',
      content: `Hi ${user?.full_name?.split(' ')[0] || 'there'} 😊 I'm Eunoia, your well-being companion. How are you feeling today?`,
      time: new Date(),
    }])
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')

    const userMsg = { role: 'user', content: text, time: new Date() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await sendMessageAPI(text, sessionId)
      const { reply, stress_level, session_id, intake_complete, mentor_assigned } = res.data

      setSessionId(session_id)
      setStressLevel(stress_level)
      if (intake_complete) setIntakeComplete(true)
      if (mentor_assigned?.assigned) setMentorAssigned(mentor_assigned)

      setMessages(prev => [...prev, {
        role: 'assistant', content: reply, time: new Date(),
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        time: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const sc = STRESS_COLORS[stressLevel] || STRESS_COLORS.low

  return (
    <div style={{ display: 'flex', gap: 24, height: 'calc(100vh - 72px)' }}>
      {/* Chat panel */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        background: 'white', borderRadius: 16, border: '1px solid var(--border)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 22px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, background: 'var(--sage-light)',
              borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 18,
            }}>🌿</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Eunoia</div>
              <div style={{ fontSize: 12, color: 'var(--sage)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, background: 'var(--green)', borderRadius: '50%', display: 'inline-block' }} />
                Online · Always here for you
              </div>
            </div>
          </div>

          {/* Stress level badge */}
          <div style={{
            background: sc.bg, color: sc.text,
            padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
          }}>
            {sc.label}
          </div>
        </div>

        {/* Mentor assigned banner */}
        {mentorAssigned && (
          <div style={{
            background: '#EFF6FF', borderBottom: '1px solid #BFDBFE',
            padding: '12px 22px', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <CheckCircle size={16} color="#2563EB" />
            <span style={{ fontSize: 13, color: '#1D4ED8' }}>
              Mentor <strong>{mentorAssigned.mentor_name}</strong> has been assigned and notified. They'll be in touch soon.
            </span>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              alignItems: 'flex-end', gap: 8,
            }}>
              {msg.role === 'assistant' && (
                <div style={{
                  width: 28, height: 28, background: 'var(--sage-light)',
                  borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 14, flexShrink: 0,
                }}>🌿</div>
              )}
              <div style={{
                maxWidth: '72%',
                background: msg.role === 'user' ? 'var(--sage-dark)' : 'var(--cream)',
                color: msg.role === 'user' ? 'white' : 'var(--ink)',
                padding: '11px 15px', borderRadius: msg.role === 'user'
                  ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                fontSize: 14, lineHeight: 1.6, border: '1px solid var(--border)',
                borderColor: msg.role === 'user' ? 'transparent' : 'var(--border)',
              }}>
                {msg.content}
                <div style={{
                  fontSize: 10, marginTop: 5, opacity: 0.6, textAlign: 'right',
                }}>
                  {msg.time?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, background: 'var(--sage-light)',
                borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 14,
              }}>🌿</div>
              <div style={{
                background: 'var(--cream)', border: '1px solid var(--border)',
                borderRadius: '16px 16px 16px 4px', padding: '11px 16px',
                display: 'flex', gap: 4, alignItems: 'center',
              }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: 6, height: 6, background: 'var(--muted)', borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'bounce 1.2s infinite',
                    animationDelay: `${i * 0.2}s`,
                  }} />
                ))}
              </div>
            </div>
          )}

          {/* Session closed */}
          {intakeComplete && (
            <div style={{
              textAlign: 'center', padding: '16px',
              background: 'var(--green-light)', borderRadius: 10,
              fontSize: 13, color: 'var(--green)',
            }}>
              ✅ Session completed. Your information has been securely recorded.
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {!intakeComplete && (
          <div style={{
            padding: '14px 18px', borderTop: '1px solid var(--border)',
            display: 'flex', gap: 10, alignItems: 'flex-end',
          }}>
            <textarea
              value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Share what's on your mind… (Enter to send)"
              rows={1} disabled={loading}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 10,
                border: '1px solid var(--border)', fontSize: 14,
                fontFamily: 'var(--font-sans)', resize: 'none',
                background: 'var(--cream)', outline: 'none',
                lineHeight: 1.5, maxHeight: 100, overflowY: 'auto',
              }}
            />
            <button
              onClick={sendMessage} disabled={!input.trim() || loading}
              style={{
                width: 40, height: 40, borderRadius: 10,
                background: input.trim() ? 'var(--sage-dark)' : 'var(--border)',
                border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background .15s',
              }}
            >
              <Send size={16} color="white" />
            </button>
          </div>
        )}
      </div>

      {/* Sessions sidebar */}
      <div style={{
        width: 260, display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <div style={{
          background: 'white', borderRadius: 14, border: '1px solid var(--border)',
          padding: '16px 18px',
        }}>
          <button
            onClick={() => setShowSessions(!showSessions)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 600, color: 'var(--ink)',
            }}
          >
            Past sessions
            <ChevronDown size={16} style={{ transform: showSessions ? 'rotate(180deg)' : 'none', transition: '.2s' }} />
          </button>

          {showSessions && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sessions.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>No previous sessions</p>
              )}
              {sessions.map(s => (
                <div key={s.session_id} style={{
                  padding: '10px 12px', borderRadius: 8,
                  background: 'var(--cream)', border: '1px solid var(--border)', fontSize: 13,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>
                      {new Date(s.started_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                    <span style={{
                      fontSize: 11, padding: '2px 7px', borderRadius: 10,
                      background: STRESS_COLORS[s.stress_level]?.bg || 'var(--sage-light)',
                      color: STRESS_COLORS[s.stress_level]?.text || 'var(--sage-dark)',
                    }}>{s.stress_level || 'low'}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'capitalize' }}>
                    {s.status} {s.mentor_assigned ? '· Mentor assigned ✓' : ''}
                  </div>
                  {s.summary?.primary_concern && (
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, fontStyle: 'italic' }}>
                      "{s.summary.primary_concern}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resources */}
        <div style={{
          background: 'white', borderRadius: 14, border: '1px solid var(--border)',
          padding: '16px 18px',
        }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Crisis resources</h4>
          {[
            { name: 'iCall (India)', contact: '9152987821' },
            { name: 'Vandrevala Foundation', contact: '1860-2662-345' },
            { name: 'AASRA', contact: '9820466627' },
          ].map(r => (
            <div key={r.name} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{r.name}</div>
              <div style={{ fontSize: 12, color: 'var(--sage-dark)', fontWeight: 600 }}>{r.contact}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  )
}