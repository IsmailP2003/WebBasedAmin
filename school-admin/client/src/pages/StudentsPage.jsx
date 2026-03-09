import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { studentsAPI } from '../api/axios'

const GENDERS = ['male','female','other','prefer_not_to_say']
const STATUSES = ['active','inactive','graduated','suspended']
const empty = { studentId:'', firstName:'', lastName:'', email:'', dateOfBirth:'', gender:'male', phone:'', address:'', status:'active', dataConsentGiven:false }

function StatusBadge({ status }) {
  const map = { active:'success', inactive:'neutral', graduated:'accent', suspended:'danger' }
  return <span className={`badge badge-${map[status] || 'neutral'}`}>{status}</span>
}

export default function StudentsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const isAdmin = user?.role === 'admin'

  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | 'add' | 'edit' | 'delete'
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(empty)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await studentsAPI.getAll({ search })
      setStudents(data.data)
    } catch (e) { toast.error('Failed to load students') }
    finally { setLoading(false) }
  }, [search])

  useEffect(() => { load() }, [load])

  const openAdd = () => { setForm(empty); setModal('add') }
  const openEdit = (s) => { setSelected(s); setForm({ ...s, dateOfBirth: s.dateOfBirth?.slice(0,10) }); setModal('edit') }
  const openDel = (s) => { setSelected(s); setModal('delete') }
  const close = () => { setModal(null); setSelected(null) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (modal === 'add') {
        await studentsAPI.create(form)
        toast.success(`Student ${form.firstName} ${form.lastName} added!`)
      } else {
        await studentsAPI.update(selected._id, form)
        toast.success('Student updated!')
      }
      close(); load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    setSubmitting(true)
    try {
      await studentsAPI.delete(selected._id)
      toast.success('Student deleted')
      close(); load()
    } catch { toast.error('Delete failed') }
    finally { setSubmitting(false) }
  }

  const handleExport = async (id, studentId) => {
    try {
      const res = await studentsAPI.report(id)
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url; a.download = `student-report-${studentId}.csv`; a.click()
      URL.revokeObjectURL(url)
      toast.success('Report downloaded!')
    } catch { toast.error('Export failed') }
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Students</h2>
          <p className="page-subtitle">{students.length} students registered</p>
        </div>
        <div className="page-actions">
          <div className="search-bar">
            <span>🔍</span>
            <input placeholder="Search name, email, ID…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search students" />
          </div>
          {isAdmin && <button className="btn btn-primary" onClick={openAdd} aria-label="Add new student">＋ Add Student</button>}
        </div>
      </div>

      {/* Table */}
      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        students.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👩‍🎓</div>
            <h3>No students found</h3>
            <p>{search ? 'Try a different search term' : 'Add your first student to get started'}</p>
            {isAdmin && <button className="btn btn-primary" onClick={openAdd}>＋ Add Student</button>}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Name</th><th>Email</th><th>Status</th><th>Courses</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s._id}>
                    <td><code style={{ color: 'var(--accent)', fontSize: 'var(--text-xs)' }}>{s.studentId}</code></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{s.gender}</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.email}</td>
                    <td><StatusBadge status={s.status} /></td>
                    <td><span className="badge badge-neutral">{s.enrolledCourses?.length || 0} courses</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-icon btn-sm" onClick={() => handleExport(s._id, s.studentId)} title="Export CSV" aria-label="Export CSV">📥</button>
                        {isAdmin && <>
                          <button className="btn btn-icon btn-sm" onClick={() => openEdit(s)} title="Edit" aria-label="Edit student">✏️</button>
                          <button className="btn btn-icon btn-sm" onClick={() => openDel(s)} title="Delete" aria-label="Delete student" style={{ color: 'var(--danger)' }}>🗑️</button>
                        </>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={modal === 'add' ? 'Add Student' : 'Edit Student'}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{modal === 'add' ? '＋ New Student' : '✏️ Edit Student'}</h3>
              <button className="btn btn-icon" onClick={close} aria-label="Close modal">✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Student ID *</label>
                    <input className="form-input" value={form.studentId} onChange={e => setForm({...form, studentId: e.target.value})} placeholder="e.g. STU011" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">First Name *</label>
                    <input className="form-input" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name *</label>
                    <input className="form-input" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Date of Birth *</label>
                    <input className="form-input" type="date" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender *</label>
                    <select className="form-select" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                      {GENDERS.map(g => <option key={g} value={g}>{g.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" type="tel" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Optional" />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!form.dataConsentGiven} onChange={e => setForm({...form, dataConsentGiven: e.target.checked})}
                      style={{ width: 18, height: 18, accentColor: 'var(--accent)' }} aria-label="Data consent" />
                    <span className="form-label" style={{ margin: 0 }}>
                      GDPR Data Consent Given <span style={{ color: 'var(--danger)' }}>*</span>
                    </span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={close}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving…' : (modal === 'add' ? 'Add Student' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {modal === 'delete' && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Confirm Delete">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3 className="modal-title">🗑️ Delete Student</h3>
              <button className="btn btn-icon" onClick={close} aria-label="Close">✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)' }}>
                Are you sure you want to delete <strong>{selected?.firstName} {selected?.lastName}</strong> ({selected?.studentId})?
                This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={close}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={submitting}>
                {submitting ? 'Deleting…' : 'Delete Student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
