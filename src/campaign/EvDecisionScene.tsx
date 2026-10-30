import './evDecisionScene.css'

export function EvDecisionScene({reduced}:{reduced:boolean}){
 return <div className={'d16-ev-decision'+(reduced?' reduced':'')} aria-label="흰둥이가 내연기관차를 전기차로 개조하기로 결심하는 장면">
  <div className="d16-ev-decision-card old"><small>내연기관차</small><b>연료 탱크 → 엔진 → 바퀴</b></div>
  <div className="d16-ev-decision-cat"><img src="/assets/investigation/cat-face.png" alt="흰둥이"/><p>이번엔 EV로 개조하자!</p></div>
  <div className="d16-ev-decision-card new"><small>전기차</small><b>배터리 → 인버터·모터 → 바퀴</b></div>
  <span className="d16-ev-decision-spark" aria-hidden="true">✦</span>
 </div>
}
