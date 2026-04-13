import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/api/auth/forgot-password', { email })
      setSent(true)
    } catch {
      setSent(true) // show same message to prevent email enumeration
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--cream)',
    }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 36, color: 'var(--sage-dark)' }}>
            Eunoia
          </div>
        </div>
        <div style={{
          background: 'white', borderRadius: 16,
          border: '1px solid var(--border)', padding: '32px 28px',
        }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📧</div>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>Check your email</h2>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                If that email exists, we sent a reset link. Check your inbox.
              </p>
              <Link to="/login" style={{
                display: 'inline-block', marginTop: 20, color: 'var(--sage-dark)', fontWeight: 500
              }}>
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Forgot password</h2>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>
                Enter your email and we'll send a reset link.
              </p>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@university.edu" required
                  style={{
                    padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)',
                    fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none',
                  }}
                />
                <button type="submit" disabled={loading} style={{
                  padding: '11px', borderRadius: 8, background: 'var(--sage-dark)',
                  color: 'white', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
              <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13 }}>
                <Link to="/login" style={{ color: 'var(--sage-dark)', fontWeight: 500 }}>
                  Back to login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}