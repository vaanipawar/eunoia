export default function RiskBadge({ level, score }) {
  const config = {
    low:    { bg: 'var(--green-light)', color: 'var(--green)',  label: 'Low Risk' },
    medium: { bg: 'var(--amber-light)', color: 'var(--amber)',  label: 'Medium Risk' },
    high:   { bg: 'var(--red-light)',   color: 'var(--red)',    label: 'High Risk' },
  }
  const c = config[level] || config.low
  return (
    <span style={{
      background: c.bg, color: c.color,
      padding: '4px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 600,
    }}>
      {score !== undefined ? `${score}% · ` : ''}{c.label}
    </span>
  )
}