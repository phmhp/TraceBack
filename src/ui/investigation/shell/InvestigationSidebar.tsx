import type { InvestigationPresentationModel, HypothesisModel } from '../presentation/InvestigationPresentationModel'
import type { Evidence } from '../../../runtime/investigation/Evidence'
import { useState, type Ref } from 'react'

interface SidebarProps {
  model: InvestigationPresentationModel
  hypothesis: HypothesisModel | null
  evidenceList: readonly Evidence[]
  videoSlotRef?: Ref<HTMLDivElement>
  onOpenAddEvidenceModal?: () => void
  onSelectEvidence?: (ev: Evidence) => void
  onNavigateToTracking?: () => void
}

export function InvestigationSidebar({
  model,
  hypothesis,
  evidenceList,
  videoSlotRef,
  onOpenAddEvidenceModal,
  onSelectEvidence,
  onNavigateToTracking
}: SidebarProps) {
  const { progress } = model
  const [collapsed,setCollapsed]=useState(false)
  const [notesOpen,setNotesOpen]=useState(true)
  const investigationNotes=evidenceList.filter(item=>item.type!=='TEST_RESULT')
  const evidenceButton=(ev:Evidence) => {
    const icon=ev.type==='SIGNAL_BOUNDARY'||ev.type==='SIGNAL_COMPARISON'||ev.type==='SIGNAL_OBSERVATION'?'📈':ev.type==='REQUIREMENT'?'📄':'📌'
    const label=ev.type==='SIGNAL_COMPARISON'?(ev.status==='MATCH'?'정상 확인':'차이 단서'):ev.type==='SIGNAL_OBSERVATION'?'관찰 기록':ev.type==='REQUIREMENT'?'기준 근거':'조사 메모'
    return <button key={ev.id} type="button" className="evidence-mini-btn" onClick={()=>onSelectEvidence?.(ev)}><span className="evidence-mini-content"><span className="evidence-mini-icon">{icon}</span><span className="evidence-mini-copy" title={ev.claim}><b>{label}</b><code>{ev.details?.subjectId??ev.title??ev.relatedComponent}</code><small>{ev.claim}</small></span></span><span>다시 확인하기 ›</span></button>
  }

  return (
    <aside className={`investigation-sidebar ${collapsed?'collapsed':''}`}>
      <button type="button" className="sidebar-collapse-toggle" aria-expanded={!collapsed} aria-label={collapsed?'조사 패널 펼치기':'조사 패널 접기'} onClick={()=>setCollapsed(value=>!value)}>
        <span aria-hidden="true">{collapsed?'›':'‹'}</span><b>{collapsed?'패널 열기':'패널 접기'}</b>
      </button>
      {!collapsed&&<>
      {/* 1. 사건 정보 카드 */}
      <section className="sidebar-card sidebar-case-card">
        <div className="sidebar-case-line">
          <span>조사 중</span>
          <code className="case-id-label">{model.caseId}</code>
        </div>

        {/* 3D viewport slot: 원본 desk-video 구조 복원 */}
        {/* case-file.css .mode-xray 규칙이 이 영역의 getBoundingClientRect를 기준으로 3D viewport를 투영 */}
        <div className="case-thumb-wrap">
          <div ref={videoSlotRef} className="desk-video" />
        </div>

        <div className="case-meta-grid">
          <span className="case-meta-key">고장 시점</span>
          <span className="case-meta-val">{model.eventTimeSeconds.toFixed(3)} s</span>

          <span className="case-meta-key">고장 현상</span>
          <span className="case-meta-val">{model.symptomName}</span>
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
            <span className="progress-copy">현상 확인{progress.phenomenonConfirmed && <small>보고서 검토 완료</small>}</span>
          </div>

          <div className={`progress-item ${progress.boundaryTracked ? 'completed' : progress.phenomenonConfirmed ? 'current' : ''}`}>
            <span className="progress-dot">{progress.boundaryTracked ? '✓' : '2'}</span>
            <span className="progress-copy">이상 발생 범위 추적{progress.boundaryTracked && <small>경계 비교 완료</small>}</span>
          </div>

          <div className={`progress-item ${progress.hypothesisFormulated ? 'completed' : progress.boundaryTracked ? 'current' : ''}`}>
            <span className="progress-dot">{progress.hypothesisFormulated ? '✓' : '3'}</span>
            <span className="progress-copy">가설 설정{progress.hypothesisFormulated && <small>가설 기록 완료</small>}</span>
          </div>

          <div className={`progress-item ${progress.hypothesisVerified ? 'completed' : progress.hypothesisFormulated ? 'current' : ''}`}>
            <span className="progress-dot">{progress.hypothesisVerified ? '✓' : '4'}</span>
            <span className="progress-copy">가설 검증{progress.hypothesisVerified && <small>검증 기록 완료</small>}</span>
          </div>

          <div className={`progress-item ${progress.conclusionSubmitted ? 'completed' : progress.hypothesisVerified ? 'current' : ''}`}>
            <span className="progress-dot">{progress.conclusionSubmitted ? '✓' : '5'}</span>
            <span className="progress-copy">결론 제출{progress.conclusionSubmitted && <small>보고서 제출 완료</small>}</span>
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
          <div className="sidebar-hypothesis-summary"><b>{hypothesis.target}</b><p>{hypothesis.prediction}</p><button type="button" onClick={onNavigateToTracking}>조사 지도에서 보기 →</button></div>
        ) : (
          <div className="sidebar-empty-guidance">
            <p>원인 추적 단계에서 의심되는 기능을 찾아 가설을 설정해보세요.</p>
            {onNavigateToTracking && (
              <button
                type="button"
                onClick={onNavigateToTracking}
                className="timeline-btn sidebar-guidance-action"
              >
                원인 추적으로 이동 →
              </button>
            )}
          </div>
        )}
      </section>

      {/* 4. 조사 메모와 검증 근거는 서로 다른 생명주기를 가진다. */}
      <section className="sidebar-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="sidebar-card-header">
          <div className="sidebar-card-title">
            <span>📁</span>
            <span>조사 메모 ({investigationNotes.length})</span>
          </div>
          <button type="button" className="notes-toggle" onClick={()=>setNotesOpen(value=>!value)}>{notesOpen?'메모 닫기':'메모 열기'}</button>
          {onOpenAddEvidenceModal && (
            <button
              type="button"
              onClick={onOpenAddEvidenceModal}
              className="sidebar-add-evidence"
              title="근거 추가"
            >
              +
            </button>
          )}
        </div>

        <div className="evidence-mini-list" style={{ overflowY: 'auto', flex: 1 }}>
          {!notesOpen?null:investigationNotes.length === 0 ? (
            <p className="sidebar-empty-notes">
              등록된 메모가 없습니다.
            </p>
          ) : investigationNotes.map(evidenceButton)}
        </div>
      </section>
      </>}
    </aside>
  )
}
