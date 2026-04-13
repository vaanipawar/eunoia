import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

const questions = [
  { key: 'attendance_pct', label: 'Attendance this week (%)', min: 0, max: 100, step: 1 },
  { key: 'assignment_completion', label: 'Assignments completed (%)', min: 0, max: 100, step: 1 },
  { key: 'avg_grade', label: 'Average grade (%)', min: 0, max: 100, step: 1 },
  { key: 'sleep_hours', label: 'Average sleep per night (hours)', min: 0, max: 12, step: 0.5 },
  { key: 'social_activity', label: 'Social activity level (1=none, 5=very active)', min: 1, max: 5, step: 1 },
  { key: 'physical_activity', label: 'Physical activity level (1=none, 5=very active)', min: 1, max: 5, step: 1 },
  { key: 'stress_survey', label: 'Current stress level (1=none, 10=extreme)', min: 1, max: 10, step: 1 },
  { key: 'missed_deadlines', label: 'Deadlines missed this week', min: 0, max: 10, step: 1 },
  { key: 'library_logins', label: 'Library/LMS logins this week', min: 0, max: 30, step: 1 },
  { key: 'lms_time_hours', label: 'Hours spent on LMS this week', min: 0, max: 40, step: 0.5 },
]

export default function SurveyPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState({
    attendance_pct: 75,
    assignment_completion: 70,
    avg_grade: 65,
    sleep_hours: 6.5,
    social_activity: 3,
    physical_activity: 3,
    stress_survey: 5,
    missed_deadlines: 1,
    library_logins: 5,
    lms_time_hours: 10,
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setValues(prev => ({ ...prev, [k]: parseFloat(v) }))

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await api.post('/api/predict/', values)
      setResult(res.data)
      if (res.data.risk_level === 'high') {
        setTimeout(() => navigate('/chat'), 3000)
      }
    } catch {
      alert('Failed to submit survey. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const riskColor = {
    low:    { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
    medium: { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
    high:   { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28 }}>Weekly check-in</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>
          Takes 2 minutes. Helps us understand how you're doing this week.
        </p>
      </div>

      {result ? (
        <div style={{
          background: riskColor[result.risk_level]?.bg,
          border: `1px solid ${riskColor[result.risk_level]?.border}`,
          borderRadius: 14, padding: 32, textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>
            {result.risk_level === 'low' ? '😊' : result.risk_level === 'medium' ? '😐' : '😔'}
          </div>
          <div style={{
            fontSize: 36, fontWeight: 700,
            color: riskColor[result.risk_level]?.color, marginBottom: 8,
          }}>
            {result.risk_score}%
          </div>
          <div style={{
            fontSize: 16, fontWeight: 600,
            color: riskColor[result.risk_level]?.color, marginBottom: 12,
          }}>
            {result.risk_level?.toUpperCase()} RISK
          </div>
          {result.risk_level === 'high' && (
            <p style={{ color: 'var(--sage-dark)', fontWeight: 600, fontSize: 13, marginBottom: 12 }}>
              Redirecting you to Eunoia chat in 3 seconds...
            </p>
          )}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '10px 24px', borderRadius: 8,
                background: 'var(--sage-dark)', color: 'white',
                border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              }}
            >
              Back to dashboard
            </button>
            <button
              onClick={() => navigate('/chat')}
              style={{
                padding: '10px 24px', borderRadius: 8,
                background: 'white', color: 'var(--sage-dark)',
                border: '1px solid var(--sage-dark)', cursor: 'pointer',
                fontSize: 14, fontWeight: 600,
              }}
            >
              Talk to Eunoia
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'white', borderRadius: 14,
          border: '1px solid var(--border)', padding: '24px 28px',
        }}>
          {questions.map(({ key, label, min, max, step }) => (
            <div key={key} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 14, fontWeight: 500 }}>{label}</label>
                <span style={{
                  fontSize: 13, fontWeight: 700, color: 'var(--sage-dark)',
                  background: 'var(--sage-light)', padding: '2px 10px', borderRadius: 20,
                }}>
                  {values[key]}
                </span>
              </div>
              <input
                type="range" min={min} max={max} step={step} value={values[key]}
                onChange={e => set(key, e.target.value)}
                style={{ width: '100%', accentColor: 'var(--sage-dark)' }}
              />
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 11, color: 'var(--muted)', marginTop: 2,
              }}>
                <span>{min}</span>
                <span>{max}</span>
              </div>
            </div>
          ))}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', padding: '12px', borderRadius: 8,
              background: loading ? 'var(--border)' : 'var(--sage-dark)',
              color: 'white', border: 'none', fontSize: 14,
              fontWeight: 600, cursor: loading ? 'default' : 'pointer', marginTop: 8,
            }}
          >
            {loading ? 'Analyzing…' : 'Submit check-in'}
          </button>
        </div>
      )}
    </div>
  )
}