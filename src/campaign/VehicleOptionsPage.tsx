import {useState} from 'react'
import type {LogicId} from './domainTraining'
import type {Designs} from './domainTraining'
import {TECHNOLOGY_GROUPS} from './vehicleArchitecture'
import {IntegratedArchitectureOverview} from './IntegratedArchitectureOverview'
import './vehicleOptions.css'

type View='choices'|'structure'
export function VehicleOptionsPage({onClose,initialView='choices',focusId='power',designs}:{onClose:()=>void;initialView?:View;focusId?:LogicId;designs?:Designs}){
 const [view,setView]=useState<View>(initialView)
 return <div className="vla-page" role="dialog" aria-modal="true" aria-label="EV 기술 선택 지도">
  <div className="vla-shell">
   <header className="vla-header"><div><small>흰둥's EV Car · 설계 지도</small><h1>내 차는 어떤 구성일까?</h1><p>분야별 구성을 살펴보세요. 색이 채워진 카드는 지금 만드는 차량의 구성입니다.</p></div><button onClick={onClose} aria-label="기술 지도 닫기">게임으로 돌아가기 ×</button></header>
   <nav className="vla-view-tabs" aria-label="기술 지도 화면"><button aria-pressed={view==='choices'} onClick={()=>setView('choices')}>차량 기술 선택지</button><button aria-pressed={view==='structure'} onClick={()=>setView('structure')}>기능 트리 · E/E 연결</button></nav>
   {view==='choices'?<>
    <section className="vla-current-summary" aria-label="현재 차량 구성"><div className="vla-car-mark" aria-hidden="true"><span>●</span><b>EV</b><span>●</span></div><div><small>현재 제작 중인 차량</small><h2>단일 모터 후륜구동 BEV</h2><p>기계 연결 EPS · 회생+마찰 제동 협조 · 기능별 분산 제어기</p></div><span className="vla-current-pill">현재 구성</span></section>
    <div className="vla-section-heading"><div><small>설계 선택 매트릭스</small><h2>분야별로 가능한 구성</h2></div><span>색이 채워진 카드 = 지금 차량</span></div>
    <section className="vla-option-grid" aria-label="분야별 EV 기술 구성">{TECHNOLOGY_GROUPS.map((group,index)=><article className="vla-option-column" key={group.id}><header><span>{String(index+1).padStart(2,'0')}</span><div><h3>{group.title}</h3><p>{group.why}</p></div></header><div className="vla-option-list">{group.choices.map(choice=><div className={'vla-option-card '+(choice.selected?'is-current':'')} key={choice.id}><small>{choice.selected?'✓ 현재 차량':'선택 가능한 구성'}</small><b>{choice.name}</b><span>{choice.summary}</span><p>{choice.implication}</p></div>)}</div></article>)}</section>
   </>:<IntegratedArchitectureOverview focusId={focusId} designs={designs}/>}
  </div>
 </div>
}
