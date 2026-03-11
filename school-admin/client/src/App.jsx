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
import UsersPage from './pages/UsersPage'
import AnnouncementsPage from './pages/AnnouncementsPage'
import AtRiskPage from './pages/AtRiskPage'
import TimetablePage from './pages/TimetablePage'
import MyDashboardPage from './pages/MyDashboardPage'

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-center"><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'student' ? '/my-dashboard' : '/dashboard'} replace />
  }
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'student' ? '/my-dashboard' : '/dashboard'} replace /> : <LoginPage />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to={user?.role === 'student' ? '/my-dashboard' : '/dashboard'} replace />} />
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
        <Route path="users" element={
          <ProtectedRoute roles={['admin']}>
            <UsersPage />
          </ProtectedRoute>
        } />
        <Route path="evaluation" element={<EvaluationPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="at-risk" element={
          <ProtectedRoute roles={['admin', 'teacher']}>
            <AtRiskPage />
          </ProtectedRoute>
        } />
        <Route path="timetable" element={<TimetablePage />} />
        <Route path="my-dashboard" element={
          <ProtectedRoute roles={['student']}>
            <MyDashboardPage />
          </ProtectedRoute>
        } />
        <Route path="my-grades" element={
          <ProtectedRoute roles={['student']}>
            <GradesPage />
          </ProtectedRoute>
        } />
        <Route path="my-attendance" element={
          <ProtectedRoute roles={['student']}>
            <AttendancePage />
          </ProtectedRoute>
        } />
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
