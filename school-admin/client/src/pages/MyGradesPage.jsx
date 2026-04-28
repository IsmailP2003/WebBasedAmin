import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { gradesAPI } from '../api/axios'
import { BarChart2, PenLine, Trophy, Target, BookOpen, GraduationCap } from 'lucide-react'

const TYPE_COLORS = {
  exam: '#6366f1',
  quiz: '#0ea5e9',
  assignment: '#f59e0b',
  project: '#10b981',
  midterm: '#ec4899',
  final: '#ef4444',
  other: '#8b5cf6',
}

function gradeInfo(pct) {
  if (pct >= 90) return { letter: 'A+', cls: 'success' }
  if (pct >= 80) return { letter: 'A',  cls: 'success' }
  if (pct >= 70) return { letter: 'B',  cls: 'info' }
  if (pct >= 60) return { letter: 'C',  cls: 'warning' }
  if (pct >= 50) return { letter: 'D',  cls: 'warning' }
  return { letter: 'F', cls: 'danger' }
}

function BarChart({ grades }) {
  if (!grades.length) return null
  const max = 100
  return (
    <div style={{ marginTop: '0.5rem' }}>
      {grades.slice(0, 10).map((g, i) => {
        const pct = g.maxScore > 0 ? Math.round((g.score / g.maxScore) * 100) : 0
        const { letter, cls } = gradeInfo(pct)
        const barColor = cls === 'success' ? '#16a34a' : cls === 'info' ? '#0ea5e9' : cls === 'warning' ? '#d97706' : '#dc2626'
        return (
          <div key={g._id} style={{ marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                <span style={{
                  display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                  background: TYPE_COLORS[g.assessmentType] || '#6b7280', flexShrink: 0,
                }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {g.assessmentName}
                </span>
                <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'capitalize', flexShrink: 0 }}>
                  {g.assessmentType}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: barColor }}>{pct}%</span>
                <span className={`badge badge-${cls}`} style={{ minWidth: 28, textAlign: 'center', fontSize: '0.65rem' }}>{letter}</span>
              </div>
            </div>
            <div style={{ height: 7, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${pct}%`, background: barColor,
                borderRadius: 999, transition: 'width 0.6s ease',
              }} />
            </div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.1rem', textAlign: 'right' }}>
              {g.score}/{g.maxScore} · {g.course?.courseCode || '—'}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function MyGradesPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ type: '', course: '' })
  const [sortBy, setSortBy] = useState('date') // 'date' | 'score' | 'name'

  useEffect(() => {
    gradesAPI.get({ limit: 100 })
      .then(r => setGrades(r.data.data))
      .catch(() => toast.error('Failed to load grades'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Derived filters
  const courses = [...new Set(grades.map(g => g.course?.courseCode).filter(Boolean))]
  const types = [...new Set(grades.map(g => g.assessmentType).filter(Boolean))]

  const filtered = grades
    .filter(g => (!filter.type || g.assessmentType === filter.type))
    .filter(g => (!filter.course || g.course?.courseCode === filter.course))
    .sort((a, b) => {
      if (sortBy === 'score') {
        const pa = a.maxScore > 0 ? a.score / a.maxScore : 0
        const pb = b.maxScore > 0 ? b.score / b.maxScore : 0
        return pb - pa
      }
      if (sortBy === 'name') return a.assessmentName.localeCompare(b.assessmentName)
      return new Date(b.createdAt) - new Date(a.createdAt)
    })

  // Stats
  const avg = filtered.length
    ? Math.round(filtered.reduce((s, g) => s + (g.maxScore > 0 ? (g.score / g.maxScore) * 100 : 0), 0) / filtered.length)
    : null

  const best = filtered.length
    ? filtered.reduce((best, g) => {
        const p = g.maxScore > 0 ? (g.score / g.maxScore) * 100 : 0
        const bp = best.maxScore > 0 ? (best.score / best.maxScore) * 100 : 0
        return p > bp ? g : best
      }, filtered[0])
    : null

  const distribution = filtered.reduce((acc, g) => {
    const p = g.maxScore > 0 ? (g.score / g.maxScore) * 100 : 0
    const { letter } = gradeInfo(p)
    acc[letter] = (acc[letter] || 0) + 1
    return acc
  }, {})

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <h2 className="page-title">My Grades</h2>
          <p className="page-subtitle">Track your academic performance across all courses</p>
        </div>
      </div>

      {/* Stats bar */}
      {grades.length > 0 && (
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card blue">
            <div className="stat-icon blue" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PenLine size={18} strokeWidth={1.75} /></div>
            <div className="stat-value">{grades.length}</div>
            <div className="stat-label">Total Assessments</div>
          </div>
          <div className="stat-card green">
            <div className="stat-icon green" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BarChart2 size={18} strokeWidth={1.75} /></div>
            <div className="stat-value">{avg ?? '—'}<span style={{ fontSize: '0.75em' }}>%</span></div>
            <div className="stat-label">Average Score</div>
          </div>
          <div className="stat-card amber">
            <div className="stat-icon amber" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trophy size={18} strokeWidth={1.75} /></div>
            <div className="stat-value">{best ? Math.round((best.score / best.maxScore) * 100) : '—'}<span style={{ fontSize: '0.75em' }}>%</span></div>
            <div className="stat-label">Best Score</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Target size={18} strokeWidth={1.75} /></div>
            <div className="stat-value" style={{ fontSize: '1.2rem' }}>
              {avg !== null ? gradeInfo(avg).letter : '—'}
            </div>
            <div className="stat-label">Overall Grade</div>
          </div>
        </div>
      )}

      <div className="two-col" style={{ alignItems: 'start' }}>
        {/* Grade list */}
        <div className="card" style={{ flex: '2 1 0' }}>
          {/* Filters + sort */}
          <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="form-select" style={{ flex: 1, minWidth: 140 }}
              value={filter.type} onChange={e => setFilter(p => ({ ...p, type: e.target.value }))}
              aria-label="Filter by type">
              <option value="">All types</option>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="form-select" style={{ flex: 1, minWidth: 140 }}
              value={filter.course} onChange={e => setFilter(p => ({ ...p, course: e.target.value }))}
              aria-label="Filter by course">
              <option value="">All courses</option>
              {courses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="form-select" style={{ flex: 1, minWidth: 120 }}
              value={sortBy} onChange={e => setSortBy(e.target.value)}
              aria-label="Sort by">
              <option value="date">Recent first</option>
              <option value="score">Best score</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><GraduationCap size={32} strokeWidth={1.25} /></div>
              <h3>No grades yet</h3>
              <p>Your grades will appear here once your instructor records them.</p>
            </div>
          ) : (
            <BarChart grades={filtered} />
          )}

          {filtered.length > 10 && (
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', marginTop: '0.5rem' }}>
              Showing top 10 of {filtered.length} assessments
            </p>
          )}
        </div>

        {/* Grade distribution + breakdown by type */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Distribution */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Target size={14} strokeWidth={2} />Grade Distribution</div>
            {['A+', 'A', 'B', 'C', 'D', 'F'].map(letter => {
              const count = distribution[letter] || 0
              const pct = filtered.length > 0 ? Math.round((count / filtered.length) * 100) : 0
              const color = letter === 'F' ? '#dc2626' : letter === 'D' ? '#d97706' : letter === 'C' ? '#d97706' : '#16a34a'
              return (
                <div key={letter} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ width: 24, fontWeight: 700, fontSize: '0.78rem', color }}>{letter}</span>
                  <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.5s' }} />
                  </div>
                  <span style={{ minWidth: 28, textAlign: 'right', fontSize: '0.72rem', color: '#64748b' }}>{count}</span>
                </div>
              )
            })}
          </div>

          {/* By assessment type */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><BookOpen size={14} strokeWidth={2} />By Type</div>
            {types.length === 0 ? (
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center' }}>No data yet</p>
            ) : types.map(type => {
              const typeGrades = filtered.filter(g => g.assessmentType === type)
              const typeAvg = typeGrades.length
                ? Math.round(typeGrades.reduce((s, g) => s + (g.maxScore > 0 ? (g.score / g.maxScore) * 100 : 0), 0) / typeGrades.length)
                : 0
              return (
                <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', textTransform: 'capitalize' }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: TYPE_COLORS[type] || '#6b7280' }} />
                    {type} ({typeGrades.length})
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: typeAvg >= 70 ? '#16a34a' : typeAvg >= 50 ? '#d97706' : '#dc2626' }}>
                    {typeAvg}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
