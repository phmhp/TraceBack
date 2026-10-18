import { useCallback, useState } from 'react'
import { DriveScene } from './components/DriveScene'
import { caseRoadmap, episodeOne } from './data/cases'
import type { EpisodePhase, FlowNode, SourceKind } from './domain/episode'

const phaseLabels: Array<{ id: EpisodePhase; label: string }> = [
  { id: 'BRIEF', label: '의뢰' },
  { id: 'DRIVE', label: '주행' },
  { id: 'INCIDENT', label: '사건' },
  { id: 'REQUEST', label: '입력' },
  { id: 'XRAY', label: '경로' },
  { id: 'BOUNDARY', label: '경계' },
  { id: 'TEST', label: '시험' },
  { id: 'REPORT', label: '보고' },
  { id: 'REPAIR', label: '수리' },
  { id: 'REDRIVE', label: '재주행' },
  { id: 'RESULT', label: '완료' },
]

const evidenceText = {
  phenomenon: '시동 요청은 유효하지만 DRIVE READY가 켜지지 않음',
  boundary: 'Start Preconditions 정상 → 12V Supply 최초 이상',
  proof: '무부하 12.3V가 시동 부하에서 9.4V로 강하',
}

export function App() {
  const [phase, setPhase] = useState<EpisodePhase>('BRIEF')
  const [requestEvidence, setRequestEvidence] = useState<string[]>([])
  const [flowIndex, setFlowIndex] = useState(0)
  const [boundaryChoice, setBoundaryChoice] = useState<string | null>(null)
  const [testRun, setTestRun] = useState(false)
  const [repairChoice, setRepairChoice] = useState<string | null>(null)
  const [roadmapOpen, setRoadmapOpen] = useState(false)

  const phaseIndex = phaseLabels.findIndex(item => item.id === phase)
  const next = (nextPhase: EpisodePhase) => {
    setPhase(nextPhase)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const restart = () => {
    setPhase('BRIEF')
    setRequestEvidence([])
    setFlowIndex(0)
    setBoundaryChoice(null)
    setTestRun(false)
    setRepairChoice(null)
  }

  const driveComplete = useCallback(() => next('INCIDENT'), [])
  const redriveComplete = useCallback(() => next('RESULT'), [])

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={restart} aria-label="처음으로">
          <img src="./assets/cat-face.png" alt="" />
          <span><b>TRACKBACK</b><small>VEHICLE VERIFICATION ADVENTURE</small></span>
        </button>
        <div className="phase-meter" aria-label={`전체 11단계 중 ${phaseIndex + 1}단계`}>
          <span>{String(phaseIndex + 1).padStart(2, '0')}</span>
          <i><b style={{ width: `${((phaseIndex + 1) / phaseLabels.length) * 100}%` }} /></i>
          <span>{String(phaseLabels.length).padStart(2, '0')}</span>
        </div>
        <button className="quiet-button" onClick={() => setRoadmapOpen(true)}>CASE ROADMAP</button>
      </header>

      <nav className="journey-rail" aria-label="에피소드 진행">
        {phaseLabels.map((item, index) => (
          <span key={item.id} className={index === phaseIndex ? 'is-current' : index < phaseIndex ? 'is-done' : ''}>
            <i>{index < phaseIndex ? '✓' : index + 1}</i>{item.label}
          </span>
        ))}
      </nav>

      <main>
        {phase === 'BRIEF' && <Brief onStart={() => next('DRIVE')} />}
        {phase === 'DRIVE' && <DriveScene mode="incident" onComplete={driveComplete} />}
        {phase === 'INCIDENT' && <Incident onNext={() => next('REQUEST')} />}
        {phase === 'REQUEST' && (
          <RequestCheck selected={requestEvidence} onChange={setRequestEvidence} onNext={() => next('XRAY')} />
        )}
        {phase === 'XRAY' && (
          <Xray index={flowIndex} onIndex={setFlowIndex} onNext={() => next('BOUNDARY')} />
        )}
        {phase === 'BOUNDARY' && (
          <Boundary choice={boundaryChoice} onChoice={setBoundaryChoice} onNext={() => next('TEST')} />
        )}
        {phase === 'TEST' && <TestBench complete={testRun} onRun={() => setTestRun(true)} onNext={() => next('REPORT')} />}
        {phase === 'REPORT' && <Report onNext={() => next('REPAIR')} />}
        {phase === 'REPAIR' && (
          <Repair choice={repairChoice} onChoice={setRepairChoice} onNext={() => next('REDRIVE')} />
        )}
        {phase === 'REDRIVE' && <DriveScene mode="verified" onComplete={redriveComplete} />}
        {phase === 'RESULT' && <Result onRestart={restart} />}
      </main>

      {roadmapOpen && <Roadmap onClose={() => setRoadmapOpen(false)} />}
    </div>
  )
}

