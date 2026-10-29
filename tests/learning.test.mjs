import test from 'node:test'
import assert from 'node:assert/strict'
import {newCampaign,buyStarter,breakDown,prepareLesson,advanceLesson,lessonPass} from '../src/campaign/model.ts'
import {BUILD_PARTS,buildReady,mountAndConnect,BUILD_LINKS} from '../src/campaign/build.ts'
import {campaignReferenceGraph} from '../src/campaign/design.ts'
import {LEARNING,PLAY_CHAPTERS,missingLessonWire} from '../src/campaign/learning.ts'
import {TorqueModel,NORMAL_TORQUE_INPUT} from '../src/engineering/torqueModel.ts'

test('new episode disassembles all fifteen plant devices, mounts in real dependency order and automatically mates all six harnesses',()=>{
 let c=breakDown(buyStarter({...newCampaign(),stage:'purchase'}))
 assert.equal(c.assemblyScope,2);assert.equal(c.record.cables.length,0);assert.equal(buildReady(c),false)
 const blocked=mountAndConnect(c,'inverter');assert.equal(blocked,c,'later power stage cannot bypass motor/wheel assembly')
 for(const part of BUILD_PARTS){c=mountAndConnect(c,part.id);assert.equal(c.record.assembly[part.id],'FIXED',part.id)}
 assert.equal(buildReady(c),true);assert.equal(c.record.cables.length,BUILD_LINKS.length)
 assert.equal(new Set(c.record.cables).size,6)
 const readyRecord=c.record;assert.equal(mountAndConnect(c,'motor').record.assembly.motor,'FIXED');assert.equal(readyRecord.assembly.motor,'FIXED')
 c.record.assembly.brakes='TRAY';assert.equal(buildReady(c),false)
 c.stage='puzzle';c.record.graph=campaignReferenceGraph();assert.equal(advanceLesson(c),c,'provided working SW does not bypass incomplete physical assembly')
})
test('connection puzzle starts with supplied correct constants; changing a test input does not change model constants',()=>{
 const g=prepareLesson(campaignReferenceGraph(),0)
 assert.equal(g.nodes.find(n=>n.id==='request').parameters.gain,1.8);assert.ok(missingLessonWire(g,0))
 assert.equal(prepareLesson(campaignReferenceGraph(),1).nodes.find(n=>n.id==='brakeCheck').parameters.brakeAt,5)
 assert.equal(prepareLesson(campaignReferenceGraph(),2).nodes.find(n=>n.id==='dynamics').parameters.rise,60)
 const model=new TorqueModel(),reference=campaignReferenceGraph()
 for(const gear of ['P','R','N','D']){const frame=model.step(reference,{...NORMAL_TORQUE_INPUT,gear});assert.equal(frame.values['quality.valid'],true);assert.equal(frame.values['gearCheck.forward'],gear==='D')}
 assert.ok(LEARNING.every(l=>l.path.includes('구동 도메인')&&l.ears.includes('해야 한다')))
 assert.ok(PLAY_CHAPTERS.every(c=>c.stages.length>0))
})
test('permission lesson checks permission ON as well as inhibition, so a comparator that always rejects D cannot pass',()=>{
 const graph=campaignReferenceGraph()
 assert.equal(lessonPass(graph,1),true)
 graph.nodes.find(n=>n.id==='gearCheck').parameters.equals=0
 assert.equal(lessonPass(graph,1),false)
})
