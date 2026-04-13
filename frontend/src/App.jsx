import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './store/useAuth.jsx'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import StudentDashboard from './pages/StudentDashboard'
import ChatPage from './pages/ChatPage'
import SurveyPage from './pages/SurveyPage'
import AdminDashboard from './pages/AdminDashboard'
import MentorPortal from './pages/MentorPortal'
import Layout from './components/Layout'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { user } = useAuth()
  const home = user?.role === 'admin' ? '/admin'
    : user?.role === 'mentor' ? '/mentor'
    : '/dashboard'

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/" element={<Navigate to={home} replace />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>
        } />
        <Route path="/chat" element={
          <ProtectedRoute allowedRoles={['student']}><ChatPage /></ProtectedRoute>
        } />
        <Route path="/survey" element={
          <ProtectedRoute allowedRoles={['student']}><SurveyPage /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/mentor" element={
          <ProtectedRoute allowedRoles={['mentor']}><MentorPortal /></ProtectedRoute>
        } />
      </Route>
    </Routes>
  )
}
import PendingApproval from './pages/PendingApproval'

// Add outside the Layout routes:
<Route path="/pending-approval" element={<PendingApproval />} />