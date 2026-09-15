import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { PerspectiveCamera } from 'three'
import type { VehiclePoseReader, VehicleStateReader } from '../domain/vehicle/VehicleState'

export function FollowCamera({ readPose, readState }: { readPose: VehiclePoseReader; readState?: VehicleStateReader }) {
  const heading = useRef<number | null>(null)
  useFrame(({ camera }, delta) => {
    // Read the SAME interpolated pose used by the mesh, after VehicleRenderer (-50).
    const { position, rotation: q } = readPose()
    const yaw = Math.atan2(2 * (q.w * q.y + q.x * q.z), 1 - 2 * (q.y * q.y + q.z * q.z))
    const previous = heading.current ?? yaw
    const difference = Math.atan2(Math.sin(yaw - previous), Math.cos(yaw - previous))
    heading.current = previous + difference * (1 - Math.exp(-7 * Math.min(delta, 0.1)))
    const sin = Math.sin(heading.current)
    const cos = Math.cos(heading.current)
    // Constant follow distance: smoothing translation separately caused apparent scale "breathing".
    // Position smoothing already happened in the shared render pose; only heading lags gently.
    const speed = readState?.().speed ?? 0
    const distance = 7 + Math.min(1.35, speed * .065)
    camera.position.set(position.x + sin * distance, position.y + 3.1, position.z + cos * distance)
    camera.lookAt(position.x - sin * 4, position.y + 0.8, position.z - cos * 4)
    if (camera instanceof PerspectiveCamera) {
      const targetFov = 42 + Math.min(7, speed * .32)
      camera.fov += (targetFov - camera.fov) * (1 - Math.exp(-3 * Math.min(delta, .1)))
      camera.updateProjectionMatrix()
    }
  }, -10)
  return null
}
