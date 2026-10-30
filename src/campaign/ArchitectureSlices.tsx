import {useState} from 'react'
import './architectureSlices.css'

const slices=[
 {key:'function',name:'기능 분해',path:'System → Domain → Function',detail:'차량의 일을 나눕니다. 전력 준비, 구동, 제동, 조향이 기능으로 이어집니다.',marks:['차량 시스템','도메인','기능']},
 {key:'physical',name:'물리 장치',path:'배터리 → 모터 → 차축 → 바퀴',detail:'전력과 힘이 실제 부품을 통과하는 위치를 보여줍니다.',marks:['배터리','모터','바퀴']},
 {key:'ee',name:'E/E 연결',path:'센서 → ECU → 통신·배선 → 액추에이터',detail:'어느 제어기가 어떤 센서와 장치에 연결되는지 확인합니다.',marks:['센서','ECU','액추에이터']},
 {key:'sw',name:'SW 실행',path:'Application SWC → Runnable → 출력',detail:'제어기 안에서 입력이 계산되어 출력 신호가 되는 경로입니다.',marks:['SWC','Runnable','출력']},
 {key:'test',name:'검증',path:'요구사항 → 시험 입력 → 기대·실제',detail:'기능, 제어기 경계, 차량 반응을 각각 확인합니다.',marks:['요구','시험','반응']},
] as const
export function ArchitectureSlices(){
 const [selected,setSelected]=useState(0)
 return <section className="vla-slices" aria-label="차량의 다섯 아키텍처 관점 단면">
  <header><small>차량 관점 단면</small><h3>같은 차를 다섯 방향에서 보기</h3></header>
  <div className="vla-slice-stack">{slices.map((slice,index)=><button key={slice.key} aria-pressed={selected===index} className={`vla-slice layer-${index}`} onClick={()=>setSelected(index)}><b>{slice.name}</b><span>{slice.marks.map(mark=><i key={mark}>{mark}</i>)}</span></button>)}</div>
  <div className="vla-slice-readout" role="status"><b>{slices[selected].path}</b><p>{slices[selected].detail}</p></div>
 </section>
}
