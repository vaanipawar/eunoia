import { useEffect, useState } from 'react'
import { getMentorAssignmentsAPI, updateAssignmentAPI } from '../api/endpoints'
import { useAuth } from '../store/useAuth'
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react'

export default function MentorPortal() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [notes, setNotes] = useState({})
  const [saving, setSaving] = useState(null)

  useEffect(() => {
    getMentorAssignmentsAPI().then(r => setAssignments(r.data)).catch(() => {})
  }, [])

  const toggleExpand = (id) => setExpanded(expanded === id ? null : id)

  const saveNote = async (id) => {
    setSaving(id)
    await updateAssignmentAPI(id, { notes: notes[id] }).catch(() => {})
    setSaving(null)
  }

  const updateStatus = async (id, status) => {
    await updateAssignmentAPI(id, { status }).catch(() => {})
    setAssignments(a => a.map(x => x.id === id ? { ...x, status } : x))
  }

  const statusColor = { active: '#D97706', resolved: '#16A34A', escalated: '#DC2626' }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28 }}>Mentor Portal</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>
          Welcome, {user?.full_name}. Here are your assigned students.
        </p>
      </div>

      {/* Summary pills */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {['active', 'resolved', 'escalated'].map(s => {
          const count = assignments.filter(a => a.status === s).length
          return (
            <div key={s} style={{
              padding: '8px 18px', borderRadius: 20,
              background: `${statusColor[s]}18`,
              color: statusColor[s], fontWeight: 600, fontSize: 13,
              textTransform: 'capitalize', border: `1px solid ${statusColor[s]}40`,
            }}>
              {count} {s}
            </div>
          )
        })}
      </div>

      {assignments.length === 0 && (
        <div style={{
          background: 'white', border: '1px solid var(--border)', borderRadius: 14,
          padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 14,
        }}>
          No students assigned yet. You'll be notified when a high-risk student needs support.
        </div>
      )}

      {assignments.map(a => {
        const s = a.summary || {}
        const isOpen = expanded === a.id
        return (
          <div key={a.id} style={{
            background: 'white', border: '1px solid var(--border)',
            borderRadius: 14, marginBottom: 14, overflow: 'hidden',
          }}>
            {/* Header row */}
            <div
              onClick={() => toggleExpand(a.id)}
              style={{
                padding: '16px 22px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Avatar */}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--sage-light)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, color: 'var(--sage-dark)', fontSize: 15,
                }}>
                  {a.student_name?.charAt(0) || 'S'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{a.student_name || 'Student'}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                    Assigned {new Date(a.assigned_at).toLocaleDateString('en-IN')}
                    {s.primary_concern ? ` · ${s.primary_concern}` : ''}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: `${statusColor[a.status]}18`, color: statusColor[a.status],
                  border: `1px solid ${statusColor[a.status]}40`, textTransform: 'capitalize',
                }}>
                  {a.status}
                </span>
                {isOpen ? <ChevronUp size={16} color="var(--muted)" /> : <ChevronDown size={16} color="var(--muted)" />}
              </div>
            </div>

            {/* Expanded body */}
            {isOpen && (
              <div style={{ padding: '0 22px 20px', borderTop: '1px solid var(--border)' }}>
                {/* Summary grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16, marginBottom: 16 }}>
                  {[
                    { label: 'Stress level', value: s.stress_level || '—' },
                    { label: 'Intensity', value: s.stress_intensity || '—' },
                    { label: 'Duration', value: s.duration_feeling || '—' },
                    { label: 'Support sought', value: s.support_sought || '—' },
                    { label: 'Desired support', value: s.desired_support || '—' },
                    { label: 'Action needed', value: s.recommended_action?.replace('_', ' ') || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: 'var(--cream)', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Topics & flags */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={{ flex: 1, background: 'var(--cream)', borderRadius: 8, padding: '12px 14px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, fontWeight: 600 }}>Topics discussed</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(s.key_topics || []).map(t => (
                        <span key={t} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 20, padding: '3px 10px', fontSize: 12 }}>{t}</span>
                      ))}
                    </div>
                  </div>
                  {(s.risk_flags || []).length > 0 && (
                    <div style={{ flex: 1, background: 'var(--red-light)', borderRadius: 8, padding: '12px 14px', border: '1px solid #FECACA' }}>
                      <div style={{ fontSize: 11, color: 'var(--red)', marginBottom: 8, fontWeight: 600 }}>Risk flags</div>
                      {s.risk_flags.map(f => (
                        <div key={f} style={{ fontSize: 12, color: 'var(--red)', marginBottom: 4 }}>⚠ {f}</div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mentor notes from Claude */}
                {s.mentor_notes && (
                  <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: '#1D4ED8', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MessageSquare size={12} /> AI briefing
                    </div>
                    <p style={{ fontSize: 13, color: '#1E3A5F', lineHeight: 1.6, margin: 0 }}>{s.mentor_notes}</p>
                  </div>
                )}

                {/* Mentor own notes */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--muted)' }}>
                    Your notes
                  </label>
                  <textarea
                    rows={3} value={notes[a.id] || a.notes || ''}
                    onChange={e => setNotes(n => ({ ...n, [a.id]: e.target.value }))}
                    placeholder="Add your observations or follow-up notes…"
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 8,
                      border: '1px solid var(--border)', fontSize: 13,
                      fontFamily: 'var(--font-sans)', resize: 'vertical', outline: 'none',
                      background: 'var(--cream)',
                    }}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => saveNote(a.id)} disabled={saving === a.id} style={{
                    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    background: 'var(--sage-dark)', color: 'white', border: 'none', cursor: 'pointer',
                  }}>
                    {saving === a.id ? 'Saving…' : 'Save notes'}
                  </button>
                  {a.status === 'active' && (
                    <>
                      <button onClick={() => updateStatus(a.id, 'resolved')} style={{
                        padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        background: 'var(--green-light)', color: 'var(--green)',
                        border: '1px solid #BBF7D0', cursor: 'pointer',
                      }}>
                        Mark resolved
                      </button>
                      <button onClick={() => updateStatus(a.id, 'escalated')} style={{
                        padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        background: 'var(--red-light)', color: 'var(--red)',
                        border: '1px solid #FECACA', cursor: 'pointer',
                      }}>
                        Escalate
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}