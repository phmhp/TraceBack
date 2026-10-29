import type {SceneControls} from '../workshop/WorkshopScene'
export const OFF_CONTROLS:SceneControls={ready:false,accelerator:0,brake:0,steering:0,gear:'P'}
/** Mouse brake is a foot-hold accessibility aid, not an altered START interlock. */
export function startControls(c:SceneControls,moving:boolean):SceneControls{
 if(moving)return c
 if(c.ready)return{...c,ready:false,accelerator:0}
 return c.gear==='P'&&c.brake>.5?{...c,ready:true}:c
}
export function stopReason(c:SceneControls,hardware:boolean,phase:string,torque:number){
 if(!hardware)return'부품·ECU·배선이 아직 준비되지 않았어요.'
 if(!c.ready)return'시동 OFF · 브레이크 ON → START 순서로 눌러요.'
 if(c.gear!=='D')return`${c.gear} 기어 · D를 선택하세요.`
 if(c.brake>0)return'브레이크 ON · 스위치를 OFF로 바꾸면 출발할 수 있어요.'
 if(phase==='grid')return'출발 준비 완료 · 오른쪽 대회 출발을 눌러요.'
 if(c.accelerator===0)return'가속 대기 · ↑ 또는 가속 페달을 누르고 있어요.'
 if(torque===0)return'구동 명령 0 · 미연결 로직이나 허용 조건을 확인해요.'
 return'구동 명령 전달 중 · 바퀴와 속도를 살펴봐요.'
}
