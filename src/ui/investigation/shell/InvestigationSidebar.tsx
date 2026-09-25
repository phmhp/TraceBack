import type { InvestigationPresentationModel, HypothesisModel } from '../presentation/InvestigationPresentationModel'
import type { Evidence } from '../../../runtime/investigation/Evidence'

interface SidebarProps {
  model: InvestigationPresentationModel
  hypothesis: HypothesisModel | null
  evidenceList: readonly Evidence[]
  onOpenAddEvidenceModal?: () => void
  onSelectEvidence?: (ev: Evidence) => void
  onNavigateToTracking?: () => void
}

export function InvestigationSidebar({
  model,
  hypothesis,
  evidenceList,
  onOpenAddEvidenceModal,
  onSelectEvidence,
  onNavigateToTracking
}: SidebarProps) {
  const { progress } = model

  return (
    <aside className="investigation-sidebar">
      {/* 1. 사건 정보 카드 */}
      <section className="sidebar-card">
        <div className="sidebar-card-header">
          <div className="sidebar-card-title">
            <span>📋</span>
            <span>사건 정보</span>
          </div>
          <span className="sidebar-badge badge-warning">조사 중</span>
        </div>

        <div className="case-id-label">{model.caseId}</div>

        <div className="case-thumb-wrap">
          <img
            src="/assets/investigation/driver-front-polaroid.png"
            alt="사건 주행 상황"
            className="case-thumb-img"
            onError={(e) => {
              // Fallback to placeholder if asset not present
              (e.target as HTMLImageElement).src = '/assets/investigation/village-polaroid.png'
            }}
          />
        </div>

        <div className="case-meta-grid">
          <span className="case-meta-key">사건 시점</span>
          <span className="case-meta-val">{model.eventTimeSeconds.toFixed(3)} s</span>

          <span className="case-meta-key">증상명</span>
          <span className="case-meta-val">{model.symptomName}</span>

          <span className="case-meta-key">요약</span>
          <span className="case-meta-val">{model.symptomSummary}</span>
        </div>
      </section>

      {/* 2. 조사 진행도 */}
      <section className="sidebar-card">
        <div className="sidebar-card-header">
          <div className="sidebar-card-title">
            <span>🧭</span>
            <span>조사 진행도</span>
          </div>
        </div>

        <div className="progress-list">
          <div className={`progress-item ${progress.phenomenonConfirmed ? 'completed' : 'current'}`}>
            <span className="progress-dot">{progress.phenomenonConfirmed ? '✓' : '1'}</span>
            <span>현상 확인</span>
          </div>

          <div className={`progress-item ${progress.boundaryTracked ? 'completed' : 'current'}`}>
            <span className="progress-dot">{progress.boundaryTracked ? '✓' : '2'}</span>
            <span>이상 발생 범위 추적</span>
          </div>

          <div className={`progress-item ${progress.hypothesisFormulated ? 'completed' : progress.boundaryTracked ? 'current' : ''}`}>
            <span className="progress-dot">{progress.hypothesisFormulated ? '✓' : '3'}</span>
            <span>가설 설정</span>
          </div>

          <div className={`progress-item ${progress.hypothesisVerified ? 'completed' : progress.hypothesisFormulated ? 'current' : ''}`}>
            <span className="progress-dot">{progress.hypothesisVerified ? '✓' : '4'}</span>
            <span>가설 검증</span>
          </div>

          <div className={`progress-item ${progress.conclusionSubmitted ? 'completed' : progress.hypothesisVerified ? 'current' : ''}`}>
            <span className="progress-dot">{progress.conclusionSubmitted ? '✓' : '5'}</span>
            <span>결론 제출</span>
          </div>
        </div>
      </section>

      {/* 3. 현재 가설 카드 */}
      <section className="sidebar-card">
        <div className="sidebar-card-header">
          <div className="sidebar-card-title">
            <span>💡</span>
            <span>현재 가설</span>
          </div>
        </div>

        {hypothesis ? (
          <div className="case-meta-grid" style={{ marginTop: '4px' }}>
            <span className="case-meta-key">대상</span>
            <span className="case-meta-val">{hypothesis.target}</span>

            <span className="case-meta-key">관련 신호</span>
            <span className="case-meta-val">{hypothesis.signal || '—'}</span>

            <span className="case-meta-key">유형</span>
            <span className="case-meta-val">{hypothesis.type}</span>
          </div>
        ) : (
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', lineHeight: 1.4 }}>
            <p style={{ margin: '0 0 6px 0' }}>아직 등록된 가설이 없습니다.</p>
            <p style={{ margin: '0 0 6px 0' }}>원인 추적 단계에서 의심되는 기능을 찾아 가설을 설정해보세요.</p>
            {onNavigateToTracking && (
              <button
                type="button"
                className="timeline-btn"
                onClick={onNavigateToTracking}
                style={{ fontSize: '10px', padding: '3px 8px' }}
              >
                원인 추적으로 이동 →
              </button>
            )}
          </div>
        )}
      </section>

      {/* 4. 확보한 근거 */}
      <section className="sidebar-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="sidebar-card-header">
          <div className="sidebar-card-title">
            <span>📁</span>
            <span>확보한 근거 ({evidenceList.length})</span>
          </div>
          {onOpenAddEvidenceModal && (
            <button
              type="button"
              onClick={onOpenAddEvidenceModal}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
              title="근거 추가"
            >
              +
            </button>
          )}
        </div>

        <div className="evidence-mini-list" style={{ overflowY: 'auto', flex: 1 }}>
          {evidenceList.length === 0 ? (
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0' }}>
              조사 중 의심스러운 신호나 요구사항을 근거로 저장하세요.
            </p>
          ) : (
            evidenceList.map((ev) => {
              const icon =
                ev.type === 'SIGNAL_BOUNDARY' ? '📈' :
                ev.type === 'TEST_RESULT' ? '🧪' :
                ev.type === 'REQUIREMENT' ? '📄' : '📌'

              return (
                <button
                  key={ev.id}
                  type="button"
                  className="evidence-mini-btn"
                  onClick={() => onSelectEvidence?.(ev)}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                    <span>{icon}</span>
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {ev.title || ev.relatedComponent}
                    </span>
                  </span>
                  <span>›</span>
                </button>
              )
            })
          )}
        </div>
      </section>
    </aside>
  )
}
