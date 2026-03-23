import { useEffect, useState } from 'react'
import { useToast } from '../context/ToastContext'
import { attendanceAPI, coursesAPI } from '../api/axios'

const STATUSES = ['present','absent','late','excused']

export default function AttendancePage() {
  const toast = useToast()
  const [courses, setCourses] = useState([])
  const [courseId, setCourseId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0,10))
  const [records, setRecords] = useState([]) // [{studentId, name, status, notes}]
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasExisting, setHasExisting] = useState(false)

  useEffect(() => {
    coursesAPI.getAll()
      .then(r => setCourses(r.data.data))
      .catch(() => toast.error('Failed to load courses'))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadAttendance = async () => {
    if (!courseId) return
    setLoading(true)
    try {
      const course = courses.find(c => c._id === courseId)
      // Get existing attendance for this course+date
      const existing = await attendanceAPI.get({ courseId, date })
      const existingMap = {}
      existing.data.data.forEach(r => { existingMap[r.student._id] = r })
      setHasExisting(existing.data.count > 0)

      // Build records from enrolled students
      const studentRecords = (course?.students || []).map(s => ({
        studentId: s._id,
        name: `${s.firstName} ${s.lastName}`,
        studentCode: s.studentId,
        status: existingMap[s._id]?.status || 'present',
        notes: existingMap[s._id]?.notes || '',
      }))
      setRecords(studentRecords)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (courseId) loadAttendance() }, [courseId, date])

  const toggle = (idx, status) => {
    setRecords(prev => prev.map((r,i) => i === idx ? { ...r, status } : r))
  }

  const handleSave = async () => {
    if (!courseId || records.length === 0) return
    setSaving(true)
    try {
      await attendanceAPI.mark({
        courseId, date,
        records: records.map(r => ({ studentId: r.studentId, status: r.status, notes: r.notes })),
      })
      toast.success(`Attendance saved for ${records.length} students!`)
      setHasExisting(true)
    } catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  const markAll = (status) => setRecords(prev => prev.map(r => ({...r, status})))

  const counts = records.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc }, {})

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Attendance</h2>
          <p className="page-subtitle">Mark and track student attendance by course and date</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Course</label>
            <select className="form-select" value={courseId} onChange={e => setCourseId(e.target.value)} aria-label="Select course">
              <option value="">— Select a course —</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.courseCode}: {c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} aria-label="Select date" />
          </div>
        </div>
      </div>

      {!courseId && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>Select a course to begin</h3>
          <p>Choose a course and date above to mark attendance</p>
        </div>
      )}

      {courseId && loading && <div className="loading-center"><div className="spinner" /></div>}

      {courseId && !loading && records.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">👩‍🎓</div>
          <h3>No students enrolled</h3>
          <p>Enrol students in this course from the Courses page</p>
        </div>
      )}

      {courseId && !loading && records.length > 0 && (
        <div className="card">
          {/* Summary bar */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {Object.entries(counts).map(([s, n]) => (
                <span key={s} className={`badge badge-${s === 'present' ? 'success' : s === 'absent' ? 'danger' : s === 'late' ? 'warning' : 'info'}`}>
                  {s}: {n}
                </span>
              ))}
              {hasExisting && <span className="badge badge-accent">✓ Saved</span>}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', alignSelf: 'center' }}>Mark all:</span>
              {STATUSES.map(s => (
                <button key={s} className="att-btn" onClick={() => markAll(s)}
                  style={{ border: '1px solid var(--border)', fontSize: 'var(--text-xs)', padding: '0.25rem 0.6rem', borderRadius: 999, cursor: 'pointer', background: 'transparent', color: 'var(--text-muted)' }}
                  aria-label={`Mark all ${s}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>ID</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => (
                  <tr key={r.studentId}>
                    <td style={{ fontWeight: 600 }}>{r.name}</td>
                    <td><code style={{ color: 'var(--accent)', fontSize: 'var(--text-xs)' }}>{r.studentCode}</code></td>
                    <td>
                      <div className="att-toggle">
                        {STATUSES.map(s => (
                          <button key={s} className={`att-btn ${s} ${r.status === s ? 'active' : ''}`}
                            onClick={() => toggle(idx, s)} aria-label={`Mark ${r.name} as ${s}`} aria-pressed={r.status === s}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td>
                      <input className="form-input" style={{ padding: '0.3rem 0.6rem', fontSize: 'var(--text-xs)' }}
                        value={r.notes} onChange={e => setRecords(p => p.map((x,i) => i===idx ? {...x, notes: e.target.value} : x))}
                        placeholder="Optional note…" aria-label={`Note for ${r.name}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} aria-label="Save attendance">
              {saving ? 'Saving…' : '💾 Save Attendance'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
