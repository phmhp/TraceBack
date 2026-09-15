import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { DirectionalLight } from 'three'
import type { VehiclePoseReader } from '../domain/vehicle/VehicleState.ts'

export function VehicleShadowLight({readPose}:{readPose:VehiclePoseReader}){const light=useRef<DirectionalLight>(null);useFrame(()=>{const value=light.current;if(!value)return;const {position}=readPose();value.position.set(position.x-12,position.y+22,position.z-10);value.target.position.set(position.x,position.y,position.z);value.target.updateMatrixWorld()},-5);return <directionalLight ref={light} intensity={2.4} color="#fff2d4" castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-24} shadow-camera-right={24} shadow-camera-top={26} shadow-camera-bottom={-22} shadow-camera-near={1} shadow-camera-far={65} shadow-normalBias={.035} shadow-bias={-.00015}/>} 
