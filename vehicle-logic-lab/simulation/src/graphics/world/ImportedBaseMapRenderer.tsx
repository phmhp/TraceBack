import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { ImportedBaseMap, ImportedBuilding, ImportedRoad, MapPoint } from '../../domain/world/MapDefinition.ts'
import { getRoadProfile } from '../../registries/RoadProfileRegistry.ts'

function smooth(points: readonly MapPoint[]) {
  if(points.length<3) return points
  const curve=new THREE.CatmullRomCurve3(points.map((point)=>new THREE.Vector3(point.x,point.y,point.z)),false,'centripetal',.35)
  const length=curve.getLength(); return curve.getPoints(Math.max(points.length*3,Math.ceil(length/5))).map(({x,y,z})=>({x,y,z}))
}
function ribbon(points: readonly MapPoint[], width: number, height=.025,offset=0) {
  const positions: number[] = []; const indices: number[] = []
  points.forEach((point, index) => {
    const previous = points[Math.max(0,index-1)]!; const next = points[Math.min(points.length-1,index+1)]!
    const dx=next.x-previous.x; const dz=next.z-previous.z; const length=Math.hypot(dx,dz)||1; const nx=-dz/length; const nz=dx/length
    positions.push(point.x+nx*(offset+width/2),point.y+height,point.z+nz*(offset+width/2),point.x+nx*(offset-width/2),point.y+height,point.z+nz*(offset-width/2))
    if(index){const p=index*2;indices.push(p-2,p-1,p,p,p-1,p+1)}
  })
  const geometry=new THREE.BufferGeometry(); geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry
}
function ImportedRoadMesh({ road }: { road: Readonly<ImportedRoad> }) {
  const profile=getRoadProfile(road.profileId); const roadWidth=profile.laneCount*profile.laneWidth
  const geometries=useMemo(()=>{const points=smooth(road.centerline);return {shoulder:ribbon(points,roadWidth+profile.shoulderWidth*2,.012),road:ribbon(points,roadWidth,.026),lines:Array.from({length:Math.max(0,profile.laneCount-1)},(_,i)=>ribbon(points,.11,.052,-roadWidth/2+(i+1)*profile.laneWidth)),leftWalk:profile.sidewalkEnabled?ribbon(points,1.8,.07,roadWidth/2+1):null,rightWalk:profile.sidewalkEnabled?ribbon(points,1.8,.07,-roadWidth/2-1):null,median:profile.medianType==='BARRIER'?ribbon(points,.42,.16):null}},[profile,road,roadWidth]); useEffect(()=>()=>{geometries.shoulder.dispose();geometries.road.dispose();geometries.lines.forEach((g)=>g.dispose());geometries.leftWalk?.dispose();geometries.rightWalk?.dispose();geometries.median?.dispose()},[geometries])
  const dirt=profile.id==='DIRT_SINGLE_ROAD'; const color=dirt?'#bd8f61':road.roadClass==='motorway'||road.roadClass==='trunk'?'#66716f':road.roadClass==='service'?'#7c8580':'#707b77'
  return <group><mesh geometry={geometries.shoulder} receiveShadow><meshStandardMaterial color={dirt?'#9f7b55':'#c9bfa7'} roughness={1} side={THREE.DoubleSide}/></mesh><mesh geometry={geometries.road} receiveShadow><meshStandardMaterial color={color} roughness={.96} side={THREE.DoubleSide}/></mesh>{geometries.lines.map((geometry,i)=><mesh key={i} geometry={geometry}><meshBasicMaterial color={i===Math.floor((profile.laneCount-2)/2)?'#f0ce68':'#f7f1df'} side={THREE.DoubleSide}/></mesh>)}{geometries.leftWalk&&<mesh geometry={geometries.leftWalk} receiveShadow><meshStandardMaterial color="#e6d9c1" roughness={1}/></mesh>}{geometries.rightWalk&&<mesh geometry={geometries.rightWalk} receiveShadow><meshStandardMaterial color="#e6d9c1" roughness={1}/></mesh>}{geometries.median&&<mesh geometry={geometries.median} position={[0,.12,0]}><meshStandardMaterial color="#d8ddd5" roughness={.8}/></mesh>}</group>
}
function ImportedBuildingMesh({ building, index }: { building: Readonly<ImportedBuilding>; index: number }) {
  const geometries=useMemo(()=>{const shape=new THREE.Shape(); building.footprint.forEach((point,i)=>i?shape.lineTo(point.x,point.z):shape.moveTo(point.x,point.z)); shape.closePath(); const body=new THREE.ExtrudeGeometry(shape,{depth:building.height,bevelEnabled:true,bevelSize:.35,bevelThickness:.35,bevelSegments:2}); body.computeVertexNormals(); return {body,roof:new THREE.ShapeGeometry(shape)}},[building])
  const roofUnit=useMemo(()=>{const xs=building.footprint.map((p)=>p.x),zs=building.footprint.map((p)=>p.z);return {x:(Math.min(...xs)+Math.max(...xs))/2,z:(Math.min(...zs)+Math.max(...zs))/2,w:Math.min(10,(Math.max(...xs)-Math.min(...xs))*.32),d:Math.min(8,(Math.max(...zs)-Math.min(...zs))*.32)}},[building])
  useEffect(()=>()=>Object.values(geometries).forEach((geometry)=>geometry.dispose()),[geometries]); const palette=['#efd7bd','#d9e4d5','#d7deea','#f0c9bd','#d8d2c2']; const accents=['#9db8b2','#a8b5c6','#c7a48f']; return <group><mesh geometry={geometries.body} position={[0,building.height,0]} rotation={[Math.PI/2,0,0]} castShadow receiveShadow><meshStandardMaterial color={palette[index%palette.length]} roughness={.88} flatShading/></mesh><mesh geometry={geometries.roof} position={[0,building.height+.08,0]} rotation={[Math.PI/2,0,0]}><meshStandardMaterial color={accents[index%accents.length]} roughness={.8} side={THREE.DoubleSide}/></mesh>{index%4===0&&<mesh position={[roofUnit.x,building.height+1,roofUnit.z]} castShadow><boxGeometry args={[roofUnit.w,1.8,roofUnit.d]}/><meshStandardMaterial color={accents[(index+1)%accents.length]} roughness={.78}/></mesh>}</group>
}
export function ImportedBaseMapRenderer({ imported }: { imported: Readonly<ImportedBaseMap> }) {
  return <group>{imported.roads.map((road)=><ImportedRoadMesh key={road.id} road={road}/>)}{imported.buildings.map((building,index)=><ImportedBuildingMesh key={building.id} building={building} index={index}/>)}</group>
}
