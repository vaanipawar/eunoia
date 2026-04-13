import api from './client'

export const loginAPI = (email, password) =>
  api.post('/api/auth/login', new URLSearchParams({ username: email, password }))

export const registerAPI = (data) => api.post('/api/auth/register', data)

export const sendMessageAPI = (message, session_id) =>
  api.post('/api/chat/message', { message, session_id })

export const getSessionsAPI = () => api.get('/api/chat/sessions')
export const getSessionHistoryAPI = (id) => api.get(`/api/chat/history/${id}`)

export const predictAPI = (features) => api.post('/api/predict/', features)
export const getPredictHistoryAPI = () => api.get('/api/predict/history')

export const getAllStudentsAPI = () => api.get('/api/admin/students')
export const getMentorAssignmentsAPI = () => api.get('/api/mentor/assignments')
export const updateAssignmentAPI = (id, data) => api.patch(`/api/mentor/assignments/${id}`, data)