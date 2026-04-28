import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { attendanceAPI, gradesAPI, coursesAPI } from '../api/axios'
import { Calendar, List, Clock, MapPin, User, Users, CalendarDays } from 'lucide-react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const HOURS = Array.from({ length: 9 }, (_, i) => i + 8) // 08:00–16:00

const COURSE_COLORS = [
    '#4F8EF7', '#22C55E', '#F59E0B', '#A78BFA', '#FB923C', '#EC4899', '#14B8A6', '#F43F5E', '#84CC16',
]

function parseTime(str) {
    if (!str) return 0
    const [h, m = '00'] = str.split(':')
    return Number(h) + Number(m) / 60
}

export default function TimetablePage() {
    const { user } = useAuth()
    const toast = useToast()
    const [courses, setCourses] = useState([])
    const [loading, setLoading] = useState(true)
    const [view, setView] = useState('week') // 'week' | 'list'

    useEffect(() => {
        coursesAPI.getAll().then(r => {
            setCourses(r.data.data.filter(c => c.schedule?.day))
        }).catch(() => toast.error('Failed to load timetable'))
            .finally(() => setLoading(false))
    }, [])

    // Build day → courses map
    const timetable = {}
    DAYS.forEach(d => { timetable[d] = [] })
    courses.forEach((c, idx) => {
        const day = c.schedule.day
        if (DAYS.includes(day)) {
            timetable[day].push({ ...c, color: COURSE_COLORS[idx % COURSE_COLORS.length] })
        }
    })

    const totalSlots = courses.length
    const today = DAYS[new Date().getDay() - 1] // Mon=0

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2 className="page-title">Timetable</h2>
                    <p className="page-subtitle">{totalSlots} scheduled sessions per week</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['week', 'list'].map(v => (
                        <button key={v} className={`btn btn-sm ${view === v ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setView(v)} style={{ textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '0.4rem' }} aria-pressed={view === v}>
                            {v === 'week' ? <><CalendarDays size={13} strokeWidth={2} />Week</> : <><List size={13} strokeWidth={2} />List</>}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? <div className="loading-center"><div className="spinner" /></div> : courses.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><Calendar size={32} strokeWidth={1.25} /></div>
                    <h3>No scheduled courses</h3>
                    <p>Add a schedule (day, time, room) to courses to see them here.</p>
                </div>
            ) : view === 'list' ? (
                /* List View */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '1rem' }}>
                    {DAYS.map(day => (
                        <div key={day} className="card" style={{
                            borderTop: `3px solid ${day === today ? 'var(--accent)' : 'var(--border)'}`,
                        }}>
                            <div style={{ fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {day} {day === today && <span className="badge badge-accent">Today</span>}
                            </div>
                            {timetable[day].length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>No classes</p>
                            ) : (
                                timetable[day].map(c => (
                                    <div key={c._id} style={{
                                        padding: '0.65rem 0.85rem', borderRadius: 'var(--radius)',
                                        background: `${c.color}18`, borderLeft: `3px solid ${c.color}`,
                                        marginBottom: '0.5rem',
                                    }}>
                                        <div style={{ fontWeight: 700, color: c.color, fontSize: 'var(--text-xs)' }}>{c.courseCode}</div>
                                        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{c.name}</div>
                                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                            <Clock size={10} strokeWidth={2} />{c.schedule.startTime}–{c.schedule.endTime}
                                            {c.schedule.room && <><MapPin size={10} strokeWidth={2} />{c.schedule.room}</>}
                                        </div>
                                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                            <User size={10} strokeWidth={2} />{c.teacher?.name || '—'}
                                            <Users size={10} strokeWidth={2} />{c.studentCount} students
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                /* Week Grid View */
                <div className="card" style={{ padding: 0, overflow: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: `60px repeat(5, 1fr)`, minWidth: 600 }}>
                        {/* Header */}
                        <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', background: 'var(--bg-secondary)' }} />
                        {DAYS.map(day => (
                            <div key={day} style={{
                                padding: '0.75rem', fontWeight: 700, fontSize: 'var(--text-sm)', textAlign: 'center',
                                borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)',
                                background: day === today ? 'var(--accent-light)' : 'var(--bg-secondary)',
                                color: day === today ? 'var(--accent)' : 'var(--text-primary)',
                            }}>
                                {day.slice(0, 3)} {day === today && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', verticalAlign: 'middle', marginLeft: 3 }} />}
                            </div>
                        ))}

                        {/* Rows for each hour */}
                        {HOURS.map(h => (
                            <>
                                <div key={`h-${h}`} style={{
                                    padding: '0.5rem 0.65rem', fontSize: 'var(--text-xs)', color: 'var(--text-muted)',
                                    borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)',
                                    background: 'var(--bg-secondary)', fontWeight: 600,
                                }}>
                                    {String(h).padStart(2, '0')}:00
                                </div>
                                {DAYS.map(day => {
                                    const slot = timetable[day].filter(c => {
                                        const start = parseTime(c.schedule.startTime)
                                        return Math.floor(start) === h
                                    })
                                    return (
                                        <div key={`${day}-${h}`} style={{
                                            minHeight: 56, padding: '0.25rem',
                                            borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)',
                                            background: day === today ? 'rgba(79,142,247,0.02)' : 'transparent',
                                        }}>
                                            {slot.map(c => (
                                                <div key={c._id} style={{
                                                    background: `${c.color}20`, borderLeft: `3px solid ${c.color}`,
                                                    borderRadius: 4, padding: '0.3rem 0.5rem', marginBottom: 2,
                                                }}>
                                                    <div style={{ fontWeight: 700, fontSize: '0.65rem', color: c.color }}>{c.courseCode}</div>
                                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                                                        {c.schedule.startTime}–{c.schedule.endTime}
                                                        {c.schedule.room && ` · ${c.schedule.room}`}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                })}
                            </>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
