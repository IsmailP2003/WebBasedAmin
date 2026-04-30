import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { studentsAPI, attendanceAPI, gradesAPI } from '../api/axios'
import { useSort, SortableHeader } from '../hooks/useSort.jsx'
import { Search, X, Pencil, Trash2, Download, GraduationCap } from 'lucide-react'

const GENDERS = ['male','female','other','prefer_not_to_say']
const STATUSES = ['active','inactive','graduated','suspended']
const empty = { studentId:'', firstName:'', lastName:'', email:'', dateOfBirth:'', gender:'male', phone:'', address:'', status:'active', dataConsentGiven:false }

function StatusBadge({ status }) {
  const map = { active:'success', inactive:'neutral', graduated:'accent', suspended:'danger' }
  return <span className={`badge badge-${map[status] || 'neutral'}`} style={{ textTransform: 'capitalize' }}>{status}</span>
}

function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function StudentsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const isAdmin = user?.role === 'admin'

  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(empty)
  const [submitting, setSubmitting] = useState(false)
  const [detailData, setDetailData] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Enrich students for sorting
  const enriched = students.map(s => ({ ...s, _fullName: `${s.firstName} ${s.lastName}`, _courseCount: s.enrolledCourses?.length ?? 0 }))
  const { sorted: sortedStudents, sortKey, sortDir, handleSort } = useSort(enriched, '_fullName', 'asc')

  const debouncedSearch = useDebounce(search, 350)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await studentsAPI.getAll({ search: debouncedSearch, status: statusFilter || undefined, page, limit: 15 })
      setStudents(data.data)
      setPagination(data.pagination)
    } catch { toast.error('Failed to load students') }
    finally { setLoading(false) }
  }, [debouncedSearch, statusFilter, page])

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [debouncedSearch, statusFilter])
  useEffect(() => { load() }, [load])

  const openDetail = async (s) => {
    setSelected(s); setModal('detail'); setDetailData(null); setDetailLoading(true)
    try {
      const [attSummary, grades] = await Promise.all([
        attendanceAPI.summary(s._id),
        gradesAPI.get({ studentId: s._id }),
      ])
      setDetailData({ attSummary: attSummary.data.data, grades: grades.data.data })
    } catch {} finally { setDetailLoading(false) }
  }

  const openAdd  = () => { setForm(empty); setModal('add') }
  const openEdit = (s) => { setSelected(s); setForm({ ...s, dateOfBirth: s.dateOfBirth?.slice(0,10) }); setModal('edit') }
  const openDel  = (s) => { setSelected(s); setModal('delete') }
  const close    = () => { setModal(null); setSelected(null); setDetailData(null) }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      if (modal === 'add') { await studentsAPI.create(form); toast.success(`${form.firstName} ${form.lastName} added!`) }
      else { await studentsAPI.update(selected._id, form); toast.success('Student updated!') }
      close(); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Operation failed') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    setSubmitting(true)
    try { await studentsAPI.delete(selected._id); toast.success('Student deleted'); close(); load() }
    catch { toast.error('Delete failed') }
    finally { setSubmitting(false) }
  }

  const handleExport = async (id, studentId, e) => {
    e.stopPropagation()
    try {
      const res = await studentsAPI.report(id)
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a'); a.href = url; a.download = `student-report-${studentId}.csv`; a.click()
      URL.revokeObjectURL(url); toast.success('Report downloaded!')
    } catch { toast.error('Export failed') }
  }

  const pct = (score, max) => (max > 0 ? Math.round((score / max) * 100) : 0)
  const letterGrade = (p) => p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B' : p >= 60 ? 'C' : p >= 50 ? 'D' : 'F'

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Students</h2>
          <p className="page-subtitle">{pagination.total ?? students.length} students registered</p>
        </div>
        <div className="page-actions">
          <div className="search-bar">
            <Search size={14} strokeWidth={2} style={{ color: 'var(--text-muted)', flexShrink: 0 }} aria-hidden="true" />
            <input placeholder="Search name, email, ID…" value={search}
              onChange={e => setSearch(e.target.value)} aria-label="Search students" />
            {search && <button onClick={() => setSearch('')} style={{ background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',display:'flex',alignItems:'center' }} aria-label="Clear search"><X size={13} /></button>}
          </div>
          <select className="form-select" style={{ width: 'auto' }} value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
          </select>
          {isAdmin && <button className="btn btn-primary" onClick={openAdd} aria-label="Add new student">＋ Add Student</button>}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : students.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><GraduationCap size={32} strokeWidth={1.25} /></div>
          <h3>No students found</h3>
          <p>{search ? `No results for "${search}"` : 'Add your first student to get started'}</p>
          {isAdmin && !search && <button className="btn btn-primary" onClick={openAdd}>＋ Add Student</button>}
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <SortableHeader col="studentId" label="ID" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortableHeader col="_fullName" label="Name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortableHeader col="email" label="Email" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortableHeader col="status" label="Status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortableHeader col="_courseCount" label="Courses" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedStudents.map(s => (
                  <tr key={s._id} style={{ cursor: 'pointer' }} onClick={() => openDetail(s)}>
                    <td><code style={{ color:'var(--accent)', fontSize:'var(--text-xs)' }}>{s.studentId}</code></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</div>
                      <div style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)', textTransform:'capitalize' }}>{s.gender?.replaceAll('_',' ')}</div>
                    </td>
                    <td style={{ color:'var(--text-secondary)' }}>{s.email}</td>
                    <td><StatusBadge status={s.status} /></td>
                    <td><span className="badge badge-neutral">{s.enrolledCourses?.length || 0} courses</span></td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display:'flex', gap:'0.5rem' }}>
                        <button className="btn btn-icon btn-sm" onClick={e => handleExport(s._id, s.studentId, e)} title="Export CSV" aria-label="Export CSV"><Download size={13} strokeWidth={2} /></button>
                        {isAdmin && <>
                          <button className="btn btn-icon btn-sm" onClick={() => { openEdit(s) }} title="Edit" aria-label="Edit"><Pencil size={13} strokeWidth={2} /></button>
                          <button className="btn btn-icon btn-sm" onClick={() => openDel(s)} title="Delete" aria-label="Delete" style={{ color:'var(--danger)' }}><Trash2 size={13} strokeWidth={2} /></button>
                        </>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'1rem', flexWrap:'wrap', gap:'0.75rem' }}>
              <span style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)' }}>
                Showing {((page-1)*15)+1}–{Math.min(page*15, pagination.total)} of {pagination.total} students
              </span>
              <div style={{ display:'flex', gap:'0.5rem' }}>
                <button className="btn btn-secondary btn-sm" disabled={page===1} onClick={() => setPage(p=>p-1)} aria-label="Previous">← Prev</button>
                {[...Array(pagination.pages)].map((_,i) => (
                  <button key={i} className={`btn btn-sm ${page===i+1 ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setPage(i+1)} aria-label={`Page ${i+1}`}>{i+1}</button>
                ))}
                <button className="btn btn-secondary btn-sm" disabled={page>=pagination.pages} onClick={() => setPage(p=>p+1)} aria-label="Next">Next →</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Student Detail Modal */}
      {modal === 'detail' && selected && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Student Detail">
          <div className="modal" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{selected.firstName} {selected.lastName}</h3>
                <p style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)' }}>{selected.studentId} · {selected.email}</p>
              </div>
              <div style={{ display:'flex', gap:'0.5rem' }}>
                <StatusBadge status={selected.status} />
                {isAdmin && <button className="btn btn-secondary btn-sm" onClick={() => { close(); openEdit(selected) }}><Pencil size={12} strokeWidth={2} style={{ marginRight: '0.3rem' }} />Edit</button>}
                <button className="btn btn-icon" onClick={close} aria-label="Close"><X size={16} /></button>
              </div>
            </div>
            <div className="modal-body">
              {detailLoading ? (
                <div className="loading-center" style={{ padding:'2rem' }}><div className="spinner" /></div>
              ) : detailData ? (
                <>
                  {/* Stats row */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem' }}>
                    <div className="card" style={{ padding:'1rem', textAlign:'center' }}>
                      <div style={{ fontSize:'1.75rem', fontWeight:800, color: detailData.attSummary.rate >= 75 ? 'var(--success)' : 'var(--danger)' }}>
                        {detailData.attSummary.rate ?? '—'}{detailData.attSummary.rate != null ? '%' : ''}
                      </div>
                      <div style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)' }}>Attendance</div>
                      <div style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)' }}>{detailData.attSummary.present}/{detailData.attSummary.total} sessions</div>
                    </div>
                    <div className="card" style={{ padding:'1rem', textAlign:'center' }}>
                      <div style={{ fontSize:'1.75rem', fontWeight:800, color:'var(--accent)' }}>{detailData.grades.length}</div>
                      <div style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)' }}>Assessments</div>
                    </div>
                    <div className="card" style={{ padding:'1rem', textAlign:'center' }}>
                      <div style={{ fontSize:'1.75rem', fontWeight:800, color:'var(--warning)' }}>
                        {selected.enrolledCourses?.length || 0}
                      </div>
                      <div style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)' }}>Courses</div>
                    </div>
                  </div>

                  {/* Grades table */}
                  {detailData.grades.length > 0 && (
                    <div>
                      <div style={{ fontWeight:600, marginBottom:'0.75rem' }}>Recent Grades</div>
                      <div className="table-wrapper">
                        <table className="data-table">
                          <thead><tr><th>Course</th><th>Assessment</th><th>Score</th><th>Grade</th></tr></thead>
                          <tbody>
                            {detailData.grades.slice(0,8).map(g => {
                              const p = pct(g.score, g.maxScore)
                              return (
                                <tr key={g._id}>
                                  <td><span className="badge badge-accent">{g.course?.courseCode}</span></td>
                                  <td>{g.assessmentName}</td>
                                  <td>{g.score}/{g.maxScore} <span style={{ color:'var(--text-muted)', fontSize:'var(--text-xs)' }}>({p}%)</span></td>
                                  <td><span className={`badge ${p>=70?'badge-success':p>=50?'badge-warning':'badge-danger'}`}>{g.letterGrade || letterGrade(p)}</span></td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Enrolled courses */}
                  {selected.enrolledCourses?.length > 0 && (
                    <div>
                      <div style={{ fontWeight:600, marginBottom:'0.5rem' }}>Enrolled Courses</div>
                      <div className="enrolled-chips">
                        {selected.enrolledCourses.map(c => (
                          <span key={c._id} className="chip">{c.courseCode} — {c.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={e => handleExport(selected._id, selected.studentId, { stopPropagation: ()=>{} })}><Download size={13} strokeWidth={2} style={{ marginRight: '0.3rem' }} />Export CSV</button>
              <button className="btn btn-secondary" onClick={close}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={modal === 'add' ? 'Add Student' : 'Edit Student'}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{modal === 'add' ? 'New Student' : 'Edit Student'}</h3>
              <button className="btn btn-icon" onClick={close} aria-label="Close modal"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Student ID *</label>
                    <input className="form-input" value={form.studentId} onChange={e => setForm({...form, studentId: e.target.value.toUpperCase()})} placeholder="e.g. STU011" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                      {STATUSES.map(s => <option key={s} value={s} style={{ textTransform:'capitalize' }}>{s}</option>)}
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
                      {GENDERS.map(g => <option key={g} value={g}>{g.replaceAll('_',' ')}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" type="tel" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Optional" />
                </div>
                <div className="form-group">
                  <label style={{ display:'flex', alignItems:'center', gap:'0.75rem', cursor:'pointer' }}>
                    <input type="checkbox" checked={!!form.dataConsentGiven} onChange={e => setForm({...form, dataConsentGiven: e.target.checked})}
                      style={{ width:18, height:18, accentColor:'var(--accent)' }} aria-label="GDPR consent" />
                    <span className="form-label" style={{ margin:0 }}>
                      GDPR Data Consent Given <span style={{ color:'var(--danger)' }}>*</span>
                    </span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={close}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving…' : modal === 'add' ? 'Add Student' : 'Save Changes'}
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
              <h3 className="modal-title">Delete Student</h3>
              <button className="btn btn-icon" onClick={close} aria-label="Close"><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color:'var(--text-secondary)' }}>
                Delete <strong>{selected?.firstName} {selected?.lastName}</strong> ({selected?.studentId})? This cannot be undone.
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
