import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { usersAPI } from '../api/axios'
import { useSort, SortableHeader } from '../hooks/useSort.jsx'
import {
  Users, ShieldCheck, GraduationCap, BookOpen, UserX,
  Search, X, Pencil, KeyRound, Ban, CheckCircle,
  AlertTriangle, UserPlus, User
} from 'lucide-react'

const ROLES = ['admin', 'teacher', 'student']
const ROLE_COLORS = { admin: 'danger', teacher: 'success', student: 'accent' }

const emptyForm = { name: '', email: '', password: '', role: 'teacher' }

function timeAgo(date) {
  if (!date) return 'Never'
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const toast = useToast()

  const [users, setUsers]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [search, setSearch]       = useState('')
  const [modal, setModal]         = useState(null) // 'add' | 'edit' | 'deactivate' | 'reset-password'
  const [selected, setSelected]   = useState(null)
  const [form, setForm]           = useState(emptyForm)
  const [resetPwForm, setResetPwForm] = useState({ newPassword: '', confirm: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch all users including inactive (admin can see all)
      const { data } = await usersAPI.getAll({
        role: roleFilter || undefined,
        includeInactive: true,
      })
      setUsers(data.data)
    } catch { toast.error('Failed to load users') }
    finally { setLoading(false) }
  }, [roleFilter])

  useEffect(() => { load() }, [load])

  const filtered = users.filter(u => {
    const matchStatus = statusFilter === 'active'
      ? u.isActive
      : statusFilter === 'inactive'
        ? !u.isActive
        : true
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const { sorted: sortedUsers, sortKey, sortDir, handleSort } = useSort(filtered, 'name', 'asc')

  // Stats
  const stats = {
    total:    users.length,
    admins:   users.filter(u => u.role === 'admin' && u.isActive).length,
    teachers: users.filter(u => u.role === 'teacher' && u.isActive).length,
    students: users.filter(u => u.role === 'student' && u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
  }

  const handleCreate = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      await usersAPI.create(form)
      toast.success(`${form.role} account created for ${form.name}!`)
      setModal(null); setForm(emptyForm); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create user') }
    finally { setSubmitting(false) }
  }

  const handleUpdate = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      await usersAPI.update(selected._id, { name: form.name, role: form.role })
      toast.success(`${form.name}'s account updated!`)
      setModal(null); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed') }
    finally { setSubmitting(false) }
  }

  const handleDeactivate = async () => {
    setSubmitting(true)
    try {
      await usersAPI.deactivate(selected._id)
      toast.success(`${selected.name}'s account deactivated`)
      setModal(null); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSubmitting(false) }
  }

  const handleReactivate = async (u) => {
    try {
      await usersAPI.reactivate(u._id)
      toast.success(`${u.name}'s account reactivated!`)
      load()
    } catch { toast.error('Reactivate failed') }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (resetPwForm.newPassword !== resetPwForm.confirm) {
      toast.error('Passwords do not match')
      return
    }
    setSubmitting(true)
    try {
      await usersAPI.resetPassword(selected._id, resetPwForm.newPassword)
      toast.success(`Password reset for ${selected.name}!`)
      setModal(null)
    } catch (err) { toast.error(err.response?.data?.message || 'Reset failed') }
    finally { setSubmitting(false) }
  }

  const openEdit = (u) => {
    setSelected(u); setForm({ name: u.name, email: u.email, password: '', role: u.role }); setModal('edit')
  }

  const openResetPw = (u) => {
    setSelected(u); setResetPwForm({ newPassword: '', confirm: '' }); setModal('reset-password')
  }

  const close = () => { setModal(null); setSelected(null) }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">User Management</h2>
          <p className="page-subtitle">Manage all system accounts across roles</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setModal('add') }} aria-label="Create user">
          ＋ Create User
        </button>
      </div>

      {/* Stats cards — click to filter by role */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Users',  value: stats.total,    Icon: Users,          color: 'blue',   roleFilter: '' },
          { label: 'Admins',       value: stats.admins,   Icon: ShieldCheck,     color: 'cyan',   roleFilter: 'admin' },
          { label: 'Teachers',     value: stats.teachers, Icon: BookOpen,        color: 'green',  roleFilter: 'teacher' },
          { label: 'Students',     value: stats.students, Icon: GraduationCap,   color: 'accent', roleFilter: 'student' },
          { label: 'Deactivated',  value: stats.inactive, Icon: UserX,           color: 'amber',  roleFilter: null },
        ].map(s => {
          const isActive = s.roleFilter !== null ? roleFilter === s.roleFilter : statusFilter === 'inactive'
          return (
            <div
              key={s.label}
              className={`stat-card ${s.color}`}
              onClick={() => {
                if (s.roleFilter !== null) { setRoleFilter(s.roleFilter); setStatusFilter('active') }
                else { setStatusFilter(v => v === 'inactive' ? 'all' : 'inactive'); setRoleFilter('') }
              }}
              style={{ cursor: 'pointer', outline: isActive ? '2px solid var(--accent)' : 'none', outlineOffset: 2, transition: 'outline 0.15s' }}
              title={s.roleFilter !== null ? `Filter by ${s.label}` : 'Toggle inactive users'}
            >
              <div className={`stat-icon ${s.color}`}><s.Icon size={18} strokeWidth={1.75} /></div>
              <div className="stat-value" style={{ fontSize: 'var(--text-2xl)' }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 220 }}>
            <Search size={14} strokeWidth={2} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search users" />
            {search && <button onClick={() => setSearch('')} style={{ background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',display:'flex',alignItems:'center' }}><X size={13} /></button>}
          </div>
          <select className="form-select" style={{ width: 'auto' }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)} aria-label="Filter by role">
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r} value={r} style={{ textTransform: 'capitalize' }}>{r}</option>)}
          </select>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['all', 'active', 'inactive'].map(s => (
              <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter(s)} style={{ textTransform: 'capitalize' }} aria-pressed={statusFilter === s}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><User size={32} strokeWidth={1.25} /></div>
          <h3>No users found</h3>
          <p>{search ? `No results for "${search}"` : 'Create a new user to get started'}</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <SortableHeader col="name" label="User" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader col="role" label="Role" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader col="isActive" label="Status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader col="lastLogin" label="Last Login" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader col="createdAt" label="Created" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map(u => (
                <tr key={u._id} style={{ opacity: u.isActive ? 1 : 0.55 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: u.isActive ? 'var(--accent-light)' : 'var(--bg-input)',
                        color: u.isActive ? 'var(--accent)' : 'var(--text-muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 'var(--text-sm)', flexShrink: 0,
                      }}>
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${ROLE_COLORS[u.role] || 'neutral'}`} style={{ textTransform: 'capitalize' }}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    {u.isActive
                      ? <span className="badge badge-success">● Active</span>
                      : <span className="badge badge-neutral">○ Inactive</span>}
                  </td>
                  <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                    {timeAgo(u.lastLogin)}
                  </td>
                  <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    {new Date(u.createdAt).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {u.isActive ? (
                        <>
                          {u._id !== currentUser?._id && (
                            <button className="btn btn-icon btn-sm" onClick={() => openEdit(u)} title="Edit user" aria-label={`Edit ${u.name}`}><Pencil size={13} strokeWidth={2} /></button>
                          )}
                          {u._id !== currentUser?._id && u.role === 'teacher' && (
                            <button className="btn btn-icon btn-sm" onClick={() => openResetPw(u)}
                              title="Reset password" aria-label={`Reset password for ${u.name}`} style={{ color: 'var(--accent)' }}><KeyRound size={13} strokeWidth={2} /></button>
                          )}
                          {u._id !== currentUser?._id && (
                            <button className="btn btn-icon btn-sm" onClick={() => { setSelected(u); setModal('deactivate') }}
                              title="Deactivate" aria-label={`Deactivate ${u.name}`} style={{ color: 'var(--danger)' }}><Ban size={13} strokeWidth={2} /></button>
                          )}
                          {u._id === currentUser?._id && (
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', padding: '0.4rem 0.6rem' }}>You</span>
                          )}
                        </>
                      ) : (
                        <button className="btn btn-success btn-sm" onClick={() => handleReactivate(u)} aria-label={`Reactivate ${u.name}`}>
                          <CheckCircle size={13} strokeWidth={2} style={{ marginRight: '0.3rem' }} />Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Modal */}
      {modal === 'add' && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Create User">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Create User Account</h3>
              <button className="btn btn-icon" onClick={close} aria-label="Close"><X size={16} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                {/* Role picker */}
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  {ROLES.map(r => (
                    <button key={r} type="button"
                      onClick={() => setForm(p => ({...p, role: r}))}
                      className={`btn btn-sm ${form.role === r ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, justifyContent: 'center', textTransform: 'capitalize' }}
                      aria-pressed={form.role === r}>
                      {r}
                    </button>
                  ))}
                </div>

                {/* Role description */}
                <div style={{ padding: '0.65rem 1rem', background: 'var(--accent-light)', borderRadius: 'var(--radius)', fontSize: 'var(--text-xs)', color: 'var(--accent)', marginBottom: '0.5rem' }}>
                  {{
                    admin:   'Full access: manage users, courses, all data and the audit log',
                    teacher: 'Can mark attendance, grade students, and view their assigned courses',
                    student: 'Read-only access to their own grades and attendance record',
                  }[form.role]}
                </div>

                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}
                    placeholder="e.g. Dr. Sarah Johnson" required autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))}
                    placeholder="e.g. sarah.johnson@school.com" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input className="form-input" type="password" value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))}
                    placeholder="Min 6 characters" required minLength={6} />
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Share this with the user so they can log in for the first time.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={close}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating…' : `Create ${form.role} account`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {modal === 'edit' && selected && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Edit User">
          <div className="modal" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit {selected.name}</h3>
              <button className="btn btn-icon" onClick={close} aria-label="Close"><X size={16} /></button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" value={form.email} disabled
                    style={{ opacity: 0.5, cursor: 'not-allowed' }} title="Email cannot be changed" />
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Email cannot be changed after account creation</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <div style={{ display: 'flex', gap: '0.65rem' }}>
                    {ROLES.map(r => (
                      <button key={r} type="button"
                        onClick={() => setForm(p => ({...p, role: r}))}
                        className={`btn btn-sm ${form.role === r ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, justifyContent: 'center', textTransform: 'capitalize' }}
                        aria-pressed={form.role === r}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={close}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {modal === 'reset-password' && selected && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Reset Password">
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 className="modal-title">Reset Password — {selected.name}</h3>
              <button className="btn btn-icon" onClick={close} aria-label="Close"><X size={16} /></button>
            </div>
            <form onSubmit={handleResetPassword}>
              <div className="modal-body">
                <div style={{ padding: '0.75rem 1rem', background: 'var(--accent-light)', borderRadius: 'var(--radius)', fontSize: 'var(--text-xs)', color: 'var(--accent)', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <AlertTriangle size={13} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
                  You are resetting the password for <strong>{selected.name}</strong> ({selected.email}). Share the new password with them securely.
                </div>
                <div className="form-group">
                  <label className="form-label">New Password *</label>
                  <input
                    className="form-input" type="password"
                    value={resetPwForm.newPassword}
                    onChange={e => setResetPwForm(p => ({ ...p, newPassword: e.target.value }))}
                    placeholder="Min 6 characters" required minLength={6} autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <input
                    className="form-input" type="password"
                    value={resetPwForm.confirm}
                    onChange={e => setResetPwForm(p => ({ ...p, confirm: e.target.value }))}
                    placeholder="Re-enter new password" required minLength={6}
                  />
                  {resetPwForm.confirm && resetPwForm.newPassword !== resetPwForm.confirm && (
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', marginTop: '0.25rem' }}>Passwords do not match</p>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={close}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting || !resetPwForm.newPassword || resetPwForm.newPassword !== resetPwForm.confirm}>
                  {submitting ? 'Resetting…' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Confirm */}
      {modal === 'deactivate' && selected && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Deactivate User">
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3 className="modal-title">Deactivate Account</h3>
              <button className="btn btn-icon" onClick={close} aria-label="Close"><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1rem', background: 'var(--danger-light)', borderRadius: 'var(--radius)',
                border: '1px solid var(--danger)', marginBottom: '0.5rem',
              }}>
                <AlertTriangle size={28} strokeWidth={1.5} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--danger)' }}>Account will be disabled</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {selected.name} will no longer be able to log in. Their data is preserved and the account can be reactivated.
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius)' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-light)',
                  color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, flexShrink: 0,
                }}>{selected.name?.charAt(0)}</div>
                <div>
                  <div style={{ fontWeight: 600 }}>{selected.name}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{selected.email}</div>
                  <span className={`badge badge-${ROLE_COLORS[selected.role]} `} style={{ marginTop: '0.35rem', textTransform: 'capitalize' }}>
                    {selected.role}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={close}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeactivate} disabled={submitting}>
                {submitting ? 'Deactivating…' : 'Deactivate Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
