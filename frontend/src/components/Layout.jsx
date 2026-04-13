import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/useAuth'
import { LayoutDashboard, MessageCircle, Users, BookOpen, ClipboardList, LogOut } from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const navs = {
    student: [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/survey', icon: <ClipboardList size={18} />, label: 'Weekly Check-in' },
  { to: '/chat', icon: <MessageCircle size={18} />, label: 'Talk to Eunoia' },
],

  }

  const links = navs[user?.role] || []

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: 'white', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: '28px 16px',
        position: 'fixed', height: '100vh', zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 36, paddingLeft: 8 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--sage-dark)' }}>
            Eunoia
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
            Well-being Assistant
          </div>
        </div>

        {/* User pill */}
        <div style={{
          background: 'var(--sage-light)', borderRadius: 10, padding: '10px 12px',
          marginBottom: 28,
        }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{user?.full_name || 'User'}</div>
          <div style={{
            fontSize: 11, color: 'var(--sage-dark)', textTransform: 'capitalize', marginTop: 2
          }}>{user?.role}</div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {links.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              textDecoration: 'none',
              background: isActive ? 'var(--sage-light)' : 'transparent',
              color: isActive ? 'var(--sage-dark)' : 'var(--muted)',
              transition: 'all .15s',
            })}>
              {icon}{label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 12px', borderRadius: 8, fontSize: 13,
          border: 'none', background: 'transparent', cursor: 'pointer',
          color: 'var(--muted)', width: '100%',
        }}>
          <LogOut size={16} /> Sign out
        </button>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 220, flex: 1, padding: '36px 40px', maxWidth: 1200 }}>
        <Outlet />
      </main>
    </div>
  )
}