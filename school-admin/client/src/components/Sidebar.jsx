import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/* ─── SVG Icons (outline, 16×16) ─── */
const Icons = {
  dashboard: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  students: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  courses: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
  attendance: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  grades: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  ),
  timetable: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  announcements: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  atrisk: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  users: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  audit: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  evaluation: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
}

/* ─── Nav structure per role ─── */
const navGroups = {
  admin: [
    { heading: 'Overview', items: [
      { to: '/dashboard',     label: 'Dashboard',     Icon: Icons.dashboard },
      { to: '/announcements', label: 'Announcements', Icon: Icons.announcements },
      { to: '/timetable',     label: 'Timetable',     Icon: Icons.timetable },
    ]},
    { heading: 'Academic Records', items: [
      { to: '/students',   label: 'Students',   Icon: Icons.students },
      { to: '/courses',    label: 'Courses',    Icon: Icons.courses },
      { to: '/attendance', label: 'Attendance', Icon: Icons.attendance },
      { to: '/grades',     label: 'Gradebook',  Icon: Icons.grades },
      { to: '/at-risk',    label: 'At-Risk',    Icon: Icons.atrisk },
    ]},
    { heading: 'Administration', items: [
      { to: '/users',      label: 'Users',      Icon: Icons.users },
      { to: '/audit',      label: 'Audit Log',  Icon: Icons.audit },
      { to: '/evaluation', label: 'Evaluation', Icon: Icons.evaluation },
    ]},
  ],
  teacher: [
    { heading: 'Overview', items: [
      { to: '/dashboard',     label: 'Dashboard',     Icon: Icons.dashboard },
      { to: '/announcements', label: 'Announcements', Icon: Icons.announcements },
      { to: '/timetable',     label: 'Timetable',     Icon: Icons.timetable },
    ]},
    { heading: 'Academic Records', items: [
      { to: '/students',   label: 'Students',   Icon: Icons.students },
      { to: '/courses',    label: 'Courses',    Icon: Icons.courses },
      { to: '/attendance', label: 'Attendance', Icon: Icons.attendance },
      { to: '/grades',     label: 'Gradebook',  Icon: Icons.grades },
      { to: '/at-risk',    label: 'At-Risk',    Icon: Icons.atrisk },
      { to: '/evaluation', label: 'Evaluation', Icon: Icons.evaluation },
    ]},
  ],
  student: [
    { heading: 'My Portal', items: [
      { to: '/my-dashboard',  label: 'Dashboard',   Icon: Icons.dashboard },
      { to: '/my-grades',     label: 'My Grades',   Icon: Icons.grades },
      { to: '/my-attendance', label: 'Attendance',  Icon: Icons.attendance },
    ]},
    { heading: 'School', items: [
      { to: '/announcements', label: 'Announcements', Icon: Icons.announcements },
      { to: '/timetable',     label: 'Timetable',     Icon: Icons.timetable },
      { to: '/evaluation',    label: 'Evaluation',    Icon: Icons.evaluation },
    ]},
  ],
}

export default function Sidebar() {
  const { user } = useAuth()
  const groups = navGroups[user?.role] || []

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      background: '#0f2d26',
      borderRight: '1px solid rgba(255,255,255,0.04)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      zIndex: 100,
      /* Subtle inner shadow on right edge */
      boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.03), 4px 0 24px rgba(0,0,0,0.25)',
    }}>

      {/* ── Logo ── */}
      <div style={{
        padding: '1.125rem 1.25rem 1rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Logo mark */}
          <div style={{
            width: 36, height: 36, flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.06))',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.14)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
              <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
            </svg>
          </div>

          <div>
            <div style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: '0.95rem',
              fontWeight: 600,
              color: '#ffffff',
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
            }}>
              SchoolAdmin
            </div>
            <div style={{
              fontSize: '0.58rem',
              color: 'rgba(255,255,255,0.38)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              marginTop: '0.15rem',
            }}>
              Management System
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0.75rem 0.75rem',
        overflowX: 'hidden',
      }}>
        {groups.map((group, gi) => (
          <div key={group.heading} style={{ marginBottom: gi < groups.length - 1 ? '1rem' : 0 }}>
            {/* Group heading */}
            <div style={{
              fontSize: '0.58rem',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.25)',
              textTransform: 'uppercase',
              letterSpacing: '0.13em',
              padding: '0 0.5rem',
              marginBottom: '0.35rem',
            }}>
              {group.heading}
            </div>

            {/* Nav items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.05rem' }}>
              {group.items.map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.5rem 0.55rem 0.5rem 0.7rem',
                    borderRadius: 7,
                    fontSize: '0.82rem',
                    fontWeight: isActive ? 600 : 400,
                    transition: 'all 0.13s',
                    position: 'relative',
                    background: isActive
                      ? 'rgba(255,255,255,0.1)'
                      : 'transparent',
                    color: isActive ? '#ffffff' : 'rgba(255,255,255,0.48)',
                    textDecoration: 'none',
                    overflow: 'hidden',
                    boxShadow: isActive
                      ? 'inset 0 0 0 1px rgba(255,255,255,0.07)'
                      : 'none',
                  })}
                >
                  {({ isActive }) => (
                    <>
                      {/* Left accent line for active */}
                      {isActive && (
                        <span style={{
                          position: 'absolute',
                          left: 0, top: '20%', bottom: '20%',
                          width: 3,
                          background: 'linear-gradient(180deg, #4ade80, #34d399)',
                          borderRadius: '0 3px 3px 0',
                        }} />
                      )}

                      {/* Icon */}
                      <span style={{
                        flexShrink: 0,
                        opacity: isActive ? 1 : 0.55,
                        display: 'flex',
                        transition: 'opacity 0.13s',
                      }}>
                        <Icon />
                      </span>

                      {/* Label */}
                      <span style={{ lineHeight: 1 }}>{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div style={{
        padding: '0.75rem 1.25rem',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '0.6rem', color: 'rgba(255,255,255,0.22)',
        }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%',
            background: '#4ade80',
            boxShadow: '0 0 6px #4ade80',
          }} />
          <span>Academic Year 2025–26</span>
        </div>
      </div>
    </aside>
  )
}
