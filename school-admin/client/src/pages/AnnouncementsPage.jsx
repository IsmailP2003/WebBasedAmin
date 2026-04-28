import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { announcementsAPI } from '../api/axios'
import { useSort, SortableHeader } from '../hooks/useSort.jsx'
import { Megaphone, AlertTriangle, Siren, Pin, PinOff, Trash2, Search, X, Inbox } from 'lucide-react'

const PRIORITY_MAP = {
    normal: { label: 'Normal', color: 'var(--text-secondary)', Icon: Megaphone },
    important: { label: 'Important', color: 'var(--warning)', Icon: AlertTriangle },
    urgent: { label: 'Urgent', color: 'var(--danger)', Icon: Siren },
}
const TARGET_LABELS = { all: 'Everyone', role: 'By Role', course: 'Course' }

const emptyForm = { title: '', body: '', priority: 'normal', target: { type: 'all', role: '' }, pinned: false }

function formatDate(d) {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AnnouncementsPage() {
    const { user } = useAuth()
    const toast = useToast()
    const canPost = user?.role === 'admin' || user?.role === 'teacher'

    const [announcements, setAnnouncements] = useState([])
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState(false)
    const [form, setForm] = useState(emptyForm)
    const [submitting, setSubmitting] = useState(false)
    const [search, setSearch] = useState('')

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await announcementsAPI.getAll()
            setAnnouncements(data.data)
        } catch { toast.error('Failed to load announcements') }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { load() }, [load])

    const filtered = announcements.filter(a =>
        !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.author?.name?.toLowerCase().includes(search.toLowerCase())
    )
    const PRIORITY_ORDER = { urgent: 0, important: 1, normal: 2 }
    const enriched = filtered.map(a => ({ ...a, _priorityOrder: PRIORITY_ORDER[a.priority] ?? 2 }))
    const { sorted: sortedAnnouncements, sortKey, sortDir, handleSort } = useSort(enriched, 'createdAt', 'desc')

    const handleSubmit = async (e) => {
        e.preventDefault(); setSubmitting(true)
        try {
            await announcementsAPI.create(form)
            toast.success('Announcement posted!')
            setModal(false); setForm(emptyForm); load()
        } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
        finally { setSubmitting(false) }
    }

    const handlePin = async (id) => {
        try {
            const { data } = await announcementsAPI.pin(id)
            toast.success(data.message); load()
        } catch { toast.error('Failed') }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this announcement?')) return
        try { await announcementsAPI.delete(id); toast.success('Deleted'); load() }
        catch { toast.error('Delete failed') }
    }

    const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2 className="page-title">Announcements</h2>
                    <p className="page-subtitle">{announcements.filter(a => !a.pinned).length} announcements · {announcements.filter(a => a.pinned).length} pinned</p>
                </div>
                {canPost && (
                    <button className="btn btn-primary" onClick={() => setModal(true)} aria-label="Post announcement">
                        <Megaphone size={14} strokeWidth={2} style={{ marginRight: '0.4rem' }} />Post Announcement
                    </button>
                )}
            </div>

            {loading ? <div className="loading-center"><div className="spinner" /></div> : (
            announcements.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><Inbox size={32} strokeWidth={1.25} /></div>
                    <h3>No announcements yet</h3>
                    {canPost && <button className="btn btn-primary" onClick={() => setModal(true)}><Megaphone size={14} strokeWidth={2} style={{ marginRight: '0.4rem' }} />Post first announcement</button>}
                </div>
            ) : (
                <>
                  {/* Search bar */}
                  <div className="card" style={{ marginBottom: '1rem', padding: '0.75rem 1rem' }}>
                    <div className="search-bar">
                      <Search size={14} strokeWidth={2} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <input placeholder="Search title or author…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search announcements" />
                      {search && <button onClick={() => setSearch('')} style={{ background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',display:'flex',alignItems:'center' }}><X size={13} /></button>}
                    </div>
                  </div>

                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <SortableHeader col="_priorityOrder" label="Priority" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                          <SortableHeader col="title" label="Title" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                          <SortableHeader col="author.name" label="Author" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                          <SortableHeader col="createdAt" label="Date" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedAnnouncements.map(ann => {
                          const p = PRIORITY_MAP[ann.priority] || PRIORITY_MAP.normal
                          return (
                            <tr key={ann._id} style={{ borderLeft: `3px solid ${ann.priority === 'urgent' ? 'var(--danger)' : ann.priority === 'important' ? 'var(--warning)' : 'var(--accent)'}` }}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                  {ann.pinned && <span className="badge badge-accent" style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Pin size={9} strokeWidth={2.5} />Pinned</span>}
                                  <span className="badge badge-neutral" style={{ color: p.color, textTransform: 'capitalize', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <p.Icon size={11} strokeWidth={2} />{p.label}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>{ann.title}</div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ann.body}</div>
                              </td>
                              <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                                <div style={{ fontWeight: 600 }}>{ann.author?.name}</div>
                                <div style={{ textTransform: 'capitalize', color: 'var(--text-muted)' }}>{ann.author?.role}</div>
                              </td>
                              <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(ann.createdAt)}</td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  {user?.role === 'admin' && (
                                    <button className="btn btn-icon btn-sm" onClick={() => handlePin(ann._id)}
                                      title={ann.pinned ? 'Unpin' : 'Pin'} aria-label={ann.pinned ? 'Unpin' : 'Pin announcement'}>
                                      {ann.pinned ? <PinOff size={13} strokeWidth={2} /> : <Pin size={13} strokeWidth={2} />}
                                    </button>
                                  )}
                                  {(user?.role === 'admin' || String(ann.author?._id) === String(user?._id)) && (
                                    <button className="btn btn-icon btn-sm" onClick={() => handleDelete(ann._id)}
                                      title="Delete" aria-label="Delete announcement" style={{ color: 'var(--danger)' }}><Trash2 size={13} strokeWidth={2} /></button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
                )
            )}

            {/* Compose Modal */}
            {modal && (
                <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Post Announcement">
                    <div className="modal">
                        <div className="modal-header">
                            <h3 className="modal-title">Post Announcement</h3>
                            <button className="btn btn-icon" onClick={() => setModal(false)} aria-label="Close"><X size={16} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {/* Priority */}
                                <div className="form-group">
                                    <label className="form-label">Priority</label>
                                    <div style={{ display: 'flex', gap: '0.65rem' }}>
                                        {['normal', 'important', 'urgent'].map(p => {
                                            const PIcon = PRIORITY_MAP[p].Icon
                                            return (
                                                <button key={p} type="button"
                                                    className={`btn btn-sm ${form.priority === p ? 'btn-primary' : 'btn-secondary'}`}
                                                    onClick={() => f('priority', p)}
                                                    style={{ flex: 1, textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '0.4rem' }} aria-pressed={form.priority === p}>
                                                    <PIcon size={12} strokeWidth={2} />{p}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Target audience */}
                                <div className="form-group">
                                    <label className="form-label">Send to</label>
                                    <div style={{ display: 'flex', gap: '0.65rem' }}>
                                        {['all', 'role'].map(t => (
                                            <button key={t} type="button"
                                                className={`btn btn-sm ${form.target.type === t ? 'btn-primary' : 'btn-secondary'}`}
                                                onClick={() => f('target', { ...form.target, type: t })}
                                                style={{ flex: 1 }} aria-pressed={form.target.type === t}>
                                                {t === 'all' ? 'Everyone' : 'Specific Role'}
                                            </button>
                                        ))}
                                    </div>
                                    {form.target.type === 'role' && (
                                        <select className="form-select" style={{ marginTop: '0.5rem' }}
                                            value={form.target.role} onChange={e => f('target', { ...form.target, role: e.target.value })}
                                            aria-label="Select role">
                                            <option value="">— Select role —</option>
                                            <option value="student">Students only</option>
                                            <option value="teacher">Teachers only</option>
                                            <option value="admin">Admins only</option>
                                        </select>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Title *</label>
                                    <input className="form-input" value={form.title} onChange={e => f('title', e.target.value)}
                                        placeholder="e.g. Important: Exam schedule change" required autoFocus />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Message *</label>
                                    <textarea className="form-textarea" rows={6} value={form.body} onChange={e => f('body', e.target.value)}
                                        placeholder="Write your announcement here…" required />
                                </div>
                                <div className="form-group" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={form.pinned} onChange={e => f('pinned', e.target.checked)}
                                            style={{ width: 18, height: 18, accentColor: 'var(--accent)' }} aria-label="Pin announcement" />
                                        <span className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Pin size={12} strokeWidth={2} />Pin this announcement</span>
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Posting…' : <><Megaphone size={14} strokeWidth={2} style={{ marginRight: '0.4rem' }} />Post Announcement</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
