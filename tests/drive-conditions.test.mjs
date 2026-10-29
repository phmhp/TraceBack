import test from 'node:test'
import assert from 'node:assert/strict'
import {campaignReferenceGraph,expandDriveConditions} from '../src/campaign/design.ts'
import {TorqueModel,NORMAL_TORQUE_INPUT,referenceTorqueGraph,torqueFingerprint} from '../src/engineering/torqueModel.ts'
import {verifyTorque,runTorqueScenario} from '../src/engineering/torqueSpec.ts'
import {assembledRecord,loadCampaign,LESSONS,prepareLesson} from '../src/campaign/model.ts'
import {mechanicRoute,MECHANIC_HOME} from '../src/campaign/assemblyMotion.ts'
import {RIVALS,rivalDistance,raceRank,finishRank} from '../src/campaign/race.ts'

test('expanded ASW exposes enum comparison, brake comparator and four actual AND operands',()=>{
 const g=campaignReferenceGraph(),model=new TorqueModel(),f=model.step(g,NORMAL_TORQUE_INPUT)
 assert.equal(f.values['input.gear'],'D');assert.equal(f.values['gearCheck.forward'],true);assert.equal(f.values['brakeCheck.clear'],true);assert.equal(f.values['permission.allow'],true)
 assert.equal(g.edges.some(e=>e.from==='input'&&e.out==='forward'),false)
 for(const gear of ['P','R','N']){const b=model.step(g,{...NORMAL_TORQUE_INPUT,gear});assert.equal(b.values['gearCheck.forward'],false);assert.equal(b.torqueNm,0)}
 assert.ok(verifyTorque(g).every(r=>r.pass));g.nodes.find(n=>n.id==='gearCheck').parameters.equals=0;assert.ok(verifyTorque(g).some(r=>!r.pass))
})
test('calibration is not stimulus: fixed threshold distinguishes directly injected 4.99 and 5 percent',()=>{
 const g=campaignReferenceGraph(),model=new TorqueModel();assert.equal(model.step(g,{...NORMAL_TORQUE_INPUT,brakePct:4.99}).permitted,true);assert.equal(model.step(g,{...NORMAL_TORQUE_INPUT,brakePct:5}).permitted,false)
 g.nodes.find(n=>n.id==='brakeCheck').parameters.brakeAt=10;assert.equal(verifyTorque(g).find(r=>r.id==='brake-edge').pass,false)
})
test('missing wires retain observable source values but never authorize force; arbitrary user stimuli use independent expectations',()=>{
 const g=prepareLesson(campaignReferenceGraph(),1),f=new TorqueModel().step(g,NORMAL_TORQUE_INPUT);assert.equal(f.values['input.gear'],'D');assert.equal(f.torqueNm,0);assert.ok(f.issues.length)
 const input={...NORMAL_TORQUE_INPUT,pedalA:37,pedalB:37,capNm:45},s={id:'custom',name:'custom',requirements:['DRV-03'],technique:'user',steps:[{input,ticks:200}]},r=runTorqueScenario(campaignReferenceGraph(),s);assert.ok(r.pass);assert.equal(r.samples.at(-1).actual.torqueNm,45);assert.equal(r.samples.at(-1).expected,45)
})
test('legacy approved save expands without losing awards, and absent player wires stay absent',()=>{
 const graph=referenceTorqueGraph(),hash=torqueFingerprint(graph),c={version:1,stage:'grid',record:{...assembledRecord(),graph,certificate:hash},clue:true,lessons:[graph,graph,graph],bench:hash,wallet:10,owned:['scrap'],paint:'scrap',rewarded:false,best:null,lastRace:null},r=loadCampaign({getItem:()=>JSON.stringify(c)})
 assert.equal(r.warning,'');assert.equal(r.save.stage,'grid');assert.equal(r.save.wallet,10);assert.equal(r.save.record.graph.nodes.length,9);assert.equal(r.save.bench,torqueFingerprint(r.save.record.graph))
 graph.edges=graph.edges.filter(e=>!(e.to==='permission'&&e.in==='forward'));const expanded=expandDriveConditions(graph);assert.equal(expanded.edges.some(e=>e.to==='gearCheck'),false);assert.equal(expanded.edges.some(e=>e.from==='gearCheck'),false)
 assert.ok(LESSONS[1].nodes.includes('brakeCheck'))
})
test('mechanic walks only outside chassis; virtual entrant positions and awards are deterministic',()=>{
 for(const [tray,mount] of [[[-3.25,.95,-1.3],[0,.64,-1.35]],[[-3.25,.95,.4],[-.6,1.04,.08]]])for(const carry of [true,false]){const route=[MECHANIC_HOME,...mechanicRoute(tray,mount,carry)];for(const p of route)assert.ok(p[0]<=-2.2&&p[1]===0)}
 for(const r of RIVALS){assert.equal(rivalDistance(0,r.finish),0);assert.equal(rivalDistance(r.finish,r.finish),160)}assert.equal(raceRank(10,-100),1);assert.equal(finishRank(21),1);assert.equal(finishRank(35),4)
})
