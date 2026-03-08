import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { getNote, deleteNote, type Note } from '../api/notes'

export default function NoteViewPage() {
  const { filename } = useParams<{ filename: string }>()
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!filename) return
    getNote(filename)
      .then((res) => setNote(res.data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [filename, navigate])

  const handleDelete = async () => {
    if (!filename || !confirm('정말 삭제하시겠습니까?')) return
    await deleteNote(filename)
    navigate('/')
  }

  if (loading) return <div className="loading">로딩 중...</div>
  if (!note) return null

  return (
    <div className="note-view-page">
      <div className="note-actions">
        <Link to="/" className="btn-back">목록</Link>
        <div>
          <Link to={`/notes/${encodeURIComponent(note.filename)}/edit`} className="btn-edit">편집</Link>
          <button onClick={handleDelete} className="btn-delete">삭제</button>
        </div>
      </div>
      <article className="markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {note.content}
        </ReactMarkdown>
      </article>
    </div>
  )
}
