import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import NoteListPage from './pages/NoteListPage'
import NoteViewPage from './pages/NoteViewPage'
import NoteEditPage from './pages/NoteEditPage'
import NoteCreatePage from './pages/NoteCreatePage'
import SettingsPage from './pages/SettingsPage'
import Layout from './components/Layout'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <div className="loading">로딩 중...</div>
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<NoteListPage />} />
          <Route path="notes/:filename" element={<NoteViewPage />} />
          <Route path="notes/:filename/edit" element={<NoteEditPage />} />
          <Route path="new" element={<NoteCreatePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
