import Logo from './Logo'

export default function AuthShell({ children, wide = false }) {
  return (
    <div className="auth">
      <div className="auth-aside">
        <Logo size={26} />
        <p>A weekly check-in that notices when things are getting heavy.</p>
        <small>For students, mentors and counsellors at your university.</small>
      </div>
      <div className="auth-main">
        <div className={`auth-form${wide ? ' wide' : ''}`}>{children}</div>
      </div>
    </div>
  )
}