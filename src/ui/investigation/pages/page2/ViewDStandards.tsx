import { useMemo } from 'react'
import { architectureNode } from '../../../../registries/investigation/Architecture'
import { getRequirement, getRequirementsForComponent, getTestsForRequirement, requirementDefinitions } from '../../../../registries/investigation/Trace'
import { RequirementConditions } from '../../../screens/CaseGuide'
import type { IncidentFrame } from '../../../../runtime/case/PropulsionCase'

interface ViewDStandardsProps {
  selectedComponent: string
  selectedRequirementId: string
  onSelectRequirement: (id: string) => void
  onSaveAsEvidence: (reqId: string) => void
  onOpenBenchWithTc?: (tcId: string) => void
  onOpenReqMap?: () => void
  currentFrame?: IncidentFrame
}

export function ViewDStandards({
  selectedComponent,
  selectedRequirementId,
  onSelectRequirement,
  onSaveAsEvidence,
  onOpenBenchWithTc,
  onOpenReqMap,
  currentFrame
}: ViewDStandardsProps) {
  // Filtered requirements list
  const filteredList = useMemo(() => {
    const allocated=getRequirementsForComponent(selectedComponent)
    return allocated.length ? allocated : requirementDefinitions
  }, [selectedComponent])

  const activeReq = useMemo(() => {
    return (
      getRequirement(selectedRequirementId) ??
      filteredList[0] ??
      requirementDefinitions[0]!
    )
  }, [selectedRequirementId, filteredList])

  const relatedTests = useMemo(() => {
    return getTestsForRequirement(activeReq.id)
  }, [activeReq])

  return (
    <div className="view-d-layout" style={{ gridTemplateColumns: 'minmax(280px, 340px) 1fr' }}>
      {/* 1열: 관련 요구사항 목록 */}
      <section className="info-card">
        <div className="info-card-header" style={{ flexWrap: 'wrap', gap: '8px' }}>
          <h3 className="info-card-title">
            <span>📄</span>
            <span>요구사항 목록 ({filteredList.length})</span>
          </h3>

          {onOpenReqMap && (
            <button
              type="button"
              className="timeline-btn"
              onClick={onOpenReqMap}
              style={{ fontSize: '11px', padding: '3px 8px' }}
              title="전체 요구사항 계층도 및 Mind-Map을 큰 화면으로 확인합니다."
            >
              전체 계층 구조 ↗
            </button>
          )}
        </div>

        <div className="req-list-group" style={{ maxHeight: '420px', overflowY: 'auto' }}>
          {filteredList.map((req) => {
            const isSelected = req.id === activeReq.id
            return (
              <div
                key={req.id}
                className={`req-card-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectRequirement(req.id)}
                style={{
                  cursor: 'pointer',
                  borderLeft: isSelected ? '3px solid #3b82f6' : undefined
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <b style={{ fontSize: '12px', color: '#1e293b', fontFamily: 'monospace' }}>{req.id}</b>
                  <span className="sidebar-badge badge-active">{req.level === 'SOFTWARE' ? 'SW' : 'System'}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.3, marginTop: '4px' }}>
                  {req.statement.length > 60 ? `${req.statement.slice(0, 60)}...` : req.statement}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 2열: 선택된 요구사항 상세 & 조건 & 검증 시험 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
        {/* 요구사항 본문 카드 */}
        <section className="info-card">
          <div className="info-card-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="info-card-title" style={{ fontFamily: 'monospace' }}>
                  {activeReq.id}
                </h3>
                <span className="sidebar-badge badge-active">
                  {activeReq.level === 'SOFTWARE' ? 'Software Requirement' : 'System Requirement'}
                </span>
              </div>
              <small style={{ color: '#64748b' }}>할당 구성요소: <b>{architectureNode(activeReq.allocatedComponent).label}</b></small>
            </div>

            <button
              type="button"
              className="p1-cta-btn"
              onClick={() => onSaveAsEvidence(activeReq.id)}
              style={{ padding: '6px 12px', fontSize: '11px' }}
            >
              근거로 저장 +
            </button>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', margin: '8px 0', fontSize: '13px', lineHeight: 1.6, color: '#1e293b' }}>
            <b style={{ color: '#334155', display: 'block', fontSize: '11px', marginBottom: '4px' }}>요구사항 명세 (Statement)</b>
            {activeReq.statement}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: '6px', fontSize: '12px', marginTop: '10px' }}>
            <span style={{ color: '#64748b' }}>상위/연결 요구사항</span>
            <span style={{ fontFamily: 'monospace' }}>
              {activeReq.linkedRequirements.join(', ') || '최상위 시스템 요구사항'}
            </span>

            <span style={{ color: '#64748b' }}>연결된 시험 (TC)</span>
            <span style={{ fontFamily: 'monospace' }}>
              {activeReq.linkedTestCases.join(', ') || '연결된 시험 없음'}
            </span>
          </div>

          {/* 적용 조건과 동작 순서 (Ground truth 기반 dynamic calculation) */}
          <div style={{ marginTop: '14px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
            <RequirementConditions id={activeReq.id} frame={currentFrame} />
          </div>
        </section>

        {/* 연결된 시험 (TC) 목록 */}
        <section className="info-card">
          <div className="info-card-header">
            <h3 className="info-card-title">
              <span>🧪</span>
              <span>연결된 검증 시험 ({relatedTests.length}건)</span>
            </h3>
          </div>

          {relatedTests.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {relatedTests.map((tc) => (
                <div key={tc.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <b style={{ fontFamily: 'monospace', color: '#1e3a5f' }}>{tc.id}</b>
                    <span className="sidebar-badge badge-active">{tc.verificationLevel ?? 'REFERENCE'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', rowGap: '4px', fontSize: '11px', color: '#475569' }}>
                    <span style={{ color: '#64748b' }}>전제 조건:</span>
                    <span>{tc.precondition ?? '상세 정의 없음'}</span>
                    <span style={{ color: '#64748b' }}>시험 입력:</span>
                    <span>{tc.stimulus ?? '상세 정의 없음'}</span>
                    <span style={{ color: '#64748b' }}>기대 결과:</span>
                    <span style={{ color: '#166534', fontWeight: 600 }}>{tc.expectedResult ?? '상세 정의 없음'}</span>
                  </div>

                  {onOpenBenchWithTc && (
                    <button
                      type="button"
                      className="timeline-btn"
                      onClick={() => onOpenBenchWithTc(tc.id)}
                      style={{ marginTop: '8px', width: '100%', justifyContent: 'center', fontSize: '11px' }}
                    >
                      이 시험으로 가설 검증하기 (Page 3) →
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
              현재 선택된 요구사항에 직접 연결된 상세 시험 케이스가 없습니다.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
