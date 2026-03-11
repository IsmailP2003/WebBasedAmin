import { useEffect, useState } from 'react'
import { useToast } from '../context/ToastContext'
import { analyticsAPI } from '../api/axios'

const RISK_COLORS = {
    high: { bg: 'rgba(239,68,68,0.1)', border: 'var(--danger)', badge: 'badge-danger', label: '🔴 High Risk' },
    medium: { bg: 'rgba(245,158,11,0.1)', border: 'var(--warning)', badge: 'badge-warning', label: '🟡 At Risk' },
}

export default function AtRiskPage() {
    const toast = useToast()
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [attThreshold, setAttThreshold] = useState(75)
    const [gradeThreshold, setGradeThreshold] = useState(50)

    const load = async () => {
        setLoading(true)
        try {
            const { data } = await analyticsAPI.atRisk({ attThreshold, gradeThreshold })
            setStudents(data.data)
        } catch { toast.error('Failed to load at-risk data') }
        finally { setLoading(false) }
    }

    useEffect(() => { load() }, [attThreshold, gradeThreshold])

    const highRisk = students.filter(s => s.riskLevel === 'high')
    const mediumRisk = students.filter(s => s.riskLevel === 'medium')

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2 className="page-title">⚠️ At-Risk Students</h2>
                    <p className="page-subtitle">
                        {students.length} students flagged — {highRisk.length} high risk, {mediumRisk.length} at risk
                    </p>
                </div>
            </div>

            {/* Threshold controls */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '1rem', fontSize: 'var(--text-sm)' }}>🎛️ Detection Thresholds</div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Attendance threshold: <strong style={{ color: 'var(--accent)' }}>{attThreshold}%</strong></label>
                        <input type="range" min="50" max="95" step="5" value={attThreshold}
                            onChange={e => setAttThreshold(Number(e.target.value))}
                            style={{ width: '100%', accentColor: 'var(--accent)' }} aria-label="Attendance threshold" />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            <span>50%</span><span>95%</span>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Grade threshold: <strong style={{ color: 'var(--accent)' }}>{gradeThreshold}%</strong></label>
                        <input type="range" min="30" max="70" step="5" value={gradeThreshold}
                            onChange={e => setGradeThreshold(Number(e.target.value))}
                            style={{ width: '100%', accentColor: 'var(--accent)' }} aria-label="Grade threshold" />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            <span>30%</span><span>70%</span>
                        </div>
                    </div>
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Students with attendance below {attThreshold}% <strong>OR</strong> average grade below {gradeThreshold}% are flagged. Both conditions = High Risk.
                </p>
            </div>

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : students.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">✅</div>
                    <h3>No at-risk students!</h3>
                    <p>All students are meeting the current thresholds. Try lowering the sliders if you expect results.</p>
                </div>
            ) : (
                <>
                    {/* Summary cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div className="stat-card red">
                            <div className="stat-icon red">🔴</div>
                            <div className="stat-value" style={{ color: 'var(--danger)' }}>{highRisk.length}</div>
                            <div className="stat-label">High Risk</div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Low att. AND low grade</div>
                        </div>
                        <div className="stat-card amber">
                            <div className="stat-icon amber">🟡</div>
                            <div className="stat-value" style={{ color: 'var(--warning)' }}>{mediumRisk.length}</div>
                            <div className="stat-label">At Risk</div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Low att. OR low grade</div>
                        </div>
                    </div>

                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Risk</th>
                                    <th>Student</th>
                                    <th>Attendance</th>
                                    <th>Avg Grade</th>
                                    <th>Flags</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(({ student: s, attRate, avgGrade, lowAtt, lowGrade, riskLevel }) => {
                                    const r = RISK_COLORS[riskLevel]
                                    return (
                                        <tr key={s._id} style={{ background: r.bg }}>
                                            <td>
                                                <span className={`badge ${r.badge}`}>{r.label}</span>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</div>
                                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{s.studentId} · {s.email}</div>
                                            </td>
                                            <td>
                                                {attRate !== null ? (
                                                    <div>
                                                        <span style={{ fontWeight: 700, color: lowAtt ? 'var(--danger)' : 'var(--success)' }}>{attRate}%</span>
                                                        {lowAtt && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', marginLeft: '0.5rem' }}>▼ Below {attThreshold}%</span>}
                                                    </div>
                                                ) : <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>No data</span>}
                                            </td>
                                            <td>
                                                {avgGrade !== null ? (
                                                    <div>
                                                        <span style={{ fontWeight: 700, color: lowGrade ? 'var(--danger)' : 'var(--success)' }}>{avgGrade}%</span>
                                                        {lowGrade && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', marginLeft: '0.5rem' }}>▼ Below {gradeThreshold}%</span>}
                                                    </div>
                                                ) : <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>No grades</span>}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                    {lowAtt && <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>📋 Low Attendance</span>}
                                                    {lowGrade && <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>📝 Low Grades</span>}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    )
}
