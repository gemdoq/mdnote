import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import type { EditorView } from '@codemirror/view'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { createNote } from '../api/notes'
import { useToast } from '../contexts/ToastContext'
import ConfirmModal from '../components/ConfirmModal'
import MarkdownToolbar from '../components/MarkdownToolbar'

const DRAFT_KEY = 'draft-new'

export default function NoteCreatePage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [showDraftModal, setShowDraftModal] = useState(false)
  const [draftData, setDraftData] = useState<{ title: string; content: string } | null>(null)
  const editorViewRef = useRef<EditorView | null>(null)
  const navigate = useNavigate()
  const { showToast } = useToast()

  // 드래프트 확인
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY)
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        if (parsed.title || parsed.content) {
          setDraftData(parsed)
          setShowDraftModal(true)
        }
      } catch { /* 무시 */ }
    }
  }, [])

  // 자동저장 (5초마다)
  const titleRef = useRef(title)
  const contentRef = useRef(content)
  titleRef.current = title
  contentRef.current = content

  useEffect(() => {
    const timer = setInterval(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ title: titleRef.current, content: contentRef.current }))
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const handleRestoreDraft = () => {
    if (draftData) {
      setTitle(draftData.title)
      setContent(draftData.content)
    }
    setShowDraftModal(false)
    setDraftData(null)
  }

  const handleDiscardDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
    setShowDraftModal(false)
    setDraftData(null)
  }

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
      localStorage.removeItem(DRAFT_KEY)
      showToast('노트가 생성되었습니다.', 'success')
      navigate(`/notes/${encodeURIComponent(filename)}`)
    } catch {
      showToast('노트 생성에 실패했습니다.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleEditorCreate = useCallback((view: EditorView) => {
    editorViewRef.current = view
  }, [])

  return (
    <div className="note-create-page">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="제목 (영어 소문자, 띄어쓰기 가능)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="title-input"
          required
        />
        {title && (
          <p className="filename-preview">
            파일명: {generateFilename(title)}
          </p>
        )}

        <button
          type="button"
          className="mode-toggle"
          onClick={() => setActiveTab(activeTab === 'edit' ? 'preview' : 'edit')}
        >
          {activeTab === 'edit' ? '👁 미리보기' : '✏️ 편집'}
        </button>

        {activeTab === 'edit' ? (
          <>
            <MarkdownToolbar editorView={editorViewRef.current} />
            <CodeMirror
              value={content}
              extensions={[markdown()]}
              onChange={setContent}
              height="calc(100vh - 320px)"
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

        <div className="editor-bottom-actions">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? '생성 중...' : '생성'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-cancel">취소</button>
        </div>
      </form>

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
