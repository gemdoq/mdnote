import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import { NoteListSkeleton, NoteViewSkeleton } from './components/Skeleton'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const NoteListPage = lazy(() => import('./pages/NoteListPage'))
const NoteViewPage = lazy(() => import('./pages/NoteViewPage'))
const NoteEditPage = lazy(() => import('./pages/NoteEditPage'))
const NoteCreatePage = lazy(() => import('./pages/NoteCreatePage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const SharedNotePage = lazy(() => import('./pages/SharedNotePage'))

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <NoteListSkeleton />
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ThemeProvider>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={
                <Suspense fallback={<div className="loading">로딩 중...</div>}>
                  <LoginPage />
                </Suspense>
              } />
              <Route path="/register" element={
                <Suspense fallback={<div className="loading">로딩 중...</div>}>
                  <RegisterPage />
                </Suspense>
              } />
              <Route path="/shared/:token" element={
                <Suspense fallback={<NoteViewSkeleton />}>
                  <SharedNotePage />
                </Suspense>
              } />
              <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route index element={
                  <Suspense fallback={<NoteListSkeleton />}>
                    <NoteListPage />
                  </Suspense>
                } />
                <Route path="notes/:filename" element={
                  <Suspense fallback={<NoteViewSkeleton />}>
                    <NoteViewPage />
                  </Suspense>
                } />
                <Route path="notes/:filename/edit" element={
                  <Suspense fallback={<NoteViewSkeleton />}>
                    <NoteEditPage />
                  </Suspense>
                } />
                <Route path="new" element={
                  <Suspense fallback={<NoteViewSkeleton />}>
                    <NoteCreatePage />
                  </Suspense>
                } />
                <Route path="settings" element={
                  <Suspense fallback={<div className="loading">로딩 중...</div>}>
                    <SettingsPage />
                  </Suspense>
                } />
              </Route>
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}
