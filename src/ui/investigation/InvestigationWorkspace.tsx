import type { ReactNode } from 'react'
import type { IncidentFrame } from '../../runtime/case/PropulsionCase'
import type { CaseDefinition } from '../../runtime/investigation/CaseDefinition'
import type { BoundaryObservation } from '../../runtime/investigation/Boundary'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useCase } from '../state/CaseContext'
import { useNavigation } from '../state/navigation'
import { architectureNode, componentIds } from '../../registries/investigation/Architecture'
import { testsForComponent } from '../../registries/investigation/Trace'
import { inspectBoundary } from '../../runtime/investigation/Boundary'
import { ArchitectureExplorer } from './ArchitectureExplorer'
import { RequirementsExplorer } from './RequirementsExplorer'
import { TestBench } from './TestBench'
import { RootCauseReportPanel } from './AnalysisReport'
import { CaseSignalComparison } from '../screens/CaseSignalComparison'
import '../case.css'
import './workspace.css'
import './case-file.css'
import { FileIcon } from './FileIcon'
import { DriverPortrait } from './DriverPortrait'
import './office.css'

const tools = [['overview', '조사 현황', '현재 조사 정보'], ['incident', '고장 보고서', '현상 파악'], ['architecture', '차량 기능 구조', '논리 기능 흐름'], ['recording', '주행 신호 조사', '기대값과 실제값'], ['requirements', '요구사항 · 시험', 'SYSR · SWR · TC'], ['bench', '재현 시험실', '독립 SW 시험'], ['report', '원인 분석서', '근거와 최종 판단']] as const
type Tool = typeof tools[number][0]
const format = (value: unknown) => value === null || value === undefined ? '—' : typeof value === 'number' ? value.toFixed(3) : typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)

export function InvestigationWorkspace() {
    const videoSlot = useRef<HTMLDivElement>(null)
    const content = useRef<HTMLElement>(null)

    const { controller, state } = useCase(), leave = useNavigation(s => s.leaveXRay)
    const [tool, setTool] = useState<Tool>('incident'), [component, setComponent] = useState('PropulsionFunction'), [tc, setTc] = useState(''), [requirement, setRequirement] = useState(''), [playing, setPlaying] = useState(false), [visited, setVisited] = useState<Set<Tool>>(() => new Set(['incident']))
    //const [video, setVideo] = useState<HTMLDivElement | null>(null), content = useRef<HTMLElement>(null)
    const frame = state.frames[state.selected], definition = controller.definition
    const observation = frame ? inspectBoundary(frame, component, state.frames[state.selected - 1]) : null
    const inspected = state.evidence.some(e => e.type === 'SIGNAL_BOUNDARY' && e.reference.frameId === frame?.id && e.relatedComponent === component)
    const go = (next: Tool) => { setTool(next); setVisited(previous => new Set(previous).add(next)); content.current?.scrollTo({ top: 0, behavior: 'smooth' }) }
    const openRequirements = (id?: string) => { const related = testsForComponent(component); setTc(id?.startsWith('TC-') ? id : related[0]?.id ?? ''); setRequirement(id && !id.startsWith('TC-') ? id : ''); go('requirements') }
    const openBench = (id: string) => { setTc(id); go('bench') }
    useLayoutEffect(() => {
        const el = videoSlot.current
        if (!el) return

        const resize = () => {
            const r = el.getBoundingClientRect()

            for (const [name, value] of Object.entries({
                left: r.left,
                top: r.top,
                width: r.width,
                height: r.height
            })) {
                document.documentElement.style.setProperty(
                    '--case-video-' + name,
                    value + 'px'
                )
            }
        }

        resize()

        const observer = new ResizeObserver(resize)
        observer.observe(el)

        window.addEventListener('resize', resize)
        window.addEventListener('scroll', resize, true)

        return () => {
            observer.disconnect()
            window.removeEventListener('resize', resize)
            window.removeEventListener('scroll', resize, true)
        }
    }, [])
    useEffect(() => { if (!playing) return; const timer = window.setInterval(() => { const snapshot = controller.getSnapshot(); if (snapshot.selected >= snapshot.frames.length - 1) setPlaying(false); else controller.select(snapshot.selected + 1) }, 95); return () => window.clearInterval(timer) }, [playing, controller])
    const inputRows = [['AcceleratorPedalPosition', frame?.sw.input.acceleratorPedalPosition, '가속 페달 입력'], ['GearRequest', frame?.sw.input.gearRequest, '운전자가 요청한 기어'], ['Brake', frame?.brake, '브레이크 입력'], ['Steering', frame?.steering, '조향 입력']]
    const outputRows = [['VehicleSpeed', frame?.plant?.speed, '차량 속력 m/s'], ['LongitudinalVelocity', frame?.plant?.longitudinalVelocity, '종방향 속력 m/s'], ['LongitudinalAcceleration', frame?.plant?.longitudinalAcceleration, '종방향 가속도 m/s²']]
    const signals = (rows: unknown[][]) => <dl className="report-signals">{rows.map(([name, value, hint]) => <div key={String(name)}><dt><code title={String(hint)}>{String(name)}</code></dt><dd>{format(value)}</dd></div>)}</dl>
    const checklist = [['고장 보고서 확인', visited.has('incident')], ['차량 기능 구조 확인', visited.has('architecture')], ['주행 신호 비교', state.evidence.some(e => e.type === 'SIGNAL_BOUNDARY')], ['요구사항 · 시험 확인', visited.has('requirements')], ['재현 시험 실행', state.experiments.length > 0], ['원인 분석서 제출', !!state.diagnosis]] as const
    const title = tools.find(([id]) => id === tool)!
    return <section className="investigation-desk case-file-room">
        <div
            className="room-brand"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
            }}
        >
            <img
                src="/assets/investigation/cat-face.png"
                alt=""
                style={{
                    width: '90px',
                    height: '90px',
                    objectFit: 'contain',
                    flexShrink: 0,
                    marginTop: '7px'

                }}
            />

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                }}
            >
                <b
                    style={{
                        fontSize: '32px',
                        lineHeight: 1,
                    }}
                >
                    TRACKBACK
                </b>

                <small
                    className="brand-speech"
                    style={{
                        marginTop: '2px',
                    }}
                >
                    고장 원인을 알아내주세요!
                </small>
            </div>
        </div>
        <div className="desk-layout"><aside className="desk-rail"><figure className="stored-drive-card"><div ref={videoSlot} className="desk-video" /><figcaption><b>저장 주행 기록</b><small>{format(frame?.sw.executionTime)} s</small></figcaption></figure><div className="office-memento" aria-hidden="true"><img src="/assets/investigation/driver-front-polaroid.png" alt="" /><img src="/assets/investigation/village-polaroid.png" alt="" /></div><nav className="desk-nav" aria-label="조사 메뉴">{tools.map(([id, label, note]) => <button key={id} aria-current={tool === id ? 'page' : undefined} onClick={() => go(id)}><FileIcon kind={id} /><span><b>{label}</b><small>{note}</small></span></button>)}</nav><section className="investigation-helper"><div><FileIcon kind="report" /><b>조사 메모</b></div><p>차근차근 단서를 모아보세요!</p>{checklist.map(([label, checked]) => <label key={label}><input type="checkbox" checked={checked} readOnly /><span>{label}</span></label>)}</section></aside>
            <main className={`desk-content tool-${tool}`} ref={content}><div className="tool-heading"><FileIcon kind={tool} /><div><h2>{title[1]}</h2><small>{title[2]}</small></div><code className="file-number">{definition.id}</code></div>
                {tool === 'overview' && <Overview frame={frame} component={component} setComponent={setComponent} go={go} evidenceCount={state.evidence.length} experimentCount={state.experiments.length} />}
                {tool === 'incident' && <IncidentReport frame={frame} definition={definition} signals={signals} inputRows={inputRows} outputRows={outputRows} onArchitecture={() => { setComponent('PropulsionFunction'); go('architecture') }} onRecording={() => go('recording')} />}
                {tool === 'architecture' && <ArchitectureExplorer selected={component} onSelect={setComponent} onTrace={() => go('recording')} onRequirements={openRequirements} />}
                {tool === 'recording' && <SignalInvestigation component={component} setComponent={setComponent} frame={frame} observation={observation} inspected={inspected} onInspect={() => controller.inspect(component)} onRequirements={openRequirements} frames={state.frames} select={controller.select.bind(controller)} />}
                {tool === 'requirements' && <RequirementsExplorer component={component} tcId={tc} initialRequirement={requirement} onComponent={setComponent} onTc={setTc} onBench={openBench} />}
                {tool === 'bench' && <TestBench key={tc} initialTc={tc} />}
                {tool === 'report' && <RootCauseReportPanel />}
            </main></div>
        <footer className="desk-timeline"><button disabled={!frame} onClick={() => { if (state.selected >= state.frames.length - 1) controller.select(0); setPlaying(value => !value) }}>{playing ? '재생 정지' : '주행 기록 재생'}</button><label>시점<input aria-label="저장 주행 시간 커서" type="range" min="0" max={Math.max(0, state.frames.length - 1)} value={state.selected} disabled={!frame} onChange={event => { setPlaying(false); controller.select(Number(event.target.value)) }} /></label><output>{format(frame?.sw.executionTime)} s</output></footer>
    </section>
}

function Overview({ frame, component, setComponent, go, evidenceCount, experimentCount }: { frame: IncidentFrame | undefined; component: string; setComponent: (id: string) => void; go: (tool: Tool) => void; evidenceCount: number; experimentCount: number }) { return <section className="overview-workspace"><article className="overview-symptom"><small>현재 사건 · {frame?.sw.executionTime?.toFixed(3) ?? '—'} s</small><h3>고장 현상</h3><p>가속 페달 입력에 비해 차량의 가속 반응이 약합니다.</p><dl className="overview-values"><div><dt><code>AcceleratorPedalPosition</code></dt><dd>{format(frame?.sw.input.acceleratorPedalPosition)}</dd></div><div><dt><code>GearState</code></dt><dd>{format(frame?.sw.output.gearState)}</dd></div></dl></article><article className="overview-flow"><h3>이번 사건의 조사 경로</h3><div><button onClick={() => go('incident')}>운전자 요구</button><i>→</i>{['GearLogic', 'PropulsionFunction', 'VMC', 'eDrive'].map((id, index) => <span key={id}><button aria-pressed={component === id} onClick={() => { setComponent(id); go('architecture') }}>{architectureNode(id).label}</button>{index < 3 && <i>→</i>}</span>)}<i>→</i><button onClick={() => go('recording')}>차량 거동</button></div><small>강조된 기능은 현재 선택한 조사 범위입니다.</small></article><article className="overview-status"><h3>차량 거동</h3><dl><div><dt><code>VehicleSpeed</code></dt><dd>{format(frame?.plant?.speed)}</dd></div><div><dt><code>LongitudinalAcceleration</code></dt><dd>{format(frame?.plant?.longitudinalAcceleration)}</dd></div><div><dt>확보 근거</dt><dd>{evidenceCount}개</dd></div><div><dt>재현 시험</dt><dd>{experimentCount}건</dd></div></dl></article><article className="overview-next"><h3>다음 조사</h3><p>기대 출력과 이번 주행 출력을 비교해, 차이가 처음 나타나는 기능을 찾아보세요.</p><button className="primary navigation-action" onClick={() => go('recording')}>주행 신호 바로가기 →</button></article></section> }
function IncidentReport({ frame, definition, signals, inputRows, outputRows, onArchitecture, onRecording }: { frame: IncidentFrame | undefined; definition: CaseDefinition; signals: (rows: unknown[][]) => ReactNode; inputRows: unknown[][]; outputRows: unknown[][]; onArchitecture: () => void; onRecording: () => void }) { return <section className="incident-workspace"><article className="incident-facts"><h3>기본 정보</h3><dl><div><dt>사건 번호</dt><dd><code>{definition.id}</code></dd></div><div><dt>발생 시점</dt><dd>{format(frame?.sw.executionTime)} s</dd></div><div><dt>차량 상태</dt><dd><code>GearState</code> {frame?.sw.output.gearState ?? '—'}</dd></div></dl></article><article className="incident-symptom"><h3><FileIcon kind="warning" /> 고장 현상</h3><p>{definition.symptom}</p><blockquote>“페달을 밟아도 차가 잘 안 나가요…”</blockquote></article><article className="incident-photo-note"><DriverPortrait /><p>운전자 진술 · 현장 기록</p><small>“페달을 밟아도 차가 잘 안 나가요…”</small></article><article className="incident-flow"><h3>운전자 요구 → 차량 내부 SW → 차량 거동</h3><div className="report-route"><section><h4>입력</h4>{signals(inputRows)}</section><i>→</i><section className="software-sheet"><button onClick={onArchitecture}><FileIcon kind="architecture" /><b>차량 내부 SW</b><small>논리 기능 흐름 보기 →</small></button><div>{['GearLogic', 'PropulsionFunction', 'VMC', 'eDrive'].map(id => <code key={id}>{id}</code>)}</div></section><i>→</i><section><h4>출력</h4>{signals(outputRows)}</section></div></article><article className="incident-hint"><h3>조사 힌트</h3><p>먼저 주행 신호에서 각 기능의 정상 기대 출력과 이번 주행 출력을 비교해보세요.</p><button className="primary navigation-action" onClick={onRecording}>주행 신호 바로가기 →</button></article></section> }
function SignalInvestigation({ component, setComponent, frame, observation, inspected, onInspect, onRequirements, frames, select }: { component: string; setComponent: (id: string) => void; frame: IncidentFrame | undefined; observation: BoundaryObservation | null; inspected: boolean; onInspect: () => void; onRequirements: (id?: string) => void; frames: readonly IncidentFrame[]; select: (index: number) => void }) {
    const node = Math.max(0, componentIds.indexOf(component as typeof componentIds[number]))
    return <section className="signal-workspace signal-investigation-layout">
        <aside className="signal-selector-panel"><small>조사 경계</small><h3>기능별 출력 신호</h3>{componentIds.map(id => <button aria-pressed={id === component} key={id} onClick={() => setComponent(id)}><b>{architectureNode(id).label}</b><span>{architectureNode(id).role}</span></button>)}</aside>
        {frame && observation && <><section className="signal-analysis-panel"><header><div><small>선택 기능</small><h3>{architectureNode(component).label}</h3></div><span className={`signal-status ${observation.status.toLowerCase()}`}>{observation.status === 'MISMATCH' ? '불일치' : observation.status === 'MATCH' ? '정상' : '관찰'}</span></header><div className="signal-output-compare"><div><small>정상 기대 출력</small><pre>{format(observation.expected)}</pre></div><div><small>이번 주행 출력</small><pre>{format(observation.actual)}</pre></div></div><article className="signal-trend-card"><CaseSignalComparison node={node} frame={frame} frames={frames} onSelect={select} showSummary={false} /></article><div className="document-actions"><button className="primary navigation-action" onClick={onInspect}>{inspected ? '이 신호를 근거로 보관함' : '이 신호를 근거로 보관 →'}</button><button className="navigation-action" onClick={() => onRequirements()}>관련 요구사항 바로가기 →</button></div></section><aside className="signal-logic-panel"><small>신호 처리 흐름</small><h3>{architectureNode(component).label}</h3><div className="signal-processing"><section><h4>입력 신호</h4>{Object.entries(observation.inputs).map(([key, value]) => <p key={key}><code>{key}</code><b>{format(value)}</b></p>)}</section><i>↓</i><section><h4>기능 처리</h4><p>{architectureNode(component).role}</p></section><i>↓</i><section><h4>출력 신호</h4><pre>{format(observation.actual)}</pre></section></div><p className="signal-oracle-note">{observation.note}</p></aside></>}
    </section>
}
