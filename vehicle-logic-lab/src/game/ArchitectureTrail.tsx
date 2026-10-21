import {useState} from 'react'
import type {Snapshot} from '../engine/types'
import type {RaceTelemetry} from '../../simulation/src/runtime/SimulationRuntime'
export function MechanismGlyph({kind}:{kind:string}){return <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">{kind==='key'?<><circle cx="23" cy="23" r="12"/><path d="m31 32 19 19m-7-7 7-7m-14 0 7-7"/></>:kind==='gear'?<><circle cx="32" cy="32" r="19"/><circle cx="32" cy="32" r="7"/>{[0,1,2,3,4,5].map(i=><path key={i} d="M32 7v7" transform={`rotate(${i*60} 32 32)`}/>)}</>:kind==='motor'?<><path d="M11 19h38v30H11zM5 27h6m38 5h11M22 13v6m14-6v6"/><path d="m32 23-8 12h13l-7 10"/></>:kind==='brake'?<><circle cx="31" cy="33" r="19"/><circle cx="31" cy="33" r="6"/><path d="M45 13h10v27H45M13 15l-6-5"/></>:kind==='wheel'?<><circle cx="32" cy="32" r="23"/><circle cx="32" cy="32" r="7"/><path d="M9 32h16m14 0h16M32 39v16"/></>:kind==='battery'?<><rect x="8" y="20" width="45" height="29" rx="5"/><path d="M54 29h5v10h-5M18 28v13m-6-7h12m14 0h10"/></>:kind==='and'?<><path d="M13 12h18a20 20 0 0 1 0 40H13Z"/><path d="M4 23h9M4 41h9m39-9h9"/></>:kind==='state'?<><circle cx="32" cy="32" r="22"/><circle cx="32" cy="32" r="16"/><path d="m23 32 7 7 13-15"/></>:<><path d="M11 13h23l17 18-17 20H11z"/><path d="M23 23v17m-6-9h13"/></>}</svg>}
export function ArchitectureTrail({snapshot,inputs,onFocus,telemetry,compact=false,area='ready'}:{snapshot:Snapshot;inputs:Record<string,boolean>;onFocus?:(index:number)=>void;telemetry?:RaceTelemetry;compact?:boolean;area?:string}){
 const [selected,setSelected]=useState(0)
 const sw=telemetry?.vehicleSw?.output
 if(area!=='ready'&&!sw)return <div className="architecture-trail"><p className="trail-explanation">▶ 정상 동작 실행을 누르면 입력 → 계산 → 명령 → 차량 반응을 실제 실행값으로 따라가요.</p></div>
 const ready=!snapshot.issues.length&&snapshot.outputs.drive===true
 let steps=sw?[
  {name:'입력',kind:'key',value:`${Math.round(telemetry!.accelerator*100)}%`,detail:'DriverInputRuntime 0~1 입력. 실제 페달 센서 전압을 측정한 값은 아니에요.',on:telemetry!.accelerator>0},
  {name:'적용 기어',kind:'gear',value:sw.gearState,detail:`요청 ${telemetry!.vehicleSw!.input.gearRequest} → 적용 ${sw.gearState}. 요청 ${sw.transitionAccepted?'수락':'보류'}.`,on:sw.transitionAccepted},
  {name:'구동 요구',kind:'and',value:sw.propulsionRequest.magnitude.toFixed(2),detail:`정규화 요구 × 방향 ${sw.propulsionRequest.direction} × 유효성 ${sw.propulsionRequest.validity}.`,on:sw.propulsionRequest.magnitude>0},
  {name:'토크 변환',kind:'motor',value:`${sw.driveTorqueRequest.magnitudeNm.toFixed(0)} Nm`,detail:'VMC가 현재 속도와 게임용 보정 맵으로 변환한 요구 토크예요.',on:sw.driveTorqueRequest.magnitudeNm>0},
  {name:'제한 후 명령',kind:'state',value:`${sw.eDriveCommand.magnitudeNm.toFixed(0)} Nm`,detail:'eDrive 명령이지 실제 모터 토크 측정값은 아니에요. 추가 학습 상한이 있으면 적용값은 더 작을 수 있어요.',on:sw.eDriveCommand.magnitudeNm>0},
  {name:'차량 반응',kind:'wheel',value:`${telemetry!.speedKmh.toFixed(1)} km/h`,detail:'Rapier 속력 피드백. 명령이 0이어도 관성으로 움직일 수 있어요.',on:telemetry!.speedKmh>.1},
 ]:[
  {name:'페달·버튼',kind:'key',value:inputs.brake?'제동 1':'제동 0',detail:'페달 움직임 → BrakePressed 조건. START는 새로 누르는 순간의 이벤트예요.',on:inputs.brake},
  {name:'조건 계산',kind:'and',value:snapshot.outputs.request?'요청 1':'요청 0',detail:'버튼 AND 브레이크 AND 시스템 준비 → 진입 요청. 요청만으로 차량이 움직이지 않아요.',on:snapshot.outputs.request},
  {name:'상태 기억',kind:'state',value:snapshot.state,detail:'같은 READY 기능의 상태 계층. OFF → 새 누름 → STANDBY → 조건과 새 누름 → READY.',on:snapshot.state==='READY'},
  {name:'구동 허용',kind:'motor',value:ready?'허용':'차단',detail:'READY에서 drive가 참이어야 구동 제어기가 가속 요청을 받아요. 실제 가속은 다음 기능이에요.',on:ready},
 ]
 if(telemetry&&area==='braking')steps=[
  {name:'제동 입력',kind:'brake',value:`${Math.round(telemetry.brake*100)}%`,detail:'운전자 제동 요구입니다. 실제 유압 센서값이 아니에요.',on:telemetry.brake>0},
  {name:'제동력 명령',kind:'and',value:telemetry.physicsCommand?`${telemetry.physicsCommand.brakeForceN.toFixed(0)} N`:'계산 전',detail:'기존 BrakeExecutionModel에서 물리 경계로 적용한 마찰 제동력 명령입니다. 유압·ABS·회생 배분은 범위 밖이에요.',on:(telemetry.physicsCommand?.brakeForceN??0)>0},
  {name:'종방향 응답',kind:'motor',value:`${telemetry.longitudinalAcceleration.toFixed(2)} m/s²`,detail:'가속도는 실제 물리 상태 변화에서 계산해요. 노면/관성/입력의 영향을 함께 받습니다.',on:Math.abs(telemetry.longitudinalAcceleration)>.01},
  {name:'속력',kind:'wheel',value:`${telemetry.speedKmh.toFixed(1)} km/h`,detail:'브레이크 명령과 차량 반응을 구분해서 관찰해요.',on:telemetry.speedKmh>.1},
 ]
 if(telemetry&&area==='steering')steps=[
  {name:'핸들 입력',kind:'wheel',value:telemetry.steering.toFixed(2),detail:'-1~1 정규화 요구입니다. 바퀴 각도와 단위가 다릅니다.',on:Math.abs(telemetry.steering)>.01},
  {name:'바퀴 각도',kind:'and',value:telemetry.physicsCommand?`${(telemetry.physicsCommand.frontWheelAngleRad*180/Math.PI).toFixed(1)}°`:'계산 전',detail:'기존 조향 모델의 rad 명령을 °로 바꿔 표시해요. 속도가 커지면 같은 입력의 각도가 작아집니다.',on:Math.abs(telemetry.physicsCommand?.frontWheelAngleRad??0)>.01},
  {name:'속도 피드백',kind:'state',value:`${telemetry.speedKmh.toFixed(1)} km/h`,detail:'현재 물리 속도가 조향 모델에 다시 입력돼요. 양산 EPS 맵을 의미하지 않습니다.',on:telemetry.speedKmh>.1},
 ]
 const current=steps[Math.min(selected,steps.length-1)]
 return <div className={`architecture-trail ${compact?'trail-compact':''}`}><div className="trail-stations">{steps.map((s,i)=><div className="trail-station-wrap" key={s.name}><button className={`${s.on?'station-live':''} ${selected===i?'station-selected':''}`} aria-pressed={selected===i} onClick={()=>{setSelected(i);onFocus?.(i===0?0:i===steps.length-1?2:1)}}><MechanismGlyph kind={s.kind}/><b>{s.name}</b><output>{s.value}</output></button>{i<steps.length-1&&<span className={s.on?'signal-travel':''}>➜</span>}</div>)}</div>{!compact&&<p className="trail-explanation"><b>{current.name}</b>{current.detail}</p>}</div>
}
