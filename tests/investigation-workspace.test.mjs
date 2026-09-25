import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { WasmVehicleSw } from '../src/runtime/c/WasmVehicleSw.ts'
import { PropulsionCase } from '../src/runtime/case/PropulsionCase.ts'
import { TRACKBACK_SIMULATION_CALIBRATION_V0_1 as cal } from '../src/data/calibration/TrackbackSimulationCalibration.ts'
import { inspectBoundary } from '../src/runtime/investigation/Boundary.ts'
import { assessEvidence } from '../src/runtime/investigation/Assessment.ts'
import { createInvestigationPresentationModel } from '../src/ui/investigation/presentation/InvestigationPresentationModel.ts'
import { deriveInvestigationMilestones, initialInvestigationSession } from '../src/runtime/investigation/InvestigationSession.ts'
import { getSignalObservation } from '../src/registries/investigation/Architecture.ts'
const module = await WebAssembly.compile(readFileSync(new URL('../src/runtime/c/generated/vehicle-sw.wasm', import.meta.url)))
const make = () => { const c = new PropulsionCase(()=>new WasmVehicleSw(module,cal),'test',{forward:180,reverse:130});c.reproduce();return c }
const collect = (c,value,options) => {c.runExperiment(value,undefined,'eDrive',options);c.collectTest(c.getSnapshot().experiment.id)}
const report = (c,type='LOGIC_CALCULATION',cause='INCORRECT_SCALING') => c.submitReport({faultLocation:'eDrive',failureType:type,detailedCause:cause,evidenceIds:c.getSnapshot().evidence.map(e=>e.id)})

test('workspace artifacts → two separate C experiments → RCA → corrective action → normal variant',()=>{
 const c=make();c.inspect('eDrive');collect(c,45);collect(c,90)
 assert.equal(c.getSnapshot().evidence.length,3)
 report(c)
 const s=c.getSnapshot();assert.equal(s.diagnosis.correct,true);assert.equal(s.diagnosis.evidenceSufficient,true)
 assert.deepEqual(s.diagnosis.assessment.ratios,[.5,.5]);assert.ok(s.diagnosis.requirementIds.includes('SWR-EDR-001'))
 assert.equal(c.report().evidenceFrames.length,1)
 assert.equal(c.runRepair(2).rows.every(r=>r.pass),false)
 assert.equal(c.runRepair(3).rows.every(r=>r.pass),false)
 assert.equal(c.runRepair(0).rows.every(r=>r.pass),true)
 assert.equal(c.getSnapshot().phase,'RESOLVED')
 const f=s.frames.at(-1);assert.equal(c.beforeStep(f.sw.input,0,0,1/60),0)
 c.reset();assert.equal(c.getSnapshot().evidence.length,0)
})
test('correctness and sufficient evidence remain independent; calibration is not this cause',()=>{
 const c=make();c.inspect('eDrive');collect(c,45);collect(c,90);report(c,'DATA_CALIBRATION','INCORRECT_CALIBRATION')
 assert.equal(c.getSnapshot().diagnosis.correct,false);assert.equal(c.getSnapshot().diagnosis.evidenceSufficient,true)
})
test('player hypothesis has one structured runtime synchronization boundary',()=>{
 const c=make();const hypothesis={target:'eDrive',signal:'DriveTorqueRequest',requirementId:'SWR-EDR-001',type:'계산 / 로직 오류'}
 c.setHypothesis(hypothesis);hypothesis.target='VMC'
 assert.equal(c.getSnapshot().hypothesis.target,'eDrive')
 assert.deepEqual(c.report().hypothesis,{target:'eDrive',signal:'DriveTorqueRequest',requirementId:'SWR-EDR-001',type:'계산 / 로직 오류'})
})
test('uncollected tests and unknown evidence cannot support report',()=>{
 const c=make();c.inspect('eDrive');c.runExperiment(45,90)
 assert.throws(()=>c.submitReport({faultLocation:'eDrive',failureType:'LOGIC_CALCULATION',detailedCause:'INCORRECT_SCALING',evidenceIds:['invented']}))
 report(c);assert.equal(c.getSnapshot().diagnosis.correct,true);assert.equal(c.getSnapshot().diagnosis.evidenceSufficient,false)
})
for(const values of [[0,90],[45,45],[181,600]])test(`non-discriminating samples ${values} excluded`,()=>{
 const c=make();c.inspect('eDrive');for(const v of values)collect(c,v);report(c);assert.equal(c.getSnapshot().diagnosis.evidenceSufficient,false)
})
test('different direction samples cannot establish same-direction repeated ratio',()=>{
 const c=make();c.inspect('eDrive');collect(c,45);collect(c,90,{variable:'magnitude',magnitude:.5,speed:0,direction:'REVERSE',validity:'VALID'});report(c);assert.equal(c.getSnapshot().diagnosis.evidenceSufficient,false)
})
test('two FAIL values with inconsistent ratios are not sufficient',()=>{
 const c=make();c.inspect('eDrive');collect(c,45);collect(c,90);const s=c.getSnapshot(),runs=structuredClone(s.experiments)
 runs[1].rows[0].actual=30
 assert.equal(assessEvidence(c.definition,[...s.evidence],s.frames,runs).sufficient,false)
})
test('local oracle distinguishes normal upstream from eDrive mismatch; missing previous gear is unknown',()=>{
 const c=make(),s=c.getSnapshot(),f=s.frames.at(-1),prev=s.frames.at(-2)
 assert.equal(inspectBoundary(f,'GearLogic',prev).status,'MATCH')
 assert.equal(inspectBoundary(f,'PropulsionFunction').status,'MATCH')
 assert.equal(inspectBoundary(f,'VMC').status,'MATCH')
 assert.equal(inspectBoundary(f,'eDrive').status,'MISMATCH')
 assert.equal(inspectBoundary(s.frames[0],'GearLogic').status,'OBSERVED')
})
test('oracle mismatch is not presented as player discovery before inspection',()=>{
 const c=make(),session=initialInvestigationSession(),milestones=deriveInvestigationMilestones(session)
 const hidden=createInvestigationPresentationModel(c.getSnapshot(),c.definition,null,milestones,[])
 assert.equal(hidden.getNodeStatus('eDrive'),'UNINSPECTED')
 const discovered=createInvestigationPresentationModel(c.getSnapshot(),c.definition,null,milestones,[{id:'finding:boundary:eDrive:300',kind:'BOUNDARY',subjectId:'eDrive',source:'INCIDENT_OBSERVATION',outcome:'MISMATCH'}])
 assert.equal(discovered.getNodeStatus('eDrive'),'DIFFERENCE_FOUND')
})
test('signal observation distinguishes incident actual, oracle expected and absent recorded reference',()=>{
 const c=make(),frames=c.getSnapshot().frames,frame=frames.at(-1),previous=frames.at(-2)
 const observation=getSignalObservation('EDriveCommand',frame,previous)
 assert.equal(observation.actual.semantics,'INCIDENT_ACTUAL')
 assert.equal(observation.expected.semantics,'ORACLE_EXPECTED')
 assert.equal(observation.recordedReference,undefined)
 assert.notEqual(observation.actual.value,observation.expected.value)
})

