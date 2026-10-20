import type { Snapshot } from '../engine/types.ts'
import { STATES } from '../content/ready.ts'
export function Dashboard({ snapshot, logicOnly = false }: { snapshot: Snapshot; logicOnly?: boolean }) {
  const ready = snapshot.outputs.ready === true, drive = snapshot.outputs.drive === true
  return <div className={`dashboard ${ready ? 'is-ready' : ''}`} aria-label="차량 계기판" aria-live="polite">
    <div className="dashboard-top"><span>VEHICLE STATUS</span><span className={snapshot.state !== 'OFF' ? 'powered-label' : ''}>◉ {snapshot.state !== 'OFF' ? 'POWER ON' : 'POWER OFF'}</span></div>
    <div className="state-readout"><span>{snapshot.state}</span><b>{STATES[snapshot.state as keyof typeof STATES] ?? snapshot.state}</b></div>
    <div className="dashboard-signals"><div className={ready ? 'signal-on' : ''}><i/>READY 표시<strong>{ready ? '켜짐' : '꺼짐'}</strong></div><div className={drive ? 'signal-on' : ''}><i/>구동 허용<strong>{drive ? '허용' : '차단'}</strong></div></div>
    {logicOnly && <div className={`request-readout ${snapshot.outputs.request ? 'request-on' : ''}`}>READY 진입 요청 <b>{snapshot.outputs.request ? '참' : '거짓'}</b><small>조건 계산만 수행 · 차량은 시동 대기 상태 유지</small></div>}
    <p>{ready ? '구동 준비가 완료됐어요. 실제 이동 중이라는 뜻은 아니에요.' : '조건과 상태를 연결하면 차량이 준비됩니다.'}</p>
  </div>
}
