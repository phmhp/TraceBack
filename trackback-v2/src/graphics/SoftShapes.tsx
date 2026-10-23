import { useEffect, useMemo } from 'react'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

type Vec3 = [number, number, number]
interface ShapeProps {
  position?: Vec3
  scale?: Vec3
  rotation?: Vec3
  color: string
  wireframe?: boolean
  roughness?: number
  metalness?: number
}
export function Blob({ position, scale = [1, 1, 1], rotation, color, wireframe = false, roughness = 0.65, metalness = 0 }: ShapeProps) {
  return <mesh position={position} scale={scale} rotation={rotation} castShadow receiveShadow>
    <sphereGeometry args={[1, 32, 24]} />
    <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} wireframe={wireframe} />
  </mesh>
}
export function SoftBox({ size, radius = 0.15, position, rotation, color, wireframe = false, roughness = 0.4, metalness = 0 }: ShapeProps & { size: Vec3; radius?: number }) {
  const [x, y, z] = size
  const geometry = useMemo(() => new RoundedBoxGeometry(x, y, z, 4, radius), [x, y, z, radius])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <mesh position={position} rotation={rotation} geometry={geometry} castShadow receiveShadow>
    <meshPhysicalMaterial color={color} roughness={roughness} metalness={metalness} clearcoat={wireframe ? 0 : 0.5} clearcoatRoughness={0.25} wireframe={wireframe} />
  </mesh>
}
