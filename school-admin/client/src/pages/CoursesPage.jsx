import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { coursesAPI, studentsAPI, gradesAPI } from '../api/axios'

const emptyForm = { courseCode:'', name:'', description:'', teacher:'', credits:3, 'schedule.day':'', 'schedule.room':'' }

export default function CoursesPage() {
  const { user } = useAuth()
  const toast = useToast()
  const isAdmin = user?.role === 'admin'

  const [courses, setCourses] = useState([])
  const [allStudents, setAllStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [enrolStudentId, setEnrolStudentId] = useState('')
  const [summaries, setSummaries] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [c, s] = await Promise.all([coursesAPI.getAll(), studentsAPI.getAll({ limit: 200 })])
      setCourses(c.data.data)
      setAllStudents(s.data.data)
    } catch { toast.error('Failed to load courses') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openDetail = async (course) => {
    setSelected(course)
    setModal('detail')
    try {
      const { data } = await gradesAPI.courseSummary(course._id)
      setSummaries(prev => ({ ...prev, [course._id]: data.data }))
    } catch {}
  }

  const handleCreate = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      await coursesAPI.create({ courseCode: form.courseCode, name: form.name, description: form.description, teacher: form.teacher, credits: form.credits })
      toast.success(`Course ${form.courseCode} created!`)
      setModal(null); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    setSubmitting(true)
    try { await coursesAPI.delete(selected._id); toast.success('Course deleted'); setModal(null); load() }
    catch { toast.error('Delete failed') }
    finally { setSubmitting(false) }
  }

  const handleEnrol = async (e) => {
    e.preventDefault()
    if (!enrolStudentId) return
    try {
      await coursesAPI.enrol(selected._id, enrolStudentId)
      toast.success('Student enrolled!')
      setEnrolStudentId(''); load()
      const { data } = await coursesAPI.getById(selected._id)
      setSelected(data.data)
    } catch (err) { toast.error(err.response?.data?.message || 'Enrol failed') }
  }

  const handleRemove = async (studentId) => {
    try {
      await coursesAPI.removeStudent(selected._id, studentId)
      toast.success('Student removed')
      const { data } = await coursesAPI.getById(selected._id)
      setSelected(data.data); load()
    } catch { toast.error('Remove failed') }
  }

  const f = (key, val) => setForm(prev => ({...prev, [key]: val}))

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Courses</h2>
          <p className="page-subtitle">{courses.length} courses available</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setModal('add') }}>＋ Create Course</button>}
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        courses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <h3>No courses yet</h3>
            {isAdmin && <button className="btn btn-primary" onClick={() => setModal('add')}>＋ Create Course</button>}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: '1.25rem' }}>
            {courses.map(c => (
              <div key={c._id} className="card" style={{ cursor: 'pointer' }} onClick={() => openDetail(c)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>{c.courseCode}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: 2 }}>{c.name}</div>
                  </div>
                  <span className="badge badge-accent">{c.credits} cr</span>
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '1rem', minHeight: 36 }}>
                  {c.description || 'No description'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                    👩‍🏫 {c.teacher?.name || '—'}
                  </div>
                  <span className="badge badge-neutral">👩‍🎓 {c.studentCount} students</span>
                </div>
                {c.schedule?.day && (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    📅 {c.schedule.day} {c.schedule.startTime}–{c.schedule.endTime} · {c.schedule.room}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* Course Detail Modal */}
      {modal === 'detail' && selected && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Course Detail">
          <div className="modal" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{selected.courseCode}: {selected.name}</h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  Teacher: {selected.teacher?.name} · {selected.credits} credits
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {isAdmin && <button className="btn btn-danger btn-sm" onClick={() => setModal('delete')} aria-label="Delete course">🗑️</button>}
                <button className="btn btn-icon" onClick={() => setModal(null)} aria-label="Close">✕</button>
              </div>
            </div>
            <div className="modal-body" style={{ gap: '1.25rem' }}>
              {/* Enrolled students */}
              <div>
                <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>
                  Enrolled Students ({selected.students?.length || 0})
                </div>
                <div className="enrolled-chips">
                  {selected.students?.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>No students enrolled</span>}
                  {selected.students?.map(s => (
                    <span key={s._id} className="chip">
                      {s.firstName} {s.lastName}
                      {isAdmin && <button onClick={() => handleRemove(s._id)} title="Remove" aria-label={`Remove ${s.firstName}`}>✕</button>}
                    </span>
                  ))}
                </div>
              </div>

              {/* Enrol student */}
              {isAdmin && (
                <form onSubmit={handleEnrol} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Enrol a Student</label>
                    <select className="form-select" value={enrolStudentId} onChange={e => setEnrolStudentId(e.target.value)} aria-label="Select student to enrol">
                      <option value="">— Select student —</option>
                      {allStudents
                        .filter(s => !selected.students?.some(es => es._id === s._id))
                        .map(s => <option key={s._id} value={s._id}>{s.studentId} — {s.firstName} {s.lastName}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="btn btn-success" disabled={!enrolStudentId}>Enrol</button>
                </form>
              )}

              {/* Grade summary */}
              {summaries[selected._id]?.length > 0 && (
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Grade Averages</div>
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead><tr><th>Student</th><th>Avg %</th><th>Assessments</th></tr></thead>
                      <tbody>
                        {summaries[selected._id].map((r, i) => (
                          <tr key={i}>
                            <td>{r.student.firstName} {r.student.lastName}</td>
                            <td><span className={`badge ${r.avgScore >= 70 ? 'badge-success' : r.avgScore >= 50 ? 'badge-warning' : 'badge-danger'}`}>{r.avgScore}%</span></td>
                            <td>{r.gradeCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {modal === 'add' && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Create Course">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">＋ New Course</h3>
              <button className="btn btn-icon" onClick={() => setModal(null)} aria-label="Close">✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Course Code *</label>
                    <input className="form-input" value={form.courseCode} onChange={e => f('courseCode', e.target.value)} placeholder="e.g. CS101" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Credits</label>
                    <input className="form-input" type="number" min="1" max="6" value={form.credits} onChange={e => f('credits', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Course Name *</label>
                  <input className="form-input" value={form.name} onChange={e => f('name', e.target.value)} placeholder="Introduction to Computer Science" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={form.description} onChange={e => f('description', e.target.value)} rows={3} placeholder="Course description…" />
                </div>
                <div className="form-group">
                  <label className="form-label">Teacher *</label>
                  <select className="form-select" value={form.teacher} onChange={e => f('teacher', e.target.value)} required aria-label="Select teacher">
                    <option value="">— Select teacher —</option>
                    {allStudents.filter(() => false).map(() => null)}
                  </select>
                  {/* Teacher select will show users with role=teacher from backend */}
                  <input className="form-input" style={{ marginTop: '0.5rem' }} value={form.teacher} onChange={e => f('teacher', e.target.value)} placeholder="Paste teacher's User ID" />
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Get teacher IDs from your MongoDB database or audit log</p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating…' : 'Create Course'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {modal === 'delete' && selected && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Confirm Delete">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3 className="modal-title">🗑️ Delete Course</h3>
              <button className="btn btn-icon" onClick={() => setModal('detail')} aria-label="Back">←</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)' }}>Delete <strong>{selected.courseCode}: {selected.name}</strong>? This will unenrol all students.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal('detail')}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={submitting}>{submitting ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
