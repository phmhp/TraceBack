export interface Vector3Value { x: number; y: number; z: number }
export interface QuaternionValue extends Vector3Value { w: number }

/** Engine-independent state. Metres, seconds, m/s, rad/s; Y-up, vehicle forward = -Z. */
import type { Gear } from '../driver/DriverInputTypes.ts'

export interface VehicleState {
  position: Vector3Value
  rotation: QuaternionValue
  linearVelocity: Vector3Value
  angularVelocity: Vector3Value
  speed: number
  longitudinalVelocity: number
  longitudinalAcceleration: number
  gearState: Gear
}
export function createVehicleState(): VehicleState {
  return {
    position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 },
    linearVelocity: { x: 0, y: 0, z: 0 }, angularVelocity: { x: 0, y: 0, z: 0 },
    speed: 0, longitudinalVelocity: 0, longitudinalAcceleration: 0, gearState: 'D',
  }
}
/** Borrowed live view, valid until the next physics tick. This is not a saved snapshot. */
export type VehicleStateReader = () => Readonly<Omit<VehicleState, 'position' | 'rotation' | 'linearVelocity' | 'angularVelocity'> & {
  position: Readonly<Vector3Value>; rotation: Readonly<QuaternionValue>
  linearVelocity: Readonly<Vector3Value>; angularVelocity: Readonly<Vector3Value>
}>

export interface VehiclePose { position: Vector3Value; rotation: QuaternionValue }
export type VehiclePoseReader = () => Readonly<{ position: Readonly<Vector3Value>; rotation: Readonly<QuaternionValue> }>
export function createVehiclePose(): VehiclePose {
  return { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 } }
}
