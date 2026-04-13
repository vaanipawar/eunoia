import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPredictHistoryAPI } from '../api/endpoints'
import { useAuth } from '../store/useAuth'
import RiskBadge from '../components/RiskBadge'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { MessageCircle, TrendingUp, Clock, BookOpen } from 'lucide-react'

export default function StudentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPredictHistoryAPI()
      .then(r => setHistory(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const latest = history[0]
  const chartData = [...history].reverse().map(h => ({
    week: h.week?.split('-W')[1] ? `W${h.week.split('-W')[1]}` : h.week,
    score: h.risk_score,
  }))

  const tips = [
    { icon: '😴', title: 'Sleep hygiene', tip: 'Aim for 7–8 hours. Avoid screens 30 mins before bed.' },
    { icon: '🚶', title: 'Movement breaks', tip: 'A 10-minute walk between study sessions improves focus.' },
    { icon: '🍃', title: 'Mindfulness', tip: 'Try 5 minutes of box breathing before exams.' },
    { icon: '📅', title: 'Time-boxing', tip: 'Break tasks into 25-min Pomodoro blocks to reduce overwhelm.' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--ink)' }}>
          Good day, {user?.full_name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: 6, fontSize: 14 }}>
          Here's your well-being overview for this week.
        </p>
      </div>

      {/* Top stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard
          icon={<TrendingUp size={20} color="var(--sage-dark)" />}
          label="Current risk"
          value={latest ? <RiskBadge level={latest.risk_level} score={latest.risk_score} /> : '—'}
        />
        <StatCard
          icon={<Clock size={20} color="var(--warm)" />}
          label="Assessments done"
          value={history.length}
        />
        <StatCard
          icon={<BookOpen size={20} color="var(--sage-dark)" />}
          label="This week"
          value={latest?.week || '—'}
        />
      </div>

      {/* Chart + CTA row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 28 }}>
        {/* Risk trend chart */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>
            Weekly burnout risk trend
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--sage)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--sage)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'white', border: '1px solid var(--border)',
                    borderRadius: 8, fontSize: 13,
                  }}
                  formatter={v => [`${v}%`, 'Risk score']}
                />
                <Area
                  type="monotone" dataKey="score" stroke="var(--sage)"
                  strokeWidth={2} fill="url(#scoreGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{
              height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--muted)', fontSize: 14,
            }}>
              No prediction history yet
            </div>
          )}
        </div>

        {/* Talk to Eunoia CTA */}
        <div style={{
          ...cardStyle,
          background: 'linear-gradient(135deg, var(--sage-light) 0%, #dceadc 100%)',
          border: '1px solid #c4d9c4',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 28, marginBottom: 10 }}>🌿</div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--sage-dark)', marginBottom: 8 }}>
              Feeling stressed?
            </h3>
            <p style={{ fontSize: 13, color: 'var(--sage-dark)', lineHeight: 1.6 }}>
              Eunoia is always here to listen, support, and connect you with a mentor if needed.
            </p>
          </div>
          <button
            onClick={() => navigate('/chat')}
            style={{
              marginTop: 20, padding: '11px 16px',
              background: 'var(--sage-dark)', color: 'white',
              border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <MessageCircle size={16} /> Start a conversation
          </button>
        </div>
      </div>

      {/* Well-being tips */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 18 }}>
          Well-being tips for you
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {tips.map(({ icon, title, tip }) => (
            <div key={title} style={{
              background: 'var(--cream)', borderRadius: 10, padding: '14px 16px',
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{title}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{tip}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div style={{
      background: 'white', borderRadius: 12, border: '1px solid var(--border)',
      padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{
        width: 40, height: 40, background: 'var(--sage-light)',
        borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{value}</div>
      </div>
    </div>
  )
}

const cardStyle = {
  background: 'white', borderRadius: 14, border: '1px solid var(--border)', padding: '22px 24px',
}