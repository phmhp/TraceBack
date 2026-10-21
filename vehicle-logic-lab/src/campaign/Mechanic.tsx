import {useRef} from 'react'
import {useFrame} from '@react-three/fiber'
import {Vector3} from 'three'
import type {Group} from 'three'
import {CatDriver} from '../graphics/CatDriver'
import type {CatMotion} from '../graphics/CatDriver'
import {PartVisual} from '../workshop/Hardware'
import {partById} from '../workshop/assembly'
import type {AssemblyPartId,WorkshopDrive} from '../workshop/assembly'
export function Mechanic({selected,active,working,task,paused,reduced,upset,celebrating,drive,onArrived}:{selected:AssemblyPartId;active:boolean;working:boolean;task?:'place'|'wire';paused:boolean;reduced:boolean;upset:boolean;celebrating:boolean;drive:React.MutableRefObject<WorkshopDrive>;onArrived?:()=>void}){
 const root=useRef<Group>(null),motion=useRef<CatMotion>({walking:false})
 useFrame((_,dt)=>{const group=root.current;if(!group||paused)return;const at=partById(selected).position,target=active?new Vector3(-2.15,0,at[2]):new Vector3(2.5,0,1.9),distance=group.position.distanceTo(target);motion.current.walking=distance>.06
  // Walk around the end of the chassis, never float to the component's mounting height.
  const waypoint=active&&group.position.x>-.8?new Vector3(-2.15,0,2.3):target,delta=waypoint.clone().sub(group.position),step=Math.min(delta.length(),dt*2.3);if(step>0){delta.normalize();group.position.addScaledVector(delta,step);group.rotation.y=Math.atan2(-delta.x,-delta.z)}if(distance<.08){group.rotation.y=active?-Math.PI/2:Math.PI/2;onArrived?.()}group.position.y=0
 })
 return <group ref={root} name="momo-floor-mechanic" position={[2.5,0,1.9]} scale={.72}><CatDriver motion={motion} working={working&&!motion.current.walking} paused={paused} reduced={reduced} upset={upset} celebrating={celebrating}/>{task==='place'&&<group position={[0,1.3,-.5]} scale={.4}><PartVisual id={selected} drive={drive} ratio={7}/></group>}</group>
}
