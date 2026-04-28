import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token from localStorage on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally — clear session and redirect to login
// Handle 429 globally — show friendly message, auto-retry after delay
api.interceptors.response.use(
  response => response,
  async error => {
    const status = error.response?.status

    if (status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    if (status === 429) {
      // Respect the Retry-After header if present, otherwise wait 10s
      const retryAfter = error.response?.headers?.['retry-after']
      const waitMs = retryAfter ? Number(retryAfter) * 1000 : 10000
      await new Promise(resolve => setTimeout(resolve, waitMs))
      // Retry the original request once
      return api.request(error.config)
    }

    return Promise.reject(error)
  }
)

export default api

// ── API helper functions ─────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.patch('/auth/change-password', data),
}

export const studentsAPI = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  report: (id) => api.get(`/students/${id}/report`, { responseType: 'blob' }),
}

export const coursesAPI = {
  getAll: (params) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
  enrol: (id, studentId) => api.post(`/courses/${id}/enrol`, { studentId }),
  removeStudent: (id, studentId) => api.delete(`/courses/${id}/enrol/${studentId}`),
}

export const attendanceAPI = {
  get: (params) => api.get('/attendance', { params }),
  mark: (data) => api.post('/attendance', data),
  summary: (studentId) => api.get(`/attendance/student/${studentId}/summary`),
}

export const gradesAPI = {
  get: (params) => api.get('/grades', { params }),
  courseSummary: (courseId) => api.get(`/grades/course/${courseId}/summary`),
  create: (data) => api.post('/grades', data),
  update: (id, data) => api.put(`/grades/${id}`, data),
  delete: (id) => api.delete(`/grades/${id}`),
}

export const analyticsAPI = {
  summary: () => api.get('/analytics/summary'),
  attendanceRate: () => api.get('/analytics/attendance-rate'),
  gradeDistribution: () => api.get('/analytics/grade-distribution'),
  monthlyEnrolments: () => api.get('/analytics/monthly-enrolments'),
  atRisk: (params) => api.get('/analytics/at-risk', { params }),
}

export const auditAPI = {
  get: (params) => api.get('/audit', { params }),
}

export const evaluationAPI = {
  submit: (data) => api.post('/evaluation', data),
  results: () => api.get('/evaluation/results'),
}

export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  reactivate: (id) => api.patch(`/users/${id}/reactivate`),
  deactivate: (id) => api.delete(`/users/${id}`),
  resetPassword: (id, newPassword) => api.patch(`/users/${id}/reset-password`, { newPassword }),
}

export const announcementsAPI = {
  getAll: (params) => api.get('/announcements', { params }),
  create: (data) => api.post('/announcements', data),
  pin: (id) => api.patch(`/announcements/${id}/pin`),
  delete: (id) => api.delete(`/announcements/${id}`),
}

export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
}

export const materialsAPI = {
  getAll: (courseId) => api.get(`/courses/${courseId}/materials`),
  upload: (courseId, formData) => api.post(`/courses/${courseId}/materials`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  download: (courseId, matId) => api.get(`/courses/${courseId}/materials/${matId}/download`, { responseType: 'blob' }),
  delete: (courseId, matId) => api.delete(`/courses/${courseId}/materials/${matId}`),
}
