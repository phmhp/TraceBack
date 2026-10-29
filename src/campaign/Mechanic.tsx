import {useEffect,useRef} from 'react'
import {useFrame} from '@react-three/fiber'
import {Quaternion,Vector3} from 'three'
import type {Group} from 'three'
import {CatDriver} from '../graphics/CatDriver'
import type {CatMotion} from '../graphics/CatDriver'
import {partById} from '../workshop/assembly'
import type {AssemblyPartId} from '../workshop/assembly'
import {MECHANIC_HOME,taskRoute,floorPath,campaignTray} from './assemblyMotion'
export type AssemblyPose={picked:boolean;arrived:boolean;hand:Vector3}
export function Mechanic({selected,active,working,task,paused,reduced,upset,celebrating,pose,onArrived}:{selected:AssemblyPartId;active:boolean;working:boolean;task?:'place'|'wire';paused:boolean;reduced:boolean;upset:boolean;celebrating:boolean;pose:React.MutableRefObject<AssemblyPose>;onArrived?:()=>void}){
 const root=useRef<Group>(null),tool=useRef<Group>(null),motion=useRef<CatMotion>({walking:false}),waypoint=useRef(0),planned=useRef<{points:import('../workshop/assembly').Vec3[];pickupIndex:number}>({points:[MECHANIC_HOME],pickupIndex:-1})
 useEffect(()=>{waypoint.current=0;pose.current.picked=false;pose.current.arrived=false;const part=partById(selected),from=root.current?.position;planned.current=active?taskRoute(from?[from.x,0,from.z]:MECHANIC_HOME,campaignTray(selected),part.position,task==='place'):{points:floorPath(from?[from.x,0,from.z]:MECHANIC_HOME,MECHANIC_HOME),pickupIndex:-1}},[selected,task,active])
 useFrame((_,dt)=>{const group=root.current;if(!group||paused)return;const part=partById(selected),route=planned.current.points;if(reduced){waypoint.current=route.length-1;group.position.set(...route[route.length-1]);pose.current.picked=task==='place'}const at=route[Math.min(waypoint.current,route.length-1)],target=new Vector3(...at),delta=target.sub(group.position),distance=delta.length();motion.current.walking=distance>.04
  if(distance>.04){delta.normalize();group.position.addScaledVector(delta,Math.min(distance,dt*5.2));group.rotation.y=Math.atan2(-delta.x,-delta.z)}else if(waypoint.current<route.length-1){if(task==='place'&&waypoint.current===planned.current.pickupIndex)pose.current.picked=true;waypoint.current++}else{if(task==='place')pose.current.picked=true;group.rotation.y=active?(part.position[0]>.9?Math.PI/2:-Math.PI/2):0;pose.current.arrived=true;onArrived?.()}
  group.position.y=0;group.updateWorldMatrix(true,true);const paw=group.getObjectByName('momo-right-arm');pose.current.hand=paw?paw.localToWorld(new Vector3(-.05,-.26,-.29)):group.localToWorld(new Vector3(0,.6,-.5))
  if(tool.current){const bolt=new Vector3(...part.position).add(new Vector3(-.22,.2,.15)),from=pose.current.hand,vector=bolt.clone().sub(from);tool.current.position.copy(from);tool.current.quaternion.copy(new Quaternion().setFromUnitVectors(new Vector3(0,1,0),vector.clone().normalize()));tool.current.scale.y=vector.length()}
 })
 const bolt=partById(selected).position
 return <><group ref={root} name="momo-floor-mechanic" position={MECHANIC_HOME} scale={.72}><CatDriver motion={motion} externalTool working={working&&pose.current.arrived} paused={paused} reduced={reduced} upset={upset} celebrating={celebrating}/></group>{working&&active&&pose.current.arrived&&<><group ref={tool} name="contact-extension-tool"><mesh position={[0,.5,0]}><cylinderGeometry args={[.018,.018,1,12]}/><meshStandardMaterial color="#c6dce7" metalness={.8}/></mesh></group><group position={[bolt[0]-.22,bolt[1]+.2,bolt[2]+.15]}><mesh rotation={[0,Math.PI/2,0]}><torusGeometry args={[.08,.018,8,24]}/><meshStandardMaterial color="#c8dfed" metalness={.8}/></mesh></group></>}</>
}
