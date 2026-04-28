import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { authAPI, usersAPI } from '../api/axios'
import { ShieldCheck, LockKeyhole } from 'lucide-react'

const ROLE_LABELS = { admin: 'Administrator', teacher: 'Faculty Member', student: 'Student' }
const ROLE_COLORS = { admin: '#b45309', teacher: '#0f5c4e', student: '#1e40af' }
const ROLE_BG    = { admin: '#fdf3dc',  teacher: '#e8f4f2', student: '#eff6ff' }

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9', alignItems: 'flex-start' }}>
      <div style={{ width: 160, fontSize: '0.78rem', color: '#64748b', fontWeight: 600, flexShrink: 0 }}>{label}</div>
      <div style={{ fontSize: '0.85rem', color: '#111827', fontWeight: 500 }}>{value || <span style={{ color: '#cbd5e1' }}>—</span>}</div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────── */
/* Strength checker                                         */
/* ──────────────────────────────────────────────────────── */
function PasswordStrength({ password }) {
  if (!password) return null
  const checks = [
    { ok: password.length >= 6,          label: 'At least 6 characters' },
    { ok: /[A-Z]/.test(password),        label: 'Contains uppercase letter' },
    { ok: /[0-9]/.test(password),        label: 'Contains a number' },
    { ok: /[^A-Za-z0-9]/.test(password), label: 'Contains special character' },
  ]
  return (
    <div style={{ background: '#f8fafc', borderRadius: 6, padding: '0.6rem 0.75rem', marginBottom: '0.75rem', border: '1px solid #e2e8f0' }}>
      <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '0 0 0.3rem', fontWeight: 600 }}>Password strength:</p>
      {checks.map(({ ok, label }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: ok ? '#16a34a' : '#94a3b8' }}>
          <span>{ok ? '✓' : '○'}</span>{label}
        </div>
      ))}
    </div>
  )
}

/* ──────────────────────────────────────────────────────── */
/* Eye toggle button                                        */
/* ──────────────────────────────────────────────────────── */
function EyeBtn({ show, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center' }}
      aria-label={show ? 'Hide password' : 'Show password'}
    >
      {show
        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      }
    </button>
  )
}