test('investigation viewport clipping only trims overflow outside the sidebar',()=>{
 const source=readFileSync(new URL('../src/ui/investigation/InvestigationWorkspace.tsx',import.meta.url),'utf8')
 assert.match(source,/const clipBottom = Math\.max\(0, rect\.bottom - box\.bottom\)/)
 assert.doesNotMatch(source,/const clipBottom = Math\.max\(0, box\.bottom - rect\.bottom\)/)
})

test('investigation Back control participates in main-content layout flow',()=>{
 const source=readFileSync(new URL('../src/ui/investigation/InvestigationWorkspace.tsx',import.meta.url),'utf8')
 const css=readFileSync(new URL('../src/ui/investigation/investigation-layout.css',import.meta.url),'utf8')
 assert.match(source,/className="investigation-main-stack"/)
 assert.match(source,/className="investigation-back-row"/)
 assert.match(css,/\.investigation-back-row\s*{[^}]*display:\s*flex/s)
 const buttonRule=css.match(/\.investigation-back-btn\s*{([^}]*)}/s)?.[1]??''
 assert.doesNotMatch(buttonRule,/position:\s*absolute/)
})

test('Page 2 uses one canonical shared context instead of duplicate target controls',()=>{
 const page=readFileSync(new URL('../src/ui/investigation/pages/Page2Tracking.tsx',import.meta.url),'utf8')
 const context=readFileSync(new URL('../src/ui/investigation/pages/page2/Page2ContextBar.tsx',import.meta.url),'utf8')
 assert.match(page,/Page2ContextBar/)
 assert.doesNotMatch(page,/현재 조사 대상 기능/)
 assert.doesNotMatch(page,/component-path-selector-bar/)
 assert.match(context,/resolveInvestigationSelection/)
 assert.match(context,/사건 관련 경로/)
 assert.match(context,/순서대로 조사할 필요는 없습니다/)
 assert.match(context,/kind-\$\{node\.kind\.toLowerCase\(\)\}/)
})

