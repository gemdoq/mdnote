import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { getSharedNote } from '../api/notes'

export default function SharedNotePage() {
  const { token } = useParams<{ token: string }>()
  const [content, setContent] = useState('')
  const [filename, setFilename] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    getSharedNote(token)
      .then((res) => {
        setContent(res.data.content)
        setFilename(res.data.filename)
      })
      .catch(() => setError('공유된 노트를 찾을 수 없습니다.'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return <div className="loading">로딩 중...</div>
  if (error) return (
    <div className="shared-note-page">
      <div className="error-message">{error}</div>
    </div>
  )

  const parseTitle = (fn: string) => {
    const match = fn.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/)
    return match ? match[2].replace(/-/g, ' ') : fn.replace('.md', '')
  }

  return (
    <div className="shared-note-page">
      <header className="shared-header">
        <span className="logo">mdnote</span>
        <span className="shared-badge">공유된 노트</span>
      </header>
      <div className="shared-content">
        <h1 className="shared-title">{parseTitle(filename)}</h1>
        <article className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  )
}
