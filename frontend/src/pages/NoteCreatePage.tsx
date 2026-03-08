import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { createNote } from '../api/notes'

export default function NoteCreatePage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  const generateFilename = (title: string): string => {
    const date = new Date().toISOString().slice(0, 10)
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    return `${date}-${slug}.md`
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setSaving(true)
    try {
      const filename = generateFilename(title)
      await createNote({ filename, content })
      navigate(`/notes/${encodeURIComponent(filename)}`)
    } catch {
      alert('노트 생성에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="note-create-page">
      <form onSubmit={handleSubmit}>
        <div className="create-header">
          <input
            type="text"
            placeholder="제목 (영어 소문자, 띄어쓰기 가능)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="title-input"
            required
          />
          <div>
            <button type="button" onClick={() => navigate(-1)} className="btn-cancel">취소</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? '생성 중...' : '생성'}
            </button>
          </div>
        </div>
        {title && (
          <p className="filename-preview">
            파일명: {generateFilename(title)}
          </p>
        )}
        <CodeMirror
          value={content}
          extensions={[markdown()]}
          onChange={setContent}
          height="calc(100vh - 200px)"
          theme="dark"
        />
      </form>
    </div>
  )
}
