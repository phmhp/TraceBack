import test from 'node:test'
import assert from 'node:assert/strict'
import RAPIER from '@dimforge/rapier3d-compat'
import { RapierVehiclePhysics } from '../src/physics/rapier/RapierVehiclePhysics.ts'
import { SimulationRuntime } from '../src/runtime/SimulationRuntime.ts'
import { createLoadedMap } from '../src/world/MapLoader.ts'
import { loadMapDefinition, PROVING_GROUND_MAP_ID } from '../src/registries/MapRegistry.ts'
import { TRACKBACK_SIMULATION_CALIBRATION_V0_1 as cal } from '../src/data/calibration/TrackbackSimulationCalibration.ts'
await RAPIER.init()
const map = createLoadedMap(loadMapDefinition(PROVING_GROUND_MAP_ID))

function setup() {
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 })
  const physics = new RapierVehiclePhysics(RAPIER, world, (dt) => { world.timestep = dt; world.step() }, map.physics, map.surfaces)
  const runtime = new SimulationRuntime(cal)
  const detach = runtime.attach(physics)
  runtime.start(); runtime.advance(0)
  const run = (ticks) => { for (let i = 0; i < ticks; i++) runtime.advance(1 / 60) }
  return { world, runtime, run, physics, clean() { detach(); physics.dispose(); world.free() } }
}
test('real Rapier gravity/contact, -Z acceleration and braking to rest in fixed D', () => {
  const r = setup()
  try {
    const initialY = r.runtime.readVehicleState().position.y
    r.run(120)
    assert.ok(r.runtime.readVehicleState().position.y < initialY)
    assert.ok(r.runtime.readVehicleState().position.y > 0.5)
    r.runtime.driverInput.setAccelerator(1); r.run(240)
    const driven = structuredClone(r.runtime.readVehicleState())
    assert.ok(driven.position.z < map.physics.vehicleSpawn.position.z - 25)
    assert.ok(driven.speed > 10)
    r.runtime.driverInput.setBrake(1); r.run(120)
    assert.ok(r.runtime.readVehicleState().speed < 0.1)
    const stoppedZ = r.runtime.readVehicleState().position.z
    r.run(180)
    assert.ok(Math.abs(r.runtime.readVehicleState().position.z - stoppedZ) < 0.02)
    console.log(`Drive: ${(driven.speed * 3.6).toFixed(1)} km/h, z=${driven.position.z.toFixed(1)}m; full brake: stopped.`)
  } finally { r.clean() }
})
test('TC-PROP-NORMAL-011/012 real Rapier responds forward and reverse from near-stationary state', () => {
  for (const scenario of [{ gear: 'D', sign: 1 }, { gear: 'R', sign: -1 }]) {
    const r = setup()
    try {
      r.run(120)
      assert.ok(Math.abs(r.runtime.readVehicleState().longitudinalVelocity) <= 0.1)
      r.runtime.driverInput.setGearRequest(scenario.gear)
      r.runtime.driverInput.setAccelerator(1)
      r.run(60)
      const state = r.runtime.readVehicleState()
      assert.ok(state.longitudinalAcceleration * scenario.sign > 0.05)
      assert.ok(state.longitudinalVelocity * scenario.sign > 0)
      assert.ok(Number.isFinite(state.speed) && state.speed >= 0)
      assert.ok(Math.abs(state.speed - Math.hypot(state.linearVelocity.x, state.linearVelocity.y, state.linearVelocity.z)) < 1e-9)
    } finally { r.clean() }
  }
})
test('runtime exposes rejected D to R request while preserving valid actual gear', () => {
  const r = setup()
  try {
    r.run(120); r.runtime.driverInput.setAccelerator(1); r.run(120)
    assert.ok(r.runtime.readVehicleState().longitudinalVelocity > 0.5)
    r.runtime.driverInput.setGearRequest('R'); r.run(6)
    assert.equal(r.runtime.readVehicleState().gearState, 'D')
  } finally { r.clean() }
})
test('left/right steering have correct signs and remain stable over sustained cornering', () => {
  for (const steering of [-1, 1]) {
    const r = setup()
    try {
      r.run(120)
      r.runtime.driverInput.setAccelerator(1); r.run(120)
      r.runtime.driverInput.setSteering(steering); r.run(60)
      assert.ok(r.runtime.readVehicleState().position.x * steering > 2)
      r.run(2400)
      const state = r.runtime.readVehicleState()
      assert.ok(Number.isFinite(state.speed) && state.speed < 25)
      assert.ok(state.position.y > 0.4 && state.position.y < 1)
      assert.ok(Math.abs(state.rotation.x) < 0.001 && Math.abs(state.rotation.z) < 0.001)
    } finally { r.clean() }
  }
})
test('real physics is unchanged while paused; resume moves again; reset recreates original spawn', () => {
  const r = setup()
  try {
    r.run(120)
    r.runtime.driverInput.setAccelerator(1); r.run(120)
    r.runtime.pause()
    const paused = structuredClone(r.runtime.readVehicleState())
    const time = r.runtime.clock.currentTime
    r.run(600)
    assert.deepEqual(r.runtime.readVehicleState(), paused)
    assert.equal(r.runtime.clock.currentTime, time)
    r.runtime.resume(); r.runtime.advance(100)
    assert.deepEqual(r.runtime.readVehicleState(), paused)
    r.runtime.driverInput.setAccelerator(1); r.run(60)
    assert.ok(r.runtime.readVehicleState().position.z < paused.position.z - 1)
    r.runtime.reset()
    assert.equal(r.runtime.clock.currentTime, 0)
    assert.equal(r.runtime.readVehicleState().position.z, map.physics.vehicleSpawn.position.z)
    assert.equal(r.runtime.readVehicleState().speed, 0)
  } finally { r.clean() }
})
test('repeated session attachment/disposal leaves no rigid bodies or controller references', () => {
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 })
  try {
    const runtime = new SimulationRuntime(cal)
    for (let i = 0; i < 10; i++) {
      const physics = new RapierVehiclePhysics(RAPIER, world, (dt) => { world.timestep = dt; world.step() }, map.physics, map.surfaces)
      const detach = runtime.attach(physics)
      assert.equal(world.bodies.len(), 2 + map.physics.staticColliders.length)
      detach(); physics.dispose(); physics.dispose()
      assert.equal(world.bodies.len(), 0)
    }
  } finally { world.free() }
})
