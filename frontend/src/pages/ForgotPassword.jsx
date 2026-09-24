import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import AuthShell from '../components/AuthShell'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/api/auth/forgot-password', { email })
    } catch {
      // same message either way, so the form can't be used to find out which emails exist
    } finally {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      {sent ? (
        <>
          <h1>Check your email</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            If an account exists for {email}, we’ve sent a link to reset your password.
          </p>
          <div className="auth-links"><Link to="/login">Back to sign in</Link></div>
        </>
      ) : (
        <>
          <h1>Reset your password</h1>
          <p className="muted">Enter your email and we’ll send you a reset link.</p>
          <form onSubmit={handleSubmit} className="stack">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" className="field" type="email" autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@university.edu" required />
            </div>
            <button type="submit" disabled={loading} className="btn btn-block">
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
          <div className="auth-links"><Link to="/login">Back to sign in</Link></div>
        </>
      )}
    </AuthShell>
  )
}