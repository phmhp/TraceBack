import test from 'node:test'
import assert from 'node:assert/strict'
import {BLOCK_GROUPS,BLOCK_LABELS,executeBlock,executeProgram,newRuntime} from '../src/campaign/signalBlocks.ts'
import {addLibraryBlock,connectModel,emptyModel,evaluateModel} from '../src/campaign/domainTraining.ts'

test('the full reference palette has unique executable block kinds',()=>{
 const kinds=BLOCK_GROUPS.flatMap(group=>group.blocks)
 assert.equal(kinds.length,39)
 assert.equal(new Set(kinds).size,39)
 for(const kind of kinds)assert.equal(typeof BLOCK_LABELS[kind],'string')
})
test('numeric, logical, conversion and switching blocks calculate their configured behavior',()=>{
 const run=(kind,inputs,config={})=>executeBlock(kind,inputs,config)
 assert.equal(run('sum',[10,3,2],{signs:'+-+'}),9)
 assert.equal(run('product',[2,3,4]),24)
 assert.equal(run('minMax',[2,8],{operation:'max'}),8)
 assert.equal(run('relational',[3,4],{operation:'<'}),true)
 assert.equal(run('saturation',[12],{lower:0,upper:10}),10)
 assert.equal(run('gain',[3],{gain:2}),6)
 assert.equal(run('sqrt',[9]),3)
 assert.equal(run('abs',[-7]),7)
 assert.equal(run('logical',[true,false],{operation:'OR'}),true)
 assert.equal(run('logical',[true,false],{operation:'AND'}),false)
 assert.equal(run('convert',[3.9],{dataType:'int32'}),3)
 assert.equal(run('switch',[10,false,20]),20)
 assert.equal(run('multiportSwitch',[2,10,20,30],{indexBase:1}),20)
})
test('lookup, direct indexing, bus and vector operations retain their signal values',()=>{
 const run=(kind,inputs,config={})=>executeBlock(kind,inputs,config)
 assert.equal(run('lookup1D',[5],{breakpoints:[[0,10]],table:[0,100]}),50)
 assert.equal(run('lookup2D',[5,5],{breakpoints:[[0,10],[0,10]],table:[[0,10],[10,20]]}),10)
 assert.equal(run('lookupND',[5,5,5],{breakpoints:[[0,10],[0,10],[0,10]],table:[[[0,10],[10,20]],[[10,20],[20,30]]]}),15)
 assert.equal(run('directLookup',[1,0],{table:[[1,2],[3,4]]}),3)
 const bus=run('busCreator',[12,true],{inputKeys:['speed','ready']})
 assert.deepEqual(bus,{speed:12,ready:true})
 assert.deepEqual(run('busSelector',[bus],{outputKeys:['ready','speed']}),[true,12])
 assert.deepEqual(run('mux',[1,[2,3]]),[1,2,3])
 assert.deepEqual(run('demux',[[1,2,3]]),[1,2,3])
})
test('stateful blocks advance one sample per execution',()=>{
 const rt=newRuntime()
 assert.equal(executeBlock('delay',[9],{delay:2,initial:0},rt,'delay'),0)
 assert.equal(executeBlock('delay',[8],{delay:2,initial:0},rt,'delay'),0)
 assert.equal(executeBlock('delay',[7],{delay:2,initial:0},rt,'delay'),9)
 assert.equal(executeBlock('unitDelay',[4],{},rt,'unit'),0)
 assert.equal(executeBlock('unitDelay',[5],{},rt,'unit'),4)
 assert.equal(executeBlock('trigger',[3,true],{},rt,'trigger'),3)
 assert.equal(executeBlock('trigger',[9,true],{},rt,'trigger'),3)
 assert.equal(executeBlock('trigger',[9,false],{},rt,'trigger'),3)
 assert.equal(executeBlock('trigger',[9,true],{},rt,'trigger'),9)
 assert.equal(executeBlock('enable',[7,true],{},rt,'enable'),7)
 assert.equal(executeBlock('enable',[3,false],{},rt,'enable'),7)
 assert.equal(executeBlock('chart',[1],{initialState:'idle',transitions:{idle:{when:1,to:'ready'}}},rt,'chart'),'ready')
 executeBlock('scope',[4],{},rt,'scope');executeBlock('scope',[5],{},rt,'scope')
 assert.deepEqual(rt.memory.scope.scope,[4,5])
})
test('tagged and stored signals, nested subsystem, and directed graph execute',()=>{
 const rt=newRuntime()
 executeBlock('goto',[42],{tag:'A'},rt)
 assert.equal(executeBlock('from',[],{tag:'A'},rt),42)
 executeBlock('dataMemory',[],{tag:'speed',initial:3},rt)
 assert.equal(executeBlock('dataRead',[],{tag:'speed'},rt),3)
 executeBlock('dataWrite',[7],{tag:'speed'},rt)
 assert.equal(executeBlock('dataRead',[],{tag:'speed'},rt),7)
 const program={blocks:[{id:'a',kind:'gain',inputs:['x'],config:{gain:2}},{id:'b',kind:'sum',inputs:['a','y']}],outputs:['b']}
 assert.equal(executeProgram(program,{x:4,y:3},rt),11)
 assert.equal(executeBlock('subsystem',[4,3],{program:{blocks:[{id:'b',kind:'sum',inputs:['u1','u2']}],outputs:['b']}},rt),7)
 assert.throws(()=>executeProgram({blocks:[{id:'a',kind:'gain',inputs:['b']},{id:'b',kind:'gain',inputs:['a']}],outputs:['a']}),/순환/)
})
test('a library block added to the playable graph uses the same evaluator and saved settings',()=>{
 let graph=addLibraryBlock(emptyModel('power'),'logical','Logical Operator',{operation:'AND'},2)
 const block=graph.nodes.find(node=>node.kind==='library')
 assert.ok(block)
 graph=connectModel(graph,'in-ready',block.id,0).graph
 graph=connectModel(graph,'in-pack',block.id,1).graph
 graph=connectModel(graph,block.id,'out-enable',0).graph
 assert.deepEqual(evaluateModel(graph,{ready:true,pack:true}).output,{enable:true})
 assert.deepEqual(evaluateModel(graph,{ready:true,pack:false}).output,{enable:false})
 assert.deepEqual(evaluateModel(structuredClone(graph),{ready:true,pack:true}).output,{enable:true})
})
test('a unit delay closes a valid state-feedback loop while an algebraic loop is rejected',()=>{
 let graph={nodes:[{id:'input',kind:'in',name:'input',x:0,y:0,unit:'any',source:'u'},{id:'output',kind:'out',name:'output',x:500,y:0,unit:'any',source:'y'}],wires:[]}
 graph=addLibraryBlock(graph,'sum','Sum',{signs:'++'},2)
 graph=addLibraryBlock(graph,'unitDelay','Unit Delay',{initial:0},1)
 const sum=graph.nodes.find(n=>n.libraryKind==='sum').id,delay=graph.nodes.find(n=>n.libraryKind==='unitDelay').id
 for(const[from,to,port]of [['input',sum,0],[delay,sum,1],[sum,delay,0],[sum,'output',0]]){const result=connectModel(graph,from,to,port);assert.equal(result.error,'');graph=result.graph}
 const runtime=newRuntime()
 assert.equal(evaluateModel(graph,{u:1},runtime).output.y,1)
 assert.equal(evaluateModel(graph,{u:1},runtime).output.y,2)
 assert.equal(evaluateModel(graph,{u:1},runtime).output.y,3)
})
test('nested subsystem instances keep their delay state separate',()=>{
 const runtime=newRuntime(),config={program:{blocks:[{id:'d',kind:'unitDelay',inputs:['u1'],config:{initial:0}}],outputs:['d']}}
 assert.equal(executeBlock('subsystem',[1],config,runtime,'left'),0)
 assert.equal(executeBlock('subsystem',[5],config,runtime,'right'),0)
 assert.equal(executeBlock('subsystem',[2],config,runtime,'left'),1)
 assert.equal(executeBlock('subsystem',[6],config,runtime,'right'),5)
})
test('unconnected Scope sinks still record each sample and nested programs advance one global tick',()=>{
 const runtime=newRuntime()
 const program={blocks:[
  {id:'source',kind:'constant',inputs:[],config:{value:7}},
  {id:'scope',kind:'scope',inputs:['source']},
  {id:'out',kind:'subsystem',inputs:['source'],config:{program:{blocks:[{id:'gain',kind:'gain',inputs:['u1'],config:{gain:2}}],outputs:['gain']}}},
 ],outputs:['out']}
 assert.equal(executeProgram(program,{},runtime),14)
 assert.deepEqual(runtime.memory.scope.scope,[7])
 assert.equal(runtime.tick,1)
 assert.equal(executeProgram(program,{},runtime),14)
 assert.deepEqual(runtime.memory.scope.scope,[7,7])
 assert.equal(runtime.tick,2)
})
test('From and Goto tags are local to a Subsystem unless global visibility is requested',()=>{
 const runtime=newRuntime(),inner={blocks:[
  {id:'source',kind:'inport',inputs:['u1']},
  {id:'publish',kind:'goto',inputs:['source'],config:{tag:'A'}},
  {id:'receive',kind:'from',inputs:[],config:{tag:'A'}},
 ],outputs:['receive']}
 assert.equal(executeBlock('subsystem',[11],{program:inner},runtime,'left'),11)
 assert.equal(executeBlock('from',[],{tag:'A'},runtime,'right/read'),0)
 assert.equal(executeBlock('subsystem',[22],{program:inner},runtime,'right'),22)
 assert.equal(executeBlock('from',[],{tag:'A'},runtime,'left/read'),11)
 executeBlock('goto',[33],{tag:'shared',visibility:'global'},runtime,'left/send')
 assert.equal(executeBlock('from',[],{tag:'shared',visibility:'global'},runtime,'right/read'),33)
})
