import {useState} from 'react'
import type {DomainId} from './domainTraining'
import {MODEL_ALLOCATION} from './vehicleArchitecture'
import type {LogicId} from './domainTraining'

export type Perspective='system'|'physical'|'ee'|'sw'|'validation'
type Node={title:string;caption:string;icon:string}
const domainName:Record<DomainId,string>={power:'에너지·전원',drive:'구동',brake:'제동',steer:'조향'}
const paths:Record<DomainId,{physical:Node[];ee:Node[]}>= {
 power:{physical:[{title:'고전압 배터리',caption:'에너지 저장',icon:'▰'},{title:'접촉기',caption:'프리차지→주 접촉기',icon:'◉'},{title:'인버터',caption:'DC→3상 AC',icon:'▣'},{title:'모터',caption:'전기→회전',icon:'◉'}],ee:[{title:'START·브레이크',caption:'운전자 입력',icon:'◎'},{title:'BMS',caption:'PackSafe',icon:'▣'},{title:'VCU',caption:'StartPermit→PowerEnable',icon:'▣'},{title:'인버터 제어기',caption:'구동 허용',icon:'▣'}]},
 drive:{physical:[{title:'고전압 배터리',caption:'DC 전력',icon:'▰'},{title:'인버터·모터',caption:'축 토크',icon:'◉'},{title:'감속·차동기어',caption:'좌우 토크 분배',icon:'⚙'},{title:'뒤 바퀴',caption:'노면 추진력',icon:'◉'}],ee:[{title:'가속페달 센서',caption:'운전자 요구',icon:'◎'},{title:'VCU',caption:'토크 요청·인터록',icon:'▣'},{title:'인버터 제어기',caption:'전류·토크 제어',icon:'▣'},{title:'모터',caption:'축 토크',icon:'◉'}]},
 brake:{physical:[{title:'브레이크 페달',caption:'감속 요구',icon:'◎'},{title:'모터·인버터',caption:'회생 가능량',icon:'◉'},{title:'캘리퍼·디스크',caption:'마찰력',icon:'◉'},{title:'네 바퀴',caption:'감속',icon:'◉'}],ee:[{title:'브레이크 센서',caption:'페달 위치',icon:'◎'},{title:'제동 제어기',caption:'힘 요청·배분',icon:'▣'},{title:'VCU·인버터',caption:'회생 토크',icon:'▣'},{title:'캘리퍼',caption:'마찰 제동',icon:'◉'}]},
 steer:{physical:[{title:'운전대',caption:'운전자 힘',icon:'◎'},{title:'조향축·EPS',caption:'기계 연결+전기 보조',icon:'⚙'},{title:'랙·타이로드',caption:'좌우 이동',icon:'⚙'},{title:'앞 바퀴',caption:'진행 방향 변경',icon:'◉'}],ee:[{title:'토크·각 센서',caption:'운전자 조향',icon:'◎'},{title:'EPS 제어기',caption:'보조량 계산',icon:'▣'},{title:'EPS 모터',caption:'보조 토크',icon:'◉'},{title:'기계식 랙',caption:'앞바퀴로 전달',icon:'⚙'}]},
}
const fileDetails:Record<string,string>={
 'VehicleSystem.arxml':'시스템과 신호 인터페이스를 설명합니다.',
 'Composition.arxml':'차량 기능을 구성하는 SWC와 포트의 연결을 묶습니다.',
 'EcuExtract.arxml':'이 ECU에 배치할 SWC와 통신 정보를 추출합니다.',
 'SwcDescription.arxml':'SWC의 포트, 데이터 타입, Runnable과 이벤트를 기술합니다.',
 'Rte_Generated/':'배치와 설정에서 생성된 SWC 호출·통신 경계입니다.',
 'Bsw_Config/':'통신·진단·입출력 기반 소프트웨어 설정을 모읍니다.',
 'Application_Swc/':'직접 구현하는 Runnable 소스가 놓이는 예시 위치입니다.',
}
export function ArchitecturePerspective({domain,view,active,models,testCount}:{domain:DomainId;view:Perspective;active:number;models:LogicId[];testCount:number}){
 const [selectedFile,setSelectedFile]=useState('SwcDescription.arxml')
 const first=MODEL_ALLOCATION[models[0]],nodes:Node[]=view==='system'?[
  {title:'System',caption:'흰둥의 EV',icon:'◇'},
  {title:'Domain',caption:domainName[domain],icon:'▦'},
  {title:'Function',caption:domain==='power'?'전력 사용·준비':domain==='drive'?'모터 구동':domain==='brake'?'감속·제동':'앞바퀴 조향',icon:'⬡'},
  {title:'물리 반응',caption:domain==='power'?'전력 경로 준비':domain==='drive'?'후륜 추진':domain==='brake'?'차량 감속':'진행 방향 변경',icon:'◉'},
 ]:view==='physical'?paths[domain].physical:view==='ee'?paths[domain].ee:view==='sw'?[
  {title:'ECU',caption:first.ecu,icon:'▣'},
  {title:'Application SWC',caption:first.swc,icon:'▦'},
  {title:'Runnable',caption:first.runnable,icon:'⬡'},
  {title:'RTE → BSW',caption:'신호·하드웨어 서비스 경계',icon:'◇'},
 ]:[
  {title:'단위',caption:`입출력 사례 ${testCount}개`,icon:'✓'},
  {title:'통합',caption:'ECU 경계·액추에이터',icon:'⇄'},
  {title:'임베디드',caption:'주기·통신·고장',icon:'▣'},
  {title:'차량',caption:'가속·제동·조향 반응',icon:'◉'},
 ]
 const summary=view==='system'?'기능을 쪼개는 경로. ECU는 이 트리의 하위 항목이 아니에요.':view==='physical'?'에너지와 힘이 실제 부품을 통과하는 순서예요.':view==='ee'?'센서·제어기·액추에이터의 신호 소유자와 경계예요.':view==='sw'?'기능을 ECU에 할당한 다음 SWC와 Runnable로 실행해요. RTE·BSW는 ECU 내부의 별도 계층이에요.':'같은 기능도 판정 수준이 달라지면 관찰할 결함이 달라져요.'
 return <section className={'d16-perspective d16-perspective-'+view} aria-label={`${domainName[domain]} ${view} 관점 연결도`}>
  <header><b>{view==='system'?'기능 분해':view==='physical'?'에너지·기계 전달':view==='ee'?'E/E 신호 연결':view==='sw'?'기능 실행 배치':'검증 단계'}</b><span>{summary}</span></header>
  <div className="d16-perspective-track">{nodes.map((node,index)=><div className="d16-perspective-step" key={node.title}><div className={'d16-perspective-node '+(index===active%nodes.length?'active':'')}><span className="d16-perspective-icon" aria-hidden="true">{node.icon}</span><b>{node.title}</b><small>{node.caption}</small></div>{index<nodes.length-1&&<svg className="d16-perspective-wire" viewBox="0 0 58 24" aria-hidden="true"><path d="M2 12h47m-8-7 8 7-8 7"/></svg>}</div>)}</div>
  {view==='sw'&&<div className="d16-autosar-explorer"><div><small>ECU 프로젝트 탐색기 · VCU 배치 예시</small><div className="d16-autosar-files"><b>▾ EV_Vehicle/</b>{Object.keys(fileDetails).map(file=><button key={file} aria-pressed={selectedFile===file} onClick={()=>setSelectedFile(file)}>⌁ {file}</button>)}</div></div><p><b>{selectedFile}</b>{fileDetails[selectedFile]}<small>파일과 폴더 이름은 이 차량의 작업 예시이며 공급사·도구에 따라 달라집니다.</small></p></div>}
 </section>
}
