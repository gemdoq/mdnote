import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { getNote, updateNote } from '../api/notes'

export default function NoteEditPage() {
  const { filename } = useParams<{ filename: string }>()
  const [content, setContent] = useState('')
  const [sha, setSha] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!filename) return
    getNote(filename)
      .then((res) => {
        setContent(res.data.content)
        setSha(res.data.sha)
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [filename, navigate])

  const handleSave = async () => {
    if (!filename) return
    setSaving(true)
    try {
      const res = await updateNote(filename, { content, sha })
      setSha(res.data.sha)
      navigate(`/notes/${encodeURIComponent(filename)}`)
    } catch {
      alert('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading">로딩 중...</div>

  return (
    <div className="note-edit-page">
      <div className="edit-header">
        <h2>{filename}</h2>
        <div>
          <button onClick={() => navigate(-1)} className="btn-cancel">취소</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
      <CodeMirror
        value={content}
        extensions={[markdown()]}
        onChange={setContent}
        height="calc(100vh - 140px)"
        theme="dark"
      />
    </div>
  )
}
