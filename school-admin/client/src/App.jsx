import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'

import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import StudentsPage from './pages/StudentsPage'
import CoursesPage from './pages/CoursesPage'
import AttendancePage from './pages/AttendancePage'
import GradesPage from './pages/GradesPage'
import AuditPage from './pages/AuditPage'
import EvaluationPage from './pages/EvaluationPage'

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-center"><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="students" element={
          <ProtectedRoute roles={['admin', 'teacher']}>
            <StudentsPage />
          </ProtectedRoute>
        } />
        <Route path="courses" element={
          <ProtectedRoute roles={['admin', 'teacher']}>
            <CoursesPage />
          </ProtectedRoute>
        } />
        <Route path="attendance" element={
          <ProtectedRoute roles={['admin', 'teacher']}>
            <AttendancePage />
          </ProtectedRoute>
        } />
        <Route path="grades" element={
          <ProtectedRoute roles={['admin', 'teacher']}>
            <GradesPage />
          </ProtectedRoute>
        } />
        <Route path="audit" element={
          <ProtectedRoute roles={['admin']}>
            <AuditPage />
          </ProtectedRoute>
        } />
        <Route path="evaluation" element={<EvaluationPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
