import test from 'node:test'
import assert from 'node:assert/strict'
import React, { Profiler, StrictMode, Suspense } from 'react'
import { useThree } from '@react-three/fiber'
import { create, act } from '@react-three/test-renderer'
import { createServer } from 'vite'
import { SimulationRuntime } from '../src/runtime/SimulationRuntime.ts'
import { createVehiclePose } from '../src/domain/vehicle/VehicleState.ts'
import { createLoadedMap } from '../src/world/MapLoader.ts'
import { loadMapDefinition, PROVING_GROUND_MAP_ID } from '../src/registries/MapRegistry.ts'
import { TRACKBACK_SIMULATION_CALIBRATION_V0_1 as cal } from '../src/data/calibration/TrackbackSimulationCalibration.ts'

test('real R3F bridge: one step owner, live mesh/camera, pause/resume, no per-tick React commits, StrictMode cleanup', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const server = await createServer({ server: { middlewareMode: true, hmr: false, watch: null }, logLevel: 'error' })
  let renderer
  try {
    const { RapierWorld } = await server.ssrLoadModule('/src/physics/RapierWorld.tsx')
    const { VehicleRenderer } = await server.ssrLoadModule('/src/graphics/VehicleRenderer.tsx')
    const { FollowCamera } = await server.ssrLoadModule('/src/graphics/FollowCamera.tsx')
    const presentedPose = createVehiclePose()
    const map = createLoadedMap(loadMapDefinition(PROVING_GROUND_MAP_ID))
    let status = 'idle'
    const runtime = new SimulationRuntime(cal, (hud) => { status = hud.status })
    let camera
    let commits = 0
    function Probe() { camera = useThree((state) => state.camera); return null }
    const tree = (showRace) => React.createElement(StrictMode, null,
      React.createElement(Profiler, { id: 'race-scene', onRender: () => { commits++ } },
        React.createElement(Suspense, { fallback: null }, React.createElement(RapierWorld, { runtime, map })),
        React.createElement(Probe),
        showRace && React.createElement(VehicleRenderer, { readState: runtime.readVehicleState, readPreviousPose: runtime.readPreviousPose, readAlpha: runtime.readInterpolationAlpha, presentedPose, originOffsetY: -0.65 }),
        showRace && React.createElement(FollowCamera, { readPose: () => presentedPose }),
      ),
    )
    runtime.start()
    renderer = await create(tree(true))
    for (let i = 0; status !== 'running' && i < 60; i++) {
      await act(async () => { await new Promise((resolve) => setTimeout(resolve, 50)) })
    }
    assert.equal(status, 'running', 'WASM + adapter must attach before advancing')
    await renderer.advanceFrames(121, 1 / 60)
    assert.equal(runtime.clock.currentTime, 2)
    runtime.driverInput.setAccelerator(1)
    const beforeDrivingCommits = commits
    await renderer.advanceFrames(240, 1 / 60)
    assert.equal(runtime.clock.currentTime, 6, 'library auto-step must remain disabled')
    const state = runtime.readVehicleState()
    assert.ok(state.position.z < map.physics.vehicleSpawn.position.z - 25)
    const mesh = renderer.scene.findByProps({ name: 'ego-vehicle' }).instance
    const previousZ = runtime.readPreviousPose().position.z
    const expectedZ = previousZ + (state.position.z - previousZ) * runtime.readInterpolationAlpha()
    assert.ok(Math.abs(mesh.position.z - expectedZ) < 0.001)
    assert.ok(camera.position.z > state.position.z && camera.position.z < state.position.z + 15)
    assert.equal(commits, beforeDrivingCommits, 'physics and camera updates must not commit React renders')
    // FollowCamera without a speed reader uses the current 9 m / 4.3 m dialogue-safe framing.
    const followDistance = Math.hypot(9, 4.3)
    for (let i = 0; i < 80; i++) {
      await renderer.advanceFrames(1, [1 / 144, 1 / 60, 1 / 30][i % 3])
      assert.ok(Math.abs(camera.position.distanceTo(mesh.position) - followDistance) < 1e-6, 'camera distance must not breathe at mixed frame rates')
      assert.deepEqual(mesh.scale.toArray(), [1, 1, 1])
    }
    const timeBeforePause = runtime.clock.currentTime

    runtime.pause()
    const parked = structuredClone(runtime.readVehicleState())
    await renderer.update(tree(false)) // X-RAY keeps the physics instance but removes the race presentation.
    await renderer.advanceFrames(120, 1 / 30)
    assert.equal(runtime.clock.currentTime, timeBeforePause)
    assert.deepEqual(runtime.readVehicleState(), parked)
    await renderer.update(tree(true))
    runtime.resume()
    await renderer.advanceFrames(61, 1 / 60)
    assert.ok(Math.abs(runtime.clock.currentTime - timeBeforePause - 1) < 1e-8)
    assert.ok(runtime.readVehicleState().position.z < parked.position.z - 1)
    await renderer.unmount()
    renderer = null
    runtime.reset() // Must not address an adapter/world already freed by React.
    assert.equal(runtime.clock.running, false)
  } finally {
    if (renderer) await renderer.unmount()
    await server.close()
  }
})

