import { useEffect, useState } from 'react'
import api from '../api/client'
import RiskBadge from '../components/RiskBadge'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts'
import { Users, AlertTriangle, CheckCircle, TrendingDown, ChevronDown, ChevronUp, X } from 'lucide-react'

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview')
  const [students, setStudents] = useState([])
  const [mentors, setMentors] = useState([])
  const [pendingMentors, setPendingMentors] = useState([])
  const [filter, setFilter] = useState('all')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentHistory, setStudentHistory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/students'),
      api.get('/api/admin/mentors'),
      api.get('/api/admin/pending-mentors'),
    ]).then(([s, m, p]) => {
      setStudents(s.data)
      setMentors(m.data)
      setPendingMentors(p.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const openStudentHistory = async (studentId) => {
    setSelectedStudent(studentId)
    try {
      const res = await api.get(`/api/admin/students/${studentId}/history`)
      setStudentHistory(res.data)
    } catch { setStudentHistory(null) }
  }

  const approveMentor = async (mentorId) => {
    await api.post(`/api/admin/approve-mentor/${mentorId}`)
    setPendingMentors(p => p.filter(m => m.id !== mentorId))
    const res = await api.get('/api/admin/mentors')
    setMentors(res.data)
  }

  const rejectMentor = async (mentorId) => {
    await api.delete(`/api/admin/reject-mentor/${mentorId}`)
    setPendingMentors(p => p.filter(m => m.id !== mentorId))
  }

  const runPrediction = async () => {
    try {
      await api.post('/api/admin/run-predictions')
      alert('Weekly predictions triggered! High-risk students will receive emails.')
    } catch { alert('Failed to run predictions') }
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

  const tabs = ['overview', 'students', 'mentors', 'pending']

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28 }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
            Manage students, mentors, and predictions
          </p>
        </div>
        <button onClick={runPrediction} style={{
          padding: '10px 20px', borderRadius: 8, background: 'var(--sage-dark)',
          color: 'white', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
        }}>
          Run weekly predictions
        </button>
      </div>

      {/* Pending mentor alert */}
      {pendingMentors.length > 0 && (
        <div style={{
          background: '#FFFBEB', border: '1px solid #FDE68A',
          borderRadius: 10, padding: '12px 18px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 13, color: '#92400E' }}>
            ⚠️ {pendingMentors.length} mentor(s) waiting for approval
          </span>
          <button onClick={() => setTab('pending')} style={{
            fontSize: 12, color: '#92400E', fontWeight: 600,
            background: 'none', border: 'none', cursor: 'pointer',
          }}>
            Review now →
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '9px 18px', borderRadius: '8px 8px 0 0',
            border: '1px solid', borderBottom: 'none',
            borderColor: tab === t ? 'var(--border)' : 'transparent',
            background: tab === t ? 'white' : 'transparent',
            cursor: 'pointer', fontSize: 13, fontWeight: 500,
            color: tab === t ? 'var(--ink)' : 'var(--muted)',
            textTransform: 'capitalize', marginBottom: tab === t ? -1 : 0,
          }}>
            {t === 'pending' ? `Pending (${pendingMentors.length})` : t}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Total students', value: counts.total, color: 'var(--sage-light)', icon: '👥' },
              { label: 'High risk', value: counts.high, color: 'var(--red-light)', icon: '🚨' },
              { label: 'Medium risk', value: counts.medium, color: 'var(--amber-light)', icon: '⚠️' },
              { label: 'Low risk', value: counts.low, color: 'var(--green-light)', icon: '✅' },
            ].map(({ label, value, color, icon }) => (
              <div key={label} style={{
                background: 'white', border: '1px solid var(--border)',
                borderRadius: 12, padding: '18px 20px',
              }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Risk by department</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptData} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="dept" tick={{ fontSize: 12, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }} />
                <Bar dataKey="high" name="High" fill="#DC2626" radius={[4, 4, 0, 0]} />
                <Bar dataKey="medium" name="Medium" fill="#D97706" radius={[4, 4, 0, 0]} />
                <Bar dataKey="low" name="Low" fill="#16A34A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Students tab */}
      {tab === 'students' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['all', 'high', 'medium', 'low'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                border: '1px solid var(--border)', cursor: 'pointer', textTransform: 'capitalize',
                background: filter === f ? 'var(--sage-dark)' : 'white',
                color: filter === f ? 'white' : 'var(--muted)',
              }}>
                {f === 'all' ? `All (${counts.total})` : `${f} (${counts[f]})`}
              </button>
            ))}
          </div>
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--cream)' }}>
                  {['Name', 'Email', 'Department', 'Year', 'Risk', 'Score', 'Last assessed', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '11px 16px', textAlign: 'left', fontSize: 12,
                      fontWeight: 600, color: 'var(--muted)', borderBottom: '1px solid var(--border)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'white' : 'var(--cream)' }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500 }}>{s.full_name}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted)' }}>{s.email}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted)' }}>{s.department || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted)' }}>{s.year_of_study || '—'}</td>
                    <td style={{ padding: '12px 16px' }}><RiskBadge level={s.risk_level || 'low'} /></td>
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>{s.risk_score ? `${s.risk_score}%` : '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted)' }}>
                      {s.last_assessed ? new Date(s.last_assessed).toLocaleDateString('en-IN') : 'Never'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => openStudentHistory(s.id)} style={{
                        fontSize: 12, padding: '4px 12px', borderRadius: 6,
                        background: 'var(--sage-light)', color: 'var(--sage-dark)',
                        border: 'none', cursor: 'pointer', fontWeight: 500,
                      }}>
                        View history
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mentors tab */}
      {tab === 'mentors' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {mentors.map(m => (
              <div key={m.id} style={{
                background: 'white', border: '1px solid var(--border)',
                borderRadius: 14, padding: '20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: 'var(--sage-light)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, color: 'var(--sage-dark)', fontSize: 16,
                  }}>
                    {m.full_name?.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{m.full_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{m.email}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                  {m.department} · {m.experience_years || 0} yrs exp
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                  {(m.specializations || []).slice(0, 3).map(s => (
                    <span key={s} style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 20,
                      background: 'var(--sage-light)', color: 'var(--sage-dark)',
                    }}>{s}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--muted)' }}>Active cases: <strong>{m.active_cases || 0}</strong></span>
                  <span style={{
                    color: m.availability === 'available' ? 'var(--green)' : 'var(--amber)',
                    fontWeight: 600,
                  }}>{m.availability}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending mentors tab */}
      {tab === 'pending' && (
        <div>
          {pendingMentors.length === 0 ? (
            <div style={{
              background: 'white', border: '1px solid var(--border)', borderRadius: 14,
              padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 14,
            }}>
              No pending mentor approvals
            </div>
          ) : (
            pendingMentors.map(m => (
              <div key={m.id} style={{
                background: 'white', border: '1px solid var(--border)',
                borderRadius: 14, padding: '20px 24px', marginBottom: 14,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{m.full_name}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                      {m.email} · {m.department}
                    </div>
                    {m.bio && (
                      <p style={{ fontSize: 13, color: 'var(--ink)', marginTop: 8, maxWidth: 500 }}>{m.bio}</p>
                    )}
                    <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                      {(m.specializations || []).map(s => (
                        <span key={s} style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 20,
                          background: 'var(--sage-light)', color: 'var(--sage-dark)',
                        }}>{s}</span>
                      ))}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
                      {m.experience_years} years experience ·
                      Languages: {(m.languages || []).join(', ') || 'Not specified'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => approveMentor(m.id)} style={{
                      padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      background: 'var(--green-light)', color: 'var(--green)',
                      border: '1px solid #BBF7D0', cursor: 'pointer',
                    }}>
                      Approve
                    </button>
                    <button onClick={() => rejectMentor(m.id)} style={{
                      padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      background: 'var(--red-light)', color: 'var(--red)',
                      border: '1px solid #FECACA', cursor: 'pointer',
                    }}>
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Student history modal */}
      {selectedStudent && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          padding: 24,
        }}>
          <div style={{
            background: 'white', borderRadius: 16, width: '100%', maxWidth: 700,
            maxHeight: '85vh', overflowY: 'auto', padding: '24px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 22 }}>
                {studentHistory?.student?.full_name}'s History
              </h3>
              <button onClick={() => { setSelectedStudent(null); setStudentHistory(null) }} style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 20,
              }}>×</button>
            </div>

            {studentHistory?.sessions?.length === 0 && (
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>No chat sessions yet.</p>
            )}

            {studentHistory?.sessions?.map(s => (
              <div key={s.session_id} style={{
                border: '1px solid var(--border)', borderRadius: 12,
                marginBottom: 16, overflow: 'hidden',
              }}>
                <div style={{
                  background: 'var(--cream)', padding: '12px 16px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>
                      {new Date(s.started_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 12 }}>
                      {s.status} · {s.stress_level || 'low'} stress
                    </span>
                  </div>
                  {s.mentor_assigned && (
                    <span style={{ fontSize: 11, background: 'var(--sage-light)', color: 'var(--sage-dark)', padding: '2px 8px', borderRadius: 10 }}>
                      Mentor assigned
                    </span>
                  )}
                </div>
                {s.summary && (
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>AI Summary</div>
                    <p style={{ fontSize: 13, color: 'var(--ink)' }}>{s.summary.primary_concern}</p>
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{s.summary.mentor_notes}</p>
                  </div>
                )}
                <div style={{ padding: '12px 16px', maxHeight: 200, overflowY: 'auto' }}>
                  {s.messages?.map((m, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                      marginBottom: 8,
                    }}>
                      <div style={{
                        maxWidth: '75%', padding: '8px 12px', borderRadius: 10,
                        background: m.role === 'user' ? 'var(--sage-dark)' : 'var(--cream)',
                        color: m.role === 'user' ? 'white' : 'var(--ink)',
                        fontSize: 12, border: '1px solid var(--border)',
                        borderColor: m.role === 'user' ? 'transparent' : 'var(--border)',
                      }}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}