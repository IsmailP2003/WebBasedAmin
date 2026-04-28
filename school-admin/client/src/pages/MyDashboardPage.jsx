import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { gradesAPI, attendanceAPI, coursesAPI, announcementsAPI } from '../api/axios'
import { BookOpen, PenLine, BarChart2, Megaphone, User, Calendar } from 'lucide-react'

function StatCard({ icon, label, value, suffix = '', color }) {
    return (
        <div className={`stat-card ${color}`}>
            <div className={`stat-icon ${color}`}>{icon}</div>
            <div className="stat-value">{value ?? '—'}{suffix}</div>
            <div className="stat-label">{label}</div>
        </div>
    )
}
function LetterBadge({ pct }) {
    const l = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F'
    const cls = pct >= 70 ? 'badge-success' : pct >= 50 ? 'badge-warning' : 'badge-danger'
    return <span className={`badge ${cls}`}>{l}</span>
}

export default function MyDashboardPage() {
    const { user } = useAuth()
    const toast = useToast()
    const [grades, setGrades] = useState([])
    const [attSummary, setAttSummary] = useState(null)
    const [courses, setCourses] = useState([])
    const [announcements, setAnnouncements] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const studentId = user?.studentMongoId || null
        Promise.all([
            gradesAPI.get({ limit: 5 }),
            // attendance summary — use /me endpoint if available, else get all
            attendanceAPI.get({ limit: 1 }),
            coursesAPI.getAll(),
            announcementsAPI.getAll({ limit: 5 }),
        ]).then(([g, a, c, ann]) => {
            setGrades(g.data.data)
            setCourses(c.data.data)
            setAnnouncements(ann.data.data)
        }).catch(() => toast.error('Failed to load your dashboard'))
            .finally(() => setLoading(false))
    }, [])

    const avgGrade = grades.length
        ? Math.round(grades.reduce((s, g) => s + (g.maxScore > 0 ? (g.score / g.maxScore) * 100 : 0), 0) / grades.length)
        : null

    const PRIORITY_DOT = { normal: 'var(--accent)', important: 'var(--warning)', urgent: 'var(--danger)' }

    return (
        <div className="page-enter">
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800 }}>
                    Welcome back, {user?.name?.split(' ')[0]}!
                </h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Here's your personal learning overview for today.
                </p>
            </div>

            {loading ? <div className="loading-center"><div className="spinner" /></div> : (
                <>
                    {/* Stats */}
                    <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                        <StatCard icon={<BookOpen size={18} strokeWidth={1.75} />} label="Enrolled Courses" value={courses.length} color="blue" />
                        <StatCard icon={<PenLine size={18} strokeWidth={1.75} />} label="Assessments" value={grades.length} color="green" />
                        <StatCard icon={<BarChart2 size={18} strokeWidth={1.75} />} label="Your Avg Grade" value={avgGrade} suffix="%" color="amber" />
                    </div>

                    <div className="two-col">
                        {/* Recent grades */}
                        <div className="chart-card">
                            <div className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><PenLine size={14} strokeWidth={2} />Recent Grades</div>
                            {grades.length === 0 ? (
                                <div className="empty-state" style={{ padding: '1.5rem' }}><p>No grades yet</p></div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                    {grades.slice(0, 5).map(g => {
                                        const p = g.maxScore > 0 ? Math.round((g.score / g.maxScore) * 100) : 0
                                        return (
                                            <div key={g._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', background: 'var(--bg-input)', borderRadius: 'var(--radius)' }}>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{g.assessmentName}</div>
                                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                                                        {g.course?.courseCode} · {g.assessmentType}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{g.score}/{g.maxScore}</span>
                                                    <LetterBadge pct={p} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Latest announcements */}
                        <div className="chart-card">
                            <div className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Megaphone size={14} strokeWidth={2} />Latest Announcements</div>
                            {announcements.length === 0 ? (
                                <div className="empty-state" style={{ padding: '1.5rem' }}><p>No announcements</p></div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                    {announcements.slice(0, 4).map(ann => (
                                        <div key={ann._id} style={{
                                            padding: '0.65rem 0.85rem',
                                            borderLeft: `3px solid ${ann.priority === 'urgent' ? 'var(--danger)' : ann.priority === 'important' ? 'var(--warning)' : 'var(--accent)'}`,
                                            background: 'var(--bg-input)', borderRadius: '0 var(--radius) var(--radius) 0',
                                        }}>
                                            <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: PRIORITY_DOT[ann.priority] || 'var(--accent)', flexShrink: 0 }} />
                                                {ann.title}
                                            </div>
                                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                                by {ann.author?.name} · {new Date(ann.createdAt).toLocaleDateString('en-GB')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Enrolled courses */}
                    {courses.length > 0 && (
                        <div className="chart-card" style={{ marginTop: '1.5rem' }}>
                            <div className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><BookOpen size={14} strokeWidth={2} />My Enrolled Courses</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
                                {courses.map(c => (
                                    <div key={c._id} style={{ padding: '0.85rem', background: 'var(--bg-input)', borderRadius: 'var(--radius)', borderTop: '2px solid var(--accent)' }}>
                                        <div style={{ fontWeight: 800, color: 'var(--accent)', fontSize: 'var(--text-sm)' }}>{c.courseCode}</div>
                                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <User size={10} strokeWidth={2} />{c.teacher?.name || '—'} · {c.credits} cr
                                        </div>
                                        {c.schedule?.day && (
                                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                <Calendar size={10} strokeWidth={2} />{c.schedule.day} {c.schedule.startTime}–{c.schedule.endTime}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
