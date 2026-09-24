import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginAPI } from '../api/endpoints'
import { useAuth } from '../store/useAuth'
import Logo from '../components/Logo'

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
      login(access_token, { role, email, full_name: email.split('@')[0] })
      navigate(role === 'admin' ? '/admin' : role === 'mentor' ? '/mentor' : '/dashboard')
    } catch {
      setError('That email and password don’t match. Check them and try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth">
      <div className="auth-aside">
        <Logo size={26} />
        <p>A weekly check-in that notices when things are getting heavy.</p>
        <small>For students, mentors and counsellors at your university.</small>
      </div>

      <div className="auth-main">
        <div className="auth-form">
          <h1>Sign in</h1>
          <p className="muted">Welcome back.</p>

          <form onSubmit={handleSubmit} className="stack">
            {error && <div className="notice notice-error" role="alert">{error}</div>}

            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email" className="field" type="email" autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@university.edu" required
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password" className="field" type="password" autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)} required
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-block">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="auth-links">
            <Link to="/forgot-password">Forgot your password?</Link>
            <Link to="/register">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  )
}