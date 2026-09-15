import { Blob, SoftBox } from './SoftShapes'

function Tree({ x, z, size = 1 }: { x: number; z: number; size?: number }) {
  return <group position={[x, 0, z]} scale={size}>
    <mesh position={[0, 1, 0]} castShadow><cylinderGeometry args={[0.22, 0.34, 2, 12]} /><meshStandardMaterial color="#ac8d70" /></mesh>
    <Blob position={[0, 2.65, 0]} scale={[1.45, 1.5, 1.2]} color="#8bbf83" />
    <Blob position={[-0.75, 2.25, 0.15]} scale={[0.85, 0.95, 0.85]} color="#a6cd8d" />
    <Blob position={[0.7, 2.45, 0.1]} scale={[0.85, 1.05, 0.8]} color="#a3cc90" />
    {[[-0.55, 2.7, -0.93], [0.55, 2.2, -0.93], [0.05, 3.35, -0.88]].map((p, i) => <Blob key={i} position={p as [number, number, number]} scale={[0.19, 0.2, 0.19]} color="#efa493" />)}
  </group>
}
function Cottage({ x, z, color }: { x: number; z: number; color: string }) {
  return <group position={[x, 0, z]}>
    <SoftBox size={[3.3, 2.5, 2.7]} position={[0, 1.25, 0]} radius={0.18} color="#fff0ce" />
    <mesh position={[0, 3.15, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[2.8, 1.7, 4]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>
    <SoftBox size={[0.83, 1.65, 0.16]} position={[0, 0.9, -1.38]} radius={0.12} color="#93bdb7" />
    {[-1, 1].map((side) => <SoftBox key={side} size={[0.65, 0.7, 0.14]} position={[side, 1.43, -1.39]} radius={0.12} color="#a4d5dc" />)}
    <Blob position={[0.24, 0.9, -1.5]} scale={[0.06, 0.06, 0.06]} color="#e4b066" />
  </group>
}
function Flower({ x, z, color }: { x: number; z: number; color: string }) {
  return <group position={[x, 0.12, z]}>
    <mesh position={[0, 0.15, 0]}><cylinderGeometry args={[0.018, 0.018, 0.3, 5]} /><meshStandardMaterial color="#689268" /></mesh>
    {Array.from({ length: 5 }, (_, i) => <Blob key={i} position={[Math.cos(i * Math.PI * 0.4) * 0.1, 0.32, Math.sin(i * Math.PI * 0.4) * 0.1]} scale={[0.09, 0.045, 0.09]} color={color} />)}
    <Blob position={[0, 0.36, 0]} scale={[0.06, 0.035, 0.06]} color="#f1cc75" />
  </group>
}
/** Static pastel village set, independent of scenario and physical road definitions. */
export function PlaceholderTrack() {
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[500, 500]} /><meshStandardMaterial color="#bed69f" /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, -40]} receiveShadow><planeGeometry args={[9, 180]} /><meshStandardMaterial color="#c6c3b5" roughness={1} /></mesh>
    {[-1, 1].map((side) => <group key={side}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[side * 4.4, 0.024, -40]}><planeGeometry args={[0.1, 180]} /><meshBasicMaterial color="#fff4d8" /></mesh>
      {Array.from({ length: 27 }, (_, i) => <SoftBox key={i} size={[0.55, 0.16, 2.3]} position={[side * 4.9, 0.08, 15 - i * 3]} color={i % 2 ? '#fff1d6' : '#eeb5a3'} radius={0.07} />)}
      {Array.from({ length: 10 }, (_, i) => <Tree key={i} x={side * (8.2 + i % 3 * 2.6)} z={6 - i * 8} size={0.85 + i % 3 * 0.15} />)}
      {Array.from({ length: 10 }, (_, i) => <group key={i} position={[side * 6.1, 0, 5 - i * 2.7]}>
        <SoftBox size={[0.13, 0.95, 0.15]} position={[0, 0.47, 0]} radius={0.06} color="#fff0d3" />
        <SoftBox size={[0.08, 0.13, 2.7]} position={[0, 0.68, -1.3]} radius={0.035} color="#fff0d3" />
      </group>)}
      {Array.from({ length: 10 }, (_, i) => <Flower key={i} x={side * (5.7 + i % 2 * 0.35)} z={5 - i * 1.6} color={i % 3 ? '#fff2d7' : '#e9a3ae'} />)}
      <Cottage x={side * 11} z={-12} color={side === 1 ? '#e7aa98' : '#a1bcb4'} />
      <Cottage x={side * 14} z={-32} color="#c1b0cb" />
      <Blob position={[side * 39, 2, -58]} scale={[22, 12, 22]} color="#a8caaa" />
      <Blob position={[side * 22, 1, -85]} scale={[18, 14, 20]} color="#b2d1ae" />
    </group>)}
    {Array.from({ length: 20 }, (_, i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, -5 - i * 6]}>
      <planeGeometry args={[0.1, 2]} /><meshBasicMaterial color="#fff3da" />
    </mesh>)}
    {[-22, 5, 28].map((x, i) => <group key={x} position={[x, 15 + i * 2, -48 - i * 7]}>
      <Blob scale={[5, 1.4, 1.7]} color="#fff9ea" /><Blob position={[-1, 0.8, 0]} scale={[2, 1.6, 1.5]} color="#fff9ea" /><Blob position={[1.6, 0.7, 0]} scale={[2.3, 1.5, 1.6]} color="#fff9ea" />
    </group>)}
    <group position={[0, 0, -26]}>
      {[-5.2, 5.2].map((x) => <SoftBox key={x} size={[0.4, 4.9, 0.4]} position={[x, 2.45, 0]} color="#fff0d0" />)}
      <SoftBox size={[11, 0.8, 0.6]} position={[0, 4.65, 0]} radius={0.22} color="#eab4a1" />
      {Array.from({ length: 11 }, (_, i) => <Blob key={i} position={[-4.5 + i * 0.9, 4.12, -0.08]} scale={[0.22, 0.26, 0.05]} color={i % 2 ? '#fff0cf' : '#9cc9bb'} />)}
    </group>
  </group>
}
