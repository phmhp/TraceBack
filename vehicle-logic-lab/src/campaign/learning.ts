import {LESSONS} from './model.ts'
import type {Stage} from './model.ts'
import type {EGraph} from '../engineering/torqueModel.ts'
import type {TorqueRun} from '../engineering/torqueSpec.ts'

export const LEARNING=[
 {path:'EV / 구동 도메인 / VCU / 운전자 토크 요청',name:'요청 토크 계산',simple:'페달을 더 누르면 요청이 커지고, 차량이 낼 수 있는 범위 안으로 제한해요.',ears:'센서 입력이 유효한 동안, 구동 제어기는 가속 페달에 비례하는 요청 토크를 계산하고 차량의 가용 토크 범위 안으로 제한해야 한다.',pattern:'상태형 · While [조건], [시스템] shall [동작]',flow:'가속 페달 → Gain × K → 동적 토크 제한',output:'ceiling.torque',explain:'Gain은 페달 비율을 토크 요청으로 바꾸는 곱셈입니다. 제한 블록은 요청과 차량이 낼 수 있는 토크를 비교합니다. K와 상한은 제공된 차량 사양이며 이번 퍼즐의 정답 숫자가 아닙니다.'},
 {path:'EV / 구동 도메인 / VCU / 구동 허용·브레이크 우선',name:'구동 허용 조건',simple:'주행 준비·D·정상 센서·브레이크 OFF가 모두 충족되어야 구동해요.',ears:'READY이며 기어가 D이고 센서 입력이 유효하며 브레이크가 해제된 동안, 구동 제어기는 구동을 허용해야 한다. 구동 허용 조건 중 하나라도 충족되지 않으면, 구동 제어기는 구동 허용을 OFF로 출력해야 한다. 브레이크가 작동하면, 구동 제어기는 양의 구동 토크 명령을 0으로 차단해야 한다.',pattern:'상태형 While … shall … + 이벤트형 When … shall …',flow:'기어 비교 + 브레이크 비교 + READY + 센서 정상 → AND',output:'permission.allow',explain:'GearState는 P/R/N/D 중 하나인 입력입니다. == D 비교 결과와 브레이크 해제 비교 결과를 AND에 넣습니다. 센서 정상은 페달 센서의 품질이며 기어 선택과 별개입니다. 이것은 제동계 전체 제작이 아니라 구동 명령의 차단 조건입니다.'},
 {path:'EV / 구동 도메인 / VCU / 토크 명령 전달',name:'명령의 동특성과 출력',simple:'출발할 때는 힘을 부드럽게 올리고, 허용이 꺼지면 즉시 구동을 끊어요.',ears:'구동이 허용된 동안, 구동 제어기는 목표 토크를 정해진 변화율 안에서 명령으로 전달해야 한다. 구동 허용이 사라지면, 구동 제어기는 양의 구동 명령을 즉시 0으로 출력해야 한다.',pattern:'상태형 While … shall … + 이벤트형 When … shall …',flow:'목표 토크 → 변화율·즉시 차단 서브시스템 → Outport',output:'command.torque',explain:'변화율은 입력값이 아니라 토크가 변하는 속도를 제한합니다. 이 교육 모델의 동특성 블록에는 허용 OFF 시 즉시 0을 선택하고 내부 이력을 초기화하는 동작이 포함됩니다. 그 출력이 같은 차량의 인버터 명령으로 전달됩니다.'},
] as const

export function missingLessonWire(g:EGraph,lesson:number){return LESSONS[lesson].edges.find(([from,out,to,input])=>!g.edges.some(e=>e.from===from&&e.out===out&&e.to===to&&e.in===input))}
export function lessonSummary(run:TorqueRun,lesson:number){
 const last=run.samples.at(-1)!,sample=run.samples[run.firstFailure??run.samples.length-1],v=sample.actual.values[LEARNING[lesson].output]
 const scenario=run.id==='cap45'?'차량이 낼 수 있는 토크가 줄었을 때':run.id==='normal-50'?'가속 페달을 눌렀을 때':run.id==='full'?'가속 페달을 끝까지 눌렀을 때':run.id==='zero'?'가속 페달을 놓았을 때':run.id==='brake-edge'?'브레이크를 켰을 때':run.id==='not-ready'?'READY가 꺼졌을 때':run.id==='park'?'기어가 P일 때':run.id==='delta-fault'?'페달 센서가 서로 맞지 않을 때':run.id==='rise'?'출발 요청이 커질 때':run.id==='fall'?'페달을 놓아 요청이 줄 때':'구동을 다시 허용할 때'
 const output=typeof v==='boolean'?(v?'구동 허용 ON':'구동 허용 OFF'):Number.isFinite(v)?`${Number(v).toFixed(1)} Nm`:'미연결 · 출력 없음'
 return {scenario,output,pass:run.pass,detail:run.pass?'요구한 동작과 일치해요.':sample.actual.issues[0]?.message??'제공 차량 사양과 연결을 확인해요.',last}
}

export const PLAY_CHAPTERS:{name:string;stages:Stage[];activity:string}[]=[
 {name:'모모의 꿈과 첫 차',stages:['dream','purchase'],activity:'영화 → 중고차 인수'},
 {name:'시운전과 도로 위 사건',stages:['shakedown','fault'],activity:'브레이크·START·기어·가속 → 자동 사건'},
 {name:'한 기능씩 복구하기',stages:['inspect','repair','component','principle','puzzle','restore'],activity:'조립 → 개별 장치 관찰 → 관련 SW/실행 → 복구. 6기능 묶음에서 반복'},
 {name:'같은 차 통합 확인',stages:['bench'],activity:'안내된 세 시험 순서 실행 → 독립 전체 기준'},
 {name:'항구 컵',stages:['grid','race','finish'],activity:'가상 출전자와 주행 → 시상식. 완주 도움 선택 가능'},
 {name:'모모의 차고',stages:['garage'],activity:'상금·차량 수집·완성한 설계도'},
]

