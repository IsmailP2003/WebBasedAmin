import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import NotificationBell from './NotificationBell'

const pageTitles = {
  '/dashboard':    { title: 'Dashboard',           subtitle: 'Academic overview and key metrics' },
  '/students':     { title: 'Student Registry',    subtitle: 'Manage enrolments and student records' },
  '/courses':      { title: 'Course Management',   subtitle: 'Courses, schedules, and materials' },
  '/attendance':   { title: 'Attendance Register', subtitle: 'Mark and review student attendance' },
  '/grades':       { title: 'Gradebook',           subtitle: 'Record and review assessments and grades' },
  '/evaluation':   { title: 'System Evaluation',   subtitle: 'System Usability Scale (SUS) questionnaire' },
  '/audit':        { title: 'Audit Log',           subtitle: 'System activity and change history' },
  '/users':        { title: 'User Management',     subtitle: 'Manage accounts and access control' },
  '/announcements':{ title: 'Announcements',       subtitle: 'School-wide notices and communications' },
  '/at-risk':      { title: 'At-Risk Monitoring',  subtitle: 'Identify students needing intervention' },
  '/timetable':    { title: 'Timetable',           subtitle: 'Weekly course schedule and room allocation' },
  '/my-dashboard': { title: 'My Dashboard',        subtitle: 'Your personal academic overview' },
  '/my-grades':    { title: 'My Grades',           subtitle: 'Assessment results and grade history' },
  '/my-attendance':{ title: 'My Attendance',       subtitle: 'Your attendance record' },
}

/* Role label map */
const ROLE_LABELS = { admin: 'Administrator', teacher: 'Faculty Member', student: 'Student' }

/* Role accent tabs — all pass 4.5:1 on white bg */
const ROLE_STYLE = {
  admin:   { color: '#8a6a10', bg: '#fdf3dc', border: '#e8c96a' },
  teacher: { color: '#0f5c4e', bg: '#e8f4f2', border: '#b2d8d3' },
  student: { color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
}

export default function Navbar() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const { success } = useToast()
  const navigate = useNavigate()
  const info = pageTitles[pathname] || { title: 'SchoolAdmin', subtitle: '' }
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleLogout = () => {
    setOpen(false); logout()
    success('You have been signed out.'); navigate('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const rs = ROLE_STYLE[user?.role] || ROLE_STYLE.student

  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      padding: '0 2rem',
      height: 56,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 50,
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      {/* Page title */}
      <div>
        <h1 style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: '1rem', fontWeight: 600,
          color: '#111827', lineHeight: 1, letterSpacing: '-0.01em',
        }}>
          {info.title}
        </h1>
        {info.subtitle && (
          <p style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: '0.15rem' }}>
            {info.subtitle}
          </p>
        )}
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Date */}
        <span style={{
          fontSize: '0.7rem', color: '#6b7280', fontWeight: 500,
          padding: '0.28rem 0.7rem',
          background: '#f3f4f6', borderRadius: 20,
          border: '1px solid #e5e7eb',
        }}>
          {today}
        </span>

        <NotificationBell />

        {/* Profile dropdown */}
        <div ref={ref} style={{ position: 'relative' }}>
          <button
            onClick={() => setOpen(p => !p)}
            aria-label="Open profile menu"
            aria-expanded={open}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.3rem 0.6rem 0.3rem 0.3rem',
              background: open ? '#f3f4f6' : 'transparent',
              border: '1px solid', borderColor: open ? '#d1d5db' : '#e5e7eb',
              borderRadius: 24, cursor: 'pointer', transition: 'all 0.14s',
            }}
            onMouseEnter={e => { if (!open) { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#d1d5db' }}}
            onMouseLeave={e => { if (!open) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#e5e7eb' }}}
          >
            {/* Avatar */}
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: '#0f2d26',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.65rem', fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.25 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#111827', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name?.split(' ')[0]}
              </div>
              <div style={{ fontSize: '0.62rem', color: rs.color, fontWeight: 700 }}>
                {ROLE_LABELS[user?.role]}
              </div>
            </div>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: '#9ca3af', transition: 'transform 0.14s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
              <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Dropdown */}
          {open && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 0.5rem)', right: 0,
              width: 248, background: '#fff',
              border: '1px solid #e5e7eb', borderRadius: 12,
              boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
              overflow: 'hidden', animation: 'fadeIn 0.12s ease', zIndex: 200,
            }}>
              {/* User info */}
              <div style={{ padding: '0.9rem 1rem', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: '#0f2d26',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.85rem', fontWeight: 800, color: '#fff', flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.email}
                    </div>
                    <span style={{
                      display: 'inline-block', marginTop: '0.25rem',
                      padding: '0.1rem 0.45rem',
                      background: rs.bg, border: `1px solid ${rs.border}`,
                      borderRadius: 4, fontSize: '0.6rem',
                      fontWeight: 700, color: rs.color,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                      {ROLE_LABELS[user?.role]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div style={{ padding: '0.35rem' }}>
                {[
                  { icon: '👤', label: 'My Profile',    sub: 'Account details',      action: null },
                  { icon: '🔔', label: 'Notifications', sub: 'Manage preferences',   action: null },
                  { icon: '📊', label: 'Dashboard',     sub: 'Go to overview',       action: () => { navigate(user?.role === 'student' ? '/my-dashboard' : '/dashboard'); setOpen(false) } },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={item.action || undefined}
                    disabled={!item.action}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem',
                      padding: '0.5rem 0.6rem',
                      background: 'none', border: 'none', borderRadius: 7,
                      cursor: item.action ? 'pointer' : 'default', textAlign: 'left',
                      transition: 'background 0.1s', opacity: item.action ? 1 : 0.45,
                    }}
                    onMouseEnter={e => { if (item.action) e.currentTarget.style.background = '#f3f4f6' }}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <span style={{ fontSize: '0.85rem', width: 20, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151' }}>{item.label}</div>
                      <div style={{ fontSize: '0.67rem', color: '#9ca3af' }}>{item.sub}</div>
                    </div>
                  </button>
                ))}

                <div style={{ height: 1, background: '#f3f4f6', margin: '0.3rem 0.25rem' }} />

                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.5rem 0.6rem',
                    background: 'none', border: 'none', borderRadius: 7,
                    cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <span style={{ fontSize: '0.85rem', width: 20, textAlign: 'center', flexShrink: 0 }}>→</span>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#991b1b' }}>Sign Out</div>
                    <div style={{ fontSize: '0.67rem', color: '#9ca3af' }}>End your session</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
