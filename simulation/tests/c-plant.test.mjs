import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import RAPIER from '@dimforge/rapier3d-compat'
import { RapierVehiclePhysics } from '../src/physics/rapier/RapierVehiclePhysics.ts'
import { SimulationRuntime } from '../src/runtime/SimulationRuntime.ts'
import { WasmVehicleSw } from '../src/runtime/c/WasmVehicleSw.ts'
import { createLoadedMap } from '../src/world/MapLoader.ts'
import { loadMapDefinition, PROVING_GROUND_MAP_ID } from '../src/registries/MapRegistry.ts'
import { TRACKBACK_SIMULATION_CALIBRATION_V0_1 as cal } from '../src/data/calibration/TrackbackSimulationCalibration.ts'
const module=await WebAssembly.compile(readFileSync(new URL('../src/runtime/c/generated/vehicle-sw.wasm',import.meta.url)))
const build=JSON.parse(readFileSync(new URL('../src/runtime/c/generated/build.json',import.meta.url),'utf8'))
await RAPIER.init()
const map=createLoadedMap(loadMapDefinition(PROVING_GROUND_MAP_ID))
function setup(c=true) {
  const world=new RAPIER.World({x:0,y:-9.81,z:0})
  const physics=new RapierVehiclePhysics(RAPIER,world,dt=>{world.timestep=dt;world.step()},map.physics,map.surfaces)
  let telemetry
  const runtime=new SimulationRuntime(cal,t=>{telemetry=t},undefined,c?new WasmVehicleSw(module,cal):undefined)
  const detach=runtime.attach(physics)
  runtime.start();runtime.advance(0)
  return {runtime,read:()=>telemetry,run(ticks){for(let i=0;i<ticks;i++)runtime.advance(1/60)},clean(){detach();physics.dispose();world.free()}}
}
test('TC011/012 C + adapter + Rapier, independent physical response verdicts',()=>{
  const evidence=[]
  for(const [tc,gear,sign] of [['011','D',1],['012','R',-1]]){
    const r=setup()
    try{
      r.run(120)
      const initialVelocity=r.runtime.readVehicleState().longitudinalVelocity
      assert.ok(Math.abs(initialVelocity)<=cal.zeroSpeedToleranceMps.value)
      r.runtime.driverInput.setGearRequest(gear);r.runtime.driverInput.setAccelerator(1)
      r.run(Math.round(cal.responseWindowSeconds.value*60))
      const state=r.runtime.readVehicleState()
      const actual={longitudinalVelocity:state.longitudinalVelocity,longitudinalAcceleration:state.longitudinalAcceleration,vehicleSpeed:state.speed,vectorMagnitude:Math.hypot(state.linearVelocity.x,state.linearVelocity.y,state.linearVelocity.z)}
      assert.ok(actual.longitudinalVelocity*sign>0)
      assert.ok(actual.longitudinalAcceleration*sign>cal.minimumResponseAccelerationMps2.value)
      assert.ok(actual.vehicleSpeed>=0)
      assert.ok(Math.abs(actual.vehicleSpeed-actual.vectorMagnitude)<1e-9)
      assert.equal(r.read().vehicleSw.source,'C_WASM')
      evidence.push({testCaseId:`TC-PROP-NORMAL-${tc}`,requirementIds:['SYSR-PROP-010','SYSR-PROP-011','SWR-PHY-001','SWR-PHY-002'],testObject:'C SW + TS force adapter + Rapier Plant',input:{gear,accelerator:1,initialVelocity,responseWindow:cal.responseWindowSeconds.value},expected:{velocitySign:sign,accelerationSignedMinimum:cal.minimumResponseAccelerationMps2.value,nonnegativeVectorSpeed:true},actual,verdict:'PASS'})
    }finally{r.clean()}
  }
  const dir=new URL('../docs/evidence/',import.meta.url);mkdirSync(dir,{recursive:true})
  writeFileSync(new URL('c-plant-evidence.json',dir),JSON.stringify({binaryHash:build.binaryHash,evidence},null,2)+'\n')
})
test('C/TS game behavior equivalent including braking, steering, interlock, pause and reset',()=>{
  const c=setup(),ts=setup(false)
  try{
    const run=ticks=>{c.run(ticks);ts.run(ticks);assert.deepEqual(c.runtime.readVehicleState(),ts.runtime.readVehicleState())}
    const set=(fn,value)=>{c.runtime.driverInput[fn](value);ts.runtime.driverInput[fn](value)}
    run(120);set('setAccelerator',1);run(120)
    set('setGearRequest','R');run(6);assert.equal(c.read().vehicleSw.output.transitionAccepted,false)
    set('setSteering',.4);run(120);set('setSteering',0);set('setBrake',1);run(300)
    assert.ok(c.runtime.readVehicleState().speed<.1)
    c.runtime.pause();ts.runtime.pause();const snapshot=c.read().vehicleSw;run(120)
    assert.deepEqual(c.read().vehicleSw,snapshot)
    c.runtime.resume();ts.runtime.resume();run(60)
    c.runtime.reset();ts.runtime.reset();assert.equal(c.read().vehicleSw,null);run(1)
  }finally{c.clean();ts.clean()}
})
test('C snapshot captures consumed inputs and isolates published evidence from mutation',()=>{
  const r=setup()
  try{
    r.run(120);r.runtime.driverInput.setAccelerator(.5);r.run(6)
    const evidence=r.read().vehicleSw
    const consumed=Math.min(.5,cal.keyboardPedalResponse.acceleratorRisePerSecond*6/60)
    assert.ok(Math.abs(evidence.input.acceleratorPedalPosition-consumed)<1e-12)
    assert.equal(evidence.output.propulsionRequest.magnitude,evidence.input.acceleratorPedalPosition)
    const step=evidence.step;evidence.output.eDriveCommand.magnitudeNm=-999
    r.run(6);assert.equal(r.read().vehicleSw.step,step+6)
    assert.ok(r.read().vehicleSw.output.eDriveCommand.magnitudeNm>=0)
  }finally{r.clean()}
})

