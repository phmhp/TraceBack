import type { IncidentFrame } from '../../runtime/case/PropulsionCase'
import { expectedTorque } from '../../runtime/case/CaseExperiment'
import { componentRoles, componentNames } from './CaseGuide'

export function expectedBoundary(frame: IncidentFrame, node: number): number | null {
  const { input, output, calibration } = frame.sw
  if (node === 3 || node === 4) {
    const r = node === 3 ? output.propulsionRequest : output.driveTorqueRequest
    const magnitude = 'magnitude' in r ? r.magnitude : r.magnitudeNm
    return expectedTorque(node === 3 ? 'VMC' : 'eDrive', magnitude, input.vehicleSpeed, r.direction, r.validity, calibration)
  }
  if (node === 2) {
    if (input.acceleratorPedalValidity !== 'VALID' || output.gearStateValidity !== 'VALID' || !input.vehicleReady || !input.propulsionEnable || ['P','N'].includes(output.gearState)) return 0
    return Number.isFinite(input.acceleratorPedalPosition) ? Math.min(1,Math.max(0,input.acceleratorPedalPosition)) : 0
  }
  return null
}
const format = (v: number | string | null) => v === null ? '기준 없음' : typeof v === 'number' ? v.toFixed(3) : v
const signalNames = ['AcceleratorPedalPosition','GearState','PropulsionRequest','DriveTorqueRequest','EDriveCommand','VehicleSpeed']
const actual = (f: IncidentFrame, n: number): number => n===0?f.sw.input.acceleratorPedalPosition:n===1?['P','R','N','D'].indexOf(f.sw.output.gearState):n===2?f.sw.output.propulsionRequest.magnitude:n===3?f.sw.output.driveTorqueRequest.magnitudeNm:n===4?f.sw.output.eDriveCommand.magnitudeNm:f.plant?.speed??0
export function CaseSignalComparison({ frame, node, frames, onSelect }: { frame: IncidentFrame; node: number; frames: readonly IncidentFrame[]; onSelect: (index:number)=>void }) {
  const expected=expectedBoundary(frame,node), unit=node===3||node===4?'Nm':node===5?'m/s':node===1?'P=0 · R=1 · N=2 · D=3':'ratio'
  const series=frames.map(f=>actual(f,node)), normal=frames.map(f=>expectedBoundary(f,node))
  const maximum=Math.max(1,...series,...normal.map(v=>v??0))
  const x=(i:number)=>12+i/Math.max(1,frames.length-1)*776
  const points=(a:readonly (number|null)[])=>a.map((v,i)=>x(i)+','+(108-(v??0)/maximum*75)).join(' ')
  const selected=frames.findIndex(f=>f.id===frame.id)
  const mismatch=frames.findIndex((_,i)=>normal[i]!==null&&Math.abs(series[i]!-normal[i]!)>1e-6)
  return <>
    <article className="case-paper case-feature"><h3><code>{componentNames[node]}</code></h3><p>{componentRoles[node]}</p><strong>관찰 신호 <code>{signalNames[node]}</code></strong></article>
    <div className="case-signals"><article><b>정상 기대 출력</b><strong>{format(expected)}</strong><small>{unit}</small></article><article><b>이번 주행 출력</b><strong>{node===1?frame.sw.output.gearState:format(actual(frame,node))}</strong><small>{unit}</small></article></div>
    {expected===null&&<p className="case-caption">여기서는 입력이나 차량 반응을 살펴보세요. PropulsionFunction·VMC·eDrive를 선택하면 제어 출력이 정상 기대와 일치하는지 비교할 수 있습니다.</p>}
    <article className="case-paper case-trend"><div className="case-chart-legend"><b>시간에 따른 동일 신호 비교</b><span className="normal-line">┄ 정상 기대 · 같은 입력 기준</span><span className="actual-line">━ 이번 주행</span></div>
      <svg viewBox="0 0 800 130" role="img" aria-label="정상 기대와 이번 주행의 동일 출력 비교 그래프">
        <text x="12" y="25" fill="#536c62">{maximum.toFixed(2)} {unit}</text><path d="M12 32v76h776" fill="none" stroke="#aebeb8"/>
        {expected!==null&&<polyline points={points(normal)} fill="none" stroke="#25856d" strokeWidth="3" strokeDasharray="6 3"/>}
        <polyline points={points(series)} fill="none" stroke="#bd683d" strokeWidth="2"/>
        {mismatch>=0&&<g><path d={'M'+x(mismatch)+' 30v78'} stroke="#a84664" strokeDasharray="3 3"/><text x={x(mismatch)} y="25" textAnchor="middle" fill="#a84664">▽</text></g>}
        <path d={'M'+x(selected)+' 32v76'} stroke="#253e53"/><text x={x(selected)} y="13" textAnchor="middle" fill="#253e53">▼</text>
        <text x="12" y="125">{frames[0]!.sw.executionTime.toFixed(2)} s</text><text x="788" y="125" textAnchor="end">{frames.at(-1)!.sw.executionTime.toFixed(2)} s</text>
      </svg>
      <div className="case-actions"><b>▼ 선택 시점 {frame.sw.executionTime.toFixed(2)} s</b>{mismatch>=0?<button onClick={()=>onSelect(mismatch)}>▽ 첫 불일치 {frames[mismatch]!.sw.executionTime.toFixed(2)} s</button>:<span>{expected===null?'자동 판정 대상 아님':'이 신호에서 불일치 없음'}</span>}</div>
    </article>
  </>
}
