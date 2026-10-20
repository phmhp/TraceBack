import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { lookPresets, moveLook, matchingSockets, socketWire, socketsFor, trialTrace, driveGate } from '../src/game/interaction.ts'
import { referenceGraph, MISSIONS, starter } from '../src/content/ready.ts'
import { verify } from '../src/engine/verification.ts'
import { connect } from '../src/engine/graph.ts'
import { createDrivingRuntime, LearnerVehicleSw, drivingWorld, drivingSurfaces } from '../src/game/driving/DrivingRuntime.ts'
import { RapierVehiclePhysics } from '../simulation/src/physics/rapier/RapierVehiclePhysics.ts'
import Rapier from '@dimforge/rapier3d-compat'

test('look movement is clamped, independent of driving, with pedal/gear presets', () => {
  assert.ok(lookPresets.pedals.pitch < -.7)
  assert.ok(Math.abs(lookPresets.gear.yaw) > .5)
  for (const [dx, dy] of [[1e6, 1e6], [-1e6, -1e6]]) {
    const look = moveLook(lookPresets.road, dx, dy)
    assert.ok(look.yaw >= -1.15 && look.yaw <= 1.15)
    assert.ok(look.pitch >= -1.15 && look.pitch <= .24)
  }
})
test('click-click supports either order, rejects same-side/type, and preserves graph validation', () => {
  const graph = starter(), sockets = socketsFor(graph)
  const output = sockets.find(s => s.node === 'power'), input = sockets.find(s => s.node === 'both' && s.port === 'a')
  assert.ok(matchingSockets(output, input)); assert.ok(matchingSockets(input, output))
  const a = socketWire(input, output), b = socketWire(output, input)
  assert.deepEqual({ ...a, id: '' }, { ...b, id: '' })
  assert.equal(connect(graph, a).edges.length, 1)
  assert.throws(() => socketWire(output, { ...input, direction: 'out' }))
  assert.throws(() => socketWire(output, { ...input, type: 'state' }))
})
test('replay samples use real evaluator and agree with independent official verdicts, including broken graphs', () => {
  for (const graph of [starter(), referenceGraph(), referenceGraph(true)]) for (const mission of MISSIONS) {
    for (const result of verify(graph, mission)) {
      const trace = trialTrace(graph, mission, result.id)
      assert.equal(trace.every(s => s.pass), result.pass, `${mission.id}/${result.id}`)
    }
  }
  assert.equal(driveGate({ state: 'STANDBY', outputs: { request: true }, issues: [] }), false)
  assert.equal(driveGate({ state: 'READY', outputs: { drive: true }, issues: [] }), true)
  assert.equal(driveGate({ state: 'READY', outputs: { drive: true }, issues: [{}] }), false)
})
const wasm = await WebAssembly.compile(await readFile(new URL('../simulation/src/runtime/c/generated/vehicle-sw.wasm', import.meta.url)))
test('learner gate reaches C inputs before torque computation, not just a lamp', () => {
  let ready = false
  const sw = new LearnerVehicleSw(wasm, () => ready)
  const input = { acceleratorPedalPosition: .6, acceleratorPedalValidity: 'VALID', gearRequest: 'D', gearRequestValidity: 'VALID', vehicleReady: true, propulsionEnable: true, longitudinalVelocity: 0, vehicleSpeed: 0 }
  assert.equal(sw.step(input).eDriveCommand.magnitudeNm, 0)
  ready = true
  assert.ok(sw.step(input).eDriveCommand.magnitudeNm > 50)
  ready = false
  assert.equal(sw.step(input).eDriveCommand.magnitudeNm, 0)
})
test('new game runtime performs real Rapier driving, steering, braking, reverse, and pause without legacy UI', async () => {
  await Rapier.init()
  const world = new Rapier.World({ x: 0, y: -9.81, z: 0 })
  const physics = new RapierVehiclePhysics(Rapier, world, dt => { world.timestep = dt; world.step() }, drivingWorld, drivingSurfaces)
  let enabled = false, telemetry
  const runtime = createDrivingRuntime(wasm, () => enabled, t => { telemetry = t })
  const detach = runtime.attach(physics)
  const advance = seconds => { for (let i = 0; i < seconds * 60; i++) runtime.advance(1 / 60) }
  try {
    runtime.start(); runtime.driverInput.setAccelerator(.6); advance(3)
    assert.ok(Math.abs(runtime.readVehicleState().longitudinalVelocity) < .01)
    assert.ok(Math.abs(runtime.readVehicleState().position.z) < .01)
    assert.equal(telemetry.vehicleSw.input.vehicleReady, false)
    enabled = true; advance(4)
    assert.ok(telemetry.speedKmh > 20)
    assert.ok(runtime.readVehicleState().position.z < -8)
    runtime.driverInput.setSteering(.25); advance(.5)
    assert.ok(Math.abs(runtime.readVehicleState().rotation.y) > .002)
    runtime.driverInput.setSteering(0); runtime.driverInput.setAccelerator(0); runtime.driverInput.setBrake(1); advance(3)
    assert.ok(telemetry.speedKmh < 1)
    runtime.driverInput.setBrake(0); runtime.driverInput.setGearRequest('R'); runtime.driverInput.setAccelerator(.4); advance(3)
    assert.equal(telemetry.gear, 'R'); assert.ok(telemetry.longitudinalVelocity < -.3)
    runtime.pause(); const before = structuredClone(runtime.readVehicleState()); advance(2)
    assert.deepEqual(runtime.readVehicleState(), before)
  } finally { runtime.pause(); detach(); physics.dispose(); world.free() }
})
