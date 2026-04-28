import { useEffect, useState } from 'react'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement, LineElement, PointElement, Filler,
} from 'chart.js'
import { analyticsAPI } from '../api/axios'
import { useAuth } from '../context/AuthContext'
import {
  GraduationCap, BookOpen, ClipboardList, BarChart2,
  ClipboardCheck, PenLine, Users, AlertTriangle, School,
  TrendingUp, Clock, Inbox, User
} from 'lucide-react'

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, LineElement, PointElement, Filler
)

const baseScales = {
  x: { ticks: { color: '#64748B', font: { family: 'DM Sans', size: 11 } }, grid: { color: 'rgba(0,0,0,0.04)' } },
  y: { ticks: { color: '#64748B', font: { family: 'DM Sans', size: 11 } }, grid: { color: 'rgba(0,0,0,0.06)' } },
}
const baseLegend = { labels: { color: '#64748B', font: { family: 'DM Sans', size: 11 } } }

function StatCard({ icon, label, value, color, suffix = '', trend }) {
  return (
    <div className={`stat-card ${color}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className={`stat-icon ${color}`} aria-hidden="true">{icon}</div>
        {trend && <span className="stat-trend">↑ {trend}</span>}
      </div>
      <div className="stat-value">{value ?? <span style={{ opacity: 0.3 }}>—</span>}{suffix}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// ── Teacher-specific dashboard ──────────────────────────────────────────────
function TeacherDashboard({ user }) {
  const [attData, setAttData]   = useState(null)
  const [summary, setSummary]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      analyticsAPI.summary(),
      analyticsAPI.attendanceRate(),
    ]).then(([s, a]) => {
      setSummary(s.data.data)
      setAttData(a.data.data)
    }).catch(err => {
      console.error('Teacher dashboard error:', err)
      setError(err.response?.data?.message || 'Failed to load dashboard data. Please try refreshing.')
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  if (error) return (
    <div className="page-enter">
      <div style={{
        padding: '2rem', background: 'var(--danger-light)', border: '1px solid var(--danger)',
        borderRadius: 'var(--radius-lg)', color: 'var(--danger)', textAlign: 'center',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}><AlertTriangle size={32} strokeWidth={1.5} /></div>
        <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Dashboard failed to load</div>
        <div style={{ fontSize: 'var(--text-sm)', opacity: 0.8 }}>{error}</div>
        <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    </div>
  )

  // Filter att data to only this teacher's courses if possible (server already does it for all, but show all)
  const attRates = attData?.map(d => d.rate) ?? []
  const attMin = attRates.length
    ? Math.max(50, Math.floor(Math.min(...attRates) / 5) * 5 - 5)
    : 0

  const attendanceChartData = attData?.length ? {
    labels: attData.map(d => d.courseCode),
    datasets: [{
      label: 'Attendance %',
      data: attData.map(d => d.rate),
      backgroundColor: attData.map(d =>
        d.rate >= 90 ? 'rgba(34,197,94,0.80)' :
        d.rate >= 75 ? 'rgba(245,158,11,0.80)' :
        'rgba(239,68,68,0.80)'
      ),
      borderColor: attData.map(d =>
        d.rate >= 90 ? '#22C55E' :
        d.rate >= 75 ? '#F59E0B' :
        '#EF4444'
      ),
      borderWidth: 2, borderRadius: 8,
    }],
  } : null

  return (
    <div className="page-enter">
      {/* Welcome banner */}
      <div style={{
        padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
        background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
        borderRadius: 'var(--radius-lg)', color: '#fff',
        display: 'flex', alignItems: 'center', gap: '1rem',
      }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <User size={22} strokeWidth={1.75} style={{ color: '#fff' }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>Welcome back, {user.name}!</div>
          <div style={{ opacity: 0.85, fontSize: 'var(--text-sm)', marginTop: '0.25rem' }}>
            Here's an overview of attendance across all courses.
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <StatCard icon={<GraduationCap size={20} strokeWidth={1.75} />} label="Total Students"   value={summary?.totalStudents}          color="blue"  />
        <StatCard icon={<BookOpen size={20} strokeWidth={1.75} />}      label="Active Courses"    value={summary?.totalCourses}            color="green" />
        <StatCard icon={<ClipboardList size={20} strokeWidth={1.75} />} label="Attendance Rate"   value={summary?.overallAttendanceRate}   suffix="%" color="amber" />
        <StatCard icon={<BarChart2 size={20} strokeWidth={1.75} />}     label="Average Grade"     value={summary?.avgGrade}                suffix="%" color="cyan"  />
      </div>

      {/* Attendance chart */}
      {attendanceChartData ? (
        <div className="chart-card" style={{ marginBottom: '1.5rem' }}>
          <div className="chart-title" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><BarChart2 size={14} strokeWidth={2} />Attendance Rate by Course</span>
            <div style={{ display: 'flex', gap: '0.75rem', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              <span style={{ display:'flex', alignItems:'center', gap:'0.3rem' }}>
                <span style={{ width:8, height:8, borderRadius:2, background:'#22C55E', display:'inline-block' }} />≥90%
              </span>
              <span style={{ display:'flex', alignItems:'center', gap:'0.3rem' }}>
                <span style={{ width:8, height:8, borderRadius:2, background:'#F59E0B', display:'inline-block' }} />75–89%
              </span>
              <span style={{ display:'flex', alignItems:'center', gap:'0.3rem' }}>
                <span style={{ width:8, height:8, borderRadius:2, background:'#EF4444', display:'inline-block' }} />&lt;75%
              </span>
            </div>
          </div>
          <div style={{ height: 220 }}>
            <Bar data={attendanceChartData} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    title: ctx => attData[ctx[0].dataIndex]?.name || ctx[0].label,
                    label: ctx => ` ${ctx.parsed.y}%  (${ctx.parsed.y >= 90 ? 'Excellent' : ctx.parsed.y >= 75 ? 'Satisfactory' : 'Below threshold'})`,
                  },
                },
              },
              scales: {
                x: { ...baseScales.x },
                y: {
                  ...baseScales.y,
                  min: attMin, max: 100,
                  ticks: { ...baseScales.y.ticks, callback: v => `${v}%`, stepSize: 5 },
                },
              },
            }} />
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
            Y-axis starts at {attMin}% — zoomed to show differences between courses
          </div>
        </div>
      ) : (
        <div className="chart-card" style={{ marginBottom: '1.5rem' }}>
          <div className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><BarChart2 size={14} strokeWidth={2} />Attendance Rate by Course</div>
          <div className="empty-state" style={{ padding: '2rem' }}>
            <div className="empty-state-icon"><ClipboardList size={28} strokeWidth={1.25} /></div>
            <p>No attendance data yet. Start marking attendance in the Attendance section.</p>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="two-col">
        {[
          { Icon: ClipboardCheck, title: 'Mark Attendance', desc: 'Record today\'s class attendance', href: '/attendance', color: 'blue' },
          { Icon: PenLine,        title: 'Enter Grades',    desc: 'Add or update student grades',     href: '/grades',     color: 'green' },
          { Icon: Users,          title: 'View Students',   desc: 'Browse your enrolled students',    href: '/students',   color: 'amber' },
          { Icon: AlertTriangle,  title: 'At-Risk Students',desc: 'Check for attendance or grade alerts', href: '/at-risk', color: 'danger' },
        ].map(card => (
          <a key={card.title} href={card.href} style={{ textDecoration: 'none' }}>
            <div className={`stat-card ${card.color}`} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem' }}>
              <div className={`stat-icon ${card.color}`} style={{ fontSize: '1.5rem', flexShrink: 0 }}><card.Icon size={20} strokeWidth={1.75} /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>{card.title}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{card.desc}</div>
              </div>
              <span style={{ marginLeft: 'auto', opacity: 0.4 }}>→</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

// ── Admin dashboard ──────────────────────────────────────────────────────────
function AdminDashboard() {
  const [summary, setSummary]   = useState(null)
  const [attData, setAttData]   = useState(null)
  const [gradeData, setGradeData] = useState(null)
  const [enrolData, setEnrolData] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      analyticsAPI.summary(),
      analyticsAPI.attendanceRate(),
      analyticsAPI.gradeDistribution(),
      analyticsAPI.monthlyEnrolments(),
    ]).then(([s, a, g, e]) => {
      setSummary(s.data.data)
      setAttData(a.data.data)
      setGradeData(g.data.data)
      setEnrolData(e.data.data)
    }).catch(err => {
      console.error('Admin dashboard error:', err)
      setError(err.response?.data?.message || 'Failed to load dashboard data. Please try refreshing.')
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  if (error) return (
    <div className="page-enter">
      <div style={{
        padding: '2rem', background: 'var(--danger-light)', border: '1px solid var(--danger)',
        borderRadius: 'var(--radius-lg)', color: 'var(--danger)', textAlign: 'center',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}><AlertTriangle size={32} strokeWidth={1.5} /></div>
        <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Dashboard failed to load</div>
        <div style={{ fontSize: 'var(--text-sm)', opacity: 0.8 }}>{error}</div>
        <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    </div>
  )

  const attRates = attData?.map(d => d.rate) ?? []
  const attMin = attRates.length
    ? Math.max(50, Math.floor(Math.min(...attRates) / 5) * 5 - 5)
    : 0

  const attendanceChartData = attData?.length ? {
    labels: attData.map(d => d.courseCode),
    datasets: [{
      label: 'Attendance %',
      data: attData.map(d => d.rate),
      backgroundColor: attData.map(d =>
        d.rate >= 90 ? 'rgba(34,197,94,0.80)' :
        d.rate >= 75 ? 'rgba(245,158,11,0.80)' :
        'rgba(239,68,68,0.80)'
      ),
      borderColor: attData.map(d =>
        d.rate >= 90 ? '#22C55E' :
        d.rate >= 75 ? '#F59E0B' :
        '#EF4444'
      ),
      borderWidth: 2, borderRadius: 8,
    }],
  } : null

  const gradeChartData = gradeData ? {
    labels: Object.keys(gradeData),
    datasets: [{
      data: Object.values(gradeData),
      backgroundColor: ['#22C55E', '#4F8EF7', '#F59E0B', '#FB923C', '#A78BFA', '#EF4444'],
      borderWidth: 0, hoverOffset: 10,
    }],
  } : null

  const enrolChartData = enrolData?.length ? {
    labels: enrolData.map(d => d.label),
    datasets: [{
      label: 'New Enrolments',
      data: enrolData.map(d => d.count),
      borderColor: '#4F8EF7',
      backgroundColor: 'rgba(79,142,247,0.08)',
      fill: true, tension: 0.45,
      pointBackgroundColor: '#4F8EF7', pointRadius: 4, pointHoverRadius: 6,
    }],
  } : null

  return (
    <div className="page-enter">
      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon={<GraduationCap size={20} strokeWidth={1.75} />} label="Active Students" value={summary?.totalStudents}          color="blue"  />
        <StatCard icon={<BookOpen size={20} strokeWidth={1.75} />}      label="Active Courses"  value={summary?.totalCourses}            color="green" />
        <StatCard icon={<ClipboardList size={20} strokeWidth={1.75} />} label="Attendance Rate" value={summary?.overallAttendanceRate}   suffix="%" color="amber" />
        <StatCard icon={<BarChart2 size={20} strokeWidth={1.75} />}     label="Average Grade"   value={summary?.avgGrade}                suffix="%" color="cyan"  />
      </div>

      {/* Row 1: Bar + Doughnut */}
      <div className="charts-grid" style={{ marginBottom: '1.5rem' }}>
        {attendanceChartData ? (
          <div className="chart-card">
            <div className="chart-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><BarChart2 size={14} strokeWidth={2} />Attendance Rate by Course</span>
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: '#22C55E', display: 'inline-block' }} />≥90%
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: '#F59E0B', display: 'inline-block' }} />75–89%
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: '#EF4444', display: 'inline-block' }} />&lt;75%
                </span>
              </div>
            </div>
            <div style={{ height: 220 }}>
              <Bar data={attendanceChartData} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      title: ctx => attData[ctx[0].dataIndex]?.name || ctx[0].label,
                      label: ctx => ` ${ctx.parsed.y}%  (${ctx.parsed.y >= 90 ? 'Excellent' : ctx.parsed.y >= 75 ? 'Satisfactory' : 'Below threshold'})`,
                    },
                  },
                },
                scales: {
                  x: { ...baseScales.x },
                  y: {
                    ...baseScales.y,
                    min: attMin, max: 100,
                    ticks: { ...baseScales.y.ticks, callback: v => `${v}%`, stepSize: 5 },
                  },
                },
              }} />
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
              Y-axis starts at {attMin}% — zoomed to show differences between courses
            </div>
          </div>
        ) : <div className="chart-card"><div className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><BarChart2 size={14} strokeWidth={2} />Attendance Rate</div><div className="empty-state" style={{ padding: '2rem' }}><p>No attendance data yet</p></div></div>}

        {gradeChartData ? (
          <div className="chart-card">
            <div className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><GraduationCap size={14} strokeWidth={2} />Grade Distribution</div>
            <div style={{ height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Doughnut data={gradeChartData} options={{
                responsive: true, maintainAspectRatio: false, cutout: '62%',
                plugins: { legend: { position: 'right', labels: { ...baseLegend.labels, padding: 14 } } },
              }} />
            </div>
          </div>
        ) : null}
      </div>

      {/* Row 2: Line chart + Activity */}
      <div className="two-col" style={{ marginBottom: '1.5rem' }}>
        {enrolChartData ? (
          <div className="chart-card">
            <div className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><TrendingUp size={14} strokeWidth={2} />Monthly Enrolments</div>
            <div style={{ height: 200 }}>
              <Line data={enrolChartData} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: baseScales,
              }} />
            </div>
          </div>
        ) : (
          <div className="chart-card">
            <div className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><TrendingUp size={14} strokeWidth={2} />Monthly Enrolments</div>
            <div className="empty-state" style={{ padding: '2rem' }}><p>No enrolment history yet</p></div>
          </div>
        )}

        <div className="chart-card" style={{ overflow: 'hidden' }}>
          <div className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={14} strokeWidth={2} />Recent Activity</div>
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {summary?.recentActivity?.length > 0 ? (
              <div className="activity-list">
                {summary.recentActivity.slice(0, 8).map((log, i) => (
                  <div key={i} className="activity-item">
                    <div className="activity-dot" />
                    <div>
                      <div className="activity-text">
                        <strong>{log.performedBy?.name || 'System'}</strong>{' '}
                        <span style={{ color: 'var(--text-secondary)' }}>— {log.details}</span>
                      </div>
                      <div className="activity-time">
                        {timeAgo(log.createdAt)} · <span style={{ textTransform: 'capitalize' }}>{log.performedBy?.role}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '1.5rem' }}>
                <div className="empty-state-icon"><Inbox size={28} strokeWidth={1.25} /></div>
                <p>No activity yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main export — picks the right dashboard by role ──────────────────────────
export default function DashboardPage() {
  const { user } = useAuth()
  if (user?.role === 'teacher') return <TeacherDashboard user={user} />
  return <AdminDashboard />
}
