import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const navItems = [
  { to: '/dashboard',  label: 'Dashboard',  icon: '📊', roles: ['admin','teacher','student'] },
  { to: '/students',   label: 'Students',   icon: '👩‍🎓', roles: ['admin','teacher'] },
  { to: '/courses',    label: 'Courses',    icon: '📚', roles: ['admin','teacher'] },
  { to: '/attendance', label: 'Attendance', icon: '📋', roles: ['admin','teacher'] },
  { to: '/grades',     label: 'Grades',     icon: '📝', roles: ['admin','teacher'] },
  { to: '/evaluation', label: 'Evaluation', icon: '⭐', roles: ['admin','teacher','student'] },
  { to: '/audit',      label: 'Audit Log',  icon: '🔍', roles: ['admin'] },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { success } = useToast()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    success('Logged out successfully')
    navigate('/login')
  }

  const visible = navItems.filter(item => item.roles.includes(user?.role))

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, bottom: 0,
      zIndex: 100, overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 38, height: 38, background: 'var(--accent)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', fontWeight: 800, color: '#fff', flexShrink: 0,
          }}>S</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>SchoolAdmin</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Administration System</div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 0.75rem', marginBottom: '0.5rem' }}>
          Navigation
        </div>
        {visible.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.65rem 0.75rem', borderRadius: 'var(--radius)',
              fontSize: 'var(--text-sm)', fontWeight: 500, transition: 'var(--transition)',
              marginBottom: '0.25rem',
              background: isActive ? 'var(--accent-light)' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
              textDecoration: 'none',
            })}
          >
            <span style={{ fontSize: '1rem', width: 20, textAlign: 'center' }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--accent-light)', color: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 'var(--text-sm)', flexShrink: 0,
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {user?.role}
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
          🚪 Sign Out
        </button>
      </div>
    </aside>
  )
}
