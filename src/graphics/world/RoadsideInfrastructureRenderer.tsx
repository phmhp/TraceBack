import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { MapDefinition, RoadSegment } from '../../domain/world/MapDefinition.ts'

interface Placement { x: number; y: number; z: number; yaw: number; scale: [number, number, number] }
function sampled(segment: Readonly<RoadSegment>) {
  const result: Array<{ x: number; z: number; yaw: number }> = []
  for (let index = 1; index < segment.points.length; index++) {
    const a = segment.points[index - 1]!; const b = segment.points[index]!; const distance = Math.hypot(b.x - a.x, b.z - a.z); const count = Math.max(1, Math.floor(distance / 24))
    for (let step = 0; step < count; step++) { const t = step / count; result.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, yaw: Math.atan2(b.x - a.x, b.z - a.z) }) }
  }
  return result
}
function Batch({ placements, shape, color, shadow = false }: { placements: readonly Placement[]; shape: 'POST' | 'RAIL' | 'TREE' | 'ROCK' | 'LAMP' | 'SIGN'; color: string; shadow?: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => { const matrix = new THREE.Matrix4(); const rotation = new THREE.Quaternion(); const scale = new THREE.Vector3(); for (let index = 0; index < placements.length; index++) { const item = placements[index]!; rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), item.yaw); matrix.compose(new THREE.Vector3(item.x, item.y, item.z), rotation, scale.set(...item.scale)); mesh.current?.setMatrixAt(index, matrix) } if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true }, [placements])
  return <instancedMesh ref={mesh} args={[undefined, undefined, placements.length]} castShadow={shadow} receiveShadow={shape === 'RAIL'}>
    {shape === 'TREE' ? <dodecahedronGeometry args={[1, 1]} /> : shape === 'ROCK' ? <dodecahedronGeometry args={[1, 0]} /> : shape === 'LAMP' ? <cylinderGeometry args={[.12, .2, 1, 8]} /> : shape === 'SIGN' ? <boxGeometry args={[1, 1, .12]} /> : <boxGeometry args={[1, 1, 1]} />}
    <meshStandardMaterial color={color} roughness={shape === 'RAIL' ? .55 : .9} metalness={shape === 'RAIL' ? .25 : 0} />
  </instancedMesh>
}
export function RoadsideInfrastructureRenderer({ map }: { map: Readonly<MapDefinition> }) {
  const groups = useMemo(() => {
    const posts: Placement[] = []; const rails: Placement[] = []; const trees: Placement[] = []; const treeTrunks: Placement[] = []; const rocks: Placement[] = []; const lamps: Placement[] = []; const signs: Placement[] = []
    for (const segment of map.roadSegments.filter((road) => !road.tags.includes('CROSS_ROUTE'))) sampled(segment).forEach((point, index) => {
      const nx = Math.cos(point.yaw); const nz = -Math.sin(point.yaw); const edge = segment.width / 2
      for (const side of [-1, 1]) {
        const x = point.x + nx * side * (edge + 2.1); const z = point.z + nz * side * (edge + 2.1)
        if (segment.tags.includes('HIGH_SPEED_AVAILABLE')) {
          posts.push({ x, y: .55, z, yaw: point.yaw, scale: [.18, 1.1, .18] }); if (index % 2 === 0) rails.push({ x: point.x + nx * side * (edge + 1.35), y: .52, z: point.z + nz * side * (edge + 1.35), yaw: point.yaw, scale: [.16, .65, 5.7] })
          if ((index + side + 1) % 4 === 0) { const distance = edge + 14 + index % 3 * 2; const tx = point.x + nx * side * distance; const tz = point.z + nz * side * distance; trees.push({ x: tx, y: 4.4, z: tz, yaw: index, scale: [3.1 + index % 2 * .5, 3 + index % 3 * .25, 3.1 + index % 2 * .5] }); treeTrunks.push({ x: tx, y: 1.8, z: tz, yaw: 0, scale: [.62, 3.6, .62] }) }
        }
        else if (segment.type === 'CURVE') { if ((index + side) % 2 === 0) { const distance = edge + 6 + index % 3 * 1.5; const tx = point.x + nx * side * distance; const tz = point.z + nz * side * distance; trees.push({ x: tx, y: 4.4, z: tz, yaw: index, scale: [3.2 + index % 3 * .4, 3.4 + index % 2 * .35, 3.2 + index % 3 * .4] }); treeTrunks.push({ x: tx, y: 1.8, z: tz, yaw: 0, scale: [.65, 3.6, .65] }) } if (index % 3 === 0) rocks.push({ x, y: .6, z, yaw: index, scale: [1.2, .8, 1] }) }
        else if (segment.type === 'INTERSECTION' && index % 2 === 0) lamps.push({ x, y: 2.8, z, yaw: 0, scale: [1, 5.6, 1] })
        else if (segment.surfaceType === 'DIRT' && index % 2 === 0) rocks.push({ x, y: .55, z, yaw: index, scale: [1.1 + index % 2, .8, 1] })
      }
      if (index === 1 && segment.type !== 'STRAIGHT') signs.push({ x: point.x + nx * (edge + 3), y: 1.8, z: point.z + nz * (edge + 3), yaw: point.yaw, scale: [2.2, 1.5, 1] })
    })
    return { posts, rails, trees, treeTrunks, rocks, lamps, signs }
  }, [map])
  const upperCrowns = groups.trees.map((tree) => ({ ...tree, x: tree.x + .7, y: tree.y + 1.2, z: tree.z - .4, scale: [tree.scale[0] * .68, tree.scale[1] * .65, tree.scale[2] * .68] as [number, number, number] }))
  return <group><Batch placements={groups.posts} shape="POST" color="#f7efe0" /><Batch placements={groups.rails} shape="RAIL" color="#cbd4ce" /><Batch placements={groups.treeTrunks} shape="POST" color="#8b6549" /><Batch placements={groups.trees} shape="TREE" color="#4f9863" shadow /><Batch placements={upperCrowns} shape="TREE" color="#69af70" /><Batch placements={groups.rocks} shape="ROCK" color="#87928c" /><Batch placements={groups.lamps} shape="LAMP" color="#586d70" /><Batch placements={groups.signs} shape="SIGN" color="#e3a76e" /></group>
}
