import test from 'node:test'
import assert from 'node:assert/strict'
import RAPIER from '@dimforge/rapier3d-compat'
import { SimulationRuntime } from '../src/runtime/SimulationRuntime.ts'
import { RapierVehiclePhysics } from '../src/physics/rapier/RapierVehiclePhysics.ts'
import { createLoadedMap } from '../src/world/MapLoader.ts'
import { loadMapDefinition, PROVING_GROUND_MAP_ID } from '../src/registries/MapRegistry.ts'
import { TRACKBACK_SIMULATION_CALIBRATION_V0_1 as calibration } from '../src/data/calibration/TrackbackSimulationCalibration.ts'
import { scheduledStimulusValue, techniqueCandidates, validateVehicleScenario } from '../src/runtime/scenario/VehicleScenario.ts'

await RAPIER.init()
const map=createLoadedMap(loadMapDefinition(PROVING_GROUND_MAP_ID))
const definition={id:'scenario-test',name:'Accelerator step',scope:{domain:'Vehicle Motion',targetType:'ACTUATION_PLANT',targetId:'VehiclePhysics'},preconditions:{gear:'D',vehicleAtRest:true},stimuli:[{target:{category:'DRIVER_INPUT',id:'accelerator',label:'Accelerator'},profile:{kind:'STEP',from:0,to:.7,atSeconds:.25},startTimeSeconds:.5,durationSeconds:1}],monitors:['accelerator','eDriveCommand','driveForce','speedKmh','longitudinalAcceleration','positionZ'],expectedCriterion:{kind:'OBSERVATION_ONLY',description:'관찰 전용'},durationSeconds:2,observationWindow:{startSeconds:.5,endSeconds:2},reset:{resetVehicle:true,resetDriverInputs:true,replayable:true}}

test('vehicle scenario scheduler supports real constant, step, and linear ramp values',()=>{
  const base={target:{category:'DRIVER_INPUT',id:'accelerator',label:'Accelerator'},startTimeSeconds:1,durationSeconds:2}
  assert.equal(scheduledStimulusValue({...base,profile:{kind:'CONSTANT',value:.4}},.5),0)
  assert.equal(scheduledStimulusValue({...base,profile:{kind:'CONSTANT',value:.4}},1.5),.4)
  assert.equal(scheduledStimulusValue({...base,profile:{kind:'STEP',from:.1,to:.8,atSeconds:.5}},1.25),.1)
  assert.equal(scheduledStimulusValue({...base,profile:{kind:'STEP',from:.1,to:.8,atSeconds:.5}},1.5),.8)
  assert.equal(scheduledStimulusValue({...base,profile:{kind:'LINEAR_RAMP',from:0,to:1,durationSeconds:2}},2),.5)
  assert.deepEqual(techniqueCandidates('accelerator','BOUNDARY_VALUE_ANALYSIS'),[0,.05,.95,1])
  assert.deepEqual(techniqueCandidates('steering','EQUIVALENCE_CLASS_ANALYSIS'),[-.5,0,.5])
  assert.doesNotThrow(()=>validateVehicleScenario(definition))
})

test('vehicle scenario drives the actual Rapier runtime and records synchronized monitors',()=>{
  const world=new RAPIER.World({x:0,y:-9.81,z:0})
  const physics=new RapierVehiclePhysics(RAPIER,world,(dt)=>{world.timestep=dt;world.step()},map.physics,map.surfaces)
  const runtime=new SimulationRuntime(calibration)
  const detach=runtime.attach(physics)
  try{
    runtime.startVehicleScenario(definition)
    runtime.advance(0)
    for(let i=0;i<150;i++)runtime.advance(1/60)
    const first=runtime.getScenarioSnapshot(),state=runtime.readVehicleState()
    assert.equal(first.status,'COMPLETED')
    assert.equal(first.phase,'RESULT')
    assert.ok(first.samples.length>=119)
    assert.ok(first.samples.every(sample=>Object.keys(sample.values).length===definition.monitors.length))
    assert.ok(first.samples.some(sample=>Number(sample.values.accelerator)>.1))
    assert.ok(first.samples.some(sample=>Number(sample.values.driveForce)>0))
    assert.ok(state.position.z<map.physics.vehicleSpawn.position.z-.05)
    const firstSpeed=Number(first.samples.at(-1).values.speedKmh)
    runtime.replayVehicleScenario();runtime.advance(0)
    for(let i=0;i<150;i++)runtime.advance(1/60)
    const replay=runtime.getScenarioSnapshot()
    assert.equal(replay.status,'COMPLETED')
    assert.ok(Math.abs(Number(replay.samples.at(-1).values.speedKmh)-firstSpeed)<1e-6)
  }finally{detach();physics.dispose();world.free()}
})

test('vehicle scenario executes interface injection, records recovery, and truly re-executes it on replay',()=>{
  const injected={...definition,id:'scenario-interface-fi',name:'Interface override',scope:{domain:'Propulsion',targetType:'INTERFACE_BOUNDARY',targetId:'eDrive->DriveAdapter'},verification:{method:'FAULT_INJECTION',executionMode:'VEHICLE_SCENARIO_TEST'},faultInjection:{id:'fi-1',name:'EDrive override',injectionPointId:'INTERFACE.EDRIVE_TO_DRIVE_ADAPTER.EDRIVE_COMMAND',targetType:'INTERFACE_BOUNDARY',targetId:'eDrive->DriveAdapter',faultType:'OVERRIDE_VALUE',activationStartSeconds:.9,activationEndSeconds:1.4,injectedValue:5,recoveryMode:'RESTORE_ORIGINAL_PATH',enabled:true}}
  const world=new RAPIER.World({x:0,y:-9.81,z:0})
  const physics=new RapierVehiclePhysics(RAPIER,world,(dt)=>{world.timestep=dt;world.step()},map.physics,map.surfaces)
  const runtime=new SimulationRuntime(calibration)
  const detach=runtime.attach(physics)
  const execute=()=>{runtime.advance(0);for(let i=0;i<150;i++)runtime.advance(1/60);return runtime.getScenarioSnapshot().completedRun}
  try{
    runtime.startVehicleScenario(injected)
    const first=execute()
    assert.equal(first.verdict,'OBSERVED')
    assert.equal(first.interfaceComparison,'MISMATCH')
    assert.equal(first.events.faultStart,.9)
    assert.equal(first.events.faultEnd,1.4)
    const active=first.faultTelemetry.filter(item=>item.active)
    assert.ok(active.length>0)
    assert.ok(active.every(item=>item.originalValue.magnitudeNm!==item.deliveredValue.magnitudeNm))
    assert.ok(first.faultTelemetry.some(item=>item.recoveryState==='RESTORED'))
    assert.ok(first.interfaceTelemetry.some(item=>item.comparisonStatus==='MATCH'))
    assert.ok(first.interfaceTelemetry.some(item=>item.comparisonStatus==='MISMATCH'))
    runtime.replayVehicleScenario()
    const replay=execute()
    assert.deepEqual(replay.definition.faultInjection,first.definition.faultInjection)
    assert.equal(replay.faultTelemetry.filter(item=>item.active).length,active.length)
    assert.equal(replay.interfaceComparison,'MISMATCH')
  }finally{detach();physics.dispose();world.free()}
})
