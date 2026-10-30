import type {DomainId} from './domainTraining'

const CONVERSION:Record<DomainId,{before:string;change:string;after:string;path:string[];speech:string;why:string}>={
 power:{before:'연료 탱크 · 12V 시동계',change:'에너지원과 시동 조건 변경',after:'고전압 배터리 · BMS · 접촉기',path:['START + 브레이크','BMS 상태 확인','프리차지·접촉기','READY'],speech:'배터리 상태를 확인한 뒤 전력 경로를 연결하자!',why:'연료 연소 대신 고전압 전력을 사용하므로 배터리 감시와 안전한 접속 순서가 필요해요.'},
 drive:{before:'엔진 · 다단 변속기',change:'동력 발생과 전달 경로 변경',after:'인버터 · 전기모터 · 감속기',path:['가속페달 센서','VCU 토크 요청','인버터·모터','감속기→뒷바퀴'],speech:'페달 신호를 토크 명령으로 바꾸자!',why:'전기모터의 회전력은 인버터의 전류 제어와 감속기를 거쳐 구동륜에 전달돼요.'},
 brake:{before:'페달 · 마찰 제동',change:'감속 요청에 에너지 회수 추가',after:'회생 제동 + 캘리퍼·디스크',path:['브레이크 페달','제동력 요청','회생 가능량 확인','마찰력 배분'],speech:'감속하면서 전력도 회수하자!',why:'모터 회생만으로 항상 멈출 수는 없어 마찰 제동 장치를 함께 사용해요.'},
 steer:{before:'운전대 · 기계식 조향 경로',change:'기계 연결을 유지하며 전기 보조 추가',after:'운전대 · EPS 모터 · 랙',path:['운전자 조향','토크·각도 센서','EPS 보조 토크','랙→앞바퀴'],speech:'운전대 연결을 남기고 조향 힘을 보태자!',why:'기계 연결을 유지하면서 전기모터가 운전자의 조향 토크를 보조해요.'},
}

export function EvConversionLesson({domain}:{domain:DomainId}){
 const lesson=CONVERSION[domain]
 return <section className="d16-ev-conversion" aria-label="내연기관차에서 전기차로 바뀐 경로">
  <div className="d16-conversion-compare"><div><small>내연기관차 · ICE</small><b>{lesson.before}</b></div><span aria-hidden="true">→</span><div><small>전기차 · EV</small><b>{lesson.after}</b></div></div>
  <p className="d16-conversion-why"><b>왜 바꿀까?</b> {lesson.why}</p>
  <div className="d16-conversion-speech"><img src="/assets/investigation/cat-face.png" alt="흰둥이"/><p>{lesson.speech}</p></div>
  <ol className="d16-conversion-flow">{lesson.path.map((step,index)=><li key={step}><span>{index+1}</span><b>{step}</b></li>)}</ol>
 </section>
}
