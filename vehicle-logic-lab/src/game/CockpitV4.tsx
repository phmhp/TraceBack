import type { Snapshot } from '../engine/types.ts'
import { STATES } from '../content/ready.ts'
import { DriveExperience } from './DriveExperience'
import { driveGate } from './interaction'
export function Cockpit({ snapshot, brake, system, onBrake, onSystem, onPower, onStopped, paused=false, volume=.25 }: {snapshot:Snapshot;brake:boolean;system:boolean;onBrake?:()=>void;onSystem?:()=>void;onPower?:()=>void;onStopped?:(value:boolean)=>void;paused?:boolean;volume?:number}) {
  const ready=snapshot.outputs.ready===true, request=snapshot.outputs.request===true
  return <div className="cockpit cockpit-live">
    <DriveExperience enabled={driveGate(snapshot)} paused={paused} volume={volume} onPower={onPower} onBrakeValue={value=>{if(value!==brake)onBrake?.()}} onTelemetry={value=>onStopped?.(value.speedKmh<.5)}/>
    <div className={`learner-cluster ${ready||request?'lit':''}`}><small>내 로직의 실제 상태</small><strong>{snapshot.state}</strong><span>{STATES[snapshot.state as keyof typeof STATES]}</span><b>{ready?'● READY':request?'● 진입 요청만 참':'○ READY 꺼짐'}</b><p>{request&&!ready?'1장: 조건만 계산해요. 구동은 아직 차단돼요.':ready?'D에서 ↑를 누르면 실제로 움직여요.':'브레이크 조건과 START를 확인해요.'}</p></div>
    <div className="learner-controls"><button aria-pressed={brake} onClick={onBrake}>로직의 브레이크 입력 {brake?'1':'0'}</button><button aria-pressed={system} onClick={onSystem}>시스템 준비 {system?'1':'0'}</button><button className="big-button" onClick={onPower}>⏻ START</button></div>
  </div>
}
