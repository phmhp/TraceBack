import {NORMAL_TORQUE_INPUT,TorqueModel} from './torqueModel.ts'
import type {EGraph,TorqueInput,TorqueFrame} from './torqueModel.ts'
export const TORQUE_SPEC={id:'TRAINING-DRIVE-1.0',status:'EDUCATIONAL_FICTIONAL',periodSeconds:.02,toleranceNm:1e-6,requirements:[
 {id:'DRV-01',title:'신호 품질',text:'두 페달 채널은 0~100%, 차이는 10%p 이하, 신호 나이는 0~100ms. 하나라도 위반하면 같은 틱에 명령 0 Nm.'},
 {id:'DRV-02',title:'정상 요청',text:'READY + D + 품질 정상 + 브레이크 5% 미만에서 요청 = 페달 A × 1.8 Nm/%. 50%의 정상 목표는 90 Nm.'},
 {id:'DRV-03',title:'토크 상한',text:'목표는 요청과 가용 상한 중 작은 값. 상한은 시험 전제상 0~180 Nm. 상한이 낮아지면 현재 명령도 즉시 그 이하.'},
 {id:'DRV-04',title:'제동·조건 차단',text:'브레이크 5% 이상, READY 꺼짐 또는 D 이외 기어에서는 같은 틱에 0 Nm. 허용 조건 복구 시 0부터 다시 증가.'},
 {id:'DRV-05',title:'동특성',text:'정상 조건에서 증가 60 Nm/s, 감소 120 Nm/s. 20ms마다 최대 +1.2/-2.4 Nm. 차단과 상한 감소는 이 변화율보다 우선.'},
]}
export type TorqueScenario={id:string;name:string;technique:string;requirements:string[];steps:{input:TorqueInput;ticks:number}[]}
const i=(patch:Partial<TorqueInput>={})=>({...NORMAL_TORQUE_INPUT,...patch})
const steady={input:i(),ticks:100}
export const TORQUE_SCENARIOS:TorqueScenario[]=[
 {id:'normal-50',name:'정상 · 페달 50% → 90 Nm',technique:'정상 시나리오',requirements:['DRV-02','DRV-05'],steps:[steady]},
 {id:'full',name:'정상 · 페달 100% → 180 Nm',technique:'상한 경계',requirements:['DRV-02','DRV-03'],steps:[{input:i({pedalA:100,pedalB:100}),ticks:180}]},
 {id:'zero',name:'정상 · 페달 0%',technique:'하한 경계',requirements:['DRV-02'],steps:[{input:i({pedalA:0,pedalB:0}),ticks:5}]},
 {id:'cap45',name:'상한 45 Nm로 제한',technique:'경계값',requirements:['DRV-03'],steps:[{input:i({capNm:45}),ticks:70}]},
 {id:'cap-drop',name:'주행 명령 중 상한 90 → 20',technique:'동적 제약',requirements:['DRV-03'],steps:[steady,{input:i({capNm:20}),ticks:3}]},
 {id:'brake-edge',name:'제동 경계 · 4.99% → 5%',technique:'경계값',requirements:['DRV-04'],steps:[{input:i({brakePct:4.99}),ticks:90},{input:i({brakePct:5}),ticks:2}]},
 {id:'not-ready',name:'READY가 꺼진 상태',technique:'동등 분할',requirements:['DRV-04'],steps:[{input:i({ready:false}),ticks:5}]},
 {id:'reverse',name:'R 기어 · 전진 기능 차단',technique:'동등 분할',requirements:['DRV-04'],steps:[{input:i({gear:'R'}),ticks:5}]},
 {id:'neutral',name:'N 기어 · 전진 기능 차단',technique:'동등 분할',requirements:['DRV-04'],steps:[{input:i({gear:'N'}),ticks:5}]},
 {id:'park',name:'P 기어 · 전진 기능 차단',technique:'동등 분할',requirements:['DRV-04'],steps:[{input:i({gear:'P'}),ticks:5}]},
 {id:'delta-edge',name:'채널 차이 경계 · 10%p',technique:'경계값',requirements:['DRV-01'],steps:[{input:i({pedalB:60}),ticks:90}]},
 {id:'delta-fault',name:'채널 불일치 · 10.01%p',technique:'고장 주입',requirements:['DRV-01'],steps:[steady,{input:i({pedalB:60.01}),ticks:2}]},
 {id:'fresh-edge',name:'Freshness 경계 · 100ms',technique:'경계값',requirements:['DRV-01'],steps:[{input:i({ageMs:100}),ticks:90}]},
 {id:'stale',name:'신호 갱신 지연 · 101ms',technique:'고장 주입',requirements:['DRV-01'],steps:[steady,{input:i({ageMs:101}),ticks:2}]},
 {id:'range-high',name:'범위 위반 · 페달 100.01%',technique:'경계값',requirements:['DRV-01'],steps:[{input:i({pedalA:100.01,pedalB:100.01}),ticks:5}]},
 {id:'range-low',name:'범위 위반 · 페달 -0.01%',technique:'경계값',requirements:['DRV-01'],steps:[{input:i({pedalA:-.01,pedalB:-.01}),ticks:5}]},
 {id:'rise',name:'증가율 · 최초 20ms의 명령',technique:'시간 기반',requirements:['DRV-05'],steps:[{input:i(),ticks:1}]},
 {id:'fall',name:'감소율 · 정상 90 → 목표 0',technique:'시간 기반',requirements:['DRV-05'],steps:[steady,{input:i({pedalA:0,pedalB:0}),ticks:1}]},
 {id:'recover',name:'지연 주입 → 복구 → 0부터 재증가',technique:'고장·복구·회귀',requirements:['DRV-01','DRV-04','DRV-05'],steps:[steady,{input:i({ageMs:120}),ticks:3},{input:i(),ticks:5}]},
]
/** Independent oracle: fixed training specification, never reads learner configuration/graph. */
export function expectedTorque(input:TorqueInput,previous:number):number {
 const channels=[input.pedalA,input.pedalB]
 if(channels.some(v=>!Number.isFinite(v)||v<0||v>100)||Math.abs(channels[0]-channels[1])>10||!Number.isFinite(input.ageMs)||input.ageMs<0||input.ageMs>100)return 0
 if(!input.ready||input.gear!=='D'||!Number.isFinite(input.brakePct)||input.brakePct<0||input.brakePct>=5)return 0
 const ceiling=input.capNm,desired=Math.min(input.pedalA/100*180,ceiling)
 const next=desired>previous?Math.min(desired,previous+1.2):Math.max(desired,previous-2.4)
 return Math.min(ceiling,Math.max(0,next))
}
export type TorqueSample={tick:number;time:number;input:TorqueInput;expected:number;actual:TorqueFrame;pass:boolean}
export type TorqueRun={id:string;name:string;requirements:string[];technique:string;pass:boolean;samples:TorqueSample[];firstFailure?:number}
export function runTorqueScenario(graph:EGraph,scenario:TorqueScenario):TorqueRun {
 const model=new TorqueModel(),samples:TorqueSample[]=[];let expected=0,tick=0
 for(const step of scenario.steps)for(let k=0;k<step.ticks;k++){const input={...step.input};expected=expectedTorque(input,expected);const actual=model.step(graph,input,TORQUE_SPEC.periodSeconds);samples.push({tick,time:(tick+1)*TORQUE_SPEC.periodSeconds,input,expected,actual,pass:!actual.issues.length&&Math.abs(actual.torqueNm-expected)<=TORQUE_SPEC.toleranceNm});tick++}
 const first=samples.findIndex(s=>!s.pass)
 return{id:scenario.id,name:scenario.name,requirements:[...scenario.requirements],technique:scenario.technique,pass:first<0,samples,firstFailure:first<0?undefined:first}
}
export function verifyTorque(graph:EGraph){return TORQUE_SCENARIOS.map(s=>runTorqueScenario(graph,s))}
