import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import type { EditorView } from '@codemirror/view'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { getNote, updateNote } from '../api/notes'
import { useToast } from '../contexts/ToastContext'
import ConfirmModal from '../components/ConfirmModal'
import MarkdownToolbar from '../components/MarkdownToolbar'

export default function NoteEditPage() {
  const { filename } = useParams<{ filename: string }>()
  const [content, setContent] = useState('')
  const [sha, setSha] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [showDraftModal, setShowDraftModal] = useState(false)
  const [draftContent, setDraftContent] = useState<string | null>(null)
  const editorViewRef = useRef<EditorView | null>(null)
  const navigate = useNavigate()
  const { showToast } = useToast()

  const draftKey = filename ? `draft-edit-${filename}` : ''

  useEffect(() => {
    if (!filename) return
    getNote(filename)
      .then((res) => {
        setContent(res.data.content)
        setSha(res.data.sha)

        // 드래프트 확인
        const draft = localStorage.getItem(draftKey)
        if (draft && draft !== res.data.content) {
          setDraftContent(draft)
          setShowDraftModal(true)
        }
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [filename, navigate])

  // 자동저장 (5초마다)
  const contentRef = useRef(content)
  contentRef.current = content

  useEffect(() => {
    if (!draftKey) return
    const timer = setInterval(() => {
      localStorage.setItem(draftKey, contentRef.current)
    }, 5000)
    return () => clearInterval(timer)
  }, [draftKey])

  const handleRestoreDraft = () => {
    if (draftContent) setContent(draftContent)
    setShowDraftModal(false)
    setDraftContent(null)
  }

  const handleDiscardDraft = () => {
    localStorage.removeItem(draftKey)
    setShowDraftModal(false)
    setDraftContent(null)
  }

  const handleSave = async () => {
    if (!filename) return
    setSaving(true)
    try {
      const res = await updateNote(filename, { content, sha })
      setSha(res.data.sha)
      localStorage.removeItem(draftKey)
      showToast('노트가 저장되었습니다.', 'success')
      navigate(`/notes/${encodeURIComponent(filename)}`)
    } catch {
      showToast('저장에 실패했습니다.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleEditorCreate = useCallback((view: EditorView) => {
    editorViewRef.current = view
  }, [])

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

      <div className="editor-tabs">
        <button
          className={`tab-btn ${activeTab === 'edit' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('edit')}
        >
          편집
        </button>
        <button
          className={`tab-btn ${activeTab === 'preview' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          미리보기
        </button>
      </div>

      {activeTab === 'edit' ? (
        <>
          <MarkdownToolbar editorView={editorViewRef.current} />
          <CodeMirror
            value={content}
            extensions={[markdown()]}
            onChange={setContent}
            height="calc(100vh - 220px)"
            theme="dark"
            onCreateEditor={handleEditorCreate}
          />
        </>
      ) : (
        <article className="markdown-body preview-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {content}
          </ReactMarkdown>
        </article>
      )}

      <ConfirmModal
        isOpen={showDraftModal}
        title="임시저장"
        message="임시저장된 내용이 있습니다. 복원하시겠습니까?"
        onConfirm={handleRestoreDraft}
        onCancel={handleDiscardDraft}
      />
    </div>
  )
}
