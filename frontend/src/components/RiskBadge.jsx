const LABELS = { low: 'Low risk', medium: 'Medium risk', high: 'High risk' }

export default function RiskBadge({ level = 'low', score }) {
  const key = LABELS[level] ? level : 'low'
  return (
    <span className={`risk risk-${key}`}>
      {LABELS[key]}
      {score !== undefined && <span className="risk-score">{score}%</span>}
    </span>
  )
}

