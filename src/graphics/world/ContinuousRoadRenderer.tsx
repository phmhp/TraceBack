import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { MapPoint, RoadSegment, RouteDefinition } from '../../domain/world/MapDefinition.ts'
import { RoadSegmentRenderer } from './RoadSegmentRenderer.tsx'

function sample(points: readonly MapPoint[]) {
  const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(point.x, point.y, point.z)), false, 'centripetal')
  return curve.getPoints(Math.max(16, (points.length - 1) * 14)).map(({ x, y, z }) => ({ x, y, z }))
}
function ribbon(points: readonly MapPoint[], width: number, offset: number, height: number) {
  const positions: number[] = []; const indices: number[] = []
  points.forEach((point, index) => {
    const previous = points[Math.max(0, index - 1)]!; const next = points[Math.min(points.length - 1, index + 1)]!
    const dx = next.x - previous.x; const dz = next.z - previous.z; const length = Math.hypot(dx, dz) || 1
    const nx = -dz / length; const nz = dx / length
    positions.push(point.x + nx * (offset + width / 2), point.y + height, point.z + nz * (offset + width / 2), point.x + nx * (offset - width / 2), point.y + height, point.z + nz * (offset - width / 2))
    if (index) { const p = index * 2; indices.push(p - 2, p - 1, p, p, p - 1, p + 1) }
  })
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry
}
function RoadStrip({ points, width, dirt = false, markings = true }: { points: readonly MapPoint[]; width: number; dirt?: boolean; markings?: boolean }) {
  const geometries = useMemo(() => { const sampled = sample(points); return { shoulder: ribbon(sampled, width + 2.4, 0, .012), road: ribbon(sampled, width, 0, .026), center: ribbon(sampled, .13, 0, .048), left: ribbon(sampled, .16, width / 2 - .32, .049), right: ribbon(sampled, .16, -width / 2 + .32, .049) } }, [points, width])
  useEffect(() => () => Object.values(geometries).forEach((geometry) => geometry.dispose()), [geometries])
  return <group><mesh geometry={geometries.shoulder} receiveShadow><meshStandardMaterial color={dirt ? '#aa8056' : '#c5b99c'} roughness={1} side={THREE.DoubleSide} /></mesh><mesh geometry={geometries.road} receiveShadow><meshStandardMaterial color={dirt ? '#c58e58' : '#596965'} roughness={.95} side={THREE.DoubleSide} /></mesh>{markings && <><mesh geometry={geometries.center}><meshBasicMaterial color="#efd065" side={THREE.DoubleSide} /></mesh><mesh geometry={geometries.left}><meshBasicMaterial color="#f6f1dd" side={THREE.DoubleSide} /></mesh><mesh geometry={geometries.right}><meshBasicMaterial color="#f6f1dd" side={THREE.DoubleSide} /></mesh></>}</group>
}
export function ContinuousRoadRenderer({ route, segments }: { route: Readonly<RouteDefinition>; segments: readonly RoadSegment[] }) {
  const dirtOrigin = segments.find((segment) => segment.surfaceType === 'DIRT')?.points[0]
  const dirtStart = Math.max(2, route.orderedPoints.findIndex((point) => dirtOrigin && point.x === dirtOrigin.x && point.z === dirtOrigin.z))
  const asphalt = route.orderedPoints.slice(0, dirtStart + 1); const dirt = route.orderedPoints.slice(dirtStart)
  const intersection = route.orderedPoints[11] ?? route.orderedPoints[Math.floor(route.orderedPoints.length / 2)]!
  const crossRoads = segments.filter((segment) => segment.tags.includes('CROSS_ROUTE'))
  return <group>
    <RoadStrip points={asphalt} width={12} />
    <RoadStrip points={dirt} width={11} dirt markings={false} />
    {crossRoads.map((segment) => <RoadSegmentRenderer key={segment.id} segment={segment} />)}
    <mesh position={[intersection.x, intersection.y + .035, intersection.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[11.5, 32]} /><meshStandardMaterial color="#596965" roughness={.95} /></mesh>
  </group>
}
