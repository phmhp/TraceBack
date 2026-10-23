import { Component, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { CatmullRomCurve3, Group, Mesh, Vector3 } from 'three'
import { SoftBox } from './SoftShapes'
type Snapshot={outputs:Record<string,boolean|undefined>}

type Props = { snapshot: Snapshot; brake: boolean; pressure?:number; focus?: number; isolated?: boolean; reduced?: boolean; revision?: number; prediction?: boolean; onInspect?: (i:number)=>void }
const colors = ['#26b9d0','#8271f5','#21c99b']
function Cable({ start, end, active, reduced }: {start:number;end:number;active:boolean;reduced:boolean}) {
  const curve=useMemo(()=>new CatmullRomCurve3([new Vector3(start,.2,.2),new Vector3(start+.4,.18,1),new Vector3(end-.4,.18,1),new Vector3(end,.2,.2)]),[start,end])
  const dot=useRef<Mesh>(null)
  useFrame(({clock})=>{if(dot.current)dot.current.position.copy(curve.getPoint(reduced?.55:(clock.elapsedTime*.4)%1))})
  return <><mesh><tubeGeometry args={[curve,48,.035,8,false]}/><meshStandardMaterial color={active?'#19c4b1':'#aab9cc'} metalness={.45} roughness={.26}/></mesh>{active&&<mesh ref={dot}><sphereGeometry args={[.08,16,12]}/><meshStandardMaterial color="#e9ffff" emissive="#1debd2" emissiveIntensity={2}/></mesh>}</>
}
function Pedal({ brake, reduced, pressure }: {brake:boolean;reduced:boolean;pressure?:number}) {
  const arm=useRef<Group>(null)
  useFrame((_,dt)=>{if(arm.current)arm.current.rotation.x+=((-.15-.5*(pressure??Number(brake)))-arm.current.rotation.x)*(reduced?1:Math.min(1,dt*12))})
  return <>
    <SoftBox size={[1.2,.16,1.5]} position={[0,.08,0]} color="#dce6f0" metalness={.6} roughness={.28}/>
    {[-.45,.45].map(x=><mesh key={x} position={[x,.19,.47]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.07,.07,.04,16]}/><meshStandardMaterial color="#526780" metalness={.8}/></mesh>)}
    <group ref={arm} position={[0,.2,-.44]}>
      <SoftBox size={[.16,.95,.14]} position={[0,.5,0]} color="#92a9bf" metalness={.8} roughness={.2}/>
      <SoftBox size={[.75,.22,.65]} position={[0,.98,.03]} rotation={[.35,0,0]} color="#283e57" radius={.09}/>
      {[-2,-1,0,1,2].map(i=><SoftBox key={i} size={[.58,.025,.04]} position={[0,1.115+i*.025,.04+i*.1]} rotation={[.35,0,0]} radius={.008} color="#9eb9c9" metalness={.45}/>)}
    </group>
    <SoftBox size={[.32,.28,.5]} position={[.57,.34,-.35]} color="#21bed2"/>
    <mesh position={[.57,.5,-.35]}><sphereGeometry args={[.065,16,12]}/><meshStandardMaterial color={brake?'#35ffe2':'#7995a7'} emissive="#10f7cb" emissiveIntensity={brake?1.2:0}/></mesh>
  </>
}
function Controller({ open, on, revision, reduced }: {open:boolean;on:boolean;revision:number;reduced:boolean}) {
  const lid=useRef<Group>(null), chip=useRef<Group>(null)
  useFrame(({clock},dt)=>{
    if(lid.current)lid.current.position.y+=((open?1.25:.43)-lid.current.position.y)*(reduced?1:Math.min(1,dt*7))
    if(chip.current)chip.current.rotation.y=reduced?0:Math.sin(clock.elapsedTime*1.2+revision)*.025
  })
  return <>
    <SoftBox size={[1.7,.18,1.55]} color="#b8c9da" metalness={.7}/>
    <SoftBox size={[1.53,.08,1.36]} position={[0,.14,0]} color="#138c88" roughness={.35}/>
    {Array.from({length:7},(_,i)=><group key={i}>
      <SoftBox size={[1.25,.009,.016]} position={[0,.185,-.51+i*.17]} color="#82dcc4" radius={.002} metalness={.7}/>
      <SoftBox size={[.016,.009,1.08]} position={[-.58+i*.19,.19,0]} color="#81b7d4" radius={.002} metalness={.6}/>
    </group>)}
    <group ref={chip} position={[0,.21,0]}>
      <SoftBox size={[.68,.14,.68]} color="#26384c" roughness={.3}/>
      <SoftBox size={[.47,.025,.47]} position={[0,.085,0]} color="#7386ae" metalness={.6}/>
      {[-1,1].flatMap(side=>Array.from({length:8},(_,i)=><group key={`${side}-${i}`}><SoftBox size={[.16,.025,.035]} position={[side*.4,-.02,-.27+i*.077]} color="#dae7ef" radius={.005} metalness={.9}/><SoftBox size={[.035,.025,.16]} position={[-.27+i*.077,-.02,side*.4]} color="#dae7ef" radius={.005} metalness={.9}/></group>))}
    </group>
    {[-.6,.6].map(x=><group key={x} position={[x,.23,.45]}><SoftBox size={[.14,.17,.18]} color="#cad7e4" metalness={.8}/><mesh position={[0,.09,0]}><sphereGeometry args={[.046,12,8]}/><meshStandardMaterial color={on?'#71ffe0':'#445c6a'} emissive="#28eac8" emissiveIntensity={on?1.2:0}/></mesh></group>)}
    <group ref={lid} position={[0,1.25,0]}>
      <SoftBox size={[1.72,.09,1.56]} color="#c6d3e7" metalness={.5} roughness={.25}/>
      {[-3,-2,-1,0,1,2,3].map(i=><SoftBox key={i} size={[1.37,.09,.045]} position={[0,.08,i*.18]} color="#a4b9ce" radius={.015} metalness={.7}/>)}
      <SoftBox size={[.35,.025,.23]} position={[0,.14,0]} color="#9a8bfa"/>
    </group>
  </>
}
function Instrument({ ready, request, prediction, reduced }: {ready:boolean;request:boolean;prediction?:boolean;reduced:boolean}) {
  const needle=useRef<Group>(null)
  useFrame((_,dt)=>{if(needle.current)needle.current.rotation.z+=((ready?-.9:request?-.1:1)-needle.current.rotation.z)*(reduced?1:Math.min(1,dt*9))})
  return <group rotation={[-.18,0,0]}>
    <SoftBox size={[1.75,1,.35]} position={[0,.65,0]} color="#dae6ee" radius={.18} metalness={.35}/>
    <SoftBox size={[1.55,.78,.08]} position={[0,.66,.22]} color="#1f344b" radius={.13} roughness={.18}/>
    <group position={[-.3,.67,.28]}>
      <mesh><torusGeometry args={[.25,.021,12,64,Math.PI*1.6]}/><meshStandardMaterial color="#9ed7ed" emissive="#44a0c0" emissiveIntensity={.4}/></mesh>
      {Array.from({length:9},(_,i)=><mesh key={i} position={[Math.cos(i*.4)*.31,Math.sin(i*.4)*.31,.01]} rotation={[0,0,i*.4]}><boxGeometry args={[.045,.013,.015]}/><meshStandardMaterial color="#c6e1f0"/></mesh>)}
      <group ref={needle}><SoftBox size={[.025,.24,.025]} position={[0,.1,.03]} color="#ff7d8d" radius={.009}/></group>
      <mesh position={[0,0,.045]}><sphereGeometry args={[.045,16,10]}/><meshStandardMaterial color="#e9f3ff" metalness={.6}/></mesh>
    </group>
    <mesh position={[.46,.68,.3]}><sphereGeometry args={[.12,24,16]}/><meshStandardMaterial color={ready||request?'#39f4c2':'#526a7b'} emissive="#0be7ad" emissiveIntensity={ready||request?1.8:0}/></mesh>
    {prediction!==undefined&&<mesh position={[.46,1.35,0]}><sphereGeometry args={[.13,24,16]}/><meshStandardMaterial color={prediction?'#bba9ff':'#a9bdce'} transparent opacity={.5} wireframe/></mesh>}
  </group>
}
function Assembly({snapshot,brake,pressure,focus=-1,isolated=false,reduced=false,revision=0,prediction,onInspect}:Props) {
  const units=useRef<(Group|null)[]>([]), target=useMemo(()=>new Vector3(),[]), destination=useMemo(()=>new Vector3(),[])
  useFrame(({camera,clock,size},dt)=>{
    const zoom=isolated?0:focus===0?-.35:focus===2?.35:0
    target.set(zoom,.8,0);if(isolated)destination.set(3.5,3.6,5.5);else destination.set(3.2+zoom,4.5,8.5);camera.position.lerp(destination,reduced?1:Math.min(1,dt*4));camera.lookAt(target)
    const fit=isolated?1.25:Math.min(1.85,Math.max(.9,size.width/Math.max(1,size.height)/2.1));if(camera.zoom!==fit){camera.zoom=fit;camera.updateProjectionMatrix()}
    units.current.forEach((g,i)=>{if(g){const y=focus===i?.55:0;g.position.y+=(y-g.position.y)*(reduced?1:Math.min(1,dt*6));g.rotation.y=reduced?0:Math.sin(clock.elapsedTime*.6+i)*.025}})
  })
  return <>
    <hemisphereLight args={['#f7fcff','#97afc6',2.1]}/><directionalLight position={[-3,8,5]} intensity={3.1} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={5} shadow-camera-bottom={-5} shadow-bias={-.001}/><directionalLight position={[5,3,-4]} color="#b2ccff" intensity={2}/>
    <SoftBox size={[isolated?3.6:9,.17,3.8]} position={[0,-.22,0]} color="#eef5fd" radius={.2} roughness={.27} metalness={.15}/>
    {[-2.8,0,2.8].map((x,i)=><group key={i} position={[isolated?0:x,0,0]} visible={!isolated||focus===i}>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.1,0]}><ringGeometry args={[.95,1.01,64]}/><meshBasicMaterial color={focus===i?colors[i]:'#d4e3f0'}/></mesh>
      <group ref={g=>{units.current[i]=g}} onClick={e=>{e.stopPropagation();onInspect?.(i)}}>
        {i===0?<Pedal brake={brake} pressure={pressure} reduced={reduced}/>:i===1?<Controller open={focus===1||focus<0} on={brake} revision={revision} reduced={reduced}/>:<Instrument ready={snapshot.outputs.ready===true} request={snapshot.outputs.request===true} prediction={prediction} reduced={reduced}/>}
      </group>
    </group>)}
    {!isolated&&<><Cable start={-2.1} end={-.8} active={brake} reduced={reduced}/><Cable start={.85} end={2.15} active={snapshot.outputs.ready===true||snapshot.outputs.request===true} reduced={reduced}/></>}
  </>
}
class RenderGuard extends Component<{children:ReactNode},{failed:boolean}> {
  state={failed:false}
  static getDerivedStateFromError(){return{failed:true}}
  render(){return this.state.failed?<div className="bench-fallback"><img src="./art/momo-garage-v4.png" alt="모모와 꼬마차"/><span>3D를 사용할 수 없어 신호 표시와 조작으로 진행해요.</span></div>:this.props.children}
}
export function SignalBench(props:Props) {
  return <div className={`signal-bench focus-${props.focus??-1}`} role="img" aria-label={`입체 신호 모형. 브레이크 ${props.brake?'참':'거짓'}, ${props.snapshot.outputs.ready?'READY 켜짐':props.snapshot.outputs.request?'진입 요청 참':'출력 대기'}`}><RenderGuard><Canvas shadows dpr={[1,1.6]} camera={{position:[4.4,5.1,7.7],fov:37}} frameloop={props.reduced?'demand':'always'} gl={{alpha:true,antialias:true}}><Assembly {...props}/></Canvas></RenderGuard></div>
}
