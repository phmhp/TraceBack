import { useState } from 'react'
import type { HypothesisModel } from '../presentation/InvestigationPresentationModel'
import type { IncidentFrame, ExperimentRun } from '../../../runtime/case/PropulsionCase'
import { executableTest, traceRequirements } from '../../../registries/investigation/Trace'
import { propulsionRequirements, propulsionTests } from '../../../data/ground-truth/PropulsionGroundTruth'

interface Page3Props {
  hypothesis: HypothesisModel | null
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
  onUpdateHypothesis,
  currentFrame,
  latestExperiment,
  onRunExperiment,
  onCollectTestAsEvidence,
  onJumpToEvent,
  onNavigateToTracking
}: Page3Props) {
  const target: 'VMC' | 'eDrive' = (hypothesis?.target === 'VMC' || hypothesis?.target === 'eDrive')
    ? hypothesis.target
    : 'VMC'

  // Input states
  const [valInput, setValInput] = useState<number>(target === 'VMC' ? 0.5 : 90)
  const [speedInput, setSpeedInput] = useState<number>(0)
  const [directionInput, setDirectionInput] = useState<'FORWARD' | 'REVERSE'>('FORWARD')
  const [validityInput, setValidityInput] = useState<'VALID' | 'INVALID'>('VALID')
  const [recordTab, setRecordTab] = useState<'CURRENT' | 'NORMAL'>('CURRENT')

  // Requirement & TC resolution
  const tcId = executableTest(target, directionInput)
  const tc = propulsionTests.find((item) => item.id === tcId)
  const req = traceRequirements(tcId).find((r) => r.level === 'SOFTWARE') ??
    propulsionRequirements.find((r) => r.id === (target === 'VMC' ? 'SWR-VMC-001' : 'SWR-EDR-001'))

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
              <span className="vehicle-state-val">{hypothesis?.signal ?? 'eDriveMagnitude'}</span>
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
                <b style={{ color: '#1e293b' }}>정상 구동 요청 변환 시험</b>
                <span className="sidebar-badge badge-active">{tcId}</span>
              </div>
              <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '11px' }}>
                {tc?.stimulus} → {tc?.expectedResult}
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

              {/* 결과 신호 미니 차트 */}
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  결과 신호 (Expected vs Actual)
                </small>
                <svg viewBox="0 0 300 80" style={{ width: '100%', height: '80px' }}>
                  <line x1="10" y1="20" x2="290" y2="20" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 2" />
                  <line x1="10" y1="55" x2="290" y2="55" stroke="#ef4444" strokeWidth="2.5" />
                  <text x="290" y="16" fill="#3b82f6" fontSize="9" textAnchor="end">Expected ({latestRow.expected})</text>
                  <text x="290" y="50" fill="#ef4444" fontSize="9" textAnchor="end">Actual ({latestRow.actual})</text>
                </svg>
              </div>

              {/* 주요 결과 요약 */}
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px', fontSize: '11px', color: '#1e40af' }}>
                <b>주요 결과 요약:</b>
                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                  <li>입력 조건({valInput})에서 생성된 출력이 정상 기대치 대비 낮게 출력되었습니다.</li>
                  <li>요구사항({req?.id}) 기준을 만족하지 못하고 FAIL 판정되었습니다.</li>
                </ul>
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
                style={{ fontSize: '10px', padding: '3px 10px' }}
              >
                정상 기록 (비교)
              </button>
            </div>

            <div className="case-thumb-wrap" style={{ height: '80px', marginBottom: '8px' }}>
              <img
                src="/assets/investigation/village-polaroid.png"
                alt="주행 기록 참조"
                className="case-thumb-img"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', rowGap: '4px', fontSize: '11px' }}>
              <span style={{ color: '#64748b' }}>VehicleSpeed:</span>
              <span style={{ fontWeight: 600 }}>{currentFrame?.plant?.speed?.toFixed(3) ?? '15.635'} m/s</span>

              <span style={{ color: '#64748b' }}>GearState:</span>
              <span style={{ fontWeight: 600 }}>{currentFrame?.sw.output.gearState ?? 'D'}</span>

              <span style={{ color: '#64748b' }}>AccelPedal:</span>
              <span style={{ fontWeight: 600 }}>100 %</span>
            </div>
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
