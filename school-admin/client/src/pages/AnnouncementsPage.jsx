import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { announcementsAPI } from '../api/axios'

const PRIORITY_MAP = {
    normal: { label: 'Normal', color: 'var(--text-secondary)', icon: '📢' },
    important: { label: 'Important', color: 'var(--warning)', icon: '⚠️' },
    urgent: { label: 'Urgent', color: 'var(--danger)', icon: '🚨' },
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

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await announcementsAPI.getAll()
            setAnnouncements(data.data)
        } catch { toast.error('Failed to load announcements') }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { load() }, [load])

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
                        📢 Post Announcement
                    </button>
                )}
            </div>

            {loading ? <div className="loading-center"><div className="spinner" /></div> : (
                announcements.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📭</div>
                        <h3>No announcements yet</h3>
                        {canPost && <button className="btn btn-primary" onClick={() => setModal(true)}>📢 Post first announcement</button>}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {announcements.map(ann => {
                            const p = PRIORITY_MAP[ann.priority] || PRIORITY_MAP.normal
                            return (
                                <div key={ann._id} className="card announcement-card" style={{
                                    borderLeft: `4px solid ${ann.priority === 'urgent' ? 'var(--danger)' : ann.priority === 'important' ? 'var(--warning)' : 'var(--accent)'}`,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flex: 1 }}>
                                            <span style={{ fontSize: '1.5rem' }}>{p.icon}</span>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                                                    {ann.pinned && <span className="badge badge-accent">📌 Pinned</span>}
                                                    <span className="badge badge-neutral" style={{ color: p.color, textTransform: 'capitalize' }}>{p.label}</span>
                                                    <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                                                        {TARGET_LABELS[ann.target?.type] || 'Everyone'}
                                                        {ann.target?.role ? ` — ${ann.target.role}` : ''}
                                                    </span>
                                                </div>
                                                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: '0.5rem' }}>{ann.title}</h3>
                                                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{ann.body}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                            {user?.role === 'admin' && (
                                                <button className="btn btn-icon btn-sm" onClick={() => handlePin(ann._id)}
                                                    title={ann.pinned ? 'Unpin' : 'Pin'} aria-label={ann.pinned ? 'Unpin' : 'Pin announcement'}>
                                                    {ann.pinned ? '📌' : '📍'}
                                                </button>
                                            )}
                                            {(user?.role === 'admin' || String(ann.author?._id) === String(user?._id)) && (
                                                <button className="btn btn-icon btn-sm" onClick={() => handleDelete(ann._id)}
                                                    title="Delete" aria-label="Delete announcement" style={{ color: 'var(--danger)' }}>🗑️</button>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1rem', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                        <span>👤 {ann.author?.name}</span>
                                        <span style={{ textTransform: 'capitalize' }}>• {ann.author?.role}</span>
                                        <span>• {formatDate(ann.createdAt)}</span>
                                        {ann.expiresAt && <span style={{ color: 'var(--warning)' }}>• Expires {formatDate(ann.expiresAt)}</span>}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )
            )}

            {/* Compose Modal */}
            {modal && (
                <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Post Announcement">
                    <div className="modal">
                        <div className="modal-header">
                            <h3 className="modal-title">📢 Post Announcement</h3>
                            <button className="btn btn-icon" onClick={() => setModal(false)} aria-label="Close">✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {/* Priority */}
                                <div className="form-group">
                                    <label className="form-label">Priority</label>
                                    <div style={{ display: 'flex', gap: '0.65rem' }}>
                                        {['normal', 'important', 'urgent'].map(p => (
                                            <button key={p} type="button"
                                                className={`btn btn-sm ${form.priority === p ? 'btn-primary' : 'btn-secondary'}`}
                                                onClick={() => f('priority', p)}
                                                style={{ flex: 1, textTransform: 'capitalize' }} aria-pressed={form.priority === p}>
                                                {PRIORITY_MAP[p].icon} {p}
                                            </button>
                                        ))}
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
                                                {t === 'all' ? '🌍 Everyone' : '🎯 Specific Role'}
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
                                        <span className="form-label" style={{ margin: 0 }}>📌 Pin this announcement</span>
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Posting…' : '📢 Post Announcement'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
