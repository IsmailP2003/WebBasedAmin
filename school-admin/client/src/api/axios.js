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
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// ── API helper functions ─────────────────────────────
export const authAPI = {
  login:  (data) => api.post('/auth/login', data),
  me:     ()     => api.get('/auth/me'),
}

export const studentsAPI = {
  getAll:  (params) => api.get('/students', { params }),
  getById: (id)     => api.get(`/students/${id}`),
  create:  (data)   => api.post('/students', data),
  update:  (id, data) => api.put(`/students/${id}`, data),
  delete:  (id)     => api.delete(`/students/${id}`),
  report:  (id)     => api.get(`/students/${id}/report`, { responseType: 'blob' }),
}

export const coursesAPI = {
  getAll:       (params)      => api.get('/courses', { params }),
  getById:      (id)          => api.get(`/courses/${id}`),
  create:       (data)        => api.post('/courses', data),
  update:       (id, data)    => api.put(`/courses/${id}`, data),
  delete:       (id)          => api.delete(`/courses/${id}`),
  enrol:        (id, studentId) => api.post(`/courses/${id}/enrol`, { studentId }),
  removeStudent:(id, studentId) => api.delete(`/courses/${id}/enrol/${studentId}`),
}

export const attendanceAPI = {
  get:     (params) => api.get('/attendance', { params }),
  mark:    (data)   => api.post('/attendance', data),
  summary: (studentId) => api.get(`/attendance/student/${studentId}/summary`),
}

export const gradesAPI = {
  get:           (params)    => api.get('/grades', { params }),
  courseSummary: (courseId)  => api.get(`/grades/course/${courseId}/summary`),
  create:        (data)      => api.post('/grades', data),
  update:        (id, data)  => api.put(`/grades/${id}`, data),
  delete:        (id)        => api.delete(`/grades/${id}`),
}

export const analyticsAPI = {
  summary:           () => api.get('/analytics/summary'),
  attendanceRate:    () => api.get('/analytics/attendance-rate'),
  gradeDistribution: () => api.get('/analytics/grade-distribution'),
  monthlyEnrolments: () => api.get('/analytics/monthly-enrolments'),
}

export const auditAPI = {
  get: (params) => api.get('/audit', { params }),
}

export const evaluationAPI = {
  submit:  (data) => api.post('/evaluation', data),
  results: ()     => api.get('/evaluation/results'),
}