/* ──────────────────────────────────────────────────────── */
/* Admin-only: Reset a teacher's password                   */
/* ──────────────────────────────────────────────────────── */
function ResetTeacherPasswordCard() {
  const toast = useToast()
  const [teachers, setTeachers]     = useState([])
  const [loadingT, setLoadingT]     = useState(true)
  const [selectedId, setSelectedId] = useState('')
  const [newPw, setNewPw]           = useState('')
  const [confirmPw, setConfirmPw]   = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    usersAPI.getAll({ role: 'teacher', includeInactive: false })
      .then(res => setTeachers(res.data.data || []))
      .catch(() => toast.error('Could not load teacher list.'))
      .finally(() => setLoadingT(false))
  }, [])

  const handleReset = async (e) => {
    e.preventDefault()
    if (newPw !== confirmPw) { toast.error('Passwords do not match.'); return }
    if (newPw.length < 6)   { toast.error('Password must be at least 6 characters.'); return }
    if (!selectedId)         { toast.error('Please select a teacher.'); return }

    setSubmitting(true)
    try {
      const teacher = teachers.find(t => t._id === selectedId)
      await usersAPI.resetPassword(selectedId, newPw)
      toast.success(`Password reset successfully for ${teacher?.name || 'teacher'}.`)
      setSelectedId(''); setNewPw(''); setConfirmPw('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <div className="card-header" style={{ marginBottom: '0.25rem' }}>
        <div>
          <div className="card-title">Reset Teacher Password</div>
          <div className="card-subtitle">Set a new password for any faculty member — no current password required</div>
        </div>
      </div>

      <form onSubmit={handleReset} style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Teacher selector */}
        <div className="form-group">
          <label className="form-label" htmlFor="teacher-select">Select teacher</label>
          {loadingT ? (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', padding: '0.5rem 0' }}>Loading teachers…</div>
          ) : (
            <select
              id="teacher-select"
              className="form-select"
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              required
            >
              <option value="">— Choose a teacher —</option>
              {teachers.map(t => (
                <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
              ))}
            </select>
          )}
        </div>

        {/* New password */}
        <div className="form-group">
          <label className="form-label" htmlFor="reset-new-pw">New password</label>
          <div style={{ position: 'relative' }}>
            <input
              id="reset-new-pw"
              className="form-input"
              type={showPw ? 'text' : 'password'}
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              placeholder="Minimum 6 characters"
              required minLength={6}
              autoComplete="new-password"
              style={{ paddingRight: '2.5rem' }}
            />
            <EyeBtn show={showPw} onToggle={() => setShowPw(p => !p)} />
          </div>
          <PasswordStrength password={newPw} />
        </div>

        {/* Confirm */}
        <div className="form-group">
          <label className="form-label" htmlFor="reset-confirm-pw">Confirm new password</label>
          <div style={{ position: 'relative' }}>
            <input
              id="reset-confirm-pw"
              className="form-input"
              type={showPw ? 'text' : 'password'}
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              placeholder="Re-enter new password"
              required
              autoComplete="new-password"
              style={{ paddingRight: '2.5rem' }}
            />
            <EyeBtn show={showPw} onToggle={() => setShowPw(p => !p)} />
          </div>
          {confirmPw && newPw !== confirmPw && (
            <p style={{ color: '#dc2626', fontSize: '0.72rem', marginTop: '0.3rem' }}>⚠ Passwords do not match</p>
          )}
          {confirmPw && newPw === confirmPw && newPw && (
            <p style={{ color: '#16a34a', fontSize: '0.72rem', marginTop: '0.3rem' }}>✓ Passwords match</p>
          )}
        </div>

        {/* Info banner */}
        <div style={{ padding: '0.75rem 1rem', background: 'var(--accent-light)', borderRadius: 'var(--radius)', border: '1px solid var(--accent-mid)', fontSize: 'var(--text-xs)', color: 'var(--accent)', lineHeight: 1.6 }}>
          The teacher's existing password will be replaced immediately. They will need to use the new password at their next login.
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting || !selectedId || !newPw || !confirmPw}
          style={{ alignSelf: 'flex-start', minWidth: 180 }}
        >
          {submitting ? 'Resetting…' : 'Reset Password'}
        </button>
      </form>
    </div>
  )
}

/* ──────────────────────────────────────────────────────── */
/* Main ProfilePage                                         */
/* ──────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const { user } = useAuth()
  const toast = useToast()
  const [form, setForm]     = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) { toast.error('New passwords do not match.'); return }
    if (form.newPassword.length < 6) { toast.error('New password must be at least 6 characters.'); return }
    setLoading(true)
    try {
      const res = await authAPI.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword })
      toast.success(res.data.message || 'Password changed successfully!')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.')
    } finally {
      setLoading(false)
    }
  }

  const color = ROLE_COLORS[user?.role] || '#374151'
  const bg    = ROLE_BG[user?.role]    || '#f3f4f6'

  return (
    <div className="page-enter">
      {/* Profile header */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #0f2d26, #1e5543)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', fontWeight: 800, color: '#fff', flexShrink: 0,
            boxShadow: '0 4px 18px rgba(15,45,38,0.25)',
          }}>
            {initials}
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>{user?.name}</h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0.4rem' }}>{user?.email}</p>
            <span style={{
              display: 'inline-block', padding: '0.2rem 0.65rem',
              background: bg, color, borderRadius: 4,
              fontSize: '0.68rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              border: `1px solid ${color}30`,
            }}>
              {ROLE_LABELS[user?.role] || user?.role}
            </span>
          </div>
        </div>
      </div>

      <div className="two-col" style={{ alignItems: 'start' }}>
        {/* ── Left column: Account Details ── */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: '0.5rem' }}>
            <div>
              <div className="card-title">Account Details</div>
              <div className="card-subtitle">Your profile information</div>
            </div>
          </div>
          <InfoRow label="Full Name"      value={user?.name} />
          <InfoRow label="Email Address"  value={user?.email} />
          <InfoRow label="Role"           value={ROLE_LABELS[user?.role]} />
          <InfoRow label="Account ID"     value={
            <code style={{ fontSize: '0.72rem', color: '#6366f1', background: '#eef2ff', padding: '0.15rem 0.35rem', borderRadius: 3 }}>
              {user?._id}
            </code>
          } />
          <InfoRow label="Last Login"     value={
            user?.lastLogin
              ? new Date(user.lastLogin).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
              : 'First session'
          } />

          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
            <p style={{ fontSize: '0.78rem', color: '#166534', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={14} strokeWidth={2} />
              Your account is secured with bcrypt password hashing and JWT authentication.
            </p>
          </div>
        </div>

        {/* ── Right column: Password section ── */}
        <div>
          {user?.role === 'teacher' ? (
            /* Teachers: info notice only */
            <div className="card">
              <div className="card-header" style={{ marginBottom: '0.25rem' }}>
                <div>
                  <div className="card-title">Change Password</div>
                  <div className="card-subtitle">Password management</div>
                </div>
              </div>
              <div style={{
                marginTop: '1rem', padding: '1.25rem',
                background: 'var(--accent-light)', borderRadius: 'var(--radius)',
                border: '1px solid var(--accent)', display: 'flex', gap: '1rem', alignItems: 'flex-start',
              }}>
                <LockKeyhole size={20} strokeWidth={1.75} style={{ flexShrink: 0, color: 'var(--accent)' }} />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: '0.35rem', fontSize: 'var(--text-sm)' }}>
                    Password changes are managed by administrators
                  </div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                    As a faculty member, you cannot change your own password directly. Please contact your system administrator to have your password reset.
                  </p>
                </div>
              </div>
            </div>

          ) : user?.role === 'student' ? (
            /* Students: own password change form */
            <div className="card">
              <div className="card-header" style={{ marginBottom: '0.25rem' }}>
                <div>
                  <div className="card-title">Change Password</div>
                  <div className="card-subtitle">Update your login credentials</div>
                </div>
              </div>

              <form onSubmit={handlePasswordChange} style={{ marginTop: '0.5rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="current-pw">Current password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="current-pw"
                      className="form-input"
                      type={showPwd ? 'text' : 'password'}
                      name="currentPassword"
                      value={form.currentPassword}
                      onChange={handleChange}
                      placeholder="Enter your current password"
                      required autoComplete="current-password"
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <EyeBtn show={showPwd} onToggle={() => setShowPwd(p => !p)} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="new-pw">New password</label>
                  <input
                    id="new-pw"
                    className="form-input"
                    type={showPwd ? 'text' : 'password'}
                    name="newPassword"
                    value={form.newPassword}
                    onChange={handleChange}
                    placeholder="Minimum 6 characters"
                    required minLength={6}
                    autoComplete="new-password"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="confirm-pw">Confirm new password</label>
                  <input
                    id="confirm-pw"
                    className="form-input"
                    type={showPwd ? 'text' : 'password'}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter new password"
                    required autoComplete="new-password"
                  />
                  {form.confirmPassword && form.newPassword !== form.confirmPassword && (
                    <p style={{ color: '#dc2626', fontSize: '0.72rem', marginTop: '0.3rem' }}>⚠ Passwords do not match</p>
                  )}
                  {form.confirmPassword && form.newPassword === form.confirmPassword && form.newPassword && (
                    <p style={{ color: '#16a34a', fontSize: '0.72rem', marginTop: '0.3rem' }}>✓ Passwords match</p>
                  )}
                </div>

                <PasswordStrength password={form.newPassword} />

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !form.currentPassword || !form.newPassword || !form.confirmPassword}
                  style={{ width: '100%' }}
                >
                  {loading ? 'Updating…' : 'Update Password'}
                </button>
              </form>
            </div>

          ) : (
            /* Admin: only the teacher reset tool, no self-change form */
            <ResetTeacherPasswordCard />
          )}
        </div>
      </div>
    </div>
  )
}
