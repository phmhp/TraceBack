import type {DomainId} from './domainTraining'

const CONVERSION:Record<DomainId,{before:string;change:string;after:string;path:string[];speech:string}>={
 power:{before:'연료 탱크 · 12V 시동계',change:'에너지원과 시동 조건 변경',after:'고전압 배터리 · BMS · 접촉기',path:['START + 브레이크','BMS 상태 확인','프리차지·접촉기','READY'],speech:'이제 연료를 태우지 않아. 배터리를 연결하기 전에 상태를 확인하고, READY가 되면 구동을 허용해!'},
 drive:{before:'엔진 · 다단 변속기',change:'동력 발생과 전달 경로 변경',after:'인버터 · 전기모터 · 감속기',path:['가속페달 센서','VCU 토크 요청','인버터·모터','감속기→뒷바퀴'],speech:'페달이 모터를 직접 돌리지는 않아. VCU가 요청을 계산하고 인버터가 모터를 움직여!'},
 brake:{before:'페달 · 마찰 제동',change:'감속 요청에 에너지 회수 추가',after:'회생 제동 + 캘리퍼·디스크',path:['브레이크 페달','제동력 요청','회생 가능량 확인','마찰력 배분'],speech:'디스크 브레이크는 남아 있어. 모터로 에너지를 되돌릴 수 있을 때는 회생과 마찰을 함께 조절해!'},
 steer:{before:'운전대 · 기계식 조향 경로',change:'기계 연결을 유지하며 전기 보조 추가',after:'운전대 · EPS 모터 · 랙',path:['운전자 조향','토크·각도 센서','EPS 보조 토크','랙→앞바퀴'],speech:'운전대와 앞바퀴는 계속 연결돼 있어. EPS 모터가 조향 힘을 보태는 거야!'},
}

export function EvConversionLesson({domain}:{domain:DomainId}){
 const lesson=CONVERSION[domain]
 return <section className="d16-ev-conversion" aria-label="내연기관차에서 전기차로 바뀐 경로">
  <div className="d16-conversion-compare"><div><small>내연기관차 · ICE</small><b>{lesson.before}</b></div><span aria-hidden="true">→</span><div><small>{lesson.change}</small><b>{lesson.after}</b></div></div>
  <div className="d16-conversion-speech"><span aria-hidden="true">🐱</span><p>{lesson.speech}</p></div>
  <ol className="d16-conversion-flow">{lesson.path.map((step,index)=><li key={step}><span>{index+1}</span><b>{step}</b></li>)}</ol>
 </section>
}
