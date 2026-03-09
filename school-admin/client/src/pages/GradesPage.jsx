import { useEffect, useState, useCallback } from 'react'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { gradesAPI, studentsAPI, coursesAPI } from '../api/axios'

const TYPES = ['assignment','exam','quiz','project','presentation','other']

function LetterBadge({ letter }) {
  const cls = letter?.startsWith('A') ? 'grade-A' : letter === 'B' ? 'grade-B' : letter === 'C' ? 'grade-C' : letter === 'D' ? 'grade-D' : 'grade-F'
  return <span className={`grade-badge ${cls}`}>{letter}</span>
}

const emptyForm = { student:'', course:'', assessmentName:'', assessmentType:'assignment', score:'', maxScore:'', feedback:'' }

export default function GradesPage() {
  const { user } = useAuth()
  const toast = useToast()
  const isAdmin = user?.role === 'admin'

  const [grades, setGrades] = useState([])
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ studentId: '', courseId: '' })
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter.studentId) params.studentId = filter.studentId
      if (filter.courseId) params.courseId = filter.courseId
      const [g, s, c] = await Promise.all([
        gradesAPI.get(params),
        students.length === 0 ? studentsAPI.getAll({ limit: 200 }) : Promise.resolve({ data: { data: students } }),
        courses.length === 0 ? coursesAPI.getAll() : Promise.resolve({ data: { data: courses } }),
      ])
      setGrades(g.data.data)
      if (students.length === 0) setStudents(s.data.data)
      if (courses.length === 0) setCourses(c.data.data)
    } catch { toast.error('Failed to load grades') }
    finally { setLoading(false) }
  }, [filter])

  useEffect(() => { load() }, [load])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (Number(form.score) > Number(form.maxScore)) {
      toast.error('Score cannot exceed max score'); return
    }
    setSubmitting(true)
    try {
      await gradesAPI.create(form)
      toast.success('Grade added!')
      setModal(null); setForm(emptyForm); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this grade?')) return
    try { await gradesAPI.delete(id); toast.success('Grade deleted'); load() }
    catch { toast.error('Delete failed') }
  }

  const pct = (score, max) => max > 0 ? Math.round((score / max) * 100) : 0
  const letterGrade = (p) => p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B' : p >= 60 ? 'C' : p >= 50 ? 'D' : 'F'

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Grades</h2>
          <p className="page-subtitle">{grades.length} grade records</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')} aria-label="Add grade">＋ Add Grade</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Filter by Student</label>
            <select className="form-select" value={filter.studentId} onChange={e => setFilter(p => ({...p, studentId: e.target.value}))} aria-label="Filter by student">
              <option value="">All Students</option>
              {students.map(s => <option key={s._id} value={s._id}>{s.studentId} — {s.firstName} {s.lastName}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Filter by Course</label>
            <select className="form-select" value={filter.courseId} onChange={e => setFilter(p => ({...p, courseId: e.target.value}))} aria-label="Filter by course">
              <option value="">All Courses</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.courseCode}: {c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        grades.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <h3>No grades found</h3>
            <button className="btn btn-primary" onClick={() => setModal('add')}>＋ Add First Grade</button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>Student</th><th>Course</th><th>Assessment</th><th>Score</th><th>Grade</th><th>Date</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {grades.map(g => {
                  const p = pct(g.score, g.maxScore)
                  return (
                    <tr key={g._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{g.student?.firstName} {g.student?.lastName}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{g.student?.studentId}</div>
                      </td>
                      <td><span className="badge badge-accent">{g.course?.courseCode}</span></td>
                      <td>
                        <div>{g.assessmentName}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{g.assessmentType}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{g.score}/{g.maxScore}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{p}%</div>
                      </td>
                      <td><LetterBadge letter={g.letterGrade || letterGrade(p)} /></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                        {new Date(g.gradedAt || g.createdAt).toLocaleDateString('en-GB')}
                      </td>
                      <td>
                        {(isAdmin) && (
                          <button className="btn btn-icon btn-sm" onClick={() => handleDelete(g._id)} aria-label="Delete grade" style={{ color: 'var(--danger)' }}>🗑️</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Add Grade Modal */}
      {modal === 'add' && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Add Grade">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">📝 Add Grade</h3>
              <button className="btn btn-icon" onClick={() => setModal(null)} aria-label="Close">✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Student *</label>
                  <select className="form-select" value={form.student} onChange={e => setForm(p => ({...p, student: e.target.value}))} required aria-label="Select student">
                    <option value="">— Select student —</option>
                    {students.filter(s => s.status === 'active').map(s => <option key={s._id} value={s._id}>{s.studentId} — {s.firstName} {s.lastName}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Course *</label>
                  <select className="form-select" value={form.course} onChange={e => setForm(p => ({...p, course: e.target.value}))} required aria-label="Select course">
                    <option value="">— Select course —</option>
                    {courses.map(c => <option key={c._id} value={c._id}>{c.courseCode}: {c.name}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Assessment Name *</label>
                    <input className="form-input" value={form.assessmentName} onChange={e => setForm(p => ({...p, assessmentName: e.target.value}))} placeholder="e.g. Coursework 1" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={form.assessmentType} onChange={e => setForm(p => ({...p, assessmentType: e.target.value}))} aria-label="Assessment type">
                      {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Score *</label>
                    <input className="form-input" type="number" min="0" step="0.5" value={form.score} onChange={e => setForm(p => ({...p, score: e.target.value}))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Score *</label>
                    <input className="form-input" type="number" min="1" step="0.5" value={form.maxScore} onChange={e => setForm(p => ({...p, maxScore: e.target.value}))} required />
                  </div>
                </div>
                {form.score && form.maxScore && (
                  <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--accent-light)', borderRadius: 'var(--radius)' }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
                      {pct(form.score, form.maxScore)}% — {letterGrade(pct(form.score, form.maxScore))}
                    </span>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Feedback</label>
                  <textarea className="form-textarea" rows={3} value={form.feedback} onChange={e => setForm(p => ({...p, feedback: e.target.value}))} placeholder="Optional feedback for student…" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Add Grade'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
