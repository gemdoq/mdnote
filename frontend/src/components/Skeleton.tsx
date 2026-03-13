export function NoteListSkeleton() {
  return (
    <div className="skeleton-container" aria-label="노트 목록 로딩 중">
      <div className="skeleton-header">
        <div className="skeleton-box skeleton-pulse" style={{ width: '140px', height: '28px' }} />
        <div className="skeleton-box skeleton-pulse" style={{ width: '100px', height: '36px' }} />
      </div>
      <div className="skeleton-search">
        <div className="skeleton-box skeleton-pulse" style={{ width: '100%', height: '44px' }} />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton-note-item skeleton-pulse">
          <div className="skeleton-box" style={{ width: '60%', height: '18px' }} />
          <div className="skeleton-box" style={{ width: '80px', height: '14px' }} />
        </div>
      ))}
    </div>
  )
}

export function NoteViewSkeleton() {
  return (
    <div className="skeleton-container" aria-label="노트 로딩 중">
      <div className="skeleton-header">
        <div className="skeleton-box skeleton-pulse" style={{ width: '60px', height: '32px' }} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <div className="skeleton-box skeleton-pulse" style={{ width: '60px', height: '32px' }} />
          <div className="skeleton-box skeleton-pulse" style={{ width: '60px', height: '32px' }} />
        </div>
      </div>
      <div className="skeleton-body skeleton-pulse">
        <div className="skeleton-box" style={{ width: '70%', height: '24px', marginBottom: '16px' }} />
        <div className="skeleton-box" style={{ width: '100%', height: '16px', marginBottom: '8px' }} />
        <div className="skeleton-box" style={{ width: '100%', height: '16px', marginBottom: '8px' }} />
        <div className="skeleton-box" style={{ width: '90%', height: '16px', marginBottom: '8px' }} />
        <div className="skeleton-box" style={{ width: '100%', height: '16px', marginBottom: '8px' }} />
        <div className="skeleton-box" style={{ width: '60%', height: '16px' }} />
      </div>
    </div>
  )
}

export function SettingsSkeleton() {
  return (
    <div className="skeleton-container" aria-label="설정 로딩 중">
      <div className="skeleton-box skeleton-pulse" style={{ width: '60px', height: '28px', marginBottom: '24px' }} />
      <div className="skeleton-section skeleton-pulse">
        <div className="skeleton-box" style={{ width: '80px', height: '20px', marginBottom: '12px' }} />
        <div className="skeleton-box" style={{ width: '150px', height: '16px', marginBottom: '8px' }} />
        <div className="skeleton-box" style={{ width: '200px', height: '16px' }} />
      </div>
      <div className="skeleton-section skeleton-pulse">
        <div className="skeleton-box" style={{ width: '120px', height: '20px', marginBottom: '12px' }} />
        <div className="skeleton-box" style={{ width: '100%', height: '44px', marginBottom: '8px' }} />
        <div className="skeleton-box" style={{ width: '100%', height: '44px' }} />
      </div>
    </div>
  )
}
