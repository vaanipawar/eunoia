import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Moon, Footprints, Wind, Timer, ClipboardList, MessageCircle } from 'lucide-react'
import { getPredictHistoryAPI } from '../api/endpoints'
import { useAuth } from '../store/useAuth'
import RiskBadge from '../components/RiskBadge'

const HEADLINE = {
  low: 'This week looks steady.',
  medium: 'This week looks like a heavy one.',
  high: 'This week looks hard.',
}
const FOLLOW_UP = {
  low: 'Your last check-in shows no strong signs of burnout. Keep doing what is working.',
  medium: 'A few signals are stacking up. An earlier night or a short chat can help.',
  high: 'Several signals point to burnout. Talking to Eunoia or a mentor can help, and you don’t need to wait.',
}
const LEVEL_COLOR = { low: 'var(--low)', medium: 'var(--mid)', high: 'var(--high)' }

const TIPS = [
  { icon: Moon, title: 'Sleep', text: 'Aim for 7–8 hours and keep screens away for the last 30 minutes.' },
  { icon: Footprints, title: 'Move between sessions', text: 'A 10-minute walk between study blocks helps you stay focused.' },
  { icon: Wind, title: 'Breathe before exams', text: 'Five minutes of slow box breathing settles the nerves.' },
  { icon: Timer, title: 'Work in 25-minute blocks', text: 'Short timed blocks make a big task feel smaller.' },
]

const weekLabel = (w = '') => (w.includes('-W') ? `Week ${Number(w.split('-W')[1])}` : w)

function TrendDot({ cx, cy, payload }) {
  if (cx == null || cy == null) return null
  return <circle cx={cx} cy={cy} r={5} fill="var(--ground)" stroke={LEVEL_COLOR[payload.level]} strokeWidth={2.5} />
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPredictHistoryAPI()
      .then(r => setHistory(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const latest = history[0]
  const first = (user?.full_name || '').split(/[\s._]+/)[0]
  const name = first ? first[0].toUpperCase() + first.slice(1) : ''

  const chartData = [...history].reverse().map(h => ({
    week: weekLabel(h.week).replace('Week ', 'W'),
    score: h.risk_score,
    level: h.risk_level,
  }))

  if (loading) return <p className="muted">Loading…</p>

  return (
    <div>
      <p className="hello">{name ? `Hi ${name}` : 'Hi there'}</p>
      <h1 className="hero-title">{latest ? HEADLINE[latest.risk_level] || HEADLINE.low : 'No check-ins yet.'}</h1>
      <p className="hero-text">
        {latest
          ? FOLLOW_UP[latest.risk_level] || FOLLOW_UP.low
          : 'Take your first weekly check-in and this page will show how your weeks are going.'}
      </p>
      <div className="hero-actions">
        <Link to="/survey" className="btn"><ClipboardList size={17} strokeWidth={1.75} /> Weekly check-in</Link>
        <Link to="/chat" className="btn btn-quiet"><MessageCircle size={17} strokeWidth={1.75} /> Talk to Eunoia</Link>
      </div>

      <section className="section" aria-labelledby="trend-title">
        <h2 id="trend-title" className="section-title">Burnout risk by week</h2>
        {chartData.length > 0 ? (
          <div role="img" aria-label={`Burnout risk over ${chartData.length} weeks. Latest score ${latest.risk_score} percent.`}>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 13, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickFormatter={v => `${v}%`}
                  tick={{ fontSize: 13, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ stroke: 'var(--line)' }}
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, boxShadow: 'none' }}
                  formatter={v => [`${v}%`, 'Risk score']}
                />
                <Line type="monotone" dataKey="score" stroke="var(--muted)" strokeWidth={1.5}
                  dot={<TrendDot />} activeDot={<TrendDot />} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="empty">Your weekly scores will appear here after your first check-in.</p>
        )}
      </section>

      <div className="section split">
        <section aria-labelledby="recent-title">
          <h2 id="recent-title" className="section-title">Recent check-ins</h2>
          {history.length > 0 ? (
            <ul className="rows">
              {history.slice(0, 5).map((h, i) => (
                <li key={h.week || i}>
                  <span>{weekLabel(h.week)}</span>
                  <span className="num">{h.risk_score}%</span>
                  <RiskBadge level={h.risk_level} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">Nothing here yet.</p>
          )}
        </section>

        <section aria-labelledby="tips-title">
          <h2 id="tips-title" className="section-title">Small things that help</h2>
          <ul className="tips">
            {TIPS.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                <div><strong>{title}</strong><span>{text}</span></div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}