function Brief({ onStart }: { onStart: () => void }) {
  return (
    <section className="scene scene-brief">
      <div className="brief-copy">
        <SourceBadge kind="FIELD FREQUENCY" />
        <p className="case-number">CASE 01 · LOW VOLTAGE</p>
        <h1>{episodeOne.title}</h1>
        <p className="lead">{episodeOne.mission}</p>
        <div className="mission-contract">
          <div><span>목적</span><strong>세 지점 로그 전달</strong></div>
          <div><span>특별 절차</span><strong>정차 후 전원 재인가</strong></div>
          <div><span>평가</span><strong>안전 · 원인 추적 · 재검증</strong></div>
        </div>
        <div className="frequency-note">
          <strong>왜 첫 번째 사건인가요?</strong>
          <p>{episodeOne.frequencyBasis}. 공개 통계의 범주를 교육용 시나리오에 맞게 단순화했으며 실제 정비 지침을 대신하지 않습니다.</p>
        </div>
        <button className="primary-button" onClick={onStart}>검증 주행 시작 <span>→</span></button>
      </div>
      <div className="brief-visual">
        <img className="blueprint" src="./assets/vehicle-blueprint.png" alt="차량 전·측·평면 스케치" />
        <div className="route-card">
          <span>PANGYO VALIDATION LOOP</span>
          <svg viewBox="0 0 420 270" aria-label="세 개의 검증 지점이 표시된 경로">
            <path d="M54 211 C72 117 138 56 224 64 C318 72 367 122 340 196 C311 251 225 230 182 197 C135 161 101 194 54 211Z" />
            <circle cx="76" cy="180" r="10" /><circle cx="222" cy="65" r="10" /><circle cx="331" cy="191" r="10" />
          </svg>
          <div className="route-legend"><span>A 출발 확인</span><span>B 재시동 절차</span><span>C 완료 보고</span></div>
        </div>
        <div className="cat-callout"><img src="./assets/cat-face.png" alt="고양이 운전자" /><p>“로그를 전달하고 두 번째 지점에서 전원을 다시 켜 볼게요.”</p></div>
      </div>
    </section>
  )
}

function Incident({ onNext }: { onNext: () => void }) {
  return (
    <SceneCard eyebrow="INCIDENT REPLAY" title="요청은 있었지만, 차량이 준비되지 않았습니다." question="무슨 일이 있었나요?">
      <div className="replay-panel">
        <div className="driver-view">
          <div className="windscreen"><span>검증 지점 B · 정차 완료</span><b>DRIVE READY</b></div>
          <div className="dashboard">
            <span>POWER <b>ON</b></span><span>GEAR <b>P</b></span><span>BRAKE <b>ON</b></span><span className="warning">12V <b>9.4V</b></span>
          </div>
        </div>
        <div className="driver-quote"><img src="./assets/cat-face.png" alt="" /><p>“브레이크를 밟고 전원을 켰는데 READY 표시가 안 들어와요.”</p></div>
      </div>
      <div className="three-facts">
        <Fact label="운전자 요청" value={episodeOne.incident.request} />
        <Fact label="당시 조건" value={episodeOne.incident.condition} />
        <Fact label="차량 반응" value={episodeOne.incident.response} alert />
      </div>
      <FooterAction hint="증상은 원인이 아니라 조사의 출발점입니다." label="입력과 조건 확인" onClick={onNext} />
    </SceneCard>
  )
}

