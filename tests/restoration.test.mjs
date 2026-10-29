import test from 'node:test'
import assert from 'node:assert/strict'
import {newCampaign,buyStarter,breakDown,advanceLesson,approve,loadCampaign,LESSONS} from '../src/campaign/model.ts'
import {ASSEMBLY_KITS} from '../src/campaign/domains.ts'
import {mountAndConnect} from '../src/campaign/build.ts'
import {activeKit,KIT_LESSON,inspectMountedKit,continueRestoration,shakedownClock,resumeLessonEdit} from '../src/campaign/restoreLoop.ts'
import {campaignReferenceGraph} from '../src/campaign/design.ts'
import {connectTorque} from '../src/engineering/torqueModel.ts'
import {taskRoute,MECHANIC_HOME,campaignTray,floorSegmentClear,floorPath} from '../src/campaign/assemblyMotion.ts'
import {allAssemblyParts} from '../src/workshop/assembly.ts'
import {ACTIVE_PLAY_KEY,readSessionPlay,rememberSessionPlay} from '../src/campaign/navigation.ts'

test('only the active tab reload resumes; stale navigation, a new tab and explicit title preserve the Start-only title',()=>{
 const data=new Map(),session={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},saved={getItem:()=>'{"version":1}'}
 assert.equal(readSessionPlay(session,saved),'title');rememberSessionPlay(session,'campaign');assert.equal(data.get(ACTIVE_PLAY_KEY),'campaign');assert.equal(readSessionPlay(session,saved),'campaign');assert.equal(readSessionPlay(session,{getItem:()=>null}),'title');rememberSessionPlay(session,'title');assert.equal(readSessionPlay(session,saved),'title');assert.equal(readSessionPlay({getItem(){throw Error('denied')}},saved),'title')
})

test('six short physical loops interleave with related ECU lessons; no all-assembly prerequisite before first software lesson',()=>{
 let c=breakDown(buyStarter({...newCampaign(),stage:'purchase'}));c.stage='repair'
 for(let i=0;i<6;i++){
  const kit=activeKit(c);assert.equal(kit,ASSEMBLY_KITS[i]);for(const id of kit.parts)c=mountAndConnect(c,id)
  c.stage='component';c=inspectMountedKit(c)
  if(KIT_LESSON[kit.id]!==undefined){assert.equal(c.stage,'puzzle');if(i===3)assert.equal(c.record.assembly.brakes,'TRAY');const lesson=LESSONS[c.lessons.length];for(const[from,out,to,input]of lesson.edges)c.record.graph=connectTorque(c.record.graph,{id:crypto.randomUUID(),from,out,to,in:input});c=advanceLesson(c)}
  assert.equal(c.stage,'restore');assert.equal(c.kitChecks.length,i+1)
  const reloaded=loadCampaign({getItem:()=>JSON.stringify(c)});assert.equal(reloaded.warning,'');assert.equal(reloaded.save.stage,'restore');assert.deepEqual(reloaded.save.record,c.record)
  c=continueRestoration(c);assert.equal(c.stage,i===5?'bench':'repair')
 }
 assert.equal(c.lessons.length,3);assert.equal(c.record.cables.length,6);c=approve(c);assert.equal(c.stage,'grid');assert.ok(c.bench)
})
test('a mounted kit must be observed before restoration; wrong active kit cannot approve a SW lesson',()=>{
 let c=breakDown(buyStarter({...newCampaign(),stage:'purchase'}));c.stage='component';assert.equal(inspectMountedKit(c),c);c.stage='restore';assert.equal(continueRestoration(c),c)
 c.stage='puzzle';assert.equal(advanceLesson(c),c)
})
test('editing an earlier function returns to its kit and supplies only downstream boundaries, not the current puzzle answer',()=>{
 let c=breakDown(buyStarter({...newCampaign(),stage:'purchase'}));for(const k of ASSEMBLY_KITS)for(const id of k.parts)c=mountAndConnect(c,id)
 c.stage='puzzle';c.kitIndex=5;c.kitChecks=ASSEMBLY_KITS.map(k=>k.id);c.lessons=[campaignReferenceGraph(),campaignReferenceGraph()]
 const edited=campaignReferenceGraph();edited.edges=edited.edges.filter(e=>!(e.from==='quality'&&e.to==='request')&&e.to!=='command')
 c=resumeLessonEdit(c,edited,0);assert.equal(c.kitIndex,3);assert.equal(c.lessons.length,0);assert.ok(!c.record.graph.edges.some(e=>e.from==='quality'&&e.to==='request'));assert.ok(c.record.graph.edges.some(e=>e.to==='command'),'downstream is supplied until its own lesson')
 assert.equal(advanceLesson(c),c);for(const[from,out,to,input]of LESSONS[0].edges)c.record.graph=connectTorque(c.record.graph,{id:crypto.randomUUID(),from,out,to,in:input});c=advanceLesson(c);assert.equal(c.stage,'restore');assert.equal(c.lessons.length,1);assert.equal(continueRestoration(c).kitIndex,4)
})
test('cat routes from every previous mount to every next task avoid expanded vehicle, table and tool chest, including return home',()=>{
 let at=MECHANIC_HOME
 for(const part of allAssemblyParts){const route=taskRoute(at,campaignTray(part.id),part.position,true);for(const p of route.points){assert.ok(floorSegmentClear(at,p),part.id+': '+JSON.stringify([at,p]));at=p}for(const p of floorPath(at,MECHANIC_HOME)){assert.ok(floorSegmentClear(at,p));at=p}}
 for(const left of allAssemblyParts)for(const right of allAssemblyParts){const from=taskRoute(MECHANIC_HOME,campaignTray(left.id),left.position,true).points.at(-1),route=taskRoute(from,campaignTray(right.id),right.position,true);let previous=from;for(const p of route.points){assert.ok(floorSegmentClear(previous,p));previous=p}}
})
test('opening advances after four seconds moving, pauses without counting, and is not tied to render frame or distance',()=>{
 let elapsed=0;for(let i=0;i<200;i++)elapsed=shakedownClock(elapsed,.02,true,false);assert.equal(elapsed,4);assert.equal(shakedownClock(1,.2,true,true),1);assert.equal(shakedownClock(1,.2,false,false),1)
})
