import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import RAPIER from '@dimforge/rapier3d-compat'
import { WasmVehicleSw } from '../src/runtime/c/WasmVehicleSw.ts'
import { PropulsionCase } from '../src/runtime/case/PropulsionCase.ts'
import { SimulationRuntime } from '../src/runtime/SimulationRuntime.ts'
import { RapierVehiclePhysics } from '../src/physics/rapier/RapierVehiclePhysics.ts'
import { createLoadedMap } from '../src/world/MapLoader.ts'
import { loadMapDefinition, PROVING_GROUND_MAP_ID, PANGYO2_MAP_ID } from '../src/registries/MapRegistry.ts'
import { TRACKBACK_SIMULATION_CALIBRATION_V0_1 as cal } from '../src/data/calibration/TrackbackSimulationCalibration.ts'
const module = await WebAssembly.compile(readFileSync(new URL('../src/runtime/c/generated/vehicle-sw.wasm', import.meta.url)))
const factory = () => new WasmVehicleSw(module, cal)
const makeCase = () => new PropulsionCase(factory, 'test-build', { forward:180, reverse:130 })
test('C fault variants remain isolated, reset restores normal behavior', () => {
  const faulty = factory(), normal = factory()
  faulty.setCaseVariant(1)
  assert.equal(faulty.verifyEDrive(90,'FORWARD','VALID').magnitudeNm,45)
  assert.equal(normal.verifyEDrive(90,'FORWARD','VALID').magnitudeNm,90)
  assert.equal(faulty.verifyEDrive(90,'FORWARD','INVALID').magnitudeNm,0)
  faulty.reset()
  assert.equal(faulty.verifyEDrive(90,'FORWARD','VALID').magnitudeNm,90)
})
test('record → evidence → experiment → immutable diagnosis → wrong fixes → C regression pass', () => {
  const c=makeCase()
  assert.throws(()=>c.submit('eDrive','scaling','SWR-EDR-001'))
  c.reproduce()
  const frames=structuredClone(c.getSnapshot().frames)
  assert.equal(frames.length,300)
  assert.equal(frames[179].sw.output.eDriveCommand.magnitudeNm,90)
  assert.equal(frames[180].sw.output.eDriveCommand.magnitudeNm,45)
  assert.equal(frames[180].plant,null)
  c.pin(); assert.throws(()=>c.runExperiment(45,45))
  c.runExperiment(45,90)
  assert.deepEqual(c.getSnapshot().experiment.rows.map(r=>r.actual),[22.5,45])
  c.submit('eDrive','scaling','SWR-EDR-001')
  assert.equal(c.getSnapshot().diagnosis.correct,true)
  assert.throws(()=>c.submit('VMC','limit','SYSR-PROP-009'))
  assert.ok(c.runRepair(2).rows.some(r=>!r.pass))
  assert.ok(c.runRepair(3).rows.some(r=>!r.pass))
  assert.equal(c.getSnapshot().phase,'SUBMITTED')
  const repaired=c.runRepair(0)
  assert.equal(repaired.rows.length,20)
  assert.ok(repaired.rows.every(r=>r.pass))
  assert.equal(c.getSnapshot().phase,'RESOLVED')
  assert.deepEqual(c.getSnapshot().frames,frames)
  assert.equal(c.report().repairs.length,3)
  c.reset();assert.equal(c.getSnapshot().phase,'DRIVING');assert.equal(c.getSnapshot().frames.length,0)
})
test('normal frame is not valid failure evidence; incorrect answer can still learn and repair', () => {
  const c=makeCase();c.reproduce();c.select(0);c.pin();c.runExperiment(45,90)
  c.submit('eDrive','scaling','SWR-EDR-001');assert.equal(c.getSnapshot().diagnosis.correct,true);assert.equal(c.getSnapshot().diagnosis.evidenceSufficient,false)
  c.runRepair(0);assert.equal(c.getSnapshot().phase,'RESOLVED')
})
test('player can test a normal upstream component without treating PASS as fault evidence', () => {
  const c=makeCase();c.reproduce();c.pin()
  c.runExperiment(.25,.5,'VMC')
  assert.equal(c.getSnapshot().experiment.testObject,'VMC')
  assert.deepEqual(c.getSnapshot().experiment.rows.map(r=>[r.actual,r.expected,r.pass]),[[45,45,true],[90,90,true]])
  assert.throws(()=>c.runExperiment(45,90,'VMC'))
  c.submit('eDrive','scaling','SWR-EDR-001')
  assert.equal(c.getSnapshot().diagnosis.correct,true);assert.equal(c.getSnapshot().diagnosis.evidenceSufficient,false)
})
for (const mapId of [PROVING_GROUND_MAP_ID, PANGYO2_MAP_ID]) test(`${mapId}: real C + Rapier captures and locks driving, preserves pose, then restores repaired drive`, async () => {
  await RAPIER.init()
  const map=createLoadedMap(loadMapDefinition(mapId))
  const world=new RAPIER.World({x:0,y:-9.81,z:0})
  const physics=new RapierVehiclePhysics(RAPIER,world,dt=>{world.timestep=dt;world.step()},map.physics,map.surfaces)
  let telemetry
  const runtime=new SimulationRuntime(cal,t=>{telemetry=t},undefined,factory())
  const c=makeCase();runtime.configureCase(c)
  const detach=runtime.attach(physics)
  try {
    runtime.start();runtime.driverInput.setAccelerator(1)
    for(let i=0;i<600;i++)runtime.advance(1/60)
    assert.equal(c.getSnapshot().phase,'CAPTURED')
    assert.equal(runtime.clock.paused,false)
    assert.equal(telemetry.raceFinished,false)
    const pose=structuredClone(runtime.readVehicleState()), frames=structuredClone(c.getSnapshot().frames)
    assert.ok(frames.some(f=>f.sw.output.eDriveCommand.magnitudeNm===f.sw.output.driveTorqueRequest.magnitudeNm && f.sw.output.eDriveCommand.magnitudeNm>0))
    assert.ok(frames.some(f=>f.sw.output.eDriveCommand.magnitudeNm===f.sw.output.driveTorqueRequest.magnitudeNm*.5 && f.sw.output.eDriveCommand.magnitudeNm>0))
    assert.equal(runtime.acceptsDrivingInput(),false); const capturedTime=runtime.clock.currentTime; runtime.advance(.1);assert.deepEqual(runtime.readVehicleState().position,pose.position); assert.equal(runtime.clock.currentTime,capturedTime)
    assert.deepEqual(c.getSnapshot().frames,frames)
    runtime.pause(); const pausedPose=structuredClone(runtime.readVehicleState())
    c.select(0);runtime.advance(.1);assert.deepEqual(runtime.readVehicleState(),pausedPose)
    c.select(frames.length-1);c.pin();c.runExperiment(45,90);c.submit('eDrive','scaling','SWR-EDR-001');c.runRepair(0)
    runtime.resume();runtime.driverInput.setAccelerator(1)
    for(let i=0;i<12;i++)runtime.advance(1/60)
    assert.equal(telemetry.vehicleSw.output.eDriveCommand.magnitudeNm,telemetry.vehicleSw.output.driveTorqueRequest.magnitudeNm)
    assert.deepEqual(c.getSnapshot().frames,frames)
    runtime.reset();assert.equal(c.getSnapshot().phase,'DRIVING');assert.equal(c.getSnapshot().frames.length,0)
  } finally {detach();physics.dispose();world.free()}
})