function RequestCheck({ selected, onChange, onNext }: { selected: string[]; onChange: (items: string[]) => void; onNext: () => void }) {
  const options = [
    { id: 'start', icon: '◉', label: '전원 요청', value: 'Start ON', needed: true },
    { id: 'brake', icon: '▥', label: '브레이크', value: 'Pressed', needed: true },
    { id: 'gear', icon: 'P', label: '기어', value: 'Park', needed: true },
    { id: 'steer', icon: '↻', label: '조향', value: '-2°', needed: false },
  ]
  const required = options.filter(option => option.needed).map(option => option.id)
  const complete = required.every(id => selected.includes(id))
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter(item => item !== id) : [...selected, id])
  return (
    <SceneCard eyebrow="CLUE 01 · DRIVER REQUEST" title="운전자가 READY 조건을 제대로 만들었나요?" question="판단에 필요한 입력만 선택하세요.">
      <div className="control-board">
        {options.map(option => (
          <button key={option.id} className={selected.includes(option.id) ? 'is-selected' : ''} onClick={() => toggle(option.id)}>
            <i>{option.icon}</i><span>{option.label}</span><strong>{option.value}</strong>
          </button>
        ))}
      </div>
      <div className={`finding ${complete ? 'is-found' : ''}`}>
        <span>{complete ? 'CLUE RECORDED' : 'SELECT 3 SIGNALS'}</span>
        <strong>{complete ? '시동 요청·브레이크·P단 조건이 모두 유효합니다.' : '시동 허가 판단에 직접 필요한 입력을 고르세요.'}</strong>
      </div>
      <FooterAction hint="관련 없는 신호를 제외하는 것도 고장 범위를 좁히는 행동입니다." label="차량 내부 경로 추적" onClick={onNext} disabled={!complete} />
    </SceneCard>
  )
}

function Xray({ index, onIndex, onNext }: { index: number; onIndex: (index: number) => void; onNext: () => void }) {
  const node = episodeOne.flow[index]
  const atEnd = index === episodeOne.flow.length - 1
  return (
    <SceneCard eyebrow="VEHICLE X-RAY" title="시동 요청은 차 안에서 어디로 전달됐나요?" question="현재 사건과 관련된 기능 경로만 따라가세요.">
      <div className="xray-layout">
        <div className="xray-map">
          <div className="vehicle-silhouette" aria-hidden="true">⌁</div>
          <div className="flow-row">
            {episodeOne.flow.map((item, itemIndex) => (
              <div className="flow-step" key={item.id}>
                <button className={`${item.state} ${itemIndex === index ? 'is-active' : ''}`} onClick={() => onIndex(itemIndex)}>
                  <small>{String(itemIndex + 1).padStart(2, '0')}</small><strong>{item.label}</strong><span>{item.actual}</span>
                </button>
                {itemIndex < episodeOne.flow.length - 1 && <i className={itemIndex < 2 ? 'normal' : 'abnormal'}>→</i>}
              </div>
            ))}
          </div>
        </div>
        <NodeDetail node={node} />
      </div>
      <FooterAction
        hint="초록은 정상 전달, 주황은 최초 차이, 회색은 그 결과로 차단된 기능입니다."
        label={atEnd ? '정상/이상 경계 찾기' : '다음 기능 보기'}
        onClick={() => atEnd ? onNext() : onIndex(index + 1)}
      />
    </SceneCard>
  )
}

function Boundary({ choice, onChoice, onNext }: { choice: string | null; onChoice: (choice: string) => void; onNext: () => void }) {
  const options = [
    { id: 'request', label: 'Driver Request → Preconditions', correct: false },
    { id: 'supply', label: 'Preconditions → 12V Supply', correct: true },
    { id: 'ready', label: 'Power Control → DRIVE READY', correct: false },
  ]
  const correct = choice === 'supply'
  return (
    <SceneCard eyebrow="CLUE 02 · FAULT BOUNDARY" title="어디까지 정상이고, 어디부터 달랐나요?" question="Last Known Normal과 First Known Abnormal 사이를 선택하세요.">
      <div className="boundary-list">
        {options.map(option => (
          <button key={option.id} onClick={() => onChoice(option.id)} className={choice === option.id ? option.correct ? 'is-correct' : 'is-wrong' : ''}>
            <span>{option.label}</span><i>{choice === option.id ? option.correct ? '경계 발견' : '다시 확인' : '선택'}</i>
          </button>
        ))}
      </div>
      {choice && <div className={`explanation ${correct ? 'success' : 'warning'}`}>
        {correct ? evidenceText.boundary : '뒤쪽의 차단 결과보다 먼저 달라진 값을 찾으세요. 증상과 최초 이상은 다를 수 있습니다.'}
      </div>}
      <FooterAction hint="정상 evidence도 결론을 지지하는 중요한 단서입니다." label="가설을 구분하는 시험" onClick={onNext} disabled={!correct} />
    </SceneCard>
  )
}

