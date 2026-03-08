import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { listNotes, searchNotes, type NoteListItem } from '../api/notes'

export default function NoteListPage() {
  const [notes, setNotes] = useState<NoteListItem[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchNotes = async () => {
    try {
      setLoading(true)
      const res = query
        ? await searchNotes(query)
        : await listNotes()
      setNotes(res.data)
      setError('')
    } catch {
      setError('노트를 불러올 수 없습니다. GitHub 설정을 확인해주세요.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotes()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchNotes()
  }

  const parseFilename = (filename: string) => {
    const match = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/)
    if (match) {
      return { date: match[1], title: match[2].replace(/-/g, ' ') }
    }
    return { date: '', title: filename.replace('.md', '') }
  }

  if (loading) return <div className="loading">로딩 중...</div>

  return (
    <div className="note-list-page">
      <div className="page-header">
        <h2>노트 목록</h2>
        <Link to="/new" className="btn-primary">새 노트</Link>
      </div>

      <form onSubmit={handleSearch} className="search-bar">
        <input
          type="text"
          placeholder="검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit">검색</button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {notes.length === 0 && !error ? (
        <div className="empty-state">
          <p>노트가 없습니다.</p>
          <Link to="/new">첫 번째 노트를 만들어보세요</Link>
        </div>
      ) : (
        <ul className="note-list">
          {notes.map((note) => {
            const { date, title } = parseFilename(note.filename)
            return (
              <li key={note.filename}>
                <Link to={`/notes/${encodeURIComponent(note.filename)}`} className="note-item">
                  <span className="note-title">{title}</span>
                  {date && <span className="note-date">{date}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
