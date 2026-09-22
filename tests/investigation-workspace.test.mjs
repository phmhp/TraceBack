import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { WasmVehicleSw } from '../src/runtime/c/WasmVehicleSw.ts'
import { PropulsionCase } from '../src/runtime/case/PropulsionCase.ts'
import { TRACKBACK_SIMULATION_CALIBRATION_V0_1 as cal } from '../src/data/calibration/TrackbackSimulationCalibration.ts'
import { inspectBoundary } from '../src/runtime/investigation/Boundary.ts'
import { assessEvidence } from '../src/runtime/investigation/Assessment.ts'
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

