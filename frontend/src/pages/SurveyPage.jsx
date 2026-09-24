import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import RiskBadge from '../components/RiskBadge'

const GROUPS = [
  {
    title: 'Your studies',
    questions: [
      { key: 'attendance_pct', label: 'Attendance this week', min: 0, max: 100, step: 1, unit: '%' },
      { key: 'assignment_completion', label: 'Assignments completed', min: 0, max: 100, step: 1, unit: '%' },
      { key: 'avg_grade', label: 'Average grade', min: 0, max: 100, step: 1, unit: '%' },
      { key: 'missed_deadlines', label: 'Deadlines missed', min: 0, max: 10, step: 1 },
    ],
  },
  {
    title: 'Body and habits',
    questions: [
      { key: 'sleep_hours', label: 'Average sleep per night', min: 0, max: 12, step: 0.5, unit: ' h' },
      { key: 'physical_activity', label: 'Physical activity', min: 1, max: 5, step: 1, lo: 'None', hi: 'Very active' },
      { key: 'social_activity', label: 'Social activity', min: 1, max: 5, step: 1, lo: 'None', hi: 'Very active' },
    ],
  },
  {
    title: 'How you feel',
    questions: [
      { key: 'stress_survey', label: 'Stress level right now', min: 1, max: 10, step: 1, lo: 'None', hi: 'Extreme' },
    ],
  },
  {
    title: 'Online activity',
    questions: [
      { key: 'library_logins', label: 'Library or LMS logins', min: 0, max: 30, step: 1 },
      { key: 'lms_time_hours', label: 'Time on the LMS', min: 0, max: 40, step: 0.5, unit: ' h' },
    ],
  },
]

const DEFAULTS = {
  attendance_pct: 75, assignment_completion: 70, avg_grade: 65, sleep_hours: 6.5,
  social_activity: 3, physical_activity: 3, stress_survey: 5,
  missed_deadlines: 1, library_logins: 5, lms_time_hours: 10,
}

const HEADLINE = {
  low: 'This week looks steady.',
  medium: 'This week looks like a heavy one.',
  high: 'This week looks hard.',
}
const FOLLOW_UP = {
  low: 'Nothing here points to burnout. Keep doing what is working.',
  medium: 'A few signals are stacking up. An earlier night or a short chat can help.',
  high: 'Several signals point to burnout. Talking it through can help, and Eunoia is there whenever you want.',
}

export default function SurveyPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState(DEFAULTS)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [redirecting, setRedirecting] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const set = (k, v) => setValues(prev => ({ ...prev, [k]: parseFloat(v) }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await api.post('/api/predict/', values)
      setResult(res.data)
      if (res.data.risk_level === 'high') {
        setRedirecting(true)
        timer.current = setTimeout(() => navigate('/chat'), 4000)
      }
    } catch {
      setError('We couldn’t save your check-in. Please try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  const stay = () => { clearTimeout(timer.current); setRedirecting(false) }

  if (result) {
    const level = result.risk_level
    return (
      <div className="narrow">
        <p className="hello">Check-in saved</p>
        <h1 className="hero-title">{HEADLINE[level] || HEADLINE.low}</h1>
        <p className="hero-text">{FOLLOW_UP[level] || FOLLOW_UP.low}</p>
        <p style={{ marginTop: 20 }}><RiskBadge level={level} score={result.risk_score} /></p>

        {redirecting && (
          <p className="notice-inline" role="status">
            Taking you to Eunoia in a few seconds.{' '}
            <button type="button" className="link-btn" onClick={stay}>Stay here</button>
          </p>
        )}

        <div className="hero-actions">
          <button className="btn" onClick={() => navigate('/dashboard')}>Back to overview</button>
          <button className="btn btn-quiet" onClick={() => navigate('/chat')}>Talk to Eunoia</button>
        </div>
      </div>
    )
  }

  return (
    <form className="narrow" onSubmit={handleSubmit}>
      <h1 className="page-title">Weekly check-in</h1>
      <p className="muted" style={{ marginTop: 6 }}>
        Two minutes. Slide each answer to what this past week was really like.
      </p>

      {GROUPS.map(group => (
        <fieldset key={group.title} className="q-group">
          <legend className="section-title">{group.title}</legend>
          {group.questions.map(({ key, label, min, max, step, unit = '', lo, hi }) => (
            <div key={key} className="q">
              <div className="q-head">
                <label htmlFor={key}>{label}</label>
                <output htmlFor={key} className="q-val">{values[key]}{unit}</output>
              </div>
              <input
                id={key} className="slider" type="range"
                min={min} max={max} step={step} value={values[key]}
                onChange={e => set(key, e.target.value)}
              />
              <div className="q-ends">
                <span>{lo || `${min}${unit}`}</span>
                <span>{hi || `${max}${unit}`}</span>
              </div>
            </div>
          ))}
        </fieldset>
      ))}

      {error && <div className="notice notice-error" role="alert" style={{ marginTop: 24 }}>{error}</div>}

      <button type="submit" className="btn btn-block" disabled={loading} style={{ marginTop: 28 }}>
        {loading ? 'Saving…' : 'Submit check-in'}
      </button>
    </form>
  )
}