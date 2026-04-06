import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { authAPI } from '../api/axios'

const ROLE_LABELS = { admin: 'Administrator', teacher: 'Faculty Member', student: 'Student' }
const ROLE_COLORS = { admin: '#b45309', teacher: '#0f5c4e', student: '#1e40af' }
const ROLE_BG = { admin: '#fdf3dc', teacher: '#e8f4f2', student: '#eff6ff' }

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9', alignItems: 'flex-start' }}>
      <div style={{ width: 160, fontSize: '0.78rem', color: '#64748b', fontWeight: 600, flexShrink: 0 }}>{label}</div>
      <div style={{ fontSize: '0.85rem', color: '#111827', fontWeight: 500 }}>{value || <span style={{ color: '#cbd5e1' }}>—</span>}</div>
    </div>
  )
}

export default function ProfilePage() {
  const { user } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) {
      toast.error('New passwords do not match.')
      return
    }
    if (form.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      const res = await authAPI.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      toast.success(res.data.message || 'Password changed successfully!')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.')
    } finally {
      setLoading(false)
    }
  }

  const color = ROLE_COLORS[user?.role] || '#374151'
  const bg = ROLE_BG[user?.role] || '#f3f4f6'

  return (
    <div className="page-enter">
      {/* Profile header card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* Avatar */}
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
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>
              {user?.name}
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0.4rem' }}>
              {user?.email}
            </p>
            <span style={{
              display: 'inline-block',
              padding: '0.2rem 0.65rem',
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
        {/* Account Details */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: '0.5rem' }}>
            <div>
              <div className="card-title">👤 Account Details</div>
              <div className="card-subtitle">Your profile information</div>
            </div>
          </div>
          <InfoRow label="Full Name" value={user?.name} />
          <InfoRow label="Email Address" value={user?.email} />
          <InfoRow label="Role" value={ROLE_LABELS[user?.role]} />
          <InfoRow label="Account ID" value={
            <code style={{ fontSize: '0.72rem', color: '#6366f1', background: '#eef2ff', padding: '0.15rem 0.35rem', borderRadius: 3 }}>
              {user?._id}
            </code>
          } />
          <InfoRow label="Last Login" value={
            user?.lastLogin
              ? new Date(user.lastLogin).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
              : 'First session'
          } />

          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
            <p style={{ fontSize: '0.78rem', color: '#166534', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>🔒</span>
              Your account is secured with bcrypt password hashing and JWT authentication.
            </p>
          </div>
        </div>

        {/* Change Password */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: '0.25rem' }}>
            <div>
              <div className="card-title">🔑 Change Password</div>
              <div className="card-subtitle">Update your login credentials</div>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} style={{ marginTop: '0.5rem' }}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPwd ? 'text' : 'password'}
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={handleChange}
                  placeholder="Enter your current password"
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#6b7280' }}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                className="form-input"
                type={showPwd ? 'text' : 'password'}
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                className="form-input"
                type={showPwd ? 'text' : 'password'}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter new password"
                required
                autoComplete="new-password"
              />
              {form.confirmPassword && form.newPassword !== form.confirmPassword && (
                <p style={{ color: '#dc2626', fontSize: '0.72rem', marginTop: '0.3rem' }}>⚠ Passwords do not match</p>
              )}
              {form.confirmPassword && form.newPassword === form.confirmPassword && form.newPassword && (
                <p style={{ color: '#16a34a', fontSize: '0.72rem', marginTop: '0.3rem' }}>✓ Passwords match</p>
              )}
            </div>

            {/* Password strength hints */}
            {form.newPassword && (
              <div style={{ background: '#f8fafc', borderRadius: 6, padding: '0.6rem 0.75rem', marginBottom: '0.75rem', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '0 0 0.3rem', fontWeight: 600 }}>Password strength:</p>
                {[
                  { ok: form.newPassword.length >= 6, label: 'At least 6 characters' },
                  { ok: /[A-Z]/.test(form.newPassword), label: 'Contains uppercase letter' },
                  { ok: /[0-9]/.test(form.newPassword), label: 'Contains a number' },
                  { ok: /[^A-Za-z0-9]/.test(form.newPassword), label: 'Contains special character' },
                ].map(({ ok, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: ok ? '#16a34a' : '#94a3b8' }}>
                    <span>{ok ? '✓' : '○'}</span>{label}
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !form.currentPassword || !form.newPassword || !form.confirmPassword}
              style={{ width: '100%' }}
            >
              {loading ? 'Updating…' : '🔑 Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
