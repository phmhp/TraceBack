import { useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Physics, useRapier } from '@react-three/rapier'
import type { SimulationRuntime } from '../runtime/SimulationRuntime'
import { PHYSICS_TIMESTEP } from '../core/SimulationClock'
import { RapierVehiclePhysics } from './rapier/RapierVehiclePhysics'
import { phase2Physics } from './rapier/phase2Config'
import type { LoadedMap } from '../world/MapLoader.ts'

function RuntimeBridge({ runtime, map }: { runtime: SimulationRuntime; map: LoadedMap }) {
  const { rapier, world, step } = useRapier()
  // Dispose child engine resources in layout cleanup, before Physics frees its world in passive cleanup.
  useLayoutEffect(() => {
    const adapter = new RapierVehiclePhysics(rapier, world, step, map.physics, map.surfaces)
    const detach = runtime.attach(adapter)
    return () => { detach(); adapter.dispose() }
  }, [runtime, map, rapier, world, step])
  useFrame((_, delta) => {
    try { runtime.advance(delta) } catch (error) {
      runtime.fail(error instanceof Error ? error.message : 'Physics step failed')
    }
  }, -100)
  return null
}
export function RapierWorld({ runtime, map }: { runtime: SimulationRuntime; map: LoadedMap }) {
  return <Physics gravity={[phase2Physics.gravity.x, phase2Physics.gravity.y, phase2Physics.gravity.z]}
    timeStep={PHYSICS_TIMESTEP} paused interpolate={false} colliders={false} debug={physicsDebugOptions.showColliders}>
    {/* paused disables library auto-stepping. Only runtime.advance may invoke context.step. */}
    <RuntimeBridge runtime={runtime} map={map} />
  </Physics>
}
export const physicsDebugOptions={showColliders:false}
