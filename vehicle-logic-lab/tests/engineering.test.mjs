import test from 'node:test'
import assert from 'node:assert/strict'
import {TorqueModel,referenceTorqueGraph,starterTorqueGraph,connectTorque,validateTorqueGraph,NORMAL_TORQUE_INPUT,torqueFingerprint} from '../src/engineering/torqueModel.ts'
import {TORQUE_SPEC,TORQUE_SCENARIOS,verifyTorque,expectedTorque} from '../src/engineering/torqueSpec.ts'
import {newDesign,certifyDesign,loadDesign,saveDesign,DESIGN_KEY} from '../src/engineering/designStore.ts'
import {readyTorqueContract} from '../src/engineering/integration.ts'
import {fitZoom,clampZoom,anchoredZoom,signalCone,routedWire} from '../src/engineering/workspace.ts'
import {MISSIONS,starter,referenceGraph} from '../src/content/ready.ts'
import {verify} from '../src/engine/verification.ts'

test('independent numeric oracle accepts all 19 reference scenarios with requirement traceability', () => {
  const rows=verifyTorque(referenceTorqueGraph())
  assert.equal(rows.length,19)
  assert.ok(rows.every(r=>r.pass),rows.filter(r=>!r.pass).map(r=>r.id).join(','))
  assert.ok(TORQUE_SPEC.requirements.every(r=>rows.some(s=>s.requirements.includes(r.id))))
  assert.equal(rows[0].samples[0].time,.02)
  assert.equal(rows[0].samples[0].expected,1.2)
  assert.ok(Math.abs(rows[0].samples.at(-1).actual.torqueNm-90)<1e-6)
  assert.equal(rows.find(r=>r.id==='cap-drop').samples[100].actual.torqueNm,20)
  assert.equal(rows.find(r=>r.id==='brake-edge').samples[90].actual.torqueNm,0)
})

for(const [node,key,value,scenario] of [
  ['request','gain',2.2,'normal-50'],['quality','delta',11,'delta-fault'],['quality','delta',9,'delta-edge'],
  ['quality','maxAge',110,'stale'],['quality','maxAge',90,'fresh-edge'],['permission','brakeAt',6,'brake-edge'],
  ['permission','brakeAt',4,'brake-edge'],['dynamics','rise',70,'rise'],['dynamics','fall',100,'fall'],
]) test(`mutation ${node}.${key}=${value} is caught by independent ${scenario}`,()=>{
  const graph=referenceTorqueGraph();graph.nodes.find(n=>n.id===node).parameters[key]=value
  const result=verifyTorque(graph).find(r=>r.id===scenario)
  assert.equal(result.pass,false);assert.equal(result.firstFailure,result.samples.findIndex(s=>!s.pass))
  assert.ok(result.samples[result.firstFailure].expected!==result.samples[result.firstFailure].actual.torqueNm)
})

test('starter fails structurally; unit mismatch, cycles, duplicate IDs, invalid parameters are rejected',()=>{
  assert.ok(verifyTorque(starterTorqueGraph()).every(r=>!r.pass&&r.firstFailure===0))
  const g=referenceTorqueGraph()
  assert.throws(()=>connectTorque(g,{id:'wrong',from:'input',out:'a',to:'command',in:'torque'}),/단위/)
  assert.throws(()=>connectTorque(g,{id:'cycle',from:'dynamics',out:'torque',to:'ceiling',in:'request'}),/순환/)
  const duplicate=structuredClone(g);duplicate.nodes.push({...duplicate.nodes[0]});assert.ok(validateTorqueGraph(duplicate).length)
  const bad=structuredClone(g);bad.nodes.find(n=>n.id==='request').parameters.gain=NaN;assert.ok(validateTorqueGraph(bad).length)
  assert.ok(validateTorqueGraph({nodes:[null],edges:[]}).length)
  assert.ok(validateTorqueGraph({nodes:[{id:'x',kind:'toString',label:'bad'}],edges:[]}).length)
  assert.ok(validateTorqueGraph({nodes:g.nodes,edges:[null]}).length)
})

test('connection replacement and wire order do not define the correct answer',()=>{
  const graph=referenceTorqueGraph()
  const replaced=connectTorque(graph,{...graph.edges[0],id:'replacement'})
  assert.equal(replaced.edges.length,graph.edges.length)
  replaced.edges.reverse();replaced.nodes.reverse()
  assert.ok(verifyTorque(replaced).every(r=>r.pass))
  assert.equal(torqueFingerprint(replaced),torqueFingerprint(graph))
})

test('stateful slew, immediate inhibit and restart from zero, invalid interval and cap',()=>{
  const model=new TorqueModel(),graph=referenceTorqueGraph(),i={...NORMAL_TORQUE_INPUT}
  assert.equal(model.step(graph,i).torqueNm,1.2)
  assert.equal(model.step(graph,i).torqueNm,2.4)
  assert.equal(model.step(graph,{...i,brakePct:5}).torqueNm,0)
  assert.equal(model.step(graph,i).torqueNm,1.2)
  assert.ok(model.step(graph,i,0).issues.length)
  assert.equal(model.step(graph,i).torqueNm,1.2)
  for(const capNm of [NaN,-1,181,Infinity])assert.equal(model.step(graph,{...i,capNm}).torqueNm,0)
  for(const patch of [{pedalA:NaN},{pedalB:Infinity},{ageMs:-1},{ageMs:NaN},{brakePct:NaN}])assert.equal(model.step(graph,{...i,...patch}).torqueNm,0)
})

