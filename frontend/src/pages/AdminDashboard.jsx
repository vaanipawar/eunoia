import { useEffect, useState } from 'react'
import { X, TriangleAlert } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../api/client'
import RiskBadge from '../components/RiskBadge'

const TABS = ['overview', 'students', 'mentors', 'pending']
const fmtDate = (d, opts) => new Date(d).toLocaleDateString('en-IN', opts)

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview')
  const [students, setStudents] = useState([])
  const [mentors, setMentors] = useState([])
  const [pendingMentors, setPendingMentors] = useState([])
  const [filter, setFilter] = useState('all')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentHistory, setStudentHistory] = useState(null)
  const [historyFailed, setHistoryFailed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'ok' | 'error', text }

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/students'),
      api.get('/api/admin/mentors'),
      api.get('/api/admin/pending-mentors'),
    ]).then(([s, m, p]) => {
      setStudents(s.data); setMentors(m.data); setPendingMentors(p.data)
    }).catch(() => setMessage({ type: 'error', text: 'Some data couldn’t be loaded. Refresh to try again.' }))
      .finally(() => setLoading(false))
  }, [])

  const closeHistory = () => { setSelectedStudent(null); setStudentHistory(null); setHistoryFailed(false) }

  useEffect(() => {
    if (!selectedStudent) return
    const onKey = (e) => { if (e.key === 'Escape') closeHistory() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedStudent])

  const openStudentHistory = async (studentId) => {
    setSelectedStudent(studentId); setStudentHistory(null); setHistoryFailed(false)
    try {
      const res = await api.get(`/api/admin/students/${studentId}/history`)
      setStudentHistory(res.data)
    } catch { setHistoryFailed(true) }
  }

  const approveMentor = async (mentorId) => {
    setMessage(null)
    try {
      await api.post(`/api/admin/approve-mentor/${mentorId}`)
      setPendingMentors(p => p.filter(m => m.id !== mentorId))
      const res = await api.get('/api/admin/mentors')
      setMentors(res.data)
    } catch { setMessage({ type: 'error', text: 'The mentor couldn’t be approved. Please try again.' }) }
  }

  const rejectMentor = async (mentor) => {
    if (!window.confirm(`Reject ${mentor.full_name}? This removes their application.`)) return
    setMessage(null)
    try {
      await api.delete(`/api/admin/reject-mentor/${mentor.id}`)
      setPendingMentors(p => p.filter(m => m.id !== mentor.id))
    } catch { setMessage({ type: 'error', text: 'The mentor couldn’t be rejected. Please try again.' }) }
  }

  const runPrediction = async () => {
    setRunning(true); setMessage(null)
    try {
      await api.post('/api/admin/run-predictions')
      setMessage({ type: 'ok', text: 'Weekly predictions started. High-risk students will be emailed.' })
    } catch { setMessage({ type: 'error', text: 'The predictions couldn’t be started. Please try again.' }) }
    finally { setRunning(false) }
  }

  const counts = {
    total: students.length,
    high: students.filter(s => s.risk_level === 'high').length,
    medium: students.filter(s => s.risk_level === 'medium').length,
    low: students.filter(s => s.risk_level === 'low').length,
  }

  const deptMap = {}
  students.forEach(s => {
    const dept = s.department || 'Unknown'
    if (!deptMap[dept]) deptMap[dept] = { dept, high: 0, medium: 0, low: 0 }
    deptMap[dept][s.risk_level || 'low']++
  })
  const deptData = Object.values(deptMap)
  const filtered = filter === 'all' ? students : students.filter(s => s.risk_level === filter)

  return (
    <div>
      <header className="page-head">
        <div>
          <h1 className="page-title">Admin</h1>
          <p className="muted" style={{ marginTop: 6 }}>Students, mentors and weekly predictions.</p>
        </div>
        <button className="btn" onClick={runPrediction} disabled={running}>
          {running ? 'Starting…' : 'Run weekly predictions'}
        </button>
      </header>

      {message && (
        <div className={`notice ${message.type === 'ok' ? 'notice-ok' : 'notice-error'}`} role="status" style={{ marginTop: 20 }}>
          {message.text}
        </div>
      )}

      {pendingMentors.length > 0 && (
        <div className="banner banner-warn">
          <TriangleAlert size={17} strokeWidth={1.75} style={{ flex: 'none', marginTop: 2 }} aria-hidden="true" />
          <span>{pendingMentors.length} mentor {pendingMentors.length === 1 ? 'application is' : 'applications are'} waiting for approval.</span>
          <button className="link-btn" onClick={() => setTab('pending')}>Review</button>
        </div>
      )}

      <div className="tabs" role="tablist">
        {TABS.map(t => (
          <button key={t} role="tab" className="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
            {t === 'pending' ? `Pending (${pendingMentors.length})` : t}
          </button>
        ))}
      </div>

      {loading ? <p className="muted" style={{ marginTop: 32 }}>Loading…</p> : (
        <div role="tabpanel" style={{ marginTop: 32 }}>
          {tab === 'overview' && (
            <>
              <div className="counts">
                <div><b>{counts.total}</b><span>Students</span></div>
                <div><b className="n-high">{counts.high}</b><span>High risk</span></div>
                <div><b className="n-mid">{counts.medium}</b><span>Medium risk</span></div>
                <div><b className="n-low">{counts.low}</b><span>Low risk</span></div>
              </div>

              <section className="section">
                <h2 className="section-title">Risk by department</h2>
                {deptData.length === 0 ? <p className="empty">No student data yet.</p> : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={deptData} barSize={14} margin={{ left: -16, right: 8 }}>
                      <CartesianGrid stroke="var(--line)" vertical={false} />
                      <XAxis dataKey="dept" tick={{ fontSize: 13, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 13, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: 'rgba(27,36,48,0.04)' }}
                        contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, boxShadow: 'none' }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13 }} />
                      <Bar dataKey="high" name="High" fill="var(--high)" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="medium" name="Medium" fill="var(--mid)" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="low" name="Low" fill="var(--low)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </section>
            </>
          )}

          {tab === 'students' && (
            <>
              <div className="chips" role="group" aria-label="Filter by risk">
                {['all', 'high', 'medium', 'low'].map(f => (
                  <button key={f} className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
                    {f === 'all' ? `All (${counts.total})` : `${f} (${counts[f]})`}
                  </button>
                ))}
              </div>
              <div className="table-wrap" style={{ marginTop: 20 }}>
                <table className="table">
                  <thead>
                    <tr><th>Student</th><th>Department</th><th>Year</th><th>Risk</th><th>Last assessed</th><th><span className="sr-only">Actions</span></th></tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && <tr><td colSpan={6} className="muted">No students match this filter.</td></tr>}
                    {filtered.map(s => (
                      <tr key={s.id}>
                        <td><strong>{s.full_name}</strong><span className="sub">{s.email}</span></td>
                        <td>{s.department || '—'}</td>
                        <td>{s.year_of_study || '—'}</td>
                        <td><RiskBadge level={s.risk_level || 'low'} score={s.risk_score || undefined} /></td>
                        <td>{s.last_assessed ? fmtDate(s.last_assessed) : 'Never'}</td>
                        <td><button className="btn btn-quiet btn-sm" onClick={() => openStudentHistory(s.id)}>View history</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'mentors' && (
            mentors.length === 0 ? <p className="empty">No approved mentors yet.</p> : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th>Mentor</th><th>Experience</th><th>Specializations</th><th>Active cases</th><th>Availability</th></tr>
                  </thead>
                  <tbody>
                    {mentors.map(m => (
                      <tr key={m.id}>
                        <td><strong>{m.full_name}</strong><span className="sub">{m.email}</span></td>
                        <td>{m.department}<span className="sub">{m.experience_years || 0} yrs</span></td>
                        <td><div className="tags">{(m.specializations || []).slice(0, 3).map(s => <span key={s} className="tag">{s}</span>)}</div></td>
                        <td className="num">{m.active_cases || 0}</td>
                        <td><span className={`risk ${m.availability === 'available' ? 'risk-low' : 'risk-medium'}`} style={{ textTransform: 'capitalize' }}>{m.availability}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {tab === 'pending' && (
            pendingMentors.length === 0 ? <p className="empty">No mentor applications waiting for approval.</p> : (
              <ul className="cases">
                {pendingMentors.map(m => (
                  <li key={m.id} className="case pending">
                    <div>
                      <div className="case-name">{m.full_name}</div>
                      <div className="case-meta">{m.email} · {m.department}</div>
                      {m.bio && <p style={{ marginTop: 10, maxWidth: '60ch' }}>{m.bio}</p>}
                      <div className="tags" style={{ marginTop: 10 }}>{(m.specializations || []).map(s => <span key={s} className="tag">{s}</span>)}</div>
                      <div className="case-meta" style={{ marginTop: 10 }}>
                        {m.experience_years || 0} years experience · Languages: {(m.languages || []).join(', ') || 'not specified'}
                      </div>
                    </div>
                    <div className="actions">
                      <button className="btn" onClick={() => approveMentor(m.id)}>Approve</button>
                      <button className="btn btn-danger" onClick={() => rejectMentor(m)}>Reject</button>
                    </div>
                  </li>
                ))}
              </ul>
            )
          )}
        </div>
      )}

      {selectedStudent && (
        <div className="overlay" onClick={closeHistory}>
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="hist-title" onClick={e => e.stopPropagation()}>
            <div className="dialog-head">
              <h2 id="hist-title">{studentHistory?.student?.full_name ? `${studentHistory.student.full_name}’s history` : 'Student history'}</h2>
              <button className="signout" onClick={closeHistory} aria-label="Close"><X size={18} strokeWidth={1.75} /></button>
            </div>

            {historyFailed && <div className="notice notice-error">The history couldn’t be loaded.</div>}
            {!studentHistory && !historyFailed && <p className="muted">Loading…</p>}
            {studentHistory?.sessions?.length === 0 && <p className="muted">No chat sessions yet.</p>}

            {studentHistory?.sessions?.map(s => (
              <section key={s.session_id} className="hist">
                <div className="hist-top">
                  <strong>{fmtDate(s.started_at, { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                  <span className="muted" style={{ textTransform: 'capitalize' }}>{s.status} · {s.stress_level || 'low'} stress</span>
                  {s.mentor_assigned && <span className="tag">Mentor assigned</span>}
                </div>
                {s.summary && (
                  <div className="brief">
                    <h3 className="sub-label">Summary from Eunoia</h3>
                    <p>{s.summary.primary_concern}</p>
                    {s.summary.mentor_notes && <p className="muted" style={{ marginTop: 4 }}>{s.summary.mentor_notes}</p>}
                  </div>
                )}
                <div className="hist-log">
                  {s.messages?.map((m, i) => (
                    <div key={i} className={`msg ${m.role === 'user' ? 'msg-u' : 'msg-a'}`}>
                      <div className="msg-body">{m.content}</div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}