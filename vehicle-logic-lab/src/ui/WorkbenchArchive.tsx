import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { DEFAULT_INPUTS, INPUTS, MISSIONS, OUTPUTS, referenceGraph, STATES, withStates } from '../content/ready.ts'
import { LogicSimulation } from '../engine/simulation.ts'
import { rating, verify } from '../engine/verification.ts'
import { fingerprint, loadSave, persist } from '../progress/storage.ts'
import type { Save } from '../progress/storage.ts'
import type { Graph, Mission, Snapshot, TestResult } from '../engine/types.ts'
import { LogicEditor } from './LogicEditor'
import { Dashboard } from './Dashboard'
import { VehicleView } from './VehicleView'

function restore() {
  const loaded = loadSave(localStorage)
  // Completion is evidence for this graph, not a trusted flag in localStorage.
  for (const mission of MISSIONS) {
    const graph = loaded.save.graphs[mission.id]
    try {
      loaded.save.grades[mission.id] = graph && loaded.save.verified[mission.id] === fingerprint(graph) ? rating(verify(graph, mission)) : 0
    } catch { loaded.save.grades[mission.id] = 0 }
  }
  return loaded
}
export default function App() {
  const [initial] = useState(restore)
  const [save, setSave] = useState<Save>(initial.save)
  const [saveMessage, setSaveMessage] = useState(initial.warning ?? '이 브라우저에 자동 저장')
  const [autosave, setAutosave] = useState(!initial.warning)
  const [active, setActive] = useState(0)
  const [view, setView] = useState<'lab' | 'map'>('lab')
  const [observe, setObserve] = useState(!initial.save.verified.conditions)
  const [celebrate, setCelebrate] = useState<string>()
  const importInput = useRef<HTMLInputElement>(null)
  const mission = MISSIONS[active]
  const graph = save.graphs[mission.id]
  const completed = MISSIONS.filter(m => (save.grades[m.id] ?? 0) >= 2).length
  const unlocked = (index: number) => MISSIONS.slice(0, index).every(m => (save.grades[m.id] ?? 0) >= 2)
  useEffect(() => {
    if (!autosave) return
    const error = persist(localStorage, save)
    setSaveMessage(error ?? '자동 저장됨 · 이 브라우저')
  }, [save, autosave])
  const selectMission = (index: number) => {
    if (!unlocked(index)) return
    const next = MISSIONS[index]
    if (!save.graphs[next.id]) setSave(s => ({ ...s, graphs: { ...s.graphs, [next.id]: index === 1 ? withStates(s.graphs.conditions) : structuredClone(s.graphs.states) } }))
    setActive(index); setView('lab'); setCelebrate(undefined)
  }
  const changeGraph = (next: Graph) => { setCelebrate(undefined); setSave(current => {
    const changed = fingerprint(next) !== fingerprint(current.graphs[mission.id])
    return { ...current, graphs: { ...current.graphs, [mission.id]: next }, grades: { ...current.grades, ...(changed ? { [mission.id]: 0 } : {}) }, verified: { ...current.verified, ...(changed ? { [mission.id]: '' } : {}) } }
  }) }
  const complete = (results: TestResult[]) => {
    const score = rating(results)
    setSave(s => ({ ...s, grades: { ...s.grades, [mission.id]: score }, verified: { ...s.verified, [mission.id]: score >= 2 ? fingerprint(s.graphs[mission.id]) : '' } }))
    if (score >= 2) setCelebrate(mission.concept)
  }
  const exportProgress = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a'); a.href = url; a.download = 'vehicle-logic-lab-progress.json'; a.click(); URL.revokeObjectURL(url)
  }
  const importProgress = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      if (file.size > 2_000_000) throw new Error('파일이 너무 큽니다.')
      const raw = await file.text()
      const loaded = loadSave({ getItem: () => raw, setItem: () => {} })
      if (loaded.warning || !loaded.save.graphs.conditions) throw new Error('올바른 진행 파일이 아닙니다.')
      for (const m of MISSIONS) {
        const g = loaded.save.graphs[m.id]
        loaded.save.grades[m.id] = g && loaded.save.verified[m.id] === fingerprint(g) ? rating(verify(g, m)) : 0
      }
      setSave(loaded.save); setAutosave(true); setActive(0); setView('lab'); setCelebrate(undefined); setSaveMessage('진행 파일을 불러왔습니다.')
    } catch { setSaveMessage('진행 파일을 읽지 못했습니다. 현재 작업은 유지됩니다.') }
    event.target.value = ''
  }
  return <div className="app">
    <a className="skip-link" href="#workspace">작업 공간으로 이동</a>
    <header className="app-header"><a className="brand" href="#" onClick={e => { e.preventDefault(); setView('lab') }}><span className="brand-mark">v<span>↗</span></span><span>VEHICLE <b>LOGIC LAB</b><small>차량의 원리를, 내 손으로.</small></span></a>
      <nav aria-label="주 메뉴"><button className={view === 'lab' ? 'nav-active' : ''} onClick={() => setView('lab')}>차량 개발실</button><button className={view === 'map' ? 'nav-active' : ''} onClick={() => setView('map')}>시스템 지도 <span>{completed}/3</span></button><button disabled title="추가 예정 — 테스트 트랙 통합">테스트 트랙 <small>추가 예정</small></button><button disabled title="추가 예정 — 문제 해결 챌린지">문제 해결 <small>추가 예정</small></button></nav>
      <div className="session-badge"><i className="status-dot"/>교육용 가상 EV <b>01</b></div>
    </header>
    <main id="workspace">
      {view === 'lab' ? <>
        <section className="mission-heading"><div><div className="eyebrow">POWERTRAIN / 구동 준비 <span>기초 · Boolean & 상태 전이</span></div><h1>작은 연결이, <em>차량을 깨웁니다.</em></h1><p>조건을 연결하고, 직접 눌러 보고, 내 설계를 시험하세요.</p></div><button className="observe-button" onClick={() => setObserve(true)}><span>▷</span><b>정상 동작 관찰<small>이 기능은 어떻게 움직일까요?</small></b></button></section>
        <section className="mission-strip" aria-label="미션 선택">{MISSIONS.map((m, i) => <button key={m.id} disabled={!unlocked(i)} aria-current={active === i ? 'step' : undefined} className={`${active === i ? 'current-step' : ''} ${(save.grades[m.id] ?? 0) >= 2 ? 'done-step' : ''}`} onClick={() => selectMission(i)}><span className="step-number">{(save.grades[m.id] ?? 0) >= 2 ? '✓' : `0${i + 1}`}</span><span><small>{m.subtitle}</small><b>{m.title}</b></span><span className="step-stars" aria-label={`${save.grades[m.id] ?? 0}단계 달성`}>{[1, 2, 3].map(n => <i key={n} className={(save.grades[m.id] ?? 0) >= n ? 'earned' : ''}>◆</i>)}</span></button>)}</section>
        <div className="objective"><span>현재 목표</span><p>{mission.goal}</p><span className="objective-stage">{active + 1} / 3</span></div>
        {graph && <Lab key={mission.id} graph={graph} mission={mission} onChange={changeGraph} onComplete={complete} onObserve={() => setObserve(true)}/>}
        {celebrate && <section className="completion" role="status"><span className="completion-icon">✓</span><div><b>{active === 2 ? 'READY 기능을 완성했어요!' : '검증 완료. 차량이 한 걸음 더 완성됐어요.'}</b><p>{celebrate}</p></div><button className="primary" onClick={() => active < 2 ? selectMission(active + 1) : setView('map')}>{active < 2 ? '다음 미션 →' : '시스템 지도에서 확인 →'}</button><button aria-label="완료 알림 닫기" onClick={() => setCelebrate(undefined)}>×</button></section>}
      </> : <SystemMap completed={completed} save={save} onOpen={() => setView('lab')}/>}
    </main>
    <footer className="app-footer"><span className="footer-note">가상 차량 사양 · READY는 이동 중이라는 뜻이 아닙니다.</span><div><span role="status">{saveMessage}</span><button onClick={() => { setAutosave(true); setSaveMessage(persist(localStorage, save) ?? '저장했습니다.') }}>저장</button><button onClick={exportProgress}>진행 내보내기</button><button onClick={() => importInput.current?.click()}>불러오기</button><input ref={importInput} type="file" accept="application/json,.json" onChange={importProgress} hidden/></div></footer>
    {observe && <Observation mission={mission} onClose={() => setObserve(false)}/>}
  </div>
}

