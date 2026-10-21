/** TRAINING-DRIVE-1: fictional EV specification. Not OEM calibration or AUTOSAR BSW. */
export type Unit='%'|'ms'|'Nm'|'flag'
export type Signal=number|boolean
export type Kind='source'|'sensor'|'gain'|'limit'|'permit'|'rate'|'sink'
export type EPort={id:string;label:string;unit:Unit}
export type ENode={id:string;kind:Kind;label:string;parameters:Record<string,number>}
export type EWire={id:string;from:string;out:string;to:string;in:string}
export type EGraph={nodes:ENode[];edges:EWire[]}
export type TorqueInput={pedalA:number;pedalB:number;ageMs:number;brakePct:number;ready:boolean;gear:'P'|'R'|'N'|'D';capNm:number}
export type TorqueFrame={values:Record<string,Signal>;torqueNm:number;issues:{message:string;nodes:string[]}[];permitted:boolean;targetNm:number}
const port=(id:string,label:string,unit:Unit):EPort=>({id,label,unit})
export const E_BLOCKS:Record<Kind,{name:string;inputs:EPort[];outputs:EPort[];parameters:{key:string;label:string;unit:string;min:number;max:number;step:number}[]}>={
 source:{name:'입력·운전 조건',inputs:[],outputs:[port('a','페달 A','%'),port('b','페달 B','%'),port('age','신호 나이','ms'),port('ready','READY','flag'),port('forward','D 기어','flag'),port('brake','브레이크','%'),port('cap','가용 상한','Nm')],parameters:[]},
 sensor:{name:'신호 품질 검사',inputs:[port('a','채널 A','%'),port('b','채널 B','%'),port('age','신호 나이','ms')],outputs:[port('pedal','유효 페달','%'),port('valid','품질 정상','flag')],parameters:[{key:'delta',label:'채널 허용차',unit:'%p',min:0,max:50,step:1},{key:'maxAge',label:'유효 시간',unit:'ms',min:0,max:1000,step:10}]},
 gain:{name:'요청 토크 변환',inputs:[port('pedal','페달','%')],outputs:[port('torque','요청 토크','Nm')],parameters:[{key:'gain',label:'변환 이득',unit:'Nm/%',min:0,max:10,step:.1}]},
 limit:{name:'가용 토크 제한',inputs:[port('request','요청','Nm'),port('cap','가용 상한','Nm')],outputs:[port('torque','제한 토크','Nm')],parameters:[]},
 permit:{name:'구동 허용 판단',inputs:[port('valid','품질 정상','flag'),port('ready','READY','flag'),port('forward','D 기어','flag'),port('brake','브레이크','%')],outputs:[port('allow','구동 허용','flag')],parameters:[{key:'brakeAt',label:'제동 우선 경계',unit:'%',min:0,max:100,step:1}]},
 rate:{name:'토크 동특성',inputs:[port('target','목표 토크','Nm'),port('allow','구동 허용','flag'),port('cap','가용 상한','Nm')],outputs:[port('torque','최종 명령','Nm')],parameters:[{key:'rise',label:'증가 제한',unit:'Nm/s',min:0,max:1000,step:10},{key:'fall',label:'감소 제한',unit:'Nm/s',min:0,max:1000,step:10}]},
 sink:{name:'구동 명령 경계',inputs:[port('torque','토크 명령','Nm')],outputs:[],parameters:[]},
}
const edge=(from:string,out:string,to:string,input:string):EWire=>({id:`${from}.${out}-${to}.${input}`,from,out,to,in:input})
export function referenceTorqueGraph():EGraph {return{nodes:[
 {id:'input',kind:'source',label:'운전자·차량 입력',parameters:{}},{id:'quality',kind:'sensor',label:'이중 채널·Freshness',parameters:{delta:10,maxAge:100}},
 {id:'request',kind:'gain',label:'페달 → 요청 토크',parameters:{gain:1.8}},{id:'ceiling',kind:'limit',label:'요청 vs 가용 상한',parameters:{}},
 {id:'permission',kind:'permit',label:'조건과 제동 우선',parameters:{brakeAt:5}},{id:'dynamics',kind:'rate',label:'변화율·즉시 차단',parameters:{rise:60,fall:120}},
 {id:'command',kind:'sink',label:'명령 토크',parameters:{}},
],edges:[edge('input','a','quality','a'),edge('input','b','quality','b'),edge('input','age','quality','age'),edge('quality','pedal','request','pedal'),edge('request','torque','ceiling','request'),edge('input','cap','ceiling','cap'),edge('quality','valid','permission','valid'),edge('input','ready','permission','ready'),edge('input','forward','permission','forward'),edge('input','brake','permission','brake'),edge('ceiling','torque','dynamics','target'),edge('permission','allow','dynamics','allow'),edge('input','cap','dynamics','cap'),edge('dynamics','torque','command','torque')]}}
export function starterTorqueGraph():EGraph {const g=referenceTorqueGraph();g.edges=g.edges.slice(0,4);return g}
export const NORMAL_TORQUE_INPUT:TorqueInput={pedalA:50,pedalB:50,ageMs:20,brakePct:0,ready:true,gear:'D',capNm:180}
export function validateTorqueGraph(g:EGraph) {
 const issues:{message:string;nodes:string[]}[]=[]
 if(!g||!Array.isArray(g.nodes)||!Array.isArray(g.edges)||g.nodes.length>40||g.edges.length>120)return[{message:'설계 데이터 형식 또는 크기를 확인하세요.',nodes:[]}]
 const ids=new Set<string>()
 if(g.nodes.some(n=>!n||typeof n.id!=='string'||!n.id||typeof n.kind!=='string'||typeof n.label!=='string')||g.edges.some(e=>!e||['id','from','to','out','in'].some(k=>typeof e[k as keyof EWire]!=='string')))return[{message:'블록·연결 데이터 형식이 올바르지 않아요.',nodes:[]}]
 for(const n of g.nodes){if(ids.has(n.id)||!Object.hasOwn(E_BLOCKS,n.kind)){issues.push({message:'중복 블록 또는 알 수 없는 종류예요.',nodes:[n.id]});continue}ids.add(n.id);for(const p of E_BLOCKS[n.kind].parameters)if(!Number.isFinite(n.parameters?.[p.key])||n.parameters[p.key]<p.min||n.parameters[p.key]>p.max)issues.push({message:`${n.label}: ${p.label} 범위를 확인하세요.`,nodes:[n.id]})}
 if(issues.length)return issues
 if(new Set(g.edges.map(e=>e.id)).size!==g.edges.length)issues.push({message:'연결 식별자가 중복돼요.',nodes:[]})
 if(g.nodes.filter(n=>n.kind==='source').length!==1||g.nodes.filter(n=>n.kind==='sink').length!==1)issues.push({message:'입력과 명령 경계는 각각 하나여야 해요.',nodes:[]})
 for(const e of g.edges){const a=g.nodes.find(n=>n.id===e.from),b=g.nodes.find(n=>n.id===e.to),out=a&&E_BLOCKS[a.kind]?.outputs.find(p=>p.id===e.out),input=b&&E_BLOCKS[b.kind]?.inputs.find(p=>p.id===e.in);if(!out||!input||out.unit!==input.unit)issues.push({message:'포트 방향·자료형·단위가 맞지 않는 연결이에요.',nodes:[e.from,e.to]})}
 for(const n of g.nodes)for(const p of E_BLOCKS[n.kind]?.inputs??[]){const count=g.edges.filter(e=>e.to===n.id&&e.in===p.id).length;if(count!==1)issues.push({message:`${n.label} · ${p.label}: ${count?'중복 연결':'미연결'} (${p.unit})`,nodes:[n.id]})}
 const done=new Set<string>(),visiting=new Set<string>();const walk=(id:string)=>{if(visiting.has(id)){issues.push({message:'같은 틱의 순환 연결은 허용하지 않아요.',nodes:[id]});return}if(done.has(id))return;visiting.add(id);for(const e of g.edges.filter(e=>e.to===id))walk(e.from);visiting.delete(id);done.add(id)};g.nodes.forEach(n=>walk(n.id));return issues
}
export function connectTorque(g:EGraph,e:EWire):EGraph {
 const a=g.nodes.find(n=>n.id===e.from),b=g.nodes.find(n=>n.id===e.to),out=a&&E_BLOCKS[a.kind]?.outputs.find(p=>p.id===e.out),input=b&&E_BLOCKS[b.kind]?.inputs.find(p=>p.id===e.in)
 if(!out||!input||e.from===e.to||out.unit!==input.unit)throw new Error('같은 단위의 출력 → 입력으로 연결하세요.')
 const candidate={...g,edges:[...g.edges.filter(w=>!(w.to===e.to&&w.in===e.in)),e]}
 const fatal=validateTorqueGraph(candidate).find(i=>!i.message.includes('미연결'));if(fatal)throw new Error(fatal.message);return candidate
}
export class TorqueModel {
 private previous=new Map<string,number>()
 reset(){this.previous.clear()}
 step(g:EGraph,input:TorqueInput,dt=.02):TorqueFrame {
  const issues=validateTorqueGraph(g),values:Record<string,Signal>={}
  if(!Number.isFinite(dt)||dt<=0||dt>.1)issues.push({message:'실행 간격은 0초 초과 0.1초 이하여야 합니다.',nodes:[]})
  if(!Number.isFinite(input.capNm)||input.capNm<0||input.capNm>180)issues.push({message:'가용 토크 상한은 0~180 Nm로 정의된 시험 전제예요.',nodes:[]})
  if(issues.length){this.reset();return{values,torqueNm:0,issues,permitted:false,targetNm:0}}
  const done=new Set<string>()
  const run=(id:string)=>{if(done.has(id))return;const n=g.nodes.find(n=>n.id===id)!,args:Record<string,Signal>={};for(const e of g.edges.filter(e=>e.to===id)){run(e.from);args[e.in]=values[`${e.from}.${e.out}`]}const put=(p:string,v:Signal)=>{values[`${id}.${p}`]=v}
   switch(n.kind){
    case 'source':put('a',input.pedalA);put('b',input.pedalB);put('age',input.ageMs);put('ready',input.ready);put('forward',input.gear==='D');put('brake',input.brakePct);put('cap',input.capNm);break
    case 'sensor':{const a=Number(args.a),b=Number(args.b),age=Number(args.age);const valid=Number.isFinite(a)&&Number.isFinite(b)&&Number.isFinite(age)&&a>=0&&a<=100&&b>=0&&b<=100&&age>=0&&age<=n.parameters.maxAge&&Math.abs(a-b)<=n.parameters.delta;put('valid',valid);put('pedal',valid?a:0);break}
    case 'gain':put('torque',Number(args.pedal)*n.parameters.gain);break
    case 'limit':put('torque',Math.max(0,Math.min(Number(args.request),Number(args.cap))));break
    case 'permit':put('allow',args.valid===true&&args.ready===true&&args.forward===true&&Number.isFinite(Number(args.brake))&&Number(args.brake)>=0&&Number(args.brake)<n.parameters.brakeAt);break
    case 'rate':{const before=this.previous.get(id)??0,target=Number(args.target),cap=Number(args.cap),difference=target-before,rate=difference>=0?n.parameters.rise:n.parameters.fall;const next=args.allow===true?Math.max(0,Math.min(cap,before+Math.sign(difference)*Math.min(Math.abs(difference),rate*dt))):0;this.previous.set(id,next);put('torque',next);break}
    case 'sink':put('torque',Number(args.torque));break
   }done.add(id)}
  g.nodes.forEach(n=>run(n.id));const sink=g.nodes.find(n=>n.kind==='sink')!,permission=g.nodes.find(n=>n.kind==='permit'),limit=g.nodes.find(n=>n.kind==='limit');const command=Number(values[`${sink.id}.torque`]);if(!Number.isFinite(command)){this.reset();issues.push({message:'명령 계산 결과가 유한한 수치가 아니에요. 구동을 차단합니다.',nodes:[sink.id]})}return{values,torqueNm:issues.length?0:command,issues,permitted:!issues.length&&!!permission&&values[`${permission.id}.allow`]===true,targetNm:limit&&Number.isFinite(Number(values[`${limit.id}.torque`]))?Number(values[`${limit.id}.torque`]):0}
 }
}
export function torqueFingerprint(g:EGraph){const text=JSON.stringify({spec:'TRAINING-DRIVE-1.0',nodes:[...g.nodes].sort((a,b)=>a.id.localeCompare(b.id)),edges:[...g.edges].map(({from,out,to,in:input})=>({from,out,to,in:input})).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))});let h=2166136261;for(const c of text){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0).toString(16)}