function TestBench({ complete, onRun, onNext }: { complete: boolean; onRun: () => void; onNext: () => void }) {
  return (
    <SceneCard eyebrow="CLUE 03 · CONTROLLED TEST" title="무부하에서는 괜찮아 보이는 전압이, 부하에서 유지되나요?" question="조건은 고정하고 전원 요청 부하만 바꿉니다.">
      <div className="test-bench">
        <div className="test-plan">
          <Fact label="고정 조건" value="기어 P · 브레이크 ON · 외기 8°C" />
          <Fact label="변경 입력" value="전원 요청 OFF → ON" />
          <Fact label="관찰 출력" value="12V Supply 최소 전압" />
          <Fact label="판정 기준" value="시뮬레이션 기준 11.5V 이상" />
          <button className="primary-button" onClick={onRun} disabled={complete}>{complete ? '시험 완료' : '부하 시험 실행'}</button>
        </div>
        <div className={`scope ${complete ? 'has-result' : ''}`}>
          <div className="scope-grid" />
          {complete ? (
            <>
              <svg viewBox="0 0 520 190" preserveAspectRatio="none" aria-label="부하 시험 전압 그래프">
                <polyline points="0,52 125,49 210,55 245,61 260,138 335,145 390,128 520,130" />
                <line x1="0" y1="105" x2="520" y2="105" />
              </svg>
              <div className="scope-labels"><span>12.3V · 무부하</span><strong>9.4V · 요청 부하</strong><span>기준 11.5V</span></div>
            </>
          ) : <p>시험을 실행하면 Actual과 Expected가 같은 시간축에 표시됩니다.</p>}
        </div>
      </div>
      {complete && <div className="explanation success"><strong>가설 지지:</strong> 입력 조건은 정상이지만 12V 공급이 부하에서 기준 아래로 떨어집니다. 실제 차량의 배터리 판정·교환 절차를 대신하지 않습니다.</div>}
      <FooterAction hint="시험 결과는 배터리 공급 경계의 이상을 지지하지만 실제 부품 고장을 단독 확정하지 않습니다." label="근거 보고서 작성" onClick={onNext} disabled={!complete} />
    </SceneCard>
  )
}

function Report({ onNext }: { onNext: () => void }) {
  return (
    <SceneCard eyebrow="EVIDENCE REPORT" title="결론보다 먼저, 근거가 충분한지 확인합니다." question="세 단서가 하나의 설명으로 이어지나요?">
      <div className="evidence-board">
        <EvidenceCard number="01" type="PHENOMENON" text={evidenceText.phenomenon} />
        <EvidenceCard number="02" type="BOUNDARY" text={evidenceText.boundary} />
        <EvidenceCard number="03" type="PROOF" text={evidenceText.proof} />
      </div>
      <div className="diagnosis">
        <span>ROOT CAUSE LOCATION</span><strong>12V Supply Boundary</strong>
        <span>FAILURE TYPE</span><strong>Load voltage collapse</strong>
        <span>CONFIDENCE</span><strong>Supported in simulation</strong>
      </div>
      <FooterAction hint="고장 위치 판단과 evidence 충분성은 분리해서 평가합니다." label="보고서 제출 및 수리" onClick={onNext} />
    </SceneCard>
  )
}

function Repair({ choice, onChoice, onNext }: { choice: string | null; onChoice: (choice: string) => void; onNext: () => void }) {
  const correct = choice === 'battery'
  const choices = [
    { id: 'interlock', title: 'READY interlock 우회', detail: '표시만 켜지도록 조건을 우회합니다.' },
    { id: 'battery', title: '12V 공급원 복구', detail: '교육 시뮬레이션의 열화된 공급원을 정상 모델로 교체합니다.' },
    { id: 'display', title: '계기판 경고 숨김', detail: '운전자 표시만 비활성화합니다.' },
  ]
  return (
    <SceneCard eyebrow="REPAIR DECISION" title="증상이 아니라 최초 이상 경계를 수정하세요." question="어떤 조치가 원인과 회귀시험을 모두 만족할까요?">
      <div className="repair-grid">
        {choices.map(item => (
          <button key={item.id} onClick={() => onChoice(item.id)} className={choice === item.id ? item.id === 'battery' ? 'is-correct' : 'is-wrong' : ''}>
            <span>{item.title}</span><small>{item.detail}</small>
          </button>
        ))}
      </div>
      {choice && <div className={`explanation ${correct ? 'success' : 'warning'}`}>
        {correct ? '회귀시험 4/4 PASS · READY 진입 · 저전압 경고 · 기존 interlock · 로그 무결성' : '결과를 숨기거나 안전 조건을 우회하면 root cause는 남아 있습니다.'}
      </div>}
      <FooterAction hint="수리 성공은 시험 통과와 실제 재주행으로 각각 확인합니다." label="같은 구간 재주행" onClick={onNext} disabled={!correct} />
    </SceneCard>
  )
}

