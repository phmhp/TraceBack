import {READY_REGIONS} from '../content/vehicleJourney'
export function JourneyContext({mission,lesson,onMap}:{mission:number;lesson:number;onMap:()=>void}){
 const regions=READY_REGIONS[mission],index=Math.min(lesson,regions.length-1)
 return <div className="journey-context"><button onClick={onMap}>◈ 차량 지도</button><div><small>차량 전체 → 차량 상태 → READY → {mission===0?'진입 조건':mission===1?'상태와 출력':'정상·변형 시나리오'}</small><b>같은 READY 기능 안을 보고 있어요.</b></div><nav aria-label="현재 기능 안의 위치">{regions.map((r,i)=><span key={r.name} aria-current={i===index?'step':undefined}><i>{i+1}</i>{r.name}</span>)}</nav></div>
}
