import type { MapDefinition, RoadSegment } from '../../domain/world/MapDefinition.ts'

function orientation(segment: Readonly<RoadSegment>) {
  const a = segment.points[0]!; const b = segment.points.at(-1)!
  return Math.atan2(b.x - a.x, b.z - a.z)
}
function at(segment: Readonly<RoadSegment>, ratio: number) {
  const a = segment.points[0]!; const b = segment.points.at(-1)!
  return { x: a.x + (b.x - a.x) * ratio, y: Math.max(a.y, b.y), z: a.z + (b.z - a.z) * ratio }
}
export function RoadContextDetails({ map }: { map: Readonly<MapDefinition> }) {
  const highway = map.roadSegments.find((segment) => segment.tags.includes('HIGH_SPEED_AVAILABLE'))
  const intersection = map.roadSegments.find((segment) => segment.type === 'INTERSECTION')
  return <group>
    {highway && <group position={Object.values(at(highway, .25)) as [number, number, number]} rotation={[0, orientation(highway), 0]}>
      <mesh position={[-7.2, 3.7, 0]} castShadow><cylinderGeometry args={[.16, .24, 7.4, 10]} /><meshStandardMaterial color="#637879" metalness={.25} /></mesh>
      <mesh position={[7.2, 3.7, 0]} castShadow><cylinderGeometry args={[.16, .24, 7.4, 10]} /><meshStandardMaterial color="#637879" metalness={.25} /></mesh>
      <mesh position={[0, 7.1, 0]} castShadow><boxGeometry args={[14.5, 2.2, .35]} /><meshStandardMaterial color="#4e897d" roughness={.7} /></mesh>
      <mesh position={[0, 7.15, -.19]}><boxGeometry args={[10.5, .14, .04]} /><meshBasicMaterial color="#eaf1dc" /></mesh>
    </group>}
    {intersection && <group position={Object.values(at(intersection, .62)) as [number, number, number]} rotation={[0, orientation(intersection), 0]}>
      {[-4.2, -3, -1.8, -.6, .6, 1.8, 3, 4.2].map((offset) => <mesh key={offset} position={[offset, .075, 0]} receiveShadow><boxGeometry args={[.7, .05, 14]} /><meshBasicMaterial color="#f3f0df" /></mesh>)}
      <mesh position={[0, .1, 12]}><boxGeometry args={[42, .2, 4]} /><meshStandardMaterial color="#c9c2ae" roughness={1} /></mesh>
      <mesh position={[0, .1, -12]}><boxGeometry args={[42, .2, 4]} /><meshStandardMaterial color="#c9c2ae" roughness={1} /></mesh>
      {[-17, 17].flatMap((x) => [-12, 12].map((z) => <group key={`${x}-${z}`} position={[x, 0, z]}><mesh position={[0, 3.1, 0]}><cylinderGeometry args={[.12, .18, 6.2, 8]} /><meshStandardMaterial color="#536b6d" /></mesh><mesh position={[0, 6.1, 0]}><sphereGeometry args={[.4, 10, 8]} /><meshStandardMaterial color="#f3d477" emissive="#806019" emissiveIntensity={.3} /></mesh></group>))}
    </group>}
  </group>
}