test('additional rate blocks have separate retained states',()=>{
  const graph=referenceTorqueGraph();graph.nodes.push({id:'rate2',kind:'rate',label:'Second independent state',parameters:{rise:30,fall:60}})
  graph.edges.push(...['target','allow','cap'].map(input=>{const e=graph.edges.find(e=>e.to==='dynamics'&&e.in===input);return{...e,id:`second-${input}`,to:'rate2'}}))
  const model=new TorqueModel(),a=model.step(graph,NORMAL_TORQUE_INPUT),b=model.step(graph,NORMAL_TORQUE_INPUT)
  assert.equal(a.values['dynamics.torque'],1.2);assert.equal(a.values['rate2.torque'],.6)
  assert.equal(b.values['dynamics.torque'],2.4);assert.equal(b.values['rate2.torque'],1.2)
})

test('deterministic changing inputs agree with independent fixed specification',()=>{
  let seed=1387,expected=0;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296)
  const model=new TorqueModel(),graph=referenceTorqueGraph()
  for(let tick=0;tick<1000;tick++){
    const a=random()*100,input={...NORMAL_TORQUE_INPUT,pedalA:a,pedalB:a+(random()<.1?10.01:0),capNm:random()*180,ready:random()>.1,brakePct:random()<.15?5:0,ageMs:random()<.1?101:20}
    expected=expectedTorque(input,expected);const actual=model.step(graph,input)
    assert.ok(Math.abs(actual.torqueNm-expected)<1e-6,`tick ${tick}`)
    assert.ok(actual.torqueNm>=0&&actual.torqueNm<=input.capNm)
  }
})

test('saved certificates are recalculated, edits and forged results cannot grant completion',()=>{
  const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}
  const certified=certifyDesign({...newDesign(),graph:referenceTorqueGraph()})
  assert.ok(certified.verified);saveDesign(storage,certified);assert.ok(loadDesign(storage).record.verified)
  const altered=structuredClone(certified);altered.graph.nodes.find(n=>n.id==='request').parameters.gain=2.2
  altered.verified=torqueFingerprint(altered.graph);saveDesign(storage,altered)
  assert.equal(loadDesign(storage).record.verified,'')
  const unknown=structuredClone(certified);unknown.graph.nodes[0].id='unknown';saveDesign(storage,unknown)
  assert.ok(loadDesign(storage).warning)
  data.set(DESIGN_KEY,'{broken');const loaded=loadDesign(storage)
  assert.ok(loaded.warning);assert.equal(data.get(DESIGN_KEY),'{broken')
  saveDesign(storage,loaded.record);assert.equal(data.get(`${DESIGN_KEY}.backup`),'{broken')
})

test('READY output and numeric controller have real functional boundary contracts',()=>{
  const pass=readyTorqueContract(referenceGraph(true),referenceTorqueGraph())
  assert.equal(pass.length,3);assert.ok(pass.every(r=>r.pass))
  assert.equal(pass[0].actualTorque,90);assert.equal(pass[1].actualTorque,0)
  assert.ok(readyTorqueContract(starter(),referenceTorqueGraph()).some(r=>!r.pass))
  const wrong=referenceTorqueGraph();wrong.nodes.find(n=>n.id==='request').parameters.gain=2.2
  assert.ok(readyTorqueContract(referenceGraph(true),wrong).some(r=>!r.pass))
})

test('READY verdict trace identifies structural vs behavior failure and a useful inspection path',()=>{
  const structural=verify(starter(),MISSIONS[0])[0]
  assert.equal(structural.category,'STRUCTURE');assert.equal(structural.failureStep,0)
  const graph=referenceGraph(),node=graph.nodes.find(n=>n.kind==='and');node.kind='or'
  const behavior=verify(graph,MISSIONS[0]).find(r=>!r.pass)
  assert.equal(behavior.category,'BEHAVIOR');assert.ok(behavior.trace.at(-1).mismatches.length)
  assert.ok(behavior.inspectNodes.includes(node.id));assert.equal(behavior.trace.at(-1).pass,false)
  assert.ok(verify(referenceGraph(),MISSIONS[0]).every(r=>r.category==='PASS'&&r.failureStep===undefined))
})

test('zoom retains pointer anchor and focused cones omit unrelated branches',()=>{
  assert.equal(clampZoom(.01),.3);assert.equal(clampZoom(99),1.8)
  assert.ok(fitZoom({width:1200,height:720},{width:2000,height:1000})>.3)
  const before={x:300,y:150},anchor={x:250,y:120},scroll=anchoredZoom(.5,1.3,before,anchor)
  assert.equal((scroll.x+anchor.x)/1.3,(before.x+anchor.x)/.5)
  assert.equal((scroll.y+anchor.y)/1.3,(before.y+anchor.y)/.5)
  const edges=[{id:'ab',from:'a',to:'b'},{id:'bc',from:'b',to:'c'},{id:'ax',from:'a',to:'x'},{id:'xy',from:'x',to:'y'}]
  assert.deepEqual([...signalCone(edges,'b').nodes].sort(),['a','b','c'])
  for(const [a,b] of [[{x:50,y:50},{x:250,y:150}],[{x:600,y:300},{x:100,y:150}]]){
    const d=routedWire(a,b,3,700);assert.match(d,/^M/);assert.ok(!/[CQL]/.test(d));assert.ok(d.includes('H')&&d.includes('V'))
  }
})