function Result({ onRestart }: { onRestart: () => void }) {
  return (
    <section className="scene result-scene">
      <div className="result-stamp">VERIFIED</div>
      <img src="./assets/cat-face.png" alt="기뻐하는 고양이 운전자" />
      <p className="eyebrow">CASE 01 COMPLETE</p>
      <h1>같은 조건에서 다시 출발했습니다.</h1>
      <p className="lead">주행을 방해한 결과만 지운 것이 아니라, 최초 이상 경계를 찾고 수정 후 동일 조건으로 재검증했습니다.</p>
      <div className="result-scores">
        <div><span>DRIVING</span><strong>A</strong><small>안전 주행</small></div>
        <div><span>INVESTIGATION</span><strong>3/3</strong><small>근거 확보</small></div>
        <div><span>RESOLUTION</span><strong>PASS</strong><small>회귀 + 재주행</small></div>
      </div>
      <button className="primary-button" onClick={onRestart}>처음부터 다시 체험</button>
    </section>
  )
}

function Roadmap({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="roadmap-title">
      <section className="roadmap-modal">
        <button className="modal-close" onClick={onClose} aria-label="닫기">×</button>
        <p className="eyebrow">FREQUENCY-LED CAMPAIGN</p>
        <h2 id="roadmap-title">현실 고장 빈도 기반 케이스 순서</h2>
        <p>ADAC 2025 고장출동 부품군 통계를 우선순위 proxy로 사용했습니다. 국가·차령·차종에 따라 달라지며, 안전 위해도 순위나 국내 결함률을 뜻하지 않습니다.</p>
        <div className="roadmap-list">
          {caseRoadmap.map(item => <div key={item.order}><b>{String(item.order).padStart(2, '0')}</b><span><strong>{item.title}</strong><small>{item.status}</small></span><i>{item.prevalence}</i></div>)}
        </div>
        <a href="https://www.adac.de/rund-ums-fahrzeug/unfall-schaden-panne/adac-pannenstatistik-2026/" target="_blank" rel="noreferrer">빈도 근거 보기 ↗</a>
      </section>
    </div>
  )
}

function SceneCard({ eyebrow, title, question, children }: { eyebrow: string; title: string; question: string; children: React.ReactNode }) {
  return <section className="scene-card"><header><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{question}</p></header>{children}</section>
}

function SourceBadge({ kind }: { kind: SourceKind }) {
  return <span className="source-badge">{kind}</span>
}

function Fact({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) {
  return <div className={`fact ${alert ? 'is-alert' : ''}`}><span>{label}</span><strong>{value}</strong></div>
}

function FooterAction({ hint, label, onClick, disabled = false }: { hint: string; label: string; onClick: () => void; disabled?: boolean }) {
  return <footer className="scene-action"><p>{hint}</p><button className="primary-button" onClick={onClick} disabled={disabled}>{label} <span>→</span></button></footer>
}

function NodeDetail({ node }: { node: FlowNode }) {
  return <aside className="node-detail"><div><span className={`node-state ${node.state}`}>{node.state}</span><SourceBadge kind={node.source} /></div><h2>{node.label}</h2><p>{node.role}</p><dl><dt>EXPECTED</dt><dd>{node.expected}</dd><dt>ACTUAL</dt><dd>{node.actual}</dd></dl><small>왜 지금 보나요? 요청이 READY 표시로 이어지는 경로에서 이 기능이 값을 만들거나 전달하기 때문입니다.</small></aside>
}

function EvidenceCard({ number, type, text }: { number: string; type: string; text: string }) {
  return <article className="evidence-card"><b>{number}</b><span>{type}</span><p>{text}</p><i>RECORDED</i></article>
}