function Lab({ graph, mission, onChange, onComplete, onObserve }: { graph: Graph; mission: Mission; onChange: (graph: Graph) => void; onComplete: (results: TestResult[]) => void; onObserve: () => void }) {
  const engine = useRef(new LogicSimulation(mission.initial, mission.mode))
  const [inputs, setInputs] = useState<Record<string, boolean>>({ ...DEFAULT_INPUTS })
  const [snapshot, setSnapshot] = useState<Snapshot>(() => engine.current.step(graph, DEFAULT_INPUTS))
  const [hold, setHold] = useState(false)
  const [hint, setHint] = useState(0)
  const [results, setResults] = useState<TestResult[]>([])
  const [selectedResult, setSelectedResult] = useState<string>()
  const [showAll, setShowAll] = useState(false)
  const [trace, setTrace] = useState<string[]>([])
  const [oldBehavior, setOldBehavior] = useState(fingerprint(graph))
  const ready = snapshot.outputs.ready === true
  const record = (next: Snapshot) => {
    setSnapshot(next)
    if (next.previousState !== next.state) setTrace(t => [`${STATES[next.previousState as keyof typeof STATES]} → ${STATES[next.state as keyof typeof STATES]}`, ...t].slice(0, 5))
  }
  const tick = (next: Record<string, boolean>) => { setSelectedResult(undefined); setInputs(next); record(engine.current.step(graph, next)) }
  const edit = (next: Graph) => {
    if (fingerprint(next) !== oldBehavior) {
      setResults([]); setSelectedResult(undefined); setOldBehavior(fingerprint(next)); engine.current.reset(mission.initial)
      setInputs({ ...DEFAULT_INPUTS }); setHold(false); setTrace([]); setSnapshot(engine.current.step(next, DEFAULT_INPUTS))
    }
    onChange(next)
  }
  const runTests = () => { const rows = verify(graph, mission); setResults(rows); setSelectedResult(undefined); onComplete(rows) }
  const inspect = (row: TestResult) => {
    setSelectedResult(row.id); setInputs(row.expected.inputs); setHold(row.expected.inputs.power); setSnapshot(row.actual)
    engine.current.reset(row.actual.state); engine.current.held = row.expected.inputs.power
  }
  const selected = results.find(r => r.id === selectedResult)
  const failedNodes = selected && !selected.pass ? selected.actual.issues.flatMap(i => i.nodes).concat(graph.nodes.filter(n => n.kind === 'output' || n.kind === 'transition').map(n => n.id)) : []
  const rows = showAll ? results : results.filter(r => !r.challenge || !r.pass || r.id === 'held')
  return <>
    <div className="workspace">
      <LogicEditor graph={graph} snapshot={snapshot} allowed={mission.allowedBlocks} onChange={edit} failedNodes={failedNodes}/>
      <aside className="simulation-panel"><header className="panel-title"><span><i className="status-dot"/> 차량 시뮬레이터</span><small>실제 로직 출력</small></header>
        <VehicleView ready={ready} powered={snapshot.state !== 'OFF'}/><Dashboard snapshot={snapshot} logicOnly={mission.mode === 'logic'}/>
        <section className="input-panel"><div className="panel-label">직접 조작하기</div><div className="input-toggles">{Object.entries(INPUTS).filter(([key]) => key !== 'power' && (mission.mode === 'machine' || key !== 'stopped')).map(([key, label]) => <label className="toggle-row" key={key}><span>{label}</span><input type="checkbox" role="switch" checked={inputs[key] ?? false} onChange={e => tick({ ...inputs, [key]: e.target.checked })}/><i/><b>{inputs[key] ? 'ON' : 'OFF'}</b></label>)}</div>
          <button className={`power-button ${snapshot.pulse ? 'power-pulsed' : ''}`} disabled={hold} onClick={() => {
            const next = { ...inputs, power: true }; const result = engine.current.step(graph, next)
            engine.current.step(graph, { ...inputs, power: false }); setInputs({ ...inputs, power: false }); setSelectedResult(undefined); record(result)
          }}><span>⏻</span>전원 버튼 누르기<small>한 번의 누름 = 한 번의 이벤트</small></button>
          <label className="hold-control"><input type="checkbox" checked={hold} onChange={e => { setHold(e.target.checked); tick({ ...inputs, power: e.target.checked }) }}/>버튼을 누른 채 유지</label>
          {hold && <button className="secondary hold-step" onClick={() => tick(inputs)}>누른 상태에서 한 틱 진행 →</button>}
          <button className="reset-sim" onClick={() => { engine.current.reset(mission.initial); setHold(false); tick({ ...DEFAULT_INPUTS }); setTrace([]) }}>↺ 시뮬레이션 처음으로</button>
        </section>
      </aside>
    </div>
    <div className="bottom-panels">
      <section className="learning-panel"><div className="panel-label">설계 노트</div><h2>{mission.mode === 'logic' ? '세 가지 조건, 하나의 요청.' : '같은 입력에도 다른 반응.'}</h2><p>{mission.mode === 'logic' ? '먼저 조건을 만드세요. 이번 미션은 요청만 계산하고, 실제 상태 변경은 다음 미션에서 연결합니다.' : '현재 상태를 기억해야 해요. 한 틱에서는 현재 상태를 기준으로 전이 하나만 실행합니다.'}</p>
        <div className="hint-actions"><button className="secondary" onClick={() => setHint(n => Math.min(4, n + 1))}>✦ {hint ? '다음 힌트' : '힌트 보기'} <span>{hint}/4</span></button><button onClick={onObserve}>정상 동작 다시 보기 ↗</button></div>
        {hint > 0 && <p className="hint" role="status">{mission.hints[hint - 1]}</p>}
        <details><summary>가상 차량 사양과 신호 설명</summary><p>실제 제조사 제어와 다른 교육용 사양입니다. OFF에서 버튼을 누르면 STANDBY, STANDBY에서 버튼·브레이크·준비 조건을 만족하면 READY, READY에서 버튼·정지 조건을 만족하면 OFF가 됩니다. 정의하지 않은 입력에서는 상태를 유지합니다.</p><p>STANDBY에서 종료, READY 중 고장 대응, 실제 고전압 제어는 이 사양의 범위 밖입니다.</p><p>검증 범위: 조건 로직 / 상태 제어 컴포넌트. 환경: 브라우저 소프트웨어 시뮬레이션. 하드웨어·실차 검증은 포함하지 않습니다.</p><p>내부 신호: Power_Button → 상승 에지, Brake_Pressed → 브레이크, System_OK → 준비, Vehicle_Stopped → 정지.</p></details>
        {trace.length > 0 && <div className="transition-trace"><small>최근 상태 변화</small>{trace.map((line, i) => <span key={i}>{line}</span>)}</div>}
      </section>
      <section className="tests-panel"><header><div><div className="panel-label">검증 벤치</div><h2>설계가 모든 조건을 만족할까요?</h2></div><button className="primary" onClick={runTests}>▷ {results.length ? '다시 전체 시험' : '전체 시험 실행'}</button></header>
        {results.length ? <>
          <div className={`test-summary ${results.every(r => r.pass) ? 'all-pass' : ''}`} role="status"><b>{results.filter(r => r.pass).length} / {results.length} 통과</b><span>필수 {results.filter(r => !r.challenge && r.pass).length}/{results.filter(r => !r.challenge).length} · 도전 {results.filter(r => r.challenge && r.pass).length}/{results.filter(r => r.challenge).length}</span><button onClick={() => setShowAll(v => !v)}>{showAll ? '핵심 시험만' : '전체 결과 보기'}</button></div>
          <div className="test-list">{rows.map(row => <button key={row.id} className={`test-row ${row.pass ? 'pass' : 'fail'} ${selectedResult === row.id ? 'selected-result' : ''}`} onClick={() => inspect(row)}><span>{row.pass ? '✓' : '!'}</span><b>{row.name}</b><small>{row.challenge ? '도전' : '필수'}</small><em>{row.pass ? '통과' : '재확인'}</em></button>)}</div>
          {selected && <div className="test-detail" role="status"><b>{selected.name}</b><p>{selected.message}</p><p>기대: {STATES[selected.expected.state as keyof typeof STATES]} / 실제: {STATES[selected.actual.state as keyof typeof STATES]}</p>{Object.entries(selected.expected.outputs).map(([key, val]) => <p key={key}>{OUTPUTS[key as keyof typeof OUTPUTS]} — 기대 {val ? '참' : '거짓'} / 실제 {key in selected.actual.outputs ? selected.actual.outputs[key] ? '참' : '거짓' : '미연결'}</p>)}</div>}
        </> : <div className="test-empty"><span>⌁</span><p>내 연결을 실제로 실행해 검증합니다.<br/>틀린 조건은 다시 연결하면 돼요. 횟수 제한은 없어요.</p><small>1단계 · 기본 동작 / 2단계 · 필수 통과 / 3단계 · 도전 통과</small></div>}
        {snapshot.issues.length > 0 && <div className="graph-issues"><b>연결을 확인해주세요</b><p>{snapshot.issues[0].message}{snapshot.issues.length > 1 ? ` 외 ${snapshot.issues.length - 1}곳` : ''}</p></div>}
      </section>
    </div>
  </>
}

function Observation({ mission, onClose }: { mission: Mission; onClose: () => void }) {
  const [index, setIndex] = useState(0)
  const graph = referenceGraph(mission.mode === 'machine')
  const steps = mission.mode === 'logic' ? [
    { title: '조건을 기다려요', note: '브레이크와 시스템이 준비되어도 버튼 입력이 없으면 요청은 거짓입니다.', inputs: { ...DEFAULT_INPUTS } },
    { title: '세 조건이 모두 참', note: '버튼을 누르면 진입 요청은 참이 됩니다. 실제 차량 상태는 아직 시동 대기예요.', inputs: { ...DEFAULT_INPUTS, power: true } },
    { title: '조건 하나가 빠지면?', note: '브레이크 없이 누르면 진입 요청이 거짓이어야 합니다.', inputs: { ...DEFAULT_INPUTS, power: false, brake: false } },
    { title: '요청을 허용하지 않아요', note: '버튼을 눌러도 브레이크 조건이 없으면 진입 요청은 거짓입니다.', inputs: { ...DEFAULT_INPUTS, power: true, brake: false } },
  ] : [
    { title: '차량이 잠들어 있어요', note: '시작 상태는 전원 꺼짐입니다.', inputs: { ...DEFAULT_INPUTS } },
    { title: '전원 켜기', note: '첫 번째 누름은 시동 대기로만 이동합니다.', inputs: { ...DEFAULT_INPUTS, power: true } },
    { title: '계속 눌러도 상태 유지', note: '버튼이 계속 눌려 있으면 새 이벤트가 아닙니다.', inputs: { ...DEFAULT_INPUTS, power: true } },
    { title: '버튼에서 손 떼기', note: '상태는 시동 대기로 유지됩니다.', inputs: { ...DEFAULT_INPUTS } },
    { title: '이제 주행 준비 완료', note: '브레이크·시스템 준비 조건에서 다시 누르면 READY가 켜집니다.', inputs: { ...DEFAULT_INPUTS, power: true } },
  ]
  const sim = new LogicSimulation(mission.initial, mission.mode)
  let snapshot!: Snapshot
  steps.slice(0, index + 1).forEach(step => { snapshot = sim.step(graph, step.inputs) })
  const close = useRef<HTMLButtonElement>(null)
  useEffect(() => { close.current?.focus(); const listener = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }; window.addEventListener('keydown', listener); return () => window.removeEventListener('keydown', listener) }, [onClose])
  return <div className="modal-backdrop" onClick={onClose}><section className="observation" role="dialog" aria-modal="true" aria-label="정상 동작 관찰" onClick={e => e.stopPropagation()}><button ref={close} className="modal-close" onClick={onClose} aria-label="관찰 닫기">×</button><div className="eyebrow">BEFORE YOU BUILD / 정상 동작 관찰</div><h2>{steps[index].title}</h2><p>{steps[index].note}</p><Dashboard snapshot={snapshot} logicOnly={mission.mode === 'logic'}/><div className="observation-inputs">{Object.entries(steps[index].inputs).filter(([key]) => key !== 'stopped').map(([key, value]) => <span key={key} className={value ? 'on' : ''}>{INPUTS[key as keyof typeof INPUTS]} {value ? 'ON' : 'OFF'}</span>)}</div><p className="observation-note">읽기 전용 기준 로직으로 실행한 관찰입니다. 내 작업 공간에는 적용되지 않아요.</p><footer><span>{index + 1} / {steps.length}</span><button disabled={index === 0} onClick={() => setIndex(i => i - 1)}>← 이전</button>{index < steps.length - 1 ? <button className="primary" onClick={() => setIndex(i => i + 1)}>다음 동작 →</button> : <button className="primary" onClick={onClose}>직접 만들어 보기 →</button>}</footer></section></div>
}

