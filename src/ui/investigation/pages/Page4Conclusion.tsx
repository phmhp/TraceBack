import { useState, useMemo } from 'react'
import type { Evidence, RootCauseReport } from '../../../runtime/investigation/Evidence'
import type { Diagnosis, ExperimentRun } from '../../../runtime/case/PropulsionCase'
import type { CaseDefinition } from '../../../runtime/investigation/CaseDefinition'
import { failureTypes } from '../../../runtime/investigation/CaseDefinition'
import { architectureNode } from '../../../registries/investigation/Architecture'
import { ExperimentResults } from '../../screens/CaseExperimentPanel'

interface Page4Props {
  definition: CaseDefinition
  evidenceList: readonly Evidence[]
  diagnosis: Diagnosis | null
  repairs: readonly ExperimentRun[]
  resolved: boolean
  onSelectEvidenceForReport: (id: string, selected: boolean) => void
  onSubmitReport: (report: RootCauseReport) => void
  onRunRepair: (variant: 0 | 2 | 3) => void
  onNavigateToDebrief?: () => void
}

type LocationType = 'FUNCTION' | 'INTERFACE' | 'SIGNAL' | 'COMMUNICATION' | 'STATE' | 'TIMING' | 'CALIBRATION' | 'SENSOR_ACTUATOR'

const locationTypes: { id: LocationType; label: string; icon: string }[] = [
  { id: 'FUNCTION', label: '기능 (Function)', icon: '⚙️' },
  { id: 'INTERFACE', label: '인터페이스', icon: '🔗' },
  { id: 'SIGNAL', label: '신호', icon: '📈' },
  { id: 'COMMUNICATION', label: '통신', icon: '📡' },
  { id: 'STATE', label: '상태 / 모드', icon: '📄' },
  { id: 'TIMING', label: '타이밍', icon: '⏱️' },
  { id: 'CALIBRATION', label: '데이터 / Calibration', icon: '💾' },
  { id: 'SENSOR_ACTUATOR', label: 'Sensor / Actuator', icon: '🎛️' }
]

const swComponents = ['GearLogic', 'PropulsionFunction', 'VMC', 'eDrive']

