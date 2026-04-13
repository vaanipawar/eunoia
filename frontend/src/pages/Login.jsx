import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginAPI } from '../api/endpoints'
import { useAuth } from '../store/useAuth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await loginAPI(email, password)
      const { access_token, role } = res.data
      // Decode basic info from token or store role separately
      login(access_token, { role, email, full_name: email.split('@')[0] })
      navigate(role === 'admin' ? '/admin' : role === 'mentor' ? '/mentor' : '/dashboard')
    } catch (err) {
      setError('Invalid email or password')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--cream)',
    }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 24px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            fontFamily: 'var(--font-serif)', fontSize: 36,
            color: 'var(--sage-dark)', marginBottom: 8,
          }}>Eunoia</div>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            Your student well-being companion
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'white', borderRadius: 16, border: '1px solid var(--border)',
          padding: '32px 28px',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>Sign in</h2>

          {error && (
            <div style={{
              background: 'var(--red-light)', color: 'var(--red)',
              padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16,
            }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@university.edu" required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                style={inputStyle}
              />
            </div>
            <button type="submit" disabled={loading} style={btnStyle}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
            <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13 }}>
  <Link to="/forgot-password" style={{ color: 'var(--muted)' }}>
    Forgot password?
  </Link>
</p>
<p style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: 'var(--muted)' }}>
  No account? <Link to="/register" style={{ color: 'var(--sage-dark)', fontWeight: 500 }}>
    Register
  </Link>
</p>
            No account? <Link to="/register" style={{ color: 'var(--sage-dark)', fontWeight: 500 }}>
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  border: '1px solid var(--border)', fontSize: 14, fontFamily: 'var(--font-sans)',
  outline: 'none', background: 'var(--cream)',
}

const btnStyle = {
  width: '100%', padding: '11px', borderRadius: 8,
  background: 'var(--sage-dark)', color: 'white',
  border: 'none', fontSize: 14, fontWeight: 600,
  cursor: 'pointer', marginTop: 4,
}