function SystemMap({ completed, save, onOpen }: { completed: number; save: Save; onOpen: () => void }) {
  const [domain, setDomain] = useState('구동')
  const domains = ['구동', '배터리', '충전', '제동', '조향', '열관리', '차체', 'ADAS', '진단']
  return <section className="system-map"><div className="eyebrow">YOUR VEHICLE / 차량 시스템 지도</div><h1>연결한 만큼, <em>완성되는 차량.</em></h1><p>첫 번째 기능을 완성하며 차량의 가능성을 넓혀가세요.</p><div className="map-layout"><div className="map-vehicle"><img src="./assets/vehicle-blueprint.png" alt="TRACKBACK 차량 도면"/><div className="map-core"><span>LAB EV / 01</span><b>{completed === 3 ? 'READY 기능 활성화' : `READY 학습 ${completed}/3`}</b><small>{completed === 3 ? '검증된 시동 조건과 상태 전이' : '차량 개발실에서 연결을 완성하세요'}</small></div><div className="domain-grid">{domains.map(name => <button className={domain === name ? 'selected-domain' : ''} key={name} onClick={() => setDomain(name)}><i className={name === '구동' && completed === 3 ? 'status-dot' : ''}/><b>{name}</b><span>{name === '구동' ? completed === 3 ? '기능 완성' : '학습 중' : '추가 예정'}</span></button>)}</div></div><aside className="domain-detail"><div className="panel-label">선택한 기능 도메인</div><h2>{domain}</h2>{domain === '구동' ? <><h3>EV 구동 준비 · READY</h3><p>전원 버튼과 브레이크·시스템 준비 조건으로 구동 가능 상태를 결정합니다. 실제 모터 토크나 차량 이동은 이 기능에 포함되지 않습니다.</p><dl><dt>입력</dt><dd>전원 버튼, 브레이크, 준비, 정지</dd><dt>출력</dt><dd>상태, READY 표시, 구동 허용</dd><dt>관련 시스템</dt><dd>가상 차량 전원·구동 상태 제어</dd></dl>{MISSIONS.map(m => <p className="map-mission" key={m.id}><span>{(save.grades[m.id] ?? 0) >= 2 ? '✓' : '○'}</span>{m.title}<b>{(save.grades[m.id] ?? 0) >= 2 ? '검증 통과' : '미완료'}</b></p>)}<button className="primary" onClick={onOpen}>차량 개발실로 →</button></> : <p>추가 예정 — {domain} 학습 콘텐츠<br/>요구사항 검수와 해당 기능 모델이 준비되면 확장합니다.</p>}<small>추가 예정 — 상세 E/E·SW 아키텍처</small></aside></div></section>
}
