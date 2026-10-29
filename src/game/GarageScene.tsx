import { Component, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Group, Vector3 } from 'three'
import { SoftBox, Blob } from '../graphics/SoftShapes'
import { PlaceholderVehicle } from '../graphics/PlaceholderVehicle'
import { CatDriver } from '../graphics/CatDriver'

function Tree({ x, z }: { x: number; z: number }) {
  return <group position={[x,0,z]}><SoftBox size={[.22,1.8,.22]} position={[0,.7,0]} color="#bea27c"/><Blob position={[0,2,0]} scale={[.85,.95,.85]} color="#a8c99c"/><Blob position={[.45,1.7,.15]} scale={[.65,.7,.7]} color="#c0d8a5"/></group>
}
function Camera({ title }: { title: boolean }) {
  const { camera } = useThree()
  const target = useRef(new Vector3())
  useEffect(() => { camera.position.set(title ? 9 : 7.7, title ? 6.3 : 5.5, -10); target.current.set(title ? -.8 : 0, .4, 0); camera.lookAt(target.current); camera.updateProjectionMatrix() }, [camera,title])
  return null
}
function Diorama({ title, celebrate, accident, reduced, ready }: { title: boolean; celebrate: boolean; accident: boolean; reduced: boolean; ready:boolean }) {
  const car = useRef<Group>(null), part = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (car.current) { car.current.position.y = reduced ? 0 : accident ? .4 + Math.abs(Math.sin(clock.elapsedTime * 4)) * .35 : celebrate ? Math.abs(Math.sin(clock.elapsedTime * 3.5)) * .1 : 0; car.current.rotation.z = accident && !reduced ? Math.sin(clock.elapsedTime * 3) * .12 : 0 }
    if (part.current) part.current.rotation.y = reduced ? .4 : clock.elapsedTime * .5
  })
  return <>
    <Camera title={title}/><color attach="background" args={['#f5edd8']}/><fog attach="fog" args={['#f5edd8',28,55]}/>
    <hemisphereLight args={['#fff7e3','#b3c9ad',2.4]}/><directionalLight position={[-5,10,-5]} intensity={3.3} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-bias={-.001}/><directionalLight position={[6,5,2]} color="#e5f4e3" intensity={1}/>
    <SoftBox size={[13,.35,11]} position={[0,-.2,0]} radius={.2} color="#e6d8ba"/>
    <SoftBox size={[11.7,.08,9.7]} position={[0,.02,0]} radius={.15} color="#e9e8ce"/>
    {Array.from({length:7},(_,i)=><SoftBox key={i} size={[.022,.01,9.4]} position={[-5.4+i*1.8,.066,0]} radius={0} color="#d7d5bd"/>)}
    {Array.from({length:6},(_,i)=><SoftBox key={i} size={[11.5,.01,.022]} position={[0,.066,-4.4+i*1.8]} radius={0} color="#d7d5bd"/>)}
    <SoftBox size={[11.7,3.5,.3]} position={[0,1.7,4.7]} color="#e9cdb3"/><SoftBox size={[.3,3.5,9.7]} position={[-5.7,1.7,0]} color="#f1ddbe"/>
    <SoftBox size={[5.4,2.25,.12]} position={[1.8,2.08,4.5]} radius={.05} color="#adc9bc"/><SoftBox size={[5.05,1.95,.08]} position={[1.8,2.08,4.41]} color="#e6f1db"/>
    <SoftBox size={[.1,2,.1]} position={[1.8,2.08,4.3]} radius={.02} color="#fff1d6"/><SoftBox size={[5.1,.1,.1]} position={[1.8,2.08,4.3]} radius={.02} color="#fff1d6"/>
    <SoftBox size={[2.4,1.25,.16]} position={[-3.4,2.25,4.43]} radius={.06} color="#b2bba5"/>
    {[-4.1,-3.5,-2.9].map((x,i)=><group key={x}><SoftBox size={[.1,.55,.1]} position={[x,2.3,4.25]} rotation={[0,0,.2-i*.15]} color="#e6e1ca"/><Blob scale={[.17,.15,.05]} position={[x-.03,2.57,4.25]} color="#d3d7c9"/></group>)}
    <SoftBox size={[2.8,.18,1.2]} position={[-3.4,1.15,3.1]} color="#af8d69"/>{[-4.5,-2.3].map(x=><SoftBox key={x} size={[.16,1.1,.85]} position={[x,.56,3.1]} color="#cda982"/>)}
    <SoftBox size={[1.1,.65,.9]} position={[-3.9,1.55,3.1]} color="#b2c5ba"/><SoftBox size={[.9,.46,.1]} position={[-3.9,1.58,2.61]} color="#e3f1d1"/>
    <SoftBox size={[1.4,1.3,.8]} position={[4.3,.7,3.5]} color="#db9f88"/>{[.38,.7,1.02].map(y=><SoftBox key={y} size={[1.15,.045,.08]} position={[4.3,y,3.05]} color="#f3e0b6"/>)}
    <SoftBox size={[1.8,.12,1.05]} position={[0,.16,0]} color="#adc5bd"/>
    <group ref={car} position={[.3,0,-.7]} rotation={[0,-.22,0]}><PlaceholderVehicle showDriver={!accident}/></group>
    {ready&&<group position={[.3,.12,-.7]}><mesh rotation={[-Math.PI/2,0,0]}><torusGeometry args={[1.9,.035,8,64]}/><meshStandardMaterial color="#a2c985" emissive="#b1cf95" emissiveIntensity={.3}/></mesh><pointLight position={[0,.4,-1.9]} color="#b7d89e" intensity={1.7} distance={4}/></group>}
    <group position={[-2.5,-.58,-.8]} scale={.78} rotation={[0,-.28,0]}><CatDriver celebrating={celebrate}/></group>
    <SoftBox size={[2.5,.08,1.8]} position={[-2.5,.08,-.8]} color="#e2bea5"/>
    <group position={[3.8,.1,-2.9]}><SoftBox size={[.65,.55,.65]} position={[0,.25,0]} color="#dcc5a8"/><Blob position={[0,.9,0]} scale={[.55,.65,.5]} color="#9fb998"/><Blob position={[.25,.8,.2]} scale={[.35,.45,.35]} color="#bad0a5"/></group>
    {[-8,-5,2,6,9].map((x,i)=><Tree key={x} x={x} z={8+i%2*2}/>)}
    <SoftBox size={[2.6,.16,.8]} position={[-2,3.65,4.65]} color="#b9a582"/>
    {accident && <group ref={part} position={[2.4,1.8,-1.8]}><SoftBox size={[1.5,.2,.3]} color="#e5ad96"/><Blob position={[.4,.4,0]} scale={[.1,.1,.1]} color="#eac363"/></group>}
  </>
}
class SceneBoundary extends Component<{children:ReactNode},{failed:boolean}> {
  state={failed:false}
  static getDerivedStateFromError(){return{failed:true}}
  render(){return this.state.failed?<div className="scene-fallback"><div className="paper-car">🚙</div><p>3D 장면 대신 계기판으로 진행할 수 있어요.</p></div>:this.props.children}
}
export function GarageScene({ title=false, celebrate=false, accident=false, reduced=false,ready=false }: {title?:boolean;celebrate?:boolean;accident?:boolean;reduced?:boolean;ready?:boolean}) {
  return <div className="garage-scene" role="img" aria-label={accident?'꼬마차의 만화적인 사고 장면':'고양이 정비사와 민트색 꼬마차가 있는 밝은 미니어처 정비소'}><SceneBoundary><Canvas shadows dpr={[1,1.5]} camera={{position:[9,6,-10],fov:40}} frameloop={reduced?'demand':'always'}><Diorama title={title} celebrate={celebrate} accident={accident} reduced={reduced} ready={ready}/></Canvas></SceneBoundary></div>
}
