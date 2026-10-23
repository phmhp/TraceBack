import { SimulationRuntime } from '../../../simulation/src/runtime/SimulationRuntime.ts'
import { WasmVehicleSw } from '../../../simulation/src/runtime/c/WasmVehicleSw.ts'
import type { VehicleSwInput } from '../../../simulation/src/runtime/c/VehicleSwPort.ts'
import { TRACKBACK_SIMULATION_CALIBRATION_V0_1 as calibration } from '../../../simulation/src/data/calibration/TrackbackSimulationCalibration.ts'
import type { RaceTelemetry } from '../../../simulation/src/runtime/SimulationRuntime.ts'
import type { WorldPhysicsDefinition, SurfaceInfoProvider } from '../../../simulation/src/domain/world/MapDefinition.ts'
/** Learner READY/drive output gates the original C execution, before torque calculation. */
export class LearnerVehicleSw extends WasmVehicleSw {
  private allowed: () => boolean
  constructor(module: WebAssembly.Module, allowed: () => boolean) { super(module, calibration); this.allowed = allowed }
  override step(input: VehicleSwInput) { const enabled = this.allowed(); return super.step({ ...input, vehicleReady: enabled, propulsionEnable: enabled }) }
}
export function createDrivingRuntime(module: WebAssembly.Module, allowed: () => boolean, publish: (t: RaceTelemetry) => void,ceiling?:()=>number|undefined) {
  const runtime = new SimulationRuntime(calibration, publish, undefined, new LearnerVehicleSw(module, allowed))
  runtime.configureReadyGate(allowed)
  if(ceiling)runtime.configureTeachingTorqueCeiling(ceiling)
  return runtime
}
export const drivingWorld: WorldPhysicsDefinition = {
  bounds: { minX: -250, maxX: 250, minZ: -550, maxZ: 250 },
  groundPosition: { x: 0, y: -.5, z: -150 }, groundHalfExtents: { x: 250, y: .5, z: 400 },
  vehicleSpawn: { position: { x: 0, y: .9, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 } },
  staticColliders: [-1, 1].map(side => ({ id: `track-rail-${side}`, position: { x: side * 11, y: .6, z: -150 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, halfExtents: { x: .2, y: .6, z: 250 }, friction: 1.3 })),
}
export const drivingSurfaces: SurfaceInfoProvider = { getSurfaceAt: p => ({ surfaceType: Math.abs(p.x) < 9 ? 'ASPHALT_DRY' : 'GRAVEL', friction: Math.abs(p.x) < 9 ? 2.2 : 1.2, rollingResistance: .018, displayMaterial: 'teaching-track' }) }