export function Page4Conclusion({
  definition,
  evidenceList,
  diagnosis,
  repairs,
  resolved,
  onSelectEvidenceForReport,
  onSubmitReport,
  onRunRepair,
  onNavigateToDebrief
}: Page4Props) {
  const [locType, setLocType] = useState<LocationType>('FUNCTION')
  const [selectedTarget, setSelectedTarget] = useState<string>('eDrive')
  const [selectedFailureType, setSelectedFailureType] = useState<string>('LOGIC_CALCULATION')
  const [selectedCause, setSelectedCause] = useState<string>('INCORRECT_SCALING')
  const [repairVariant, setRepairVariant] = useState<0 | 2 | 3>(0)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const activeNode = architectureNode(selectedTarget)
  const selectedEvidence = evidenceList.filter((e) => e.selectedForReport)

  // Dynamic analysis summary generated purely from user selections
  const analysisSummaryText = useMemo(() => {
    const targetLabel = architectureNode(selectedTarget)?.label ?? selectedTarget
    const failureItem = failureTypes.find((f) => f.id === selectedFailureType)
    const causeItem = failureItem?.causes.find((c) => c.id === selectedCause)

    return `${targetLabel}의 동작 및 신호를 조사한 결과, 정상 주행 기준 대비 이상 동작이 확인되었습니다. ` +
      `확보된 ${selectedEvidence.length}건의 근거에 기반하여 ${failureItem?.label ?? selectedFailureType} 범주의 ` +
      `${causeItem?.label ?? selectedCause} 오류로 판단됩니다.`
  }, [selectedTarget, selectedFailureType, selectedCause, selectedEvidence])

  const handleSubmit = () => {
    if (!selectedTarget || !selectedFailureType || !selectedCause || selectedEvidence.length === 0) {
      setErrorMessage('원인 대상, 오류 유형 및 최소 1개 이상의 근거를 선택해야 합니다.')
      return
    }

    try {
      onSubmitReport({
        faultLocation: selectedTarget,
        failureType: selectedFailureType,
        detailedCause: selectedCause,
        evidenceIds: selectedEvidence.map((e) => e.id)
      })
      setErrorMessage('')
    } catch (err) {
      setErrorMessage(String(err))
    }
  }

  // If already submitted, display the verified report and repair suite
  if (diagnosis) {
    const isVerified = diagnosis.correct && diagnosis.evidenceSufficient

    return (
      <div className="investigation-main-content">
        <section className="p2-top-bar">
          <div className="p2-title-box">
            <span style={{ fontSize: '24px' }}>📋</span>
            <div>
              <h2>고장 원인 분석 보고서</h2>
              <p>제출한 원인 판단과 근거 충분성에 대한 종합 결과입니다.</p>
            </div>
          </div>
          <span className={`sidebar-badge ${isVerified ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '13px', padding: '6px 12px' }}>
            {isVerified ? '원인 확인 (VERIFIED)' : '원인 미확인'}
          </span>
        </section>

        <div className="p3-top-summary">
          <section className="info-card">
            <div className="info-card-header">
              <h3 className="info-card-title">제출 내용 요약</h3>
              <code>{definition.id}</code>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: '6px', fontSize: '12px' }}>
              <span style={{ color: '#64748b' }}>원인 기능:</span>
              <b>{architectureNode(diagnosis.component)?.label ?? diagnosis.component}</b>

              <span style={{ color: '#64748b' }}>오류 유형:</span>
              <span>{diagnosis.mechanism}</span>

              <span style={{ color: '#64748b' }}>첨부 근거:</span>
              <span>{selectedEvidence.length}개 선택</span>

              <span style={{ color: '#64748b' }}>근거 충분성:</span>
              <b style={{ color: diagnosis.evidenceSufficient ? '#16a34a' : '#dc2626' }}>
                {diagnosis.evidenceSufficient ? '충족 (Sufficient)' : '부족 (Insufficient)'}
              </b>
            </div>

            <div style={{ marginTop: '14px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
              <b>실제 원인 설명:</b>
              <p style={{ margin: '4px 0 0 0', color: '#334155' }}>
                {definition.rootCause.explanation}
              </p>
            </div>
          </section>

          {/* 수정 검증 섹션 */}
          <section className="info-card">
            <div className="info-card-header">
              <h3 className="info-card-title">수정 검증 (Corrective Action)</h3>
              <span className="sidebar-badge badge-warning">독립 C 시험</span>
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 8px 0' }}>
              원인 제출 뒤에만 기존 독립 C 시험으로 수정안을 확인할 수 있습니다.
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <select
                className="component-select"
                value={repairVariant}
                onChange={(e) => setRepairVariant(Number(e.target.value) as 0 | 2 | 3)}
                style={{ flex: 1 }}
              >
                <option value={0}>비율 감소 제거 · 정상 계산 복구 (추천)</option>
                <option value={2}>입력 요청을 두 배로 보상</option>
                <option value={3}>출력 상한 제한 해제</option>
              </select>

              <button
                type="button"
                className="p1-cta-btn"
                onClick={() => onRunRepair(repairVariant)}
                style={{ padding: '6px 14px', fontSize: '12px' }}
              >
                수정안 시험 실행
              </button>
            </div>

            <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
              {repairs.map((run) => (
                <details key={run.id} style={{ background: '#f8fafc', padding: '8px', borderRadius: '6px', marginBottom: '6px', border: '1px solid #e2e8f0', fontSize: '11px' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                    수정 시험 #{run.id} · {run.rows.every((r) => r.pass) ? 'PASS' : 'FAIL'}
                  </summary>
                  <ExperimentResults run={run} />
                </details>
              ))}
            </div>

            {onNavigateToDebrief && resolved && (
              <button
                type="button"
                className="p1-cta-btn"
                onClick={onNavigateToDebrief}
                style={{ width: '100%', marginTop: '10px', padding: '10px', justifyContent: 'center' }}
              >
                세션 디브리프로 이동 →
              </button>
            )}
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="investigation-main-content">
      {/* PAGE 4 상단 타이틀 배너 */}
      <section className="p2-top-bar">
        <div className="p2-title-box">
          <span style={{ fontSize: '24px' }}>📋</span>
          <div>
            <h2>4. 결론 제출</h2>
            <p>어디가 어떻게 잘못됐고, 어떤 근거로 그렇게 판단했는가?</p>
          </div>
        </div>
      </section>

      {/* 3열 그리드: 원인 위치 & 오류 유형 / 판단 근거 / 요약 및 제출 */}
      <div className="p4-main-grid">
        {/* 1열: 1. 원인 위치 선택 & 2. 오류 유형 선택 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 1. 원인 위치 선택 */}
          <section className="info-card">
            <div className="info-card-header">
              <h3 className="info-card-title">
                <span>1.</span>
                <span>원인 위치 선택</span>
              </h3>
            </div>

            <small style={{ color: '#64748b', display: 'block', marginBottom: '6px' }}>1-1. 위치 유형</small>
            <div className="category-pill-grid" style={{ marginBottom: '10px' }}>
              {locationTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`category-pill-btn ${locType === t.id ? 'active' : ''}`}
                  onClick={() => setLocType(t.id)}
                >
                  <span style={{ display: 'block', fontSize: '14px' }}>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            <small style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>1-2. 대상 선택</small>
            <select
              className="component-select"
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              style={{ width: '100%', marginBottom: '10px' }}
            >
              {swComponents.map((id) => (
                <option key={id} value={id}>
                  {architectureNode(id).label} ({id})
                </option>
              ))}
            </select>

            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <b style={{ color: '#1e293b' }}>{activeNode?.label}</b>
                <span className="sidebar-badge badge-active">{activeNode?.id}</span>
              </div>
              <p style={{ margin: '0 0 4px 0', color: '#475569' }}>{activeNode?.role}</p>
              <div style={{ color: '#64748b' }}>주요 출력: {activeNode?.outputs.join(', ')}</div>
            </div>
          </section>

          {/* 2. 오류 유형 선택 */}
          <section className="info-card">
            <div className="info-card-header">
              <h3 className="info-card-title">
                <span>2.</span>
                <span>오류 유형 선택</span>
              </h3>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
              {failureTypes.map((ft) => (
                <button
                  key={ft.id}
                  type="button"
                  className={`chain-node-btn ${selectedFailureType === ft.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedFailureType(ft.id)
                    setSelectedCause(ft.causes[0]?.id ?? '')
                  }}
                  style={{ fontSize: '11px', padding: '5px 10px' }}
                >
                  {ft.label}
                </button>
              ))}
            </div>

            <small style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>세부 원인 선택:</small>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {failureTypes
                .find((ft) => ft.id === selectedFailureType)
                ?.causes.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`evidence-mini-btn ${selectedCause === c.id ? 'active' : ''}`}
                    onClick={() => setSelectedCause(c.id)}
                    style={{
                      padding: '8px 10px',
                      background: selectedCause === c.id ? '#eff6ff' : undefined,
                      borderColor: selectedCause === c.id ? '#3b82f6' : undefined
                    }}
                  >
                    <span>{c.label}</span>
                    {selectedCause === c.id && <span style={{ color: '#2563eb' }}>✓</span>}
                  </button>
                ))}
            </div>
          </section>
        </div>

        {/* 2열: 3. 판단 근거 선택 (최소 1개 이상) */}
        <section className="info-card">
          <div className="info-card-header">
            <div>
              <h3 className="info-card-title">
                <span>3.</span>
                <span>판단 근거 선택 ({selectedEvidence.length}개 선택됨)</span>
              </h3>
              <small style={{ color: '#64748b' }}>분석의 근거로 사용할 정보를 선택하세요. (조사 중 저장한 근거)</small>
            </div>
          </div>

          <div className="evidence-checkbox-list">
            {evidenceList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8' }}>
                <span style={{ fontSize: '28px', display: 'block', marginBottom: '6px' }}>📁</span>
                저장된 근거가 없습니다.<br />이전 단계에서 신호 비교나 재현 시험 결과를 근거로 저장하세요.
              </div>
            ) : (
              evidenceList.map((e) => (
                <label key={e.id} className="evidence-checkbox-row">
                  <input
                    type="checkbox"
                    checked={e.selectedForReport}
                    onChange={(evt) => onSelectEvidenceForReport(e.id, evt.target.checked)}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>
                      {e.title || e.relatedComponent}
                    </div>
                    <small style={{ color: '#64748b' }}>
                      {e.type} · {e.status}
                    </small>
                  </div>
                </label>
              ))
            )}
          </div>
        </section>

        {/* 3열: 4. 분석 요약 & 5. 최종 제출 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 4. 분석 요약 */}
          <section className="info-card">
            <div className="info-card-header">
              <h3 className="info-card-title">
                <span>4.</span>
                <span>분석 요약</span>
              </h3>
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 8px 0' }}>
              선택한 근거를 바탕으로 분석 내용을 정리합니다.
            </p>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', lineHeight: 1.6, color: '#334155' }}>
              {analysisSummaryText}
            </div>
          </section>

          {/* 5. 최종 제출 */}
          <section className="submit-cta-card">
            <div className="info-card-header">
              <h3 className="info-card-title">
                <span>5.</span>
                <span>최종 제출</span>
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', textAlign: 'center' }}>
              <div style={{ background: '#f8fafc', padding: '8px 4px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#64748b' }}>원인 위치</small>
                <b style={{ display: 'block', fontSize: '12px', color: '#1e293b', marginTop: '2px' }}>{selectedTarget}</b>
              </div>
              <div style={{ background: '#f8fafc', padding: '8px 4px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#64748b' }}>오류 유형</small>
                <b style={{ display: 'block', fontSize: '11px', color: '#1e293b', marginTop: '2px' }}>
                  {failureTypes.find((f) => f.id === selectedFailureType)?.causes.find((c) => c.id === selectedCause)?.label.split(' · ')[0] ?? selectedCause}
                </b>
              </div>
              <div style={{ background: '#f8fafc', padding: '8px 4px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#64748b' }}>선택 근거</small>
                <b style={{ display: 'block', fontSize: '12px', color: '#0f766e', marginTop: '2px' }}>{selectedEvidence.length}건</b>
              </div>
            </div>

            {errorMessage && (
              <p style={{ color: '#dc2626', fontSize: '12px', margin: '4px 0 0 0' }}>{errorMessage}</p>
            )}

            <button
              type="button"
              className="submit-cta-btn"
              disabled={selectedEvidence.length === 0}
              onClick={handleSubmit}
            >
              <span>🚀</span>
              <span>최종 분석 제출</span>
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}
