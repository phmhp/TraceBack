import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { ScenarioActorPose } from '../domain/vehicle/VehiclePhysicsPort.ts'
import { PlaceholderVehicle } from './PlaceholderVehicle.tsx'

/** Visual projection of the same Rapier kinematic body used by the scenario. */
export function ScenarioLeadVehicleRenderer({readPose}:{readPose:()=>Readonly<ScenarioActorPose>}){
  const group=useRef<Group>(null)
  useFrame(()=>{
    const target=group.current,pose=readPose()
    if(!target)return
    target.visible=pose.available
    if(!pose.available)return
    target.position.set(pose.position.x,pose.position.y,pose.position.z)
    target.quaternion.set(pose.rotation.x,pose.rotation.y,pose.rotation.z,pose.rotation.w)
  })
  return <group ref={group} visible={false}><PlaceholderVehicle showDriver={false}/></group>
}
