import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import type { StaticWorldObject } from '../../domain/world/MapDefinition.ts'
import { getAssetDefinition } from '../../registries/AssetRegistry.ts'

export function StaticObjectRenderer({ assetId, objects }: { assetId: string; objects: readonly StaticWorldObject[] }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const accents = useRef<THREE.InstancedMesh>(null)
  const facades = useRef<THREE.InstancedMesh>(null)
  const asset = getAssetDefinition(assetId)
  useLayoutEffect(() => {
    const matrix = new THREE.Matrix4(); const position = new THREE.Vector3(); const rotation = new THREE.Quaternion(); const scale = new THREE.Vector3()
    objects.forEach((object, index) => {
      position.set(object.position.x, object.position.y, object.position.z); rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), object.rotationY); scale.set(object.scale.x, object.scale.y, object.scale.z); matrix.compose(position, rotation, scale); mesh.current?.setMatrixAt(index, matrix)
      position.set(object.position.x, object.position.y + asset.size.y * object.scale.y / 2 + .22, object.position.z); matrix.compose(position, rotation, scale.set(object.scale.x, 1, object.scale.z)); accents.current?.setMatrixAt(index, matrix)
      const facadeOffset = new THREE.Vector3(0, 0, -asset.size.z * object.scale.z / 2 - .03).applyQuaternion(rotation)
      position.set(object.position.x + facadeOffset.x, object.position.y, object.position.z + facadeOffset.z); matrix.compose(position, rotation, scale.set(object.scale.x, object.scale.y, 1)); facades.current?.setMatrixAt(index, matrix)
    })
    if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true
    if (accents.current) accents.current.instanceMatrix.needsUpdate = true
    if (facades.current) facades.current.instanceMatrix.needsUpdate = true
  }, [asset.size.y, asset.size.z, objects])
  return <group><instancedMesh ref={mesh} args={[undefined, undefined, objects.length]} castShadow receiveShadow>
    {asset.primitive === 'CONE' ? <coneGeometry args={[asset.size.x / 2, asset.size.y, 12]} /> : asset.primitive === 'ROCK' ? <dodecahedronGeometry args={[asset.size.x / 2, 0]} /> : <boxGeometry args={[asset.size.x, asset.size.y, asset.size.z]} />}
    <meshStandardMaterial color={asset.color} roughness={0.75} />
  </instancedMesh>{asset.accentColor && <><instancedMesh ref={accents} args={[undefined, undefined, objects.length]} castShadow><boxGeometry args={[asset.size.x * 1.04, .4, asset.size.z * 1.04]} /><meshStandardMaterial color={asset.accentColor} roughness={.8} /></instancedMesh>{asset.objectType === 'BUILDING' && <instancedMesh ref={facades} args={[undefined, undefined, objects.length]}><boxGeometry args={[asset.size.x * .7, asset.size.y * .5, .08]} /><meshStandardMaterial color={asset.accentColor} roughness={.5} metalness={.08} /></instancedMesh>}</>}</group>
}
