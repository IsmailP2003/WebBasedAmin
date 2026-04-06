import { useEffect, useState } from 'react'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement, LineElement, PointElement, Filler,
} from 'chart.js'
import { analyticsAPI } from '../api/axios'

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, LineElement, PointElement, Filler
)

const baseScales = {
  x: { ticks: { color: '#64748B', font: { family: 'Inter', size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
  y: { ticks: { color: '#64748B', font: { family: 'Inter', size: 11 } }, grid: { color: 'rgba(255,255,255,0.06)' } },
}
const baseLegend = { labels: { color: '#94A3B8', font: { family: 'Inter', size: 11 } } }

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

export default function DashboardPage() {
  const [summary, setSummary] = useState(null)
  const [attData, setAttData] = useState(null)
  const [gradeData, setGradeData] = useState(null)
  const [enrolData, setEnrolData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  // Compute zoomed Y-axis: start just below the lowest value so differences are visible
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
      fill: true,
      tension: 0.45,
      pointBackgroundColor: '#4F8EF7',
      pointRadius: 4,
      pointHoverRadius: 6,
    }],
  } : null

  return (
    <div className="page-enter">
      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon="👩‍🎓" label="Active Students" value={summary?.totalStudents}  color="blue"  />
        <StatCard icon="📚" label="Active Courses"  value={summary?.totalCourses}   color="green" />
        <StatCard icon="📋" label="Attendance Rate" value={summary?.overallAttendanceRate} suffix="%" color="amber" />
        <StatCard icon="📊" label="Average Grade"   value={summary?.avgGrade}        suffix="%" color="cyan"  />
      </div>

      {/* Row 1: Bar + Doughnut */}
      <div className="charts-grid" style={{ marginBottom: '1.5rem' }}>
        {attendanceChartData ? (
          <div className="chart-card">
            <div className="chart-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>📊 Attendance Rate by Course</span>
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
                      label: ctx => ` ${ctx.parsed.y}%  (${ctx.parsed.y >= 90 ? '✅ Excellent' : ctx.parsed.y >= 75 ? '📘 Satisfactory' : '⚠️ Below threshold'})`,
                    },
                  },
                },
                scales: {
                  x: { ...baseScales.x },
                  y: {
                    ...baseScales.y,
                    min: attMin,
                    max: 100,
                    ticks: {
                      ...baseScales.y.ticks,
                      callback: v => `${v}%`,
                      stepSize: 5,
                    },
                  },
                },
              }} />
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
              Y-axis starts at {attMin}% — zoomed to show differences between courses
            </div>
          </div>
        ) : <div className="chart-card"><div className="chart-title">📊 Attendance Rate</div><div className="empty-state" style={{ padding: '2rem' }}><p>No attendance data yet</p></div></div>}

        {gradeChartData ? (
          <div className="chart-card">
            <div className="chart-title">🎓 Grade Distribution</div>
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
            <div className="chart-title">📈 Monthly Enrolments</div>
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
            <div className="chart-title">📈 Monthly Enrolments</div>
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p>No enrolment history yet</p>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="chart-card" style={{ overflow: 'hidden' }}>
          <div className="chart-title">🕐 Recent Activity</div>
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
                <div className="empty-state-icon">📭</div>
                <p>No activity yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
