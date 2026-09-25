import { useEffect, useState } from 'react'
import type { HypothesisModel } from '../presentation/InvestigationPresentationModel'
import type { IncidentFrame, ExperimentRun } from '../../../runtime/case/PropulsionCase'
import { executableTest, getRequirement, getTestCase, traceRequirements } from '../../../registries/investigation/Trace'

interface Page3Props {
  hypothesis: HypothesisModel | null
  selectedTestCaseId: string
  onUpdateHypothesis: (h: HypothesisModel | null) => void
  currentFrame: IncidentFrame | undefined
  frames?: readonly IncidentFrame[]
  latestExperiment: ExperimentRun | null
  experiments?: readonly ExperimentRun[]
  onRunExperiment: (value: number, speed: number, direction: 'FORWARD' | 'REVERSE', validity: 'VALID' | 'INVALID', target: 'VMC' | 'eDrive') => void
  onCollectTestAsEvidence: (runId: number) => void
  onJumpToEvent: () => void
  onNavigateToTracking: () => void
}

export function Page3Verification({
  hypothesis,
  selectedTestCaseId,
  onUpdateHypothesis,
  currentFrame,
  latestExperiment,
  onRunExperiment,
  onCollectTestAsEvidence,
  onJumpToEvent,
  onNavigateToTracking
}: Page3Props) {
  const selectedTest = getTestCase(selectedTestCaseId)
  const selectedExecution = selectedTest?.execution
  const hypothesisTarget: 'VMC' | 'eDrive' = (hypothesis?.target === 'VMC' || hypothesis?.target === 'eDrive') ? hypothesis.target : 'VMC'
  const target: 'VMC' | 'eDrive' = selectedExecution?.status === 'EXECUTABLE' ? selectedExecution.target : hypothesisTarget
  const fallbackTcId = executableTest(target, 'FORWARD')
  const tc = selectedTestCaseId ? selectedTest : getTestCase(fallbackTcId)
  const execution = tc?.execution
  const isExecutable = execution?.status === 'EXECUTABLE'

  // Input states
  const [valInput, setValInput] = useState<number>(target === 'VMC' ? 0.5 : 90)
  const [speedInput, setSpeedInput] = useState<number>(0)
  const [directionInput, setDirectionInput] = useState<'FORWARD' | 'REVERSE'>(isExecutable ? execution.direction ?? 'FORWARD' : 'FORWARD')
  const [validityInput, setValidityInput] = useState<'VALID' | 'INVALID'>('VALID')
  const [recordTab, setRecordTab] = useState<'CURRENT' | 'NORMAL'>('CURRENT')

  const tcId = selectedTestCaseId || executableTest(target, directionInput)
  const req = traceRequirements(tcId).find((r) => r.level === 'SOFTWARE') ??
    traceRequirements(tcId)[0] ?? getRequirement(target === 'VMC' ? 'SWR-VMC-001' : 'SWR-EDR-001')

  useEffect(() => {
    if (execution?.status === 'EXECUTABLE' && execution.direction) setDirectionInput(execution.direction)
  }, [execution])

  // Reset to event time values
  const handleResetToEvent = () => {
    if (target === 'VMC') {
      setValInput(currentFrame?.sw.input.acceleratorPedalPosition ?? 1.0)
    } else {
      setValInput(60)
    }
    setSpeedInput(Math.round(currentFrame?.plant?.speed ?? 15))
    setDirectionInput('FORWARD')
    setValidityInput('VALID')
  }

  // Run experiment action
  const handleRun = () => {
    if (!isExecutable) return
    onRunExperiment(valInput, speedInput, directionInput, validityInput, target)
  }

  // Hypothesis judgement action
  const handleJudge = (status: 'MAINTAINED' | 'REJECTED') => {
    if (hypothesis) {
      onUpdateHypothesis({ ...hypothesis, status })
    }
  }

  const latestRow = latestExperiment?.rows[0]

  return (
    <div className="investigation-main-content">
      {/* 3. 가설 검증 상단 타이틀 배너 */}
      <section className="p2-top-bar">
        <div className="p2-title-box">
          <span style={{ fontSize: '24px' }}>🧪</span>
          <div>
            <h2>3. 가설 검증</h2>
            <p>내가 의심한 조건을 바꾸면 같은 이상이 재현되는가?</p>
          </div>
        </div>
      </section>

      {/* 상단 2열 요약: 현재 가설 & 검증 기준 */}
      <div className="p3-top-summary">
        {/* 현재 가설 카드 */}
        <section className="info-card">
          <div className="info-card-header">
            <h3 className="info-card-title">
              <span>💡</span>
              <span>현재 가설</span>
            </h3>
            <button
              type="button"
              className="timeline-btn"
              onClick={onNavigateToTracking}
              style={{ fontSize: '11px', padding: '4px 8px' }}
            >
              ✏️ 가설 수정하기
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div className="vehicle-state-card">
              <span className="vehicle-state-label">대상 기능</span>
              <span className="vehicle-state-val">{hypothesis?.target ?? target}</span>
            </div>
            <div className="vehicle-state-card">
              <span className="vehicle-state-label">관련 신호</span>
              <span className="vehicle-state-val">{hypothesis?.signal ?? 'EDriveCommand'}</span>
            </div>
            <div className="vehicle-state-card">
              <span className="vehicle-state-label">의심 유형</span>
              <span className="vehicle-state-val">{hypothesis?.type ?? '계산 / Calibration'}</span>
            </div>
          </div>
        </section>

        {/* 검증 기준 카드 */}
        <section className="info-card">
          <div className="info-card-header">
            <h3 className="info-card-title">
              <span>📋</span>
              <span>검증 기준</span>
            </h3>
            <span className="sidebar-badge badge-active">{req?.id ?? 'SWR-VMC-001'}</span>
          </div>

          <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <span style={{ color: '#64748b', width: '80px', flexShrink: 0 }}>관련 요구사항</span>
              <b style={{ fontFamily: 'monospace' }}>{req?.id ?? 'SWR-VMC-001'}</b>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <span style={{ color: '#64748b', width: '80px', flexShrink: 0 }}>정상 동작 요약</span>
              <span style={{ color: '#334155' }}>{req?.statement ?? '유효한 입력이 주어지면 정상 범위의 토크를 계산하여 출력해야 함.'}</span>
            </div>
          </div>
        </section>
      </div>

      {/* 본문 3열 그리드: 실험 조건 / 시험 실행 및 결과 / 주행 기록 및 가설 판단 */}
      <div className="p3-main-grid">
        {/* 1. 실험 조건 설정 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <section className="info-card">
            <div className="info-card-header">
              <h3 className="info-card-title">
                <span>1.</span>
                <span>실험 조건 설정</span>
              </h3>
              <button
                type="button"
                className="timeline-btn"
                onClick={handleResetToEvent}
                style={{ fontSize: '10px', padding: '3px 6px' }}
              >
                사건 당시 값으로 초기화
              </button>
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 12px 0' }}>
              가설을 검증하기 위해 독립 SW 시험 입력을 설정하세요.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <b>{target === 'VMC' ? 'PropulsionRequest' : 'DriveTorqueRequest'}</b>
                  <small style={{ color: '#64748b' }}>정상범위: {target === 'VMC' ? '0 ~ 1' : '0 ~ 200'}</small>
                </label>
                <input
                  type="number"
                  step={target === 'VMC' ? '0.05' : '5'}
                  min="0"
                  max={target === 'VMC' ? '1' : '600'}
                  value={valInput}
                  onChange={(e) => setValInput(e.target.valueAsNumber)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px' }}><b>Direction (방향)</b></label>
                <select
                  value={directionInput}
                  onChange={(e) => setDirectionInput(e.target.value as 'FORWARD' | 'REVERSE')}
                  disabled={isExecutable && Boolean(execution.direction)}
                  className="component-select"
                  style={{ width: '100%' }}
                >
                  <option value="FORWARD">FORWARD (전진)</option>
                  <option value="REVERSE">REVERSE (후진)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px' }}><b>Validity (유효성)</b></label>
                <select
                  value={validityInput}
                  onChange={(e) => setValidityInput(e.target.value as 'VALID' | 'INVALID')}
                  className="component-select"
                  style={{ width: '100%' }}
                >
                  <option value="VALID">VALID (유효)</option>
                  <option value="INVALID">INVALID (무효)</option>
                </select>
              </div>

              {target === 'VMC' && (
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <b>VehicleSpeed (속력)</b>
                    <small style={{ color: '#64748b' }}>0 ~ 60 m/s</small>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={speedInput}
                    onChange={(e) => setSpeedInput(e.target.valueAsNumber)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              )}
            </div>
          </section>

          {/* 2. 실행 가능한 시험 */}
          <section className="info-card">
            <div className="info-card-header">
              <h3 className="info-card-title">
                <span>2.</span>
                <span>실행 가능한 시험</span>
              </h3>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b style={{ color: '#1e293b' }}>{isExecutable ? '정상 구동 요청 변환 시험' : '참조 시험 정의'}</b>
                <span className="sidebar-badge badge-active">{tcId || '선택 없음'}</span>
              </div>
              <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '11px' }}>
                {tc ? `${tc.stimulus ?? '상세 입력 정의 없음'} → ${tc.expectedResult ?? '상세 기대 결과 정의 없음'}` : '선택한 시험 정의를 찾을 수 없습니다.'}
                {!isExecutable && <><br />현재 C/WASM 직접 실행 대상이 아닙니다.</>}
              </p>
            </div>
          </section>
        </div>

        {/* 3. 시험 실행 및 결과 */}
        <section className="info-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="info-card-header">
            <h3 className="info-card-title">
              <span>3.</span>
              <span>시험 실행 및 결과</span>
            </h3>

            <button
              type="button"
              className="p1-cta-btn"
              onClick={handleRun}
              disabled={!isExecutable}
              style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>▶</span>
              <span>시험 실행</span>
            </button>
          </div>

          {latestExperiment && latestRow ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              {/* EXPECTED / ACTUAL / RESULT 배지 */}
              <div className="test-metric-badges">
                <div className="test-metric-box">
                  <small style={{ color: '#64748b', fontWeight: 600 }}>EXPECTED</small>
                  <b style={{ fontSize: '18px', color: '#0f766e', fontFamily: 'monospace' }}>
                    {Number(latestRow.expected).toFixed(1)} Nm
                  </b>
                </div>

                <div className="test-metric-box">
                  <small style={{ color: '#64748b', fontWeight: 600 }}>ACTUAL</small>
                  <b style={{ fontSize: '18px', color: latestRow.pass ? '#0f766e' : '#dc2626', fontFamily: 'monospace' }}>
                    {Number(latestRow.actual).toFixed(1)} Nm
                  </b>
                </div>

                <div className={`test-metric-box ${latestRow.pass ? 'pass' : 'fail'}`}>
                  <small style={{ fontWeight: 600 }}>RESULT</small>
                  <b style={{ fontSize: '18px', fontWeight: 900 }}>
                    {latestRow.pass ? 'PASS' : 'FAIL'}
                  </b>
                </div>
              </div>

              {/* 결과 신호 시각화 (Expected vs Actual 막대 비교) */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  출력 비교 (Expected vs Actual)
                </small>
                {(() => {
                  const expVal = Math.max(0, Number(latestRow.expected) || 0)
                  const actVal = Math.max(0, Number(latestRow.actual) || 0)
                  const maxVal = Math.max(1, expVal, actVal) * 1.15
                  const expPct = Math.min(100, Math.round((expVal / maxVal) * 100))
                  const actPct = Math.min(100, Math.round((actVal / maxVal) * 100))
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                          <span style={{ color: '#0f766e', fontWeight: 600 }}>기대 출력 (Expected)</span>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{expVal.toFixed(2)} Nm</span>
                        </div>
                        <div style={{ height: '12px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                          <div style={{ width: `${expPct}%`, height: '100%', background: '#25856d', borderRadius: '6px' }} />
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                          <span style={{ color: latestRow.pass ? '#0f766e' : '#dc2626', fontWeight: 600 }}>실제 출력 (Actual)</span>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: latestRow.pass ? '#0f766e' : '#dc2626' }}>{actVal.toFixed(2)} Nm</span>
                        </div>
                        <div style={{ height: '12px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                          <div style={{ width: `${actPct}%`, height: '100%', background: latestRow.pass ? '#25856d' : '#d56c42', borderRadius: '6px' }} />
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* 세부 결과 테이블 (79ec3b ExperimentResults 패턴 복원) */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>조건 / 신호</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>기대</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>실제</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center' }}>판정</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestExperiment.rows.map((r) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '6px 8px' }}>
                          <b>{r.input}</b>
                          <small style={{ display: 'block', color: '#64748b' }}>{r.id}</small>
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace', color: '#0f766e' }}>
                          {typeof r.expected === 'number' ? r.expected.toFixed(2) + ' Nm' : r.expected}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace', color: r.pass ? '#0f766e' : '#dc2626' }}>
                          {typeof r.actual === 'number' ? r.actual.toFixed(2) + ' Nm' : r.actual}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <b style={{ color: r.pass ? '#15803d' : '#dc2626', fontWeight: 800 }}>{r.pass ? 'PASS' : 'FAIL'}</b>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                className="timeline-btn"
                onClick={() => onCollectTestAsEvidence(latestExperiment.id)}
                style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}
              >
                📥 시험 결과를 근거로 보관
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#94a3b8', gap: '8px' }}>
              <span style={{ fontSize: '32px' }}>⚙️</span>
              <b>시험을 실행하면 결과가 표시됩니다.</b>
              <small>입력 조건을 설정하고 상단의 '시험 실행' 버튼을 누르세요.</small>
            </div>
          )}
        </section>

        {/* 4 & 5. 주행 기록 (비교 참조) & 가설 판단 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 4. 주행 기록 */}
          <section className="info-card">
            <div className="info-card-header">
              <h3 className="info-card-title">
                <span>4.</span>
                <span>주행 기록 (비교 참조)</span>
              </h3>
              <button
                type="button"
                className="timeline-btn"
                onClick={onJumpToEvent}
                style={{ fontSize: '10px', padding: '3px 6px' }}
              >
                사건 시점으로 이동
              </button>
            </div>

            <div className="view-subtabs-bar" style={{ marginBottom: '8px' }}>
              <button
                type="button"
                className={`view-subtab-btn ${recordTab === 'CURRENT' ? 'active' : ''}`}
                onClick={() => setRecordTab('CURRENT')}
                style={{ fontSize: '10px', padding: '3px 10px' }}
              >
                현재 기록 (문제 발생)
              </button>
              <button
                type="button"
                className={`view-subtab-btn ${recordTab === 'NORMAL' ? 'active' : ''}`}
                onClick={() => setRecordTab('NORMAL')}
                disabled
                style={{ fontSize: '10px', padding: '3px 10px' }}
              >
                정상 기록 (데이터 없음)
              </button>
            </div>

            <div className="bench-record-telemetry" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', marginBottom: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', rowGap: '6px', fontSize: '11px' }}>
                <span style={{ color: '#64748b' }}>선택 시점:</span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{currentFrame?.sw.executionTime.toFixed(3) ?? '—'} s</span>

                <span style={{ color: '#64748b' }}>차량 속도:</span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{currentFrame?.plant?.speed?.toFixed(3) ?? '—'} m/s</span>

                <span style={{ color: '#64748b' }}>기어 상태:</span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{currentFrame?.sw.output.gearState ?? '—'}</span>

                <span style={{ color: '#64748b' }}>가속 페달:</span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{((currentFrame?.sw.input.acceleratorPedalPosition ?? 0) * 100).toFixed(0)} %</span>
              </div>
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0 0' }}>
              * 위 SW 시험의 입력과 당시 주행 기록을 비교하여 가설을 검증하세요.
            </p>
          </section>

          {/* 5. 가설 판단 */}
          <section className="info-card">
            <div className="info-card-header">
              <h3 className="info-card-title">
                <span>5.</span>
                <span>가설 판단</span>
              </h3>
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 10px 0' }}>
              이 시험 결과를 바탕으로 현재 가설을 어떻게 판단하시겠습니까?
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                className="step-btn"
                onClick={() => handleJudge('MAINTAINED')}
                style={{
                  background: hypothesis?.status === 'MAINTAINED' ? '#15803d' : '#22c55e',
                  color: '#ffffff',
                  borderColor: '#16a34a',
                  justifyContent: 'center',
                  padding: '8px 4px'
                }}
              >
                가설 유지 (추가 검증)
              </button>

              <button
                type="button"
                className="step-btn"
                onClick={() => handleJudge('REJECTED')}
                style={{
                  background: hypothesis?.status === 'REJECTED' ? '#991b1b' : '#ef4444',
                  color: '#ffffff',
                  borderColor: '#dc2626',
                  justifyContent: 'center',
                  padding: '8px 4px'
                }}
              >
                가설 기각 (다른 후보)
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
