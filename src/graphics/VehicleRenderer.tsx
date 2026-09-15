import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Quaternion } from 'three'
import type { Group } from 'three'
import type { VehiclePose, VehiclePoseReader, VehicleStateReader } from '../domain/vehicle/VehicleState'
import { PlaceholderVehicle } from './PlaceholderVehicle'

/** Physics pose interpolation is presentation-only. Never writes back to the physics state. */
export function VehicleRenderer({ readState, readPreviousPose, readAlpha, presentedPose, originOffsetY, readSteering = () => 0, celebrating = false }: {
  readState: VehicleStateReader; readPreviousPose: VehiclePoseReader; readAlpha: () => number
  presentedPose: VehiclePose; originOffsetY: number; readSteering?: () => number; celebrating?: boolean
}) {
  const model = useRef<Group>(null)
  const quaternions = useRef({ previous: new Quaternion(), current: new Quaternion() })
  const wheelAngle = useRef(0)
  useFrame((_, delta) => {
    if (!model.current) return
    const current = readState()
    const previous = readPreviousPose()
    const alpha = readAlpha()
    model.current.position.set(
      previous.position.x + (current.position.x - previous.position.x) * alpha,
      previous.position.y + (current.position.y - previous.position.y) * alpha,
      previous.position.z + (current.position.z - previous.position.z) * alpha,
    )
    const a = previous.rotation
    const b = current.rotation
    quaternions.current.previous.set(a.x, a.y, a.z, a.w)
    quaternions.current.current.set(b.x, b.y, b.z, b.w)
    model.current.quaternion.slerpQuaternions(quaternions.current.previous, quaternions.current.current, alpha)
    wheelAngle.current -= current.speed * Math.min(delta, .1) / .425
    model.current.traverse((object) => {
      if (object.name === 'wheel-spin') object.rotation.z = wheelAngle.current
      else if (object.name.startsWith('front-wheel-')) object.rotation.y = -readSteering() * .45
    })
    Object.assign(presentedPose.position, {
      x: model.current.position.x, y: model.current.position.y, z: model.current.position.z,
    })
    Object.assign(presentedPose.rotation, {
      x: model.current.quaternion.x, y: model.current.quaternion.y,
      z: model.current.quaternion.z, w: model.current.quaternion.w,
    })
  }, -50)
  return <group ref={model} name="ego-vehicle"><group position={[0, originOffsetY, 0]}>
    <PlaceholderVehicle celebrating={celebrating} />
  </group></group>
}
