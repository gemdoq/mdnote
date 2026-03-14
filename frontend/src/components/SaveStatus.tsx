export type SaveState = 'draft' | 'unsaved' | 'saved'

interface SaveStatusProps {
  state: SaveState
}

const STATUS_CONFIG: Record<SaveState, { label: string; className: string }> = {
  draft: { label: '임시저장됨', className: 'save-status-draft' },
  unsaved: { label: '저장 필요', className: 'save-status-unsaved' },
  saved: { label: '저장 완료', className: 'save-status-saved' },
}

export default function SaveStatus({ state }: SaveStatusProps) {
  const config = STATUS_CONFIG[state]
  return (
    <span className={`save-status ${config.className}`} aria-label={`저장 상태: ${config.label}`}>
      {config.label}
    </span>
  )
}
