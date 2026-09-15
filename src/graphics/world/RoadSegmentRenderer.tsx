import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { RoadSegment } from '../../domain/world/MapDefinition.ts'

const colors = { ASPHALT_DRY: '#5d6b68', ASPHALT_LOW_GRIP: '#70777c', GRAVEL: '#afa17f', DIRT: '#c68f57' }
function ribbon(segment: Readonly<RoadSegment>, width: number, offset: number, height: number) {
  const positions: number[] = []; const indices: number[] = []
  segment.points.forEach((point, index) => {
    const previous = segment.points[Math.max(0, index - 1)]!; const next = segment.points[Math.min(segment.points.length - 1, index + 1)]!
    const dx = next.x - previous.x; const dz = next.z - previous.z; const length = Math.hypot(dx, dz) || 1
    const normalX = -dz / length; const normalZ = dx / length; const left = offset + width / 2; const right = offset - width / 2
    positions.push(point.x + normalX * left, point.y + height, point.z + normalZ * left, point.x + normalX * right, point.y + height, point.z + normalZ * right)
    if (index > 0) { const p = index * 2; indices.push(p - 2, p - 1, p, p, p - 1, p + 1) }
  })
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry
}
export function RoadSegmentRenderer({ segment }: { segment: Readonly<RoadSegment> }) {
  const geometries = useMemo(() => ({
    shoulder: ribbon(segment, segment.width + 2.2, 0, .012), road: ribbon(segment, segment.width, 0, .025),
    center: ribbon(segment, .13, 0, .046), left: ribbon(segment, .16, segment.width / 2 - .32, .047), right: ribbon(segment, .16, -segment.width / 2 + .32, .047),
  }), [segment])
  useEffect(() => () => Object.values(geometries).forEach((geometry) => geometry.dispose()), [geometries])
  const marked = segment.surfaceType.startsWith('ASPHALT')
  return <group>
    <mesh geometry={geometries.shoulder} receiveShadow><meshStandardMaterial color={marked ? '#c8bda0' : '#b58c62'} roughness={1} side={THREE.DoubleSide} /></mesh>
    <mesh geometry={geometries.road} receiveShadow><meshStandardMaterial color={colors[segment.surfaceType]} roughness={.94} side={THREE.DoubleSide} /></mesh>
    {marked && <><mesh geometry={geometries.center}><meshBasicMaterial color="#f5d56d" side={THREE.DoubleSide} /></mesh><mesh geometry={geometries.left}><meshBasicMaterial color="#f7f3df" side={THREE.DoubleSide} /></mesh><mesh geometry={geometries.right}><meshBasicMaterial color="#f7f3df" side={THREE.DoubleSide} /></mesh></>}
  </group>
}
