import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import api from '../api/client'

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
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true); setError('')
    try {
      await api.post('/api/auth/reset-password', { token, new_password: password })
      setDone(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid or expired link')
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
          {done ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Password reset!</h2>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 8 }}>
                Redirecting to login...
              </p>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Set new password</h2>
              {error && (
                <div style={{
                  background: 'var(--red-light)', color: 'var(--red)',
                  padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16,
                }}>{error}</div>
              )}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="New password" required minLength={6}
                  style={{
                    padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)',
                    fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none',
                  }}
                />
                <input
                  type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Confirm new password" required
                  style={{
                    padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)',
                    fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none',
                  }}
                />
                <button type="submit" disabled={loading} style={{
                  padding: '11px', borderRadius: 8, background: 'var(--sage-dark)',
                  color: 'white', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}>
                  {loading ? 'Resetting…' : 'Reset password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}