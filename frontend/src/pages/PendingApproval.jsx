import { Link } from 'react-router-dom'
import AuthShell from '../components/AuthShell'

export default function PendingApproval() {
  return (
    <AuthShell>
      <h1>Your account is awaiting approval</h1>
      <p className="muted" style={{ marginTop: 8 }}>
        Your mentor account has been created and is waiting for an admin to verify it.
        We’ll email you as soon as it’s approved, and then you can sign in.
      </p>
      <div style={{ marginTop: 24 }}>
        <Link to="/login" className="btn">Back to sign in</Link>
      </div>
    </AuthShell>
  )
}