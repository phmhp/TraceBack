import {useRef} from 'react'
import {Canvas,useFrame} from '@react-three/fiber'
import type {Group} from 'three'
import {CarShell,ContactShadow} from './CarBody'
import {CatDriver} from '../graphics/CatDriver'
import type {CatMotion} from '../graphics/CatDriver'
import {SoftBox,Blob} from '../graphics/SoftShapes'

function MarketWorld({buying,paused,reduced,onDone}:{buying:boolean;paused:boolean;reduced:boolean;onDone:()=>void}){
 const buyer=useRef<Group>(null),driver=useRef<Group>(null),car=useRef<Group>(null),key=useRef<Group>(null)
 const time=useRef(0),done=useRef(false),motion=useRef<CatMotion>({walking:false})
 useFrame((_,dt)=>{
  if(paused)return
  if(buying)time.current+=reduced?8:dt
  const t=time.current
  if(buyer.current){
   const boarding=Math.max(0,Math.min(1,(t-1.1)/1.15))
   const eased=boarding*boarding*(3-2*boarding)
   buyer.current.position.x=buying?Math.min(-1.9,-3.8+t*1.85)+eased*.7:-3.8
   buyer.current.position.z=2.8-eased*2.4
   buyer.current.rotation.y=-Math.PI/2-eased*Math.PI/2
   buyer.current.visible=t<2.25
   motion.current.walking=buying&&t<1.1
  }
  if(driver.current)driver.current.visible=t>=2.25
  if(key.current){
   key.current.visible=buying&&t>.8&&t<2.15
   key.current.position.x=-1.32
   key.current.position.y=1.14+Math.sin(Math.max(0,t-.8)*Math.PI/1.3)*.08
   key.current.position.z=3.45-Math.min(1,Math.max(0,(t-.8)/1.3))*.28
   key.current.rotation.y=t*1.5
  }
  if(car.current){
   car.current.position.z=t>2.7?Math.pow(t-2.7,2)*3:0
   car.current.rotation.y=Math.PI
  }
  if(t>=4.1&&!done.current){done.current=true;onDone()}
 })
 return <>
  <color attach="background" args={['#edf2e8']}/>
  <hemisphereLight args={['#fff','#9cb5bc',2]}/>
  <directionalLight castShadow position={[3,7,-3]} intensity={2} shadow-mapSize={[1024,1024]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10}/>
  <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[60,60]}/><meshStandardMaterial color="#e3eaf0" roughness={.95}/></mesh>
  <group ref={car}>
   <ContactShadow/><CarShell/>
   <group ref={driver} name="momo-drives-away" position={[-.47,.58,.18]} scale={.54}><CatDriver seated/></group>
   {[-1,1].flatMap(side=>[-1.3,.95].map(z=><mesh key={`${side}${z}`} position={[side*1.18,.58,z]} rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[.46,.46,.25,32]}/><meshStandardMaterial color="#334451"/></mesh>))}
   {[-1,1].flatMap(side=>[-1.3,.95].map(z=><group key={side+','+z} position={[side*1.33,.58,z]} rotation={[0,0,Math.PI/2]}><mesh><cylinderGeometry args={[.27,.27,.025,32]}/><meshStandardMaterial color="#b4c6d4" metalness={.75} roughness={.25}/></mesh><mesh><cylinderGeometry args={[.09,.09,.05,24]}/><meshStandardMaterial color="#6a8b9c"/></mesh></group>))}
  </group>
  <group position={[-1.9,0,4.4]} scale={.72}><CatDriver/></group>
  <group ref={buyer} position={[-3.8,0,2.8]} rotation={[0,-Math.PI/2,0]} scale={.72}><CatDriver motion={motion}/></group>
  <group ref={key} position={[-1.32,1.14,3.45]}><mesh><torusGeometry args={[.12,.028,12,24]}/><meshStandardMaterial color="#d5b878" metalness={.8}/></mesh><SoftBox size={[.05,.28,.06]} position={[0,-.18,0]} color="#d5b878" radius={.01}/></group>
  <group position={[4.5,0,-4]}><SoftBox size={[5,2.2,.18]} position={[0,1.1,0]} color="#a1c3d7"/><SoftBox size={[5.6,.2,3]} position={[0,2.3,.8]} color="#f6f7f2"/>{[-1,1].map(s=><SoftBox key={s} size={[.2,2.2,.2]} position={[s*2.4,1.1,2]} color="#c3d8e1"/>)}<Blob position={[0,2.7,0]} scale={[1.2,.1,.6]} color="#db747c"/></group>
 </>
}
export function MarketIntro(p:{buying:boolean;paused:boolean;reduced:boolean;onDone:()=>void}){return <div className="v14-market"><Canvas shadows dpr={[1,1.5]} camera={{position:[6,4.5,7],fov:42}}><MarketWorld {...p}/></Canvas><span>{p.buying?'서류 확인 → 열쇠 전달 → 흰둥이가 운전해 출발':'흰둥의 첫 차를 만났어요 · 중고차 시장'}</span></div>}
