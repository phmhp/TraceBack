import {useRef} from 'react'
import {useFrame} from '@react-three/fiber'
import {Group,Vector3} from 'three'
import type {RaceTelemetry} from '../../simulation/src/runtime/SimulationRuntime'
import {Blob} from '../graphics/SoftShapes'
export function CockpitPaws({t}:{t:RaceTelemetry}){
 const left=useRef<Group>(null),right=useRef<Group>(null),feet=useRef<Group>(null),previous=useRef(t.gearRequest),shift=useRef(0)
 useFrame((_,dt)=>{if(previous.current!==t.gearRequest){previous.current=t.gearRequest;shift.current=.8}shift.current=Math.max(0,shift.current-dt);const a=-t.steering*.8;for(const [i,ref] of [left,right].entries()){if(!ref.current)continue;const side=i?1:-1,point=new Vector3(-.24+side*.27*Math.cos(a),1.01+side*.27*Math.sin(a),-.12);if(i&&shift.current>0)point.lerp(new Vector3(.64,1.04,.3),Math.sin(Math.PI*Math.min(1,shift.current/.8)));ref.current.position.copy(point);ref.current.rotation.z=a}feet.current?.children.forEach((foot,i)=>{foot.position.z=-.35-(i?t.accelerator:t.brake)*.12;foot.rotation.x=-(i?t.accelerator:t.brake)*.35})})
 return <group name="momo-driver-limbs">{[left,right].map((ref,i)=><group ref={ref} name={i?'momo-right-driving-paw':'momo-left-driving-paw'} key={i} position={[i?.03:-.51,1.01,-.12]}><Blob position={[i?.11:-.11,-.06,.18]} scale={[.105,.12,.28]} rotation={[.3,0,i?-.3:.3]} color="#f4e7d8"/><Blob scale={[.12,.095,.095]} color="#f7ecdf"/><Blob position={[0,.015,-.077]} scale={[.055,.04,.016]} color="#e5c4bd"/></group>)}<group ref={feet}>{[-.3,.3].map(x=><group key={x} position={[x,.48,-.35]}><Blob position={[0,0,.28]} scale={[.1,.1,.3]} color="#f4e7d8"/><Blob scale={[.125,.08,.17]} color="#f7ecdf"/></group>)}</group></group>
}
