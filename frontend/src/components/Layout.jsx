import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, MessageCircle, Users, ClipboardList, LogOut } from 'lucide-react'
import { useAuth } from '../store/useAuth'
import Logo from './Logo'

const NAVS = {
  student: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { to: '/survey', icon: ClipboardList, label: 'Weekly check-in' },
    { to: '/chat', icon: MessageCircle, label: 'Talk to Eunoia' },
  ],
  mentor: [{ to: '/mentor', icon: Users, label: 'My students' }],
  admin: [{ to: '/admin', icon: LayoutDashboard, label: 'Overview' }],
}

const initials = (name = '') =>
  name.split(/[\s._]+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('') || '?'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const links = NAVS[user?.role] || []

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="shell">
      <aside className="side">
        <Logo />

        <nav className="nav" aria-label="Main">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}>
              <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="who">
          <span className="avatar" aria-hidden="true">{initials(user?.full_name)}</span>
          <div style={{ minWidth: 0 }}>
            <div className="who-name">{user?.full_name || 'Account'}</div>
            <div className="who-role">{user?.role}</div>
          </div>
          <button className="signout" onClick={handleLogout} aria-label="Sign out" title="Sign out">
            <LogOut size={17} strokeWidth={1.75} />
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}