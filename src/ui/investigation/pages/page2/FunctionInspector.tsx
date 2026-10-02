import { useMemo } from 'react'
import type { IncidentFrame } from '../../../../runtime/case/PropulsionCase'
import { compareSignalAtFrame } from '../../../../runtime/investigation/SignalComparison'
import { architectureNode, getIncomingInterfaces, getInputSignals, getOutgoingInterfaces, getOutputSignals } from '../../../../registries/investigation/Architecture'
import { getRequirementsForComponent } from '../../../../registries/investigation/Trace'
import type { InvestigationPresentationModel } from '../../presentation/InvestigationPresentationModel'

interface Props {
  model: InvestigationPresentationModel
  selectedComponent: string
  selectedSignal: string
  currentFrame: IncidentFrame | undefined
  previousFrame: IncidentFrame | undefined
  onSelectSignal: (id: string) => void
  onCompareSignal: (id: string) => void
  onSaveAsEvidence: (id: string) => void
  onOpenSignalTimeline: (id: string) => void
  onOpenInterface: (id: string) => void
  onOpenRequirement: (id: string) => void
  onSetHypothesisTarget: (id: string) => void
}

const statusLabel = (status: 'OBSERVED' | 'MATCH' | 'MISMATCH' | undefined) =>
  status === 'MATCH' ? '기준 만족' : status === 'MISMATCH' ? '차이 발견' : '판단 기준 없음'

export function FunctionInspector({
  model, selectedComponent, selectedSignal, currentFrame, previousFrame,
  onSelectSignal, onCompareSignal, onSaveAsEvidence, onOpenSignalTimeline,
  onOpenInterface, onOpenRequirement, onSetHypothesisTarget,
}: Props) {
  const node = selectedComponent ? architectureNode(selectedComponent) : undefined
  const inputs = useMemo(() => node ? getInputSignals(node.id) : [], [node])
  const states = inputs.filter(signal => signal.semanticRole === 'STATE_OR_PRECONDITION')
  const valueInputs = inputs.filter(signal => signal.semanticRole !== 'STATE_OR_PRECONDITION')
  const outputs = useMemo(() => node ? getOutputSignals(node.id) : [], [node])
  const requirements = useMemo(() => node ? getRequirementsForComponent(node.id) : [], [node])
  const interfaces = useMemo(() => node ? [...getIncomingInterfaces(node.id), ...getOutgoingInterfaces(node.id)] : [], [node])
  const mismatchDiscovered = node ? model.getNodeStatus(node.id) === 'DIFFERENCE_FOUND' : false

  if (!node) return <section className="context-inspector-empty">
    <p className="investigation-section-label">현재 조사</p>
    <h3>지도에서 기능을 선택하세요.</h3>
    <p>차량 반응에 가까운 기능부터 거슬러 올라가며 상태 → 입력 → 출력 순서로 확인합니다.</p>
  </section>

  const group = (kind: 'STATE' | 'INPUT' | 'OUTPUT', title: string, signals: typeof inputs) => <section className={`function-reading-group ${kind.toLowerCase()}`}>
    <header><span>{kind}</span><h4>{title}</h4></header>
    <div>{signals.length ? signals.map(signal => {
      const comparison = currentFrame ? compareSignalAtFrame(signal.id, node.id, currentFrame, previousFrame) : undefined
      const selected = selectedSignal === signal.id
      return <article className={`function-reading ${comparison?.status?.toLowerCase() ?? ''} ${selected ? 'selected' : ''}`} key={signal.id}>
        <button type="button" className="function-reading-main" onClick={() => onSelectSignal(signal.id)}>
          <span><b>{signal.description ?? signal.label}</b><code className="investigation-tech-id">{signal.id}</code></span>
          <strong>{comparison?.actual ?? '—'}</strong>
          <em>{statusLabel(comparison?.status)}</em>
        </button>
        <div className="function-reading-basis">
          <span>{comparison?.criterionKind === 'NONE' ? 'Actual 관찰만 가능' : `${comparison?.criterionLabel} · ${comparison?.criterionValue}`}</span>
          <button type="button" onClick={() => onCompareSignal(signal.id)}>판단 확인</button>
          <button type="button" onClick={() => onSaveAsEvidence(signal.id)}>근거 기록</button>
        </div>
      </article>
    }) : <p className="inspector-empty-copy">등록된 신호가 없습니다.</p>}</div>
  </section>

  return <section className="function-context-inspector" aria-labelledby="function-inspector-title">
    <header className="context-inspector-heading">
      <div><p className="investigation-section-label">현재 조사 · FUNCTION</p><h3 id="function-inspector-title">{node.label}</h3><code className="investigation-tech-id">{node.id}</code></div>
      <span className={`node-investigation-status ${model.getNodeStatus(node.id).toLowerCase()}`}>{mismatchDiscovered ? '차이 발견' : '조사 중'}</span>
    </header>
    <section className="function-responsibility-card" aria-label="선택 기능 책임과 관계"><div><span>DOMAIN</span><strong>{node.area}</strong></div><p>{node.role}</p><dl><div><dt>Upstream</dt><dd>{getIncomingInterfaces(node.id).map(edge=>architectureNode(edge.sourceId)?.label??edge.sourceId).join(' · ')||'등록된 상위 기능 없음'}</dd></div><div><dt>Downstream</dt><dd>{getOutgoingInterfaces(node.id).map(edge=>architectureNode(edge.targetId)?.label??edge.targetId).join(' · ')||'등록된 하위 기능 없음'}</dd></div></dl></section>
    <p className="context-inspector-question">이 기능의 상태와 입력은 정상이고, 출력부터 달라지나요?</p>
    <div className="comparison-basis-ladder" aria-label="신호 판단 기준의 네 계층"><span><b>A · STATIC RANGE</b> 물리/등록 범위</span><span><b>B · ALLOWED SET</b> 허용 상태</span><span><b>C · CONTEXTUAL EXPECTED</b> 현재 조건의 기대값</span><span><b>D · CURRENT ACTUAL</b> 사건 기록값</span></div>
    <div className="function-reading-sequence">
      {group('STATE', '전제조건 / 상태', states)}
      {group('INPUT', '기능 입력', valueInputs)}
      {group('OUTPUT', '기능 출력', outputs)}
    </div>
    {mismatchDiscovered && <p className="function-interpretation">입력과 출력 비교에서 의미 있는 차이가 확인됐습니다. 기준을 확인한 뒤 이 위치를 가설로 검토할 수 있습니다.</p>}
    <aside className="fault-localization-guide"><b>판단 가지</b><span>상태/입력 차이 → 상류 기능을 확인</span><span>입력 정상·출력 차이 → 이 기능의 로직/계산 가설</span><span>Source/Destination 차이 → 전달 경계 가설</span><span>Expected 없음 → 관찰로 저장하고 요구사항 또는 검증 기준 확인</span></aside>
    <div className="context-inspector-actions">
      <button type="button" disabled={!selectedSignal&&!outputs[0]&&!inputs[0]} onClick={() => {const signalId=selectedSignal||outputs[0]?.id||inputs[0]?.id;if(signalId)onOpenSignalTimeline(signalId)}}>시간 흐름 보기</button>
      {requirements[0] && <button type="button" onClick={() => onOpenRequirement(requirements[0]!.id)}>왜 이 값이어야 하나요? · 기준 확인</button>}
      {interfaces.length > 0 && <button type="button" onClick={() => onOpenInterface(interfaces[0]!.id)}>연결 경계 확인</button>}
      {mismatchDiscovered && <button type="button" className="primary" onClick={() => onSetHypothesisTarget(node.id)}>가설로 검토 →</button>}
    </div>
  </section>
}
