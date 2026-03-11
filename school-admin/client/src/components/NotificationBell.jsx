import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationsAPI } from '../api/axios'

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([])
    const [unread, setUnread] = useState(0)
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const panelRef = useRef(null)
    const navigate = useNavigate()

    const load = async () => {
        try {
            const { data } = await notificationsAPI.getAll({ limit: 20 })
            setNotifications(data.data)
            setUnread(data.unreadCount)
        } catch { }
    }

    // Poll every 30 seconds for new notifications
    useEffect(() => {
        load()
        const interval = setInterval(load, 30000)
        return () => clearInterval(interval)
    }, [])

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleToggle = async () => {
        setOpen(prev => !prev)
        if (!open) { setLoading(true); await load(); setLoading(false) }
    }

    const handleRead = async (n) => {
        if (!n.read) await notificationsAPI.markRead(n._id)
        setOpen(false)
        if (n.link) navigate(n.link)
        load()
    }

    const handleReadAll = async () => {
        await notificationsAPI.markAllRead()
        load()
    }

    const handleDelete = async (e, id) => {
        e.stopPropagation()
        await notificationsAPI.delete(id)
        load()
    }

    function timeAgo(date) {
        const diff = Math.floor((Date.now() - new Date(date)) / 1000)
        if (diff < 60) return 'just now'
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
        return `${Math.floor(diff / 86400)}d ago`
    }

    const TYPE_COLORS = {
        announcement: 'var(--accent)', grade: 'var(--success)',
        attendance: 'var(--warning)', alert: 'var(--danger)', system: 'var(--text-muted)',
    }

    return (
        <div ref={panelRef} style={{ position: 'relative' }}>
            <button
                onClick={handleToggle}
                aria-label={`Notifications (${unread} unread)`}
                style={{
                    position: 'relative', background: 'none', border: '1px solid var(--border)',
                    borderRadius: '50%', width: 38, height: 38, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem', transition: 'all 0.2s',
                    backgroundColor: open ? 'var(--accent-light)' : 'transparent',
                }}>
                🔔
                {unread > 0 && (
                    <span style={{
                        position: 'absolute', top: 2, right: 2,
                        background: 'var(--danger)', color: '#fff',
                        borderRadius: '50%', width: 16, height: 16,
                        fontSize: '0.6rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        lineHeight: 1,
                    }}>{unread > 9 ? '9+' : unread}</span>
                )}
            </button>

            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 0.75rem)', right: 0,
                    width: 360, maxHeight: 480, overflowY: 'auto',
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                    zIndex: 200,
                }}>
                    {/* Header */}
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                            🔔 Notifications {unread > 0 && <span className="badge badge-danger" style={{ marginLeft: '0.5rem' }}>{unread}</span>}
                        </div>
                        {unread > 0 && (
                            <button className="btn btn-sm btn-secondary" onClick={handleReadAll} style={{ fontSize: 'var(--text-xs)' }}>
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner" /></div>
                    ) : notifications.length === 0 ? (
                        <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
                            <p style={{ fontSize: 'var(--text-sm)' }}>All caught up!</p>
                        </div>
                    ) : (
                        notifications.map(n => (
                            <div key={n._id} onClick={() => handleRead(n)} style={{
                                padding: '0.85rem 1.25rem',
                                borderBottom: '1px solid var(--border)',
                                cursor: 'pointer', position: 'relative',
                                background: n.read ? 'transparent' : 'rgba(79,142,247,0.06)',
                                transition: 'background 0.15s',
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                                onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(79,142,247,0.06)'}>
                                {!n.read && (
                                    <div style={{
                                        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                                        background: 'var(--accent)', borderRadius: '3px 0 0 3px',
                                    }} />
                                )}
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                    <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{n.icon || '🔔'}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: n.read ? 500 : 700, fontSize: 'var(--text-xs)', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{n.title}</div>
                                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{n.message}</div>
                                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: TYPE_COLORS[n.type] || 'var(--text-muted)', display: 'inline-block', flexShrink: 0 }} />
                                            <span style={{ textTransform: 'capitalize' }}>{n.type}</span>
                                            <span>·</span>
                                            <span>{timeAgo(n.createdAt)}</span>
                                        </div>
                                    </div>
                                    <button onClick={e => handleDelete(e, n._id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', padding: '0.15rem 0.3rem', flexShrink: 0 }} aria-label="Dismiss notification">✕</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
