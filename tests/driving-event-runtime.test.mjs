import test from 'node:test'
import assert from 'node:assert/strict'
import RAPIER from '@dimforge/rapier3d-compat'
import { SimulationRuntime } from '../src/runtime/SimulationRuntime.ts'
import { RapierVehiclePhysics } from '../src/physics/rapier/RapierVehiclePhysics.ts'
import { createLoadedMap } from '../src/world/MapLoader.ts'
import { loadMapDefinition, PROVING_GROUND_MAP_ID } from '../src/registries/MapRegistry.ts'
import { TRACKBACK_SIMULATION_CALIBRATION_V0_1 as calibration } from '../src/data/calibration/TrackbackSimulationCalibration.ts'
import { RecoveryChallenge, createMemoryBestTimeStore, createRecoveryTrack } from '../src/runtime/gameplay/RecoveryChallenge.ts'
import { STOPPED_VEHICLE_AVOIDANCE_EVENT } from '../src/data/gameplay/DrivingEvents.ts'

await RAPIER.init()

test('verified recovery starts a visible, collidable stopped-vehicle driving event',()=>{
  const map=createLoadedMap(loadMapDefinition(PROVING_GROUND_MAP_ID)),route=map.definition.routes[0]
  const world=new RAPIER.World({x:0,y:-9.81,z:0}),physics=new RapierVehiclePhysics(RAPIER,world,(dt)=>{world.timestep=dt;world.step()},map.physics,map.surfaces)
  let telemetry
  const runtime=new SimulationRuntime(calibration,value=>{telemetry=value}),detach=runtime.attach(physics)
  const challenge=new RecoveryChallenge(createRecoveryTrack(map.definition.mapId,route,'EVENT-TEST'),{id:'EVENT-TEST',trackId:map.definition.mapId,version:'g1',title:'Event test',rulesVersion:'g1'},createMemoryBestTimeStore())
  try{
    runtime.configureRoute(route.orderedPoints);runtime.configureRecoveryChallenge(challenge,()=>{});runtime.configureDrivingEvent(STOPPED_VEHICLE_AVOIDANCE_EVENT)
    runtime.start();runtime.unlockRecoveryChallenge();runtime.startRecoveryChallenge()
    assert.equal(runtime.readScenarioLeadVehiclePose().available,true)
    assert.equal(telemetry.drivingEvent.status,'ACTIVE')
    assert.equal(telemetry.drivingEvent.id,'EVENT-STOPPED-VEHICLE-001')
  }finally{detach();physics.dispose();world.free()}
})
