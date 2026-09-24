import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import api from '../api/client'
import AuthShell from '../components/AuthShell'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true); setError('')
    try {
      await api.post('/api/auth/reset-password', { token, new_password: password })
      setDone(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.response?.data?.detail || 'This link is invalid or has expired.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <AuthShell>
        <h1>This link isn’t valid</h1>
        <p className="muted" style={{ marginTop: 6 }}>The reset link is missing or incomplete. Request a new one and try again.</p>
        <div className="auth-links"><Link to="/forgot-password">Request a new link</Link></div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      {done ? (
        <>
          <h1>Password updated</h1>
          <p className="muted" style={{ marginTop: 6 }}>Taking you to sign in…</p>
        </>
      ) : (
        <>
          <h1>Set a new password</h1>
          <form onSubmit={handleSubmit} className="stack">
            {error && <div className="notice notice-error" role="alert">{error}</div>}
            <div>
              <label className="label" htmlFor="password">New password</label>
              <input id="password" className="field" type="password" autoComplete="new-password"
                value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div>
              <label className="label" htmlFor="confirm">Confirm new password</label>
              <input id="confirm" className="field" type="password" autoComplete="new-password"
                value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading} className="btn btn-block">
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  )
}