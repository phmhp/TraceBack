import { useEffect, useMemo, useRef } from 'react'
import { ExtrudeGeometry, Shape } from 'three'
import type { Group } from 'three'
import { useFrame } from '@react-three/fiber'
import { Blob } from './SoftShapes'

const cream = '#f7e9d3'

/** Rounded triangular ears, with the base embedded into the head. */
function SoftEar({ side }: { side: number }) {
  const geometry = useMemo(() => {
    const shape = new Shape()
    shape.moveTo(-0.2, 0)
    shape.quadraticCurveTo(-0.24, 0.15, -0.12, 0.39)
    shape.quadraticCurveTo(-0.07, 0.49, 0.02, 0.39)
    shape.quadraticCurveTo(0.18, 0.24, 0.22, 0)
    shape.quadraticCurveTo(0, -0.07, -0.2, 0)
    return new ExtrudeGeometry(shape, {
      depth: 0.14, bevelEnabled: true, bevelThickness: 0.065,
      bevelSize: 0.055, bevelSegments: 5, steps: 1, curveSegments: 16,
    })
  }, [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <group position={[side * 0.43, 1.25, -0.08]} rotation={[0, 0, side * -0.13]}>
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={cream} roughness={0.85} />
    </mesh>
    <Blob position={[-0.02, 0.2, -0.065]} scale={[0.095, 0.16, 0.014]} rotation={[0, 0, 0.17]} color="#eed4c6" roughness={0.9} />
  </group>
}

/** Cream plush-like driver inspired by the latest references. Presentation only. */
export function CatDriver({ celebrating = false }: { celebrating?: boolean }) {
  const root = useRef<Group>(null)
  const leftArm = useRef<Group>(null)
  const rightArm = useRef<Group>(null)
  useFrame(({ clock }, delta) => {
    const blend = 1 - Math.exp(-7 * Math.min(delta, .1))
    if (root.current) {
      root.current.rotation.y += ((celebrating ? Math.PI : 0) - root.current.rotation.y) * blend
      root.current.position.y = .94 + (celebrating ? Math.abs(Math.sin(clock.elapsedTime * 7)) * .12 : 0)
    }
    if (leftArm.current) leftArm.current.rotation.z += ((celebrating ? -2.55 : 0) - leftArm.current.rotation.z) * blend
    if (rightArm.current) rightArm.current.rotation.z += ((celebrating ? 2.55 : 0) - rightArm.current.rotation.z) * blend
  })
  return <group ref={root} position={[0, 0.94, 0.15]}>
    <Blob position={[0, 0.3, 0.05]} scale={[0.39, 0.43, 0.32]} color={cream} roughness={0.85} />
    <SoftEar side={-1} />
    <SoftEar side={1} />
    <Blob position={[0, 0.96, -0.04]} scale={[0.7, 0.55, 0.52]} color={cream} roughness={0.85} />
    {[-1, 1].map((side) => <group key={side}>
      <Blob position={[side * 0.18, 0.99, -0.548]} scale={[0.047, 0.075, 0.022]} color="#343332" roughness={0.55} />
      <group ref={side < 0 ? leftArm : rightArm} position={[side * .31, .42, -.2]}>
        <Blob position={[0, -0.18, -0.09]} scale={[0.16, 0.235, 0.16]} rotation={[0.5, 0, side * -0.45]} color={cream} roughness={0.85} />
        <Blob position={[-side * .05, -0.26, -0.29]} scale={[0.17, 0.13, 0.14]} color={cream} roughness={0.85} />
      </group>
    </group>)}
    <group position={[0.4, 0.12, 0.33]} rotation={[0, 0.4, 0]}>
      <mesh rotation={[0, 0, -0.5]} castShadow>
        <torusGeometry args={[0.23, 0.09, 12, 32, Math.PI * 1.2]} />
        <meshStandardMaterial color={cream} roughness={0.85} />
      </mesh>
      <Blob position={[0.2, -0.11, 0]} scale={[0.095, 0.095, 0.095]} color={cream} roughness={0.85} />
    </group>
  </group>
}
