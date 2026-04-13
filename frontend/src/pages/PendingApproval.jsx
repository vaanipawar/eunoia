import { Link } from 'react-router-dom'

export default function PendingApproval() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--cream)',
    }}>
      <div style={{
        background: 'white', borderRadius: 16, border: '1px solid var(--border)',
        padding: '40px 36px', maxWidth: 440, textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, marginBottom: 12 }}>
          Account pending approval
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
          Your mentor account has been created and is awaiting admin verification.
          You'll receive an email once your account is approved.
        </p>
        <Link to="/login" style={{
          display: 'inline-block', padding: '10px 24px', borderRadius: 8,
          background: 'var(--sage-dark)', color: 'white',
          textDecoration: 'none', fontSize: 14, fontWeight: 600,
        }}>
          Back to login
        </Link>
      </div>
    </div>
  )
}