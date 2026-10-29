import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import type { EnvironmentZone } from '../../domain/world/MapDefinition.ts'
import { getEnvironmentPreset } from '../../registries/EnvironmentRegistry.ts'

function noise(seed: number) { const value = Math.sin(seed * 91.731) * 43758.5453; return value - Math.floor(value) }
function point(zone: Readonly<EnvironmentZone>, index: number) {
  return [zone.bounds.minX + noise(index + zone.id.length) * (zone.bounds.maxX - zone.bounds.minX), zone.bounds.minZ + noise(index * 3 + zone.id.length) * (zone.bounds.maxZ - zone.bounds.minZ)] as const
}
export function EnvironmentRenderer({ zone }: { zone: Readonly<EnvironmentZone> }) {
  const preset = getEnvironmentPreset(zone.visualPreset)
  const treeCount = zone.type === 'FOREST' ? 84 : zone.type === 'MEADOW' ? 46 : zone.type === 'DIRT_FIELD' ? 18 : zone.type === 'SERVICE_AREA' ? 6 : 12
  const flowerCount = zone.type === 'MEADOW' ? 96 : zone.type === 'FOREST' ? 38 : 0
  const houseCount = zone.type === 'URBAN' ? 14 : zone.type === 'SERVICE_AREA' ? 8 : zone.type === 'CONSTRUCTION' ? 4 : 0
  const trunks = useRef<THREE.InstancedMesh>(null); const crowns = useRef<THREE.InstancedMesh>(null); const crownTops = useRef<THREE.InstancedMesh>(null)
  const flowers = useRef<THREE.InstancedMesh>(null); const houses = useRef<THREE.InstancedMesh>(null); const roofs = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const matrix = new THREE.Matrix4(); const scale = new THREE.Vector3(); const rotation = new THREE.Quaternion()
    for (let index = 0; index < treeCount; index++) {
      const [x, z] = point(zone, index); const size = 2.2 + noise(index * 7) * 2.2
      matrix.compose(new THREE.Vector3(x, size * .55, z), rotation, scale.set(.8, size, .8)); trunks.current?.setMatrixAt(index, matrix)
      matrix.compose(new THREE.Vector3(x, size * 1.55, z), rotation, scale.set(size * 1.05, size * .86, size * 1.05)); crowns.current?.setMatrixAt(index, matrix)
      matrix.compose(new THREE.Vector3(x + size * .18, size * 2.12, z - size * .12), rotation, scale.set(size * .68, size * .58, size * .68)); crownTops.current?.setMatrixAt(index, matrix)
    }
    for (let index = 0; index < flowerCount; index++) { const [x, z] = point(zone, index + 80); const size = .35 + noise(index) * .3; matrix.compose(new THREE.Vector3(x, size, z), rotation, scale.set(size, size, size)); flowers.current?.setMatrixAt(index, matrix) }
    for (let index = 0; index < houseCount; index++) { const [x, z] = point(zone, index + 140); rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), noise(index) > .5 ? 0 : Math.PI / 2); matrix.compose(new THREE.Vector3(x, 2.6, z), rotation, scale.set(7, 5.2, 7)); houses.current?.setMatrixAt(index, matrix); matrix.compose(new THREE.Vector3(x, 6.1, z), rotation, scale.set(5.8, 3.1, 5.8)); roofs.current?.setMatrixAt(index, matrix) }
    for (const ref of [trunks, crowns, crownTops, flowers, houses, roofs]) if (ref.current) ref.current.instanceMatrix.needsUpdate = true
  }, [flowerCount, houseCount, treeCount, zone])
  return <group>
    <instancedMesh ref={trunks} args={[undefined, undefined, treeCount]}><cylinderGeometry args={[.38, .62, 1, 8]} /><meshStandardMaterial color="#9c7253" roughness={1} /></instancedMesh>
    <instancedMesh ref={crowns} args={[undefined, undefined, treeCount]} castShadow><dodecahedronGeometry args={[1, 1]} /><meshStandardMaterial color={preset.foliageColor} roughness={.9} /></instancedMesh>
    <instancedMesh ref={crownTops} args={[undefined, undefined, treeCount]} castShadow><dodecahedronGeometry args={[1, 1]} /><meshStandardMaterial color={preset.foliageColor} roughness={.88} /></instancedMesh>
    {flowerCount > 0 && <instancedMesh ref={flowers} args={[undefined, undefined, flowerCount]}><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color={preset.accentColor} roughness={.8} /></instancedMesh>}
    {houseCount > 0 && <><instancedMesh ref={houses} args={[undefined, undefined, houseCount]} castShadow><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#fff0d2" roughness={.85} /></instancedMesh><instancedMesh ref={roofs} args={[undefined, undefined, houseCount]} castShadow><coneGeometry args={[1, 1, 4]} /><meshStandardMaterial color="#e98d72" roughness={.85} /></instancedMesh></>}
  </group>
}
