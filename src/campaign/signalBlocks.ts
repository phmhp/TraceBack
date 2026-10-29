/** Deterministic, discrete-time block laboratory. One call is one simulation tick. */
export type Signal = number | boolean | string | Signal[] | {[key:string]:Signal} | null
export type BlockKind = 'from'|'goto'|'sum'|'display'|'enable'|'trigger'|'lookupND'|'busCreator'|'busSelector'|'product'|'minMax'|'relational'|'saturation'|'lookup1D'|'constant'|'convert'|'sqrt'|'scope'|'logical'|'delay'|'unitDelay'|'memory'|'lookup2D'|'gain'|'demux'|'mux'|'subsystem'|'directLookup'|'inport'|'outport'|'dataRead'|'dataMemory'|'dataWrite'|'chart'|'ground'|'terminator'|'abs'|'switch'|'multiportSwitch'
export type BlockConfig = {tag?:string; name?:string; visibility?:'local'|'global'; value?:Signal; gain?:number; signs?:string; operation?:string; lower?:number; upper?:number; delay?:number; initial?:Signal; breakpoints?:number[][]; table?:Signal; indexBase?:0|1; outputKeys?:string[]; inputKeys?:string[]; dataType?:'boolean'|'double'|'int32'|'string'; transitions?:Record<string,{when:number;to:string}>; initialState?:string; program?:BlockProgram}
export type Block = {id:string;kind:BlockKind;inputs:string[];config?:BlockConfig}
export type BlockProgram = {blocks:Block[]; outputs:string[]}
export type BlockState = {previous?:Signal; buffer?:Signal[]; scope?:Signal[]; chartState?:string; triggerPrevious?:boolean}
export type Runtime = {memory:Record<string,BlockState>; stores:Record<string,Signal>; tags:Record<string,Signal>; tick:number}
export const newRuntime = ():Runtime=>({memory:{},stores:{},tags:{},tick:0})
export const BLOCK_GROUPS:readonly {name:string;blocks:readonly BlockKind[]}[] = [
 {name:'신호 입출력',blocks:['inport','outport','constant','display','scope','ground','terminator','goto','from']},
 {name:'연산과 판단',blocks:['sum','product','minMax','relational','saturation','gain','sqrt','abs','logical','convert','switch','multiportSwitch']},
 {name:'버스와 경로',blocks:['busCreator','busSelector','mux','demux','subsystem']},
 {name:'시간과 조건',blocks:['delay','unitDelay','memory','enable','trigger','chart']},
 {name:'값과 표',blocks:['lookup1D','lookup2D','lookupND','directLookup','dataMemory','dataRead','dataWrite']},
]
export const BLOCK_LABELS:Record<BlockKind,string>={from:'From',goto:'Goto',sum:'Sum',display:'Display',enable:'Enable',trigger:'Trigger',lookupND:'n-D Lookup Table',busCreator:'Bus Creator',busSelector:'Bus Selector',product:'Product',minMax:'MinMax',relational:'Relational Operator',saturation:'Saturation',lookup1D:'1-D Lookup Table',constant:'Constant',convert:'Data Type Conversion',sqrt:'Sqrt',scope:'Scope',logical:'Logical Operator',delay:'Delay',unitDelay:'Unit Delay',memory:'Memory',lookup2D:'2-D Lookup Table',gain:'Gain',demux:'Demux',mux:'Mux',subsystem:'Subsystem',directLookup:'Direct Lookup Table',inport:'In1',outport:'Out1',dataRead:'Data Store Read',dataMemory:'Data Store Memory',dataWrite:'Data Store Write',chart:'Chart',ground:'Ground',terminator:'Terminator',abs:'Abs',switch:'Switch',multiportSwitch:'Multiport Switch'}
export const isStateBlock=(kind:BlockKind)=>kind==='delay'||kind==='unitDelay'||kind==='memory'
export function readStateBlock(kind:BlockKind,config:BlockConfig,runtime:Runtime,id:string):Signal{
 const state=runtime.memory[id]??(runtime.memory[id]={})
 if(kind==='delay'){const steps=Math.max(1,Math.trunc(config.delay??1));return (state.buffer??[]).length>=steps?state.buffer![0]:config.initial??0}
 return state.previous??config.initial??0
}
export function commitStateBlock(kind:BlockKind,value:Signal,config:BlockConfig,runtime:Runtime,id:string){
 const state=runtime.memory[id]??(runtime.memory[id]={})
 if(kind==='delay'){const steps=Math.max(1,Math.trunc(config.delay??1)),buffer=state.buffer??(state.buffer=[]);buffer.push(value);while(buffer.length>steps)buffer.shift()}
 else state.previous=value
}
const num=(v:Signal|undefined):number=>typeof v==='number'&&Number.isFinite(v)?v:Number(v??0)||0
const truth=(v:Signal|undefined):boolean=>v===true||typeof v==='number'&&v!==0
const list=(v:Signal|undefined):Signal[]=>Array.isArray(v)?v:[v??0]
const pick=(v:Signal,indices:number[]):Signal=>indices.reduce<Signal>((a,i)=>Array.isArray(a)?a[Math.max(0,Math.min(a.length-1,i))]??0:0,v)
const lerp=(a:Signal,b:Signal,t:number):Signal=>num(a)+(num(b)-num(a))*t
function lookup(table:Signal,breakpoints:number[][],positions:number[],depth=0):Signal{
 if(depth===breakpoints.length)return table
 const axis=breakpoints[depth],values=list(table),x=positions[depth]
 if(axis.length<2||values.length!==axis.length)throw new Error('Lookup 축과 표 크기가 맞지 않습니다.')
 let i=0;while(i<axis.length-2&&x>axis[i+1])i++
 const ratio=Math.max(0,Math.min(1,(x-axis[i])/(axis[i+1]-axis[i]||1)))
 return lerp(lookup(values[i],breakpoints,positions,depth+1),lookup(values[i+1],breakpoints,positions,depth+1),ratio)
}
export function executeBlock(kind:BlockKind,input:Signal[],config:BlockConfig={},runtime:Runtime=newRuntime(),id:string=kind):Signal{
 const a=input[0]??0,b=input[1]??0,mem=runtime.memory[id]??(runtime.memory[id]={}),tag=config.tag??config.name??id,scope=id.slice(0,id.lastIndexOf('/')+1),tagKey=config.visibility==='global'?tag:scope+tag,storeKey=config.visibility==='local'?scope+tag:tag
 switch(kind){
 case 'inport':case 'outport':case 'display':case 'terminator':return a
 case 'constant':return config.value??0
 case 'ground':return 0
 case 'goto':runtime.tags[tagKey]=a;return a
 case 'from':return runtime.tags[tagKey]??0
 case 'sum':{const signs=config.signs??'++';return input.reduce<number>((s,v,i)=>s+(signs[i]==='-'?-1:1)*num(v),0)}
 case 'product':return input.reduce<number>((p,v)=>p*num(v),1)
 case 'minMax':return (config.operation==='max'?Math.max:Math.min)(...input.map(num))
 case 'relational':{const x=num(a),y=num(b);switch(config.operation){case'<':return x<y;case'<=':return x<=y;case'>':return x>y;case'>=':return x>=y;case'!=':return a!==b;default:return a===b}}
 case 'saturation':return Math.min(config.upper??1,Math.max(config.lower??0,num(a)))
 case 'gain':return num(a)*(config.gain??1)
 case 'sqrt':return Math.sqrt(num(a))
 case 'abs':return Math.abs(num(a))
 case 'logical':switch(config.operation){case'OR':return input.some(truth);case'NOT':return !truth(a);case'XOR':return input.filter(truth).length%2===1;default:return input.every(truth)}
 case 'convert':switch(config.dataType){case'boolean':return truth(a);case'int32':return Math.max(-2147483648,Math.min(2147483647,Math.trunc(num(a))));case'string':return String(a);default:return num(a)}
 case 'switch':return truth(b)?a:input[2]??0
 case 'multiportSwitch':return input[Math.max(1,Math.min(input.length-1,Math.trunc(num(a))+(config.indexBase===0?1:0)))]??0
 case 'busCreator':return Object.fromEntries(input.map((v,i)=>[config.inputKeys?.[i]??`signal${i+1}`,v]))
 case 'busSelector':return (config.outputKeys??[]).map(key=>a&&typeof a==='object'&&!Array.isArray(a)?a[key]??0:0)
 case 'mux':return input.flatMap(list)
 case 'demux':return list(a)
 case 'subsystem':return config.program?executeProgram(config.program,Object.fromEntries(input.map((v,i)=>[`u${i+1}`,v])),runtime,id+'/',false):a
 case 'delay':case 'unitDelay':case 'memory':{const old=readStateBlock(kind,config,runtime,id);commitStateBlock(kind,a,config,runtime,id);return old}
 case 'enable':if(truth(b))mem.previous=a;return mem.previous??config.initial??0
 case 'trigger':{const rising=truth(b)&&!mem.triggerPrevious;mem.triggerPrevious=truth(b);if(rising)mem.previous=a;return mem.previous??config.initial??0}
 case 'scope':(mem.scope??(mem.scope=[])).push(a);return a
 case 'lookup1D':case 'lookup2D':case 'lookupND':return lookup(config.table??[],config.breakpoints??[],input.map(num))
 case 'directLookup':return pick(config.table??[],input.map(v=>Math.trunc(num(v))-(config.indexBase??0)))
 case 'dataMemory':runtime.stores[storeKey]=runtime.stores[storeKey]??config.initial??0;return runtime.stores[storeKey]
 case 'dataWrite':runtime.stores[storeKey]=a;return a
 case 'dataRead':return runtime.stores[storeKey]??config.initial??0
 case 'chart':{let state=mem.chartState??config.initialState??'idle';const transition=config.transitions?.[state];if(transition&&num(a)>=transition.when)state=transition.to;mem.chartState=state;return state}
 }
}
/** Evaluate a directed graph in block order, detecting combinational cycles. */
export function executeProgram(program:BlockProgram,external:Record<string,Signal>={},runtime:Runtime=newRuntime(),scope='',advanceTick=true):Signal{
 const values:Record<string,Signal>={},visiting=new Set<string>(),byId=new Map(program.blocks.map(block=>[block.id,block])),delayed:Block[]=[]
 const visit=(id:string):Signal=>{
  if(id in values)return values[id]
  if(id in external)return external[id]
  if(visiting.has(id))throw new Error(`지연 없는 순환: ${id}`)
  const block=byId.get(id);if(!block)throw new Error(`연결되지 않은 신호: ${id}`)
  if(isStateBlock(block.kind)){const value=readStateBlock(block.kind,block.config??{},runtime,scope+id);values[id]=value;delayed.push(block);return value}
  visiting.add(id)
  const args=block.inputs.map(visit)
  const value=executeBlock(block.kind,args,block.config,runtime,scope+block.id)
  visiting.delete(id);values[id]=value;return value
 }
 // Sink blocks still execute when they are not selected as graph outputs.
 // Establish local sources before the sinks so a Scope fed by From sees this sample.
 for(const kind of ['dataMemory','goto','dataWrite','display','scope','terminator'] as const)
  for(const block of program.blocks.filter(block=>block.kind===kind))visit(block.id)
 for(const block of program.blocks.filter(block=>isStateBlock(block.kind)))visit(block.id)
 const outputs=program.outputs.map(visit)
 for(let i=0;i<delayed.length;i++){const block=delayed[i],value=visit(block.inputs[0]);commitStateBlock(block.kind,value,block.config??{},runtime,scope+block.id)}
 if(advanceTick)runtime.tick++
 return outputs.length===1?outputs[0]:outputs
}
