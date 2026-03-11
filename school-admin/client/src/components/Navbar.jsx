import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'

const pageTitles = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of your school administration system' },
  '/students': { title: 'Students', subtitle: 'Manage student records and enrolments' },
  '/courses': { title: 'Courses', subtitle: 'Manage courses and class assignments' },
  '/attendance': { title: 'Attendance', subtitle: 'Track and record student attendance' },
  '/grades': { title: 'Grades', subtitle: 'Log and view student grades and assessments' },
  '/evaluation': { title: 'Evaluation', subtitle: 'System Usability Scale (SUS) evaluation' },
  '/audit': { title: 'Audit Log', subtitle: 'System activity and change history' },
  '/users': { title: 'User Management', subtitle: 'Create, edit, and manage system accounts' },
  '/announcements': { title: 'Announcements', subtitle: 'School-wide announcements and notices' },
  '/at-risk': { title: 'At-Risk Students', subtitle: 'Identify students needing intervention' },
  '/timetable': { title: 'Timetable', subtitle: 'Weekly schedule for all courses' },
  '/my-dashboard': { title: 'My Dashboard', subtitle: 'Your personal learning overview' },
  '/my-grades': { title: 'My Grades', subtitle: 'Your grades and assessment results' },
  '/my-attendance': { title: 'My Attendance', subtitle: 'Your attendance records' },
}

export default function Navbar() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const info = pageTitles[pathname] || { title: 'SchoolAdmin', subtitle: '' }

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <header style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      padding: '1rem 2rem',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '1rem', flexWrap: 'wrap',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {info.title}
        </h1>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
          {info.subtitle}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'right' }}>
          <div>{dateStr}</div>
          <div style={{ color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'capitalize' }}>
            Logged in as <span style={{ color: 'var(--accent)' }}>{user?.role}</span>
          </div>
        </div>
        <NotificationBell />
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'var(--accent)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 'var(--text-base)', flexShrink: 0,
          boxShadow: '0 2px 8px rgba(79,142,247,0.4)',
        }}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
