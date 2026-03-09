import { useEffect, useState } from 'react'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement,
} from 'chart.js'
import { analyticsAPI } from '../api/axios'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

const chartOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#94A3B8', font: { family: 'Inter', size: 11 } } } },
  scales: {
    x: { ticks: { color: '#64748B' }, grid: { color: 'rgba(255,255,255,0.04)' } },
    y: { ticks: { color: '#64748B' }, grid: { color: 'rgba(255,255,255,0.06)' } },
  },
}

function StatCard({ icon, label, value, color, suffix = '' }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className={`stat-icon ${color}`} aria-hidden="true">{icon}</div>
      <div className="stat-value">{value ?? '—'}{suffix}</div>
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [s, a, g] = await Promise.all([
          analyticsAPI.summary(),
          analyticsAPI.attendanceRate(),
          analyticsAPI.gradeDistribution(),
        ])
        setSummary(s.data.data)
        setAttData(a.data.data)
        setGradeData(g.data.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  const attendanceChartData = attData ? {
    labels: attData.map(d => d.courseCode),
    datasets: [{
      label: 'Attendance Rate (%)',
      data: attData.map(d => d.rate),
      backgroundColor: 'rgba(79,142,247,0.7)',
      borderColor: '#4F8EF7',
      borderWidth: 2,
      borderRadius: 6,
    }],
  } : null

  const gradeChartData = gradeData ? {
    labels: Object.keys(gradeData),
    datasets: [{
      data: Object.values(gradeData),
      backgroundColor: ['#22C55E','#4F8EF7','#F59E0B','#FB923C','#A78BFA','#EF4444'],
      borderWidth: 0,
      hoverOffset: 8,
    }],
  } : null

  return (
    <div className="page-enter">
      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon="👩‍🎓" label="Active Students" value={summary?.totalStudents} color="blue" />
        <StatCard icon="📚" label="Active Courses"  value={summary?.totalCourses}  color="green" />
        <StatCard icon="📋" label="Attendance Rate" value={summary?.overallAttendanceRate} suffix="%" color="amber" />
        <StatCard icon="📊" label="Average Grade"   value={summary?.avgGrade}       suffix="%" color="cyan" />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {attendanceChartData && (
          <div className="chart-card">
            <div className="chart-title">📊 Attendance Rate by Course</div>
            <div style={{ height: 220 }}>
              <Bar data={attendanceChartData} options={{ ...chartOpts,
                plugins: { ...chartOpts.plugins, legend: { display: false } },
              }} />
            </div>
          </div>
        )}
        {gradeChartData && (
          <div className="chart-card">
            <div className="chart-title">🎓 Grade Distribution</div>
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Doughnut data={gradeChartData} options={{
                responsive: true, maintainAspectRatio: false, cutout: '60%',
                plugins: { legend: { position: 'right', labels: { color: '#94A3B8', font: { family: 'Inter', size: 10 }, padding: 12 } } },
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="chart-card">
        <div className="chart-title">🕐 Recent Activity</div>
        {summary?.recentActivity?.length > 0 ? (
          <div className="activity-list">
            {summary.recentActivity.map((log, i) => (
              <div key={i} className="activity-item">
                <div className="activity-dot" />
                <div>
                  <div className="activity-text">
                    <strong>{log.performedBy?.name || 'System'}</strong> — {log.details}
                  </div>
                  <div className="activity-time">{timeAgo(log.createdAt)} · {log.performedBy?.role}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <div className="empty-state-icon">📭</div>
            <p>No activity yet. Start using the system to see logs here.</p>
          </div>
        )}
      </div>
    </div>
  )
}
