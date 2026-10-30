import {useState} from 'react'
import type {LogicId} from './domainTraining'
import type {Designs} from './domainTraining'
import {TECHNOLOGY_GROUPS} from './vehicleArchitecture'
import {IntegratedArchitectureOverview} from './IntegratedArchitectureOverview'
import {VehicleFlowIllustration} from './VehicleFlowIllustration'
import './vehicleOptions.css'

type View='choices'|'structure'
export function VehicleOptionsPage({onClose,initialView='choices',focusId='power',focusLevel='function',designs}:{onClose:()=>void;initialView?:View;focusId?:LogicId;focusLevel?:'system'|'domain'|'function';designs?:Designs}){
 const [view,setView]=useState<View>(initialView)
 const [preview,setPreview]=useState({group:'drive',choice:'rwd'})
 const previewGroup=TECHNOLOGY_GROUPS.find(group=>group.id===preview.group)!,previewChoice=previewGroup.choices.find(choice=>choice.id===preview.choice)!
 return <div className="vla-page" role="dialog" aria-modal="true" aria-label="EV 기술 선택 지도">
  <div className="vla-shell">
   <header className="vla-header"><div><small>흰둥's EV Car · 설계 지도</small><h1>내 차는 어떤 구성일까?</h1><p>분야별 구성을 살펴보세요. 색이 채워진 카드는 지금 만드는 차량의 구성입니다.</p></div><button onClick={onClose} aria-label="기술 지도 닫기">게임으로 돌아가기 ×</button></header>
   <nav className="vla-view-tabs" aria-label="기술 지도 화면"><button aria-pressed={view==='choices'} onClick={()=>setView('choices')}>차량 기술 선택지</button><button aria-pressed={view==='structure'} onClick={()=>setView('structure')}>기능 트리 · E/E 연결</button></nav>
   {view==='choices'?<>
    <section className="vla-current-summary" aria-label="현재 차량 구성"><div className="vla-car-mark" aria-hidden="true"><span>●</span><b>EV</b><span>●</span></div><div><small>현재 제작 중인 차량</small><h2>단일 모터 후륜구동 BEV</h2><p>기계 연결 EPS · 회생+마찰 제동 협조 · 기능별 분산 제어기</p></div><span className="vla-current-pill">현재 구성</span></section>
    <nav className="vla-category-tabs" aria-label="분야별로 가능한 구성">{TECHNOLOGY_GROUPS.map(group=><button key={group.id} aria-pressed={preview.group===group.id} onClick={()=>setPreview({group:group.id,choice:group.choices.find(choice=>choice.selected)?.id??group.choices[0].id})}>{group.title}</button>)}</nav>
    <div className="vla-choice-workspace"><section className="vla-option-preview" aria-label="선택한 차량 구성의 기계 동작"><div><small>{previewGroup.title} · 구성 미리보기</small><h3>{previewChoice.name}</h3><p>{previewChoice.summary}</p><strong>{previewChoice.selected?'✓ 현재 제작 중인 구성':'다른 구성 미리보기'}</strong></div><VehicleFlowIllustration domain={preview.group==='ee'?'network':preview.group==='steer'?'steer':preview.group==='brake'?'brake':'drive'} choice={preview.choice}/></section><section className="vla-option-column" aria-label={`${previewGroup.title} 선택지`}><header><div><h3>{previewGroup.title} 선택지</h3><p>{previewGroup.why}</p></div></header><div className="vla-option-list">{previewGroup.choices.map(choice=><button type="button" aria-pressed={preview.choice===choice.id} className={'vla-option-card '+(choice.selected?'is-current':'')} key={choice.id} onClick={()=>setPreview({group:previewGroup.id,choice:choice.id})}><small>{choice.selected?'✓ 현재 차량':'선택 가능한 구성'}</small><b>{choice.name}</b><span>{choice.summary}</span><p>{choice.implication}</p></button>)}</div></section></div>
   </>:<IntegratedArchitectureOverview focusId={focusId} initialLevel={focusLevel} designs={designs}/>}
  </div>
 </div>
}
