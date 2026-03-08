import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Layout() {
  const { username, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="logo">mdnote</Link>
        <nav className="nav">
          <Link to="/new" className="nav-link">새 노트</Link>
          <Link to="/settings" className="nav-link">설정</Link>
          <span className="nav-username">{username}</span>
          <button onClick={handleLogout} className="nav-link btn-logout">로그아웃</button>
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