test('experiment history retains earlier evidence and repeats selected inputs after repair',()=>{
 const c=makeCase(); c.reproduce(); c.pin(); c.runExperiment(45,120); const id=c.getSnapshot().experiment.id;
 c.runExperiment(.25,.75,'VMC'); assert.equal(c.getSnapshot().experiments.length,2);
 c.selectExperiment(id); c.submit('eDrive','scaling','SWR-EDR-001'); assert.equal(c.getSnapshot().diagnosis.evidenceSufficient,true);
 const repaired=c.runRepair(0); assert.deepEqual(repaired.rows.slice(0,2).map(r=>[r.input,r.actual]),[[45,45],[120,120]]);
});

test('configurable speed, reverse and validity conditions survive repair replay',()=>{
 const c=makeCase(); c.reproduce(); c.pin();
 const speed={variable:'speed',magnitude:.5,speed:0,direction:'REVERSE',validity:'VALID'};
 c.runExperiment(0,10,'VMC',speed);
 const run=c.getSnapshot().experiment;
 assert.equal(run.rows[0].expected,65); assert.ok(run.rows[1].expected<65);
 assert.ok(run.rows.every(r=>r.pass));
 c.submit('VMC','limit','SWR-VMC-001'); const repaired=c.runRepair(0);
 assert.deepEqual(repaired.rows.slice(0,2).map(r=>r.actual),run.rows.map(r=>r.actual));
 const d=makeCase(); d.reproduce();
 d.runExperiment(70,170,'eDrive',{...speed,variable:'magnitude',validity:'INVALID'});
 assert.ok(d.getSnapshot().experiment.rows.every(r=>r.pass&&r.actual===0));
 assert.throws(()=>d.runExperiment(0,10,'eDrive',speed));
 assert.throws(()=>d.runExperiment(NaN,20,'eDrive'));
 assert.throws(()=>d.runExperiment(-1,20,'eDrive'));
 assert.throws(()=>d.runExperiment(45,601,'eDrive'));
 assert.throws(()=>d.runExperiment(0,61,'VMC',speed));
});

test('one editable request per run; separate runs can establish scaling evidence',()=>{
 const c=makeCase();c.reproduce();c.pin();c.runExperiment(60,undefined,'eDrive');
 assert.equal(c.getSnapshot().experiment.rows.length,1);
 assert.equal(c.getSnapshot().experiment.rows[0].actual,30);
 c.runExperiment(120,undefined,'eDrive');c.submit('eDrive','scaling','SWR-EDR-001');
 assert.equal(c.getSnapshot().diagnosis.evidenceSufficient,true);
 const repaired=c.runRepair(0);assert.equal(repaired.rows.length,20);
 assert.deepEqual(repaired.rows.slice(0,2).map(r=>[r.input,r.actual]),[[60,60],[120,120]]);
 const single=makeCase();single.reproduce();single.pin();single.runExperiment(90,undefined,'eDrive');
 single.submit('eDrive','scaling','SWR-EDR-001');assert.equal(single.getSnapshot().diagnosis.correct,true);
 assert.equal(single.getSnapshot().diagnosis.evidenceSufficient,false);
});
