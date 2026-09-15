import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { ImportedBaseMap } from '../../domain/world/MapDefinition.ts'
import { getRoadProfile } from '../../registries/RoadProfileRegistry.ts'

export function ImportedJunctionRenderer({imported}:{imported:Readonly<ImportedBaseMap>}){
  const mesh=useRef<THREE.InstancedMesh>(null)
  const junctions=useMemo(()=>imported.connectors.flatMap((connector)=>{const connected=imported.roads.filter((road)=>road.centerline.some((point,index)=>{if(index!==0&&index!==road.centerline.length-1)return false;return Math.hypot(point.x-connector.position.x,point.z-connector.position.z)<2.5}));if(connected.length<2)return [];const radius=Math.max(...connected.map((road)=>getRoadProfile(road.profileId).laneCount*getRoadProfile(road.profileId).laneWidth/2))+1.2;return [{...connector.position,radius}] }),[imported])
  useLayoutEffect(()=>{const matrix=new THREE.Matrix4();const q=new THREE.Quaternion();const scale=new THREE.Vector3();junctions.forEach((item,index)=>{matrix.compose(new THREE.Vector3(item.x,item.y+.025,item.z),q,scale.set(item.radius,.06,item.radius));mesh.current?.setMatrixAt(index,matrix)});if(mesh.current)mesh.current.instanceMatrix.needsUpdate=true},[junctions])
  return <instancedMesh ref={mesh} args={[undefined,undefined,junctions.length]} receiveShadow><cylinderGeometry args={[1,1,1,24]}/><meshStandardMaterial color="#707b77" roughness={.96}/></instancedMesh>
}
