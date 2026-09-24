import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { getMentorAssignmentsAPI, updateAssignmentAPI } from '../api/endpoints'

const STATUS = {
  active: { label: 'Active', cls: 'risk-medium' },
  resolved: { label: 'Resolved', cls: 'risk-low' },
  escalated: { label: 'Escalated', cls: 'risk-high' },
}

const pretty = (v) => (v ? String(v).replace(/_/g, ' ') : '—')

export default function MentorPortal() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [notes, setNotes] = useState({})
  const [saving, setSaving] = useState(null)
  const [saved, setSaved] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getMentorAssignmentsAPI()
      .then(r => setAssignments(r.data))
      .catch(() => setError('We couldn’t load your students. Refresh to try again.'))
      .finally(() => setLoading(false))
  }, [])

  const saveNote = async (a) => {
    setSaving(a.id); setSaved(null); setError('')
    try {
      await updateAssignmentAPI(a.id, { notes: notes[a.id] ?? a.notes ?? '' })
      setAssignments(list => list.map(x => x.id === a.id ? { ...x, notes: notes[a.id] ?? a.notes ?? '' } : x))
      setSaved(a.id)
    } catch {
      setError('Your notes weren’t saved. Please try again.')
    } finally {
      setSaving(null)
    }
  }

  const updateStatus = async (id, status) => {
    setError('')
    try {
      await updateAssignmentAPI(id, { status })
      setAssignments(list => list.map(x => x.id === id ? { ...x, status } : x))
    } catch {
      setError('The status wasn’t updated. Please try again.')
    }
  }

  const count = (s) => assignments.filter(a => a.status === s).length

  return (
    <div className="narrow-wide">
      <h1 className="page-title">My students</h1>
      <p className="muted" style={{ marginTop: 6 }}>Students assigned to you, most recent first.</p>

      <div className="counts">
        {Object.entries(STATUS).map(([key, { label }]) => (
          <div key={key}><b>{count(key)}</b><span>{label}</span></div>
        ))}
      </div>

      {error && <div className="notice notice-error" role="alert" style={{ marginTop: 24 }}>{error}</div>}

      <section className="section" style={{ marginTop: 40 }}>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : assignments.length === 0 ? (
          <p className="empty">No students assigned yet. You’ll be notified when a student needs support.</p>
        ) : (
          <ul className="cases">
            {assignments.map(a => {
              const s = a.summary || {}
              const isOpen = expanded === a.id
              const st = STATUS[a.status] || STATUS.active
              return (
                <li key={a.id} className="case">
                  <button
                    className="case-head" aria-expanded={isOpen} aria-controls={`case-${a.id}`}
                    onClick={() => setExpanded(isOpen ? null : a.id)}
                  >
                    <span>
                      <span className="case-name">{a.student_name || 'Student'}</span>
                      <span className="case-meta">
                        Assigned {new Date(a.assigned_at).toLocaleDateString('en-IN')}
                        {s.primary_concern ? ` · ${s.primary_concern}` : ''}
                      </span>
                    </span>
                    <span className="case-end">
                      <span className={`risk ${st.cls}`}>{st.label}</span>
                      <ChevronDown size={18} strokeWidth={1.75} aria-hidden="true"
                        style={{ transform: isOpen ? 'rotate(180deg)' : 'none', color: 'var(--muted)' }} />
                    </span>
                  </button>

                  {isOpen && (
                    <div id={`case-${a.id}`} className="case-body">
                      <dl className="facts">
                        {[
                          ['Stress level', s.stress_level],
                          ['Intensity', s.stress_intensity],
                          ['Duration', s.duration_feeling],
                          ['Support sought', s.support_sought],
                          ['Desired support', s.desired_support],
                          ['Action needed', s.recommended_action],
                        ].map(([label, value]) => (
                          <div key={label}><dt>{label}</dt><dd>{pretty(value)}</dd></div>
                        ))}
                      </dl>

                      {(s.key_topics || []).length > 0 && (
                        <div>
                          <h3 className="sub-label">Topics discussed</h3>
                          <div className="tags">{s.key_topics.map(t => <span key={t} className="tag">{t}</span>)}</div>
                        </div>
                      )}

                      {(s.risk_flags || []).length > 0 && (
                        <div className="flags">
                          <h3 className="sub-label">Risk flags</h3>
                          <ul>{s.risk_flags.map(f => <li key={f}>{f}</li>)}</ul>
                        </div>
                      )}

                      {s.mentor_notes && (
                        <div className="brief">
                          <h3 className="sub-label">Briefing from Eunoia</h3>
                          <p>{s.mentor_notes}</p>
                        </div>
                      )}

                      <div>
                        <label className="label" htmlFor={`notes-${a.id}`}>Your notes</label>
                        <textarea
                          id={`notes-${a.id}`} className="field" rows={3}
                          value={notes[a.id] ?? a.notes ?? ''}
                          onChange={e => { setNotes(n => ({ ...n, [a.id]: e.target.value })); setSaved(null) }}
                          placeholder="Observations, follow-ups, what to raise next time."
                          style={{ resize: 'vertical' }}
                        />
                      </div>

                      <div className="actions">
                        <button className="btn" onClick={() => saveNote(a)} disabled={saving === a.id}>
                          {saving === a.id ? 'Saving…' : 'Save notes'}
                        </button>
                        {saved === a.id && <span className="muted" role="status">Saved</span>}
                        {a.status === 'active' && (
                          <>
                            <button className="btn btn-quiet" onClick={() => updateStatus(a.id, 'resolved')}>Mark resolved</button>
                            <button className="btn btn-danger" onClick={() => updateStatus(a.id, 'escalated')}>Escalate</button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}