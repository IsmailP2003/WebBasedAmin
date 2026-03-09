import { useEffect, useState } from 'react'
import { auditAPI } from '../api/axios'

const ACTION_LABELS = {
  CREATE_STUDENT: '➕ Created student', UPDATE_STUDENT: '✏️ Updated student', DELETE_STUDENT: '🗑️ Deleted student',
  CREATE_COURSE: '➕ Created course', UPDATE_COURSE: '✏️ Updated course', DELETE_COURSE: '🗑️ Deleted course',
  ENROL_STUDENT: '📚 Enrolled student', REMOVE_STUDENT_FROM_COURSE: '📤 Removed from course',
  MARK_ATTENDANCE: '📋 Marked attendance', UPDATE_ATTENDANCE: '📋 Updated attendance',
  ADD_GRADE: '📝 Added grade', UPDATE_GRADE: '📝 Updated grade', DELETE_GRADE: '🗑️ Deleted grade',
  USER_LOGIN: '🔐 User login', USER_LOGOUT: '🚪 User logout',
}

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(date).toLocaleDateString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })
}

export default function AuditPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [action, setAction] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await auditAPI.get({ page, limit: 30, action: action || undefined })
      setLogs(data.data)
      setPagination(data.pagination)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page, action])

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Audit Log</h2>
          <p className="page-subtitle">Full history of system changes — {pagination.total || 0} total entries</p>
        </div>
        <select className="form-select" style={{ width: 'auto' }} value={action} onChange={e => { setAction(e.target.value); setPage(1) }} aria-label="Filter by action">
          <option value="">All Actions</option>
          {Object.keys(ACTION_LABELS).map(a => <option key={a} value={a}>{ACTION_LABELS[a]}</option>)}
        </select>
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No audit entries found</h3>
            <p>System actions will appear here as they happen</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrapper" style={{ borderRadius: 'var(--radius-lg)' }}>
              <table className="data-table">
                <thead>
                  <tr><th>Time</th><th>Action</th><th>Details</th><th>Performed By</th><th>Role</th></tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log._id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>
                        {timeAgo(log.createdAt)}
                      </td>
                      <td>
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', maxWidth: 300 }}>
                        {log.details}
                      </td>
                      <td style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                        {log.performedBy?.name || 'System'}
                      </td>
                      <td>
                        <span className={`badge ${log.performedBy?.role === 'admin' ? 'badge-danger' : 'badge-success'}`} style={{ textTransform: 'capitalize' }}>
                          {log.performedBy?.role || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '1rem', borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} aria-label="Previous page">← Prev</button>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  Page {page} of {pagination.pages}
                </span>
                <button className="btn btn-secondary btn-sm" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)} aria-label="Next page">Next →</button>
              </div>
            )}
          </div>
        )
      )}
    </div>
  )
}
