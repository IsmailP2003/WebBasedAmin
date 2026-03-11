import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { coursesAPI, studentsAPI, gradesAPI, usersAPI, materialsAPI } from '../api/axios'

const emptyForm = { courseCode: '', name: '', description: '', teacher: '', credits: 3 }

const FILE_TYPES = [
  { value: 'lecture', label: '📖 Lecture Slides' },
  { value: 'assignment', label: '📋 Assignment' },
  { value: 'reading', label: '📄 Reading' },
  { value: 'resource', label: '🔗 Resource' },
  { value: 'other', label: '📁 Other' },
]

function fileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(mime = '') {
  if (mime.includes('pdf')) return '📕'
  if (mime.includes('word')) return '📘'
  if (mime.includes('powerpoint') || mime.includes('presentation')) return '📊'
  if (mime.includes('excel') || mime.includes('spreadsheet')) return '📗'
  if (mime.includes('image')) return '🖼️'
  if (mime.includes('zip')) return '🗜️'
  if (mime.includes('text')) return '📄'
  return '📎'
}

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// ── Materials panel ──────────────────────────────────────────────
function MaterialsPanel({ course }) {
  const { user } = useAuth()
  const toast = useToast()
  const canUpload = user?.role === 'admin' || user?.role === 'teacher'
  const fileRef = useRef(null)

  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState({ title: '', type: 'resource' })
  const [pendingFile, setPendingFile] = useState(null)

  const load = useCallback(async () => {
    if (!course?._id) return
    setLoading(true)
    try {
      const { data } = await materialsAPI.getAll(course._id)
      setMaterials(data.data)
    } catch { toast.error('Failed to load materials') }
    finally { setLoading(false) }
  }, [course?._id])

  useEffect(() => { load() }, [load])

  const handleSelectFile = (file) => {
    if (!file) return
    setPendingFile(file)
    setUploadForm(p => ({ ...p, title: p.title || file.name.replace(/\.[^.]+$/, '') }))
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!pendingFile) { toast.error('Please select a file'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', pendingFile)
      fd.append('title', uploadForm.title || pendingFile.name)
      fd.append('type', uploadForm.type)
      await materialsAPI.upload(course._id, fd)
      toast.success(`"${uploadForm.title || pendingFile.name}" uploaded!`)
      setPendingFile(null)
      setUploadForm({ title: '', type: 'resource' })
      if (fileRef.current) fileRef.current.value = ''
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed') }
    finally { setUploading(false) }
  }

  const handleDownload = async (mat) => {
    try {
      const res = await materialsAPI.download(course._id, mat._id)
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a'); a.href = url; a.download = mat.originalName; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Download failed') }
  }

  const handleDelete = async (mat) => {
    if (!window.confirm(`Delete "${mat.title}"?`)) return
    try {
      await materialsAPI.delete(course._id, mat._id)
      toast.success('Deleted'); load()
    } catch { toast.error('Delete failed') }
  }

  return (
    <div>
      {/* Upload area (admin/teacher only) */}
      {canUpload && (
        <form onSubmit={handleUpload} style={{ marginBottom: '1.25rem' }}>
          {/* Drop zone */}
          <div
            className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault(); setDragOver(false)
              const file = e.dataTransfer.files[0]
              if (file) handleSelectFile(file)
            }}>
            <input ref={fileRef} type="file" style={{ display: 'none' }} aria-label="Select file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.gif,.webp,.zip"
              onChange={e => handleSelectFile(e.target.files[0])} />
            {pendingFile ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '2rem' }}>{fileIcon(pendingFile.type)}</span>
                <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{pendingFile.name}</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{fileSize(pendingFile.size)}</span>
                <button type="button" className="btn btn-sm btn-secondary" onClick={e => { e.stopPropagation(); setPendingFile(null); if (fileRef.current) fileRef.current.value = '' }}>
                  ✕ Remove
                </button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📤</div>
                <p style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: '0.25rem' }}>Drag & drop or click to upload</p>
                <p style={{ fontSize: 'var(--text-xs)' }}>PDF, Word, PowerPoint, Excel, images, ZIP · Max 20 MB</p>
              </>
            )}
          </div>

          {/* Upload metadata */}
          {pendingFile && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', marginTop: '0.75rem', alignItems: 'flex-end' }}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" value={uploadForm.title}
                  onChange={e => setUploadForm(p => ({ ...p, title: e.target.value }))}
                  placeholder={pendingFile.name} />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={uploadForm.type}
                  onChange={e => setUploadForm(p => ({ ...p, type: e.target.value }))}>
                  {FILE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" disabled={uploading} style={{ gridColumn: '1/-1' }}>
                {uploading ? '⏳ Uploading…' : '📤 Upload File'}
              </button>
            </div>
          )}
        </form>
      )}

      {/* Materials list */}
      {loading ? (
        <div className="loading-center" style={{ padding: '1.5rem' }}><div className="spinner" /></div>
      ) : materials.length === 0 ? (
        <div className="empty-state" style={{ padding: '2rem' }}>
          <div className="empty-state-icon">📂</div>
          <h3 style={{ fontSize: 'var(--text-base)' }}>No materials yet</h3>
          {canUpload && <p>Upload the first file for this course above.</p>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {materials.map(mat => (
            <div key={mat._id} style={{
              display: 'flex', alignItems: 'center', gap: '0.85rem',
              padding: '0.75rem 1rem', borderRadius: 'var(--radius)',
              background: 'var(--bg-input)', border: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{fileIcon(mat.mimetype)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {mat.title}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.15rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ textTransform: 'capitalize' }}>{mat.type}</span>
                  <span>·</span>
                  <span>{mat.originalName}</span>
                  <span>·</span>
                  <span>{fileSize(mat.size)}</span>
                  <span>·</span>
                  <span>by {mat.uploadedBy?.name}</span>
                  <span>·</span>
                  <span>{timeAgo(mat.createdAt)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                <button className="btn btn-icon btn-sm" onClick={() => handleDownload(mat)} title="Download" aria-label={`Download ${mat.title}`}>⬇️</button>
                {(user?.role === 'admin' || String(mat.uploadedBy?._id) === String(user?._id)) && (
                  <button className="btn btn-icon btn-sm" onClick={() => handleDelete(mat)}
                    title="Delete" aria-label={`Delete ${mat.title}`} style={{ color: 'var(--danger)' }}>🗑️</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main CoursesPage ──────────────────────────────────────────────
export default function CoursesPage() {
  const { user } = useAuth()
  const toast = useToast()
  const isAdmin = user?.role === 'admin'

  const [courses, setCourses] = useState([])
  const [allStudents, setAllStudents] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [enrolStudentId, setEnrolStudentId] = useState('')
  const [summaries, setSummaries] = useState({})
  const [activeTab, setActiveTab] = useState('students') // 'students' | 'grades' | 'materials'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [c, s, t] = await Promise.all([
        coursesAPI.getAll(),
        studentsAPI.getAll({ limit: 200 }),
        usersAPI.getAll({ role: 'teacher' }),
      ])
      setCourses(c.data.data)
      setAllStudents(s.data.data)
      setTeachers(t.data.data)
    } catch { toast.error('Failed to load courses') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openDetail = async (course) => {
    setSelected(course); setModal('detail'); setActiveTab('students')
    try {
      const { data } = await gradesAPI.courseSummary(course._id)
      setSummaries(prev => ({ ...prev, [course._id]: data.data }))
    } catch { }
  }

  const handleCreate = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      await coursesAPI.create({
        courseCode: form.courseCode, name: form.name,
        description: form.description, teacher: form.teacher, credits: form.credits,
      })
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
      setEnrolStudentId('')
      const { data } = await coursesAPI.getById(selected._id)
      setSelected(data.data); load()
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

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const TABS = [
    { id: 'students', label: '👩‍🎓 Students' },
    { id: 'grades', label: '📝 Grades' },
    { id: 'materials', label: '📁 Materials' },
  ]

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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.25rem' }}>
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
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>👩‍🏫 {c.teacher?.name || '—'}</div>
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

      {/* ── Course Detail Modal ── */}
      {modal === 'detail' && selected && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Course Detail">
          <div className="modal" style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{selected.courseCode}: {selected.name}</h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  Teacher: {selected.teacher?.name} · {selected.credits} credits
                  {selected.schedule?.day && ` · 📅 ${selected.schedule.day} ${selected.schedule.startTime}–${selected.schedule.endTime}`}
                  {selected.schedule?.room && ` · 📍 ${selected.schedule.room}`}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {isAdmin && <button className="btn btn-danger btn-sm" onClick={() => setModal('delete')} aria-label="Delete">🗑️</button>}
                <button className="btn btn-icon" onClick={() => setModal(null)} aria-label="Close">✕</button>
              </div>
            </div>

            {/* Tab bar */}
            <div className="tab-bar" style={{ padding: '0 1.5rem', margin: 0 }}>
              {TABS.map(t => (
                <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.id)} aria-pressed={activeTab === t.id}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', gap: '1rem' }}>
              {/* Students tab */}
              {activeTab === 'students' && (
                <>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>
                      Enrolled Students ({selected.students?.length || 0})
                    </div>
                    <div className="enrolled-chips">
                      {selected.students?.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>No students enrolled</span>}
                      {selected.students?.map(s => (
                        <span key={s._id} className="chip">
                          {s.firstName} {s.lastName}
                          {isAdmin && <button onClick={() => handleRemove(s._id)} aria-label={`Remove ${s.firstName}`}>✕</button>}
                        </span>
                      ))}
                    </div>
                  </div>
                  {isAdmin && (
                    <form onSubmit={handleEnrol} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Enrol a Student</label>
                        <select className="form-select" value={enrolStudentId} onChange={e => setEnrolStudentId(e.target.value)} aria-label="Select student">
                          <option value="">— Select student —</option>
                          {allStudents
                            .filter(s => !selected.students?.some(es => es._id === s._id))
                            .map(s => <option key={s._id} value={s._id}>{s.studentId} — {s.firstName} {s.lastName}</option>)}
                        </select>
                      </div>
                      <button type="submit" className="btn btn-success" disabled={!enrolStudentId}>Enrol</button>
                    </form>
                  )}
                </>
              )}

              {/* Grades tab */}
              {activeTab === 'grades' && (
                summaries[selected._id]?.length > 0 ? (
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Grade Averages per Student</div>
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
                ) : (
                  <div className="empty-state" style={{ padding: '2rem' }}>
                    <div className="empty-state-icon">📝</div>
                    <p>No grades recorded for this course yet.</p>
                  </div>
                )
              )}

              {/* Materials tab */}
              {activeTab === 'materials' && <MaterialsPanel course={selected} />}
            </div>
          </div>
        </div>
      )}

      {/* ── Create Modal ── */}
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
                    {teachers.map(t => <option key={t._id} value={t._id}>{t.name} ({t.email})</option>)}
                  </select>
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

      {/* ── Delete Confirm ── */}
      {modal === 'delete' && selected && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Delete Course">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3 className="modal-title">🗑️ Delete Course</h3>
              <button className="btn btn-icon" onClick={() => setModal('detail')} aria-label="Back">←</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)' }}>
                Delete <strong>{selected.courseCode}: {selected.name}</strong>? This will unenrol all students and remove uploaded materials.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal('detail')}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={submitting}>
                {submitting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
