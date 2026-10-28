import {useEffect,useMemo,useRef} from 'react'
import {Canvas,useFrame} from '@react-three/fiber'
import {CatmullRomCurve3,Vector3} from 'three'
import type {Group,Mesh} from 'three'
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js'
import {SoftBox,Blob} from '../graphics/SoftShapes'
import {CatDriver} from '../../simulation/src/graphics/CatDriver'
import type {Snapshot} from '../engine/types'

function SignalLine({points,active,paused}:{points:[number,number,number][];active:boolean;paused:boolean}){
 const curve=useMemo(()=>new CatmullRomCurve3(points.map(p=>new Vector3(...p))),[points]),dot=useRef<Mesh>(null),phase=useRef(0)
 useFrame((_,dt)=>{if(paused)return;phase.current=(phase.current+dt*.4)%1;if(dot.current)dot.current.position.copy(curve.getPoint(phase.current))})
 return <><mesh><tubeGeometry args={[curve,32,.022,8,false]}/><meshStandardMaterial color={active?'#26c3b0':'#a1b7cb'} metalness={.5}/></mesh>{active&&<mesh ref={dot}><sphereGeometry args={[.055,12,10]}/><meshStandardMaterial color="#aaffee" emissive="#26dfbf" emissiveIntensity={2}/></mesh>}</>
}
export type LearningVehicleProps={brake:number;ready:boolean;speedKmh?:number;torqueNm?:number;steering?:number;wheelAngleRad?:number;focus?:number;cutaway?:boolean;paused?:boolean;showDriver?:boolean;onInspect?:(index:number)=>void}
/** Geometry/animation only. RPM, battery state and actual motor torque are not invented. */
export function LearningVehicle({brake,ready,speedKmh=0,torqueNm=0,steering=0,wheelAngleRad,focus=-1,cutaway=true,paused=false,showDriver=true,onInspect}:LearningVehicleProps){
 const pedal=useRef<Group>(null),lid=useRef<Group>(null),rotor=useRef<Group>(null),wheels=useRef<Group[]>([]),phase=useRef(0)
 const shell=useMemo(()=>new RoundedBoxGeometry(1.86,.5,3.05,5,.22),[])
 useEffect(()=>()=>shell.dispose(),[shell])
 useFrame((_,dt)=>{if(paused)return;const k=Math.min(1,dt*10);if(pedal.current)pedal.current.rotation.x+=(-brake*.6-pedal.current.rotation.x)*k;if(lid.current){lid.current.position.y+=((focus===1?1.4:1.12)-lid.current.position.y)*k;lid.current.position.x+=((focus===1?1.45:.22)-lid.current.position.x)*k;}phase.current+=speedKmh/3.6/.425*dt;for(const w of wheels.current)if(w)w.rotation.x=phase.current;if(rotor.current)rotor.current.rotation.x=phase.current*4})
 return <group>
  <mesh geometry={shell} position={[0,.67,0]} castShadow><meshPhysicalMaterial color="#42c6c0" transparent opacity={cutaway?.27:1} depthWrite={!cutaway} roughness={.22} metalness={.25} clearcoat={1}/></mesh>
  <SoftBox size={[1.5,.12,2.55]} position={[0,.3,0]} color="#8ba9bd" metalness={.8}/>
  <group position={[0,.4,.1]}>{Array.from({length:6},(_,i)=><SoftBox key={i} size={[.47,.15,.45]} position={[(i%2-.5)*.53,0,(Math.floor(i/2)-1)*.5]} color="#b6dce6" metalness={.5}/>)}</group>
  {[-1,1].flatMap((side,si)=>[-.98,.98].map((z,zi)=><group key={`${side}-${z}`} position={[side*.96,.44,z]} rotation={[0,z<0?-(wheelAngleRad??steering*.42):0,0]}>
   <group name="learning-wheel-spin" ref={g=>{if(g)wheels.current[si*2+zi]=g}}><mesh rotation={[0,Math.PI/2,0]} castShadow><torusGeometry args={[.3,.105,16,40]}/><meshStandardMaterial color="#304b60" roughness={.88}/></mesh><mesh rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.23,.23,.13,32]}/><meshStandardMaterial color="#b7cbd9" metalness={.8} roughness={.25}/></mesh>{Array.from({length:6},(_,i)=><SoftBox key={i} size={[.15,.035,.42]} rotation={[i*Math.PI/3,0,0]} radius={.01} color="#e6f3fb" metalness={.7}/>)}</group>
   <group onClick={e=>{e.stopPropagation();onInspect?.(2)}}><SoftBox size={[.2,.28,.18]} position={[-side*.1,.13,.2-brake*.06]} color={brake>0?'#f19bb3':'#6ca8c2'} radius={.045}/></group>
  </group>))}
  <group position={[-.38,.5,-.62]} onClick={e=>{e.stopPropagation();onInspect?.(0)}}><group name="platform-brake-pedal" ref={pedal}><SoftBox size={[.07,.43,.06]} position={[0,.2,0]} color="#b7cbd9" metalness={.8}/><SoftBox size={[.24,.12,.25]} position={[0,.44,.03]} color="#41627c" radius={.04}/></group><Blob position={[.16,.14,-.05]} scale={[.055,.055,.055]} color={brake>0?'#3dffd6':'#799aaf'}/></group>
  <group onClick={e=>{e.stopPropagation();onInspect?.(1)}}><SoftBox size={[.66,.1,.55]} position={[.22,.9,-.5]} color="#7799b4" metalness={.8}/><SoftBox size={[.55,.045,.45]} position={[.22,.98,-.5]} color="#159c90"/><SoftBox size={[.24,.08,.24]} position={[.22,1.04,-.5]} color={ready?'#967fe0':'#547087'}/><group name="platform-ecu-lid" ref={lid} position={[.22,1.12,-.5]}><SoftBox size={[.69,.08,.58]} color="#c2d9e8" metalness={.7}/>{[-2,-1,0,1,2].map(i=><SoftBox key={i} size={[.55,.045,.025]} position={[0,.06,i*.09]} color="#91b3cb"/>)}</group></group>
  <group position={[0,.63,.99]} onClick={e=>{e.stopPropagation();onInspect?.(2)}}><mesh rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.3,.3,.68,32,1,true,0,Math.PI*1.5]}/><meshPhysicalMaterial color="#a7c3d6" side={2} roughness={.25} metalness={.8}/></mesh><group name="platform-motor-rotor" ref={rotor}>{Array.from({length:10},(_,i)=><SoftBox key={i} size={[.6,.055,.07]} position={[0,Math.cos(i*Math.PI/5)*.19,Math.sin(i*Math.PI/5)*.19]} rotation={[i*Math.PI/5,0,0]} radius={.01} color={i%2?'#ddac85':'#a8775b'} metalness={.85}/>)}</group><SoftBox size={[1.65,.08,.08]} color="#c3d8e7" metalness={.8}/></group>
  <SignalLine points={[[-.2,.65,-.65],[-.2,.78,-.9],[.22,.96,-.55]]} active={brake>0} paused={paused}/><SignalLine points={[[.35,.92,-.4],[.7,.7,.1],[.3,.68,.98]]} active={ready} paused={paused}/>
  <SoftBox size={[1.72,.15,.16]} position={[0,.55,-1.5]} color="#e8f6ff"/><SoftBox size={[1.72,.15,.16]} position={[0,.55,1.5]} color="#e8f6ff"/>
  {[-.58,.58].map(x=><Blob key={x} position={[x,.87,-1.4]} scale={[.21,.13,.07]} color={ready?'#aaffea':'#c1e0ed'}/>)}
  <SoftBox size={[.65,.12,.08]} position={[0,1.1,-.25]} color={ready?'#39cfb1':'#718da5'}/>
  {showDriver&&<group scale={[.73,.73,.73]} position={[-.28,.12,.2]}><CatDriver/></group>}
  {torqueNm>0&&<mesh position={[0,.64,.98]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.38,.014,8,40]}/><meshStandardMaterial color="#68ecd5" emissive="#24baa7" emissiveIntensity={1}/></mesh>}
 </group>
}
export function VehiclePlatform({snapshot,brake,focus=-1,paused=false,torqueNm=0,onInspect,referenceOnly=false}:{referenceOnly?:boolean;snapshot:Snapshot;brake:boolean;focus?:number;paused?:boolean;torqueNm?:number;onInspect?:(index:number)=>void}){
 return <div className="vehicle-platform" aria-label="같은 차량 플랫폼에서 페달·제어기·구동 허용 관찰"><Canvas shadows dpr={[1,1.5]} camera={{position:[4.7,3.9,-5.2],fov:38}} onCreated={({camera})=>camera.lookAt(0,.65,0)}><hemisphereLight args={['#fff','#a6c7dd',2.7]}/><directionalLight position={[-3,7,4]} intensity={3} castShadow/><directionalLight position={[4,4,-4]} intensity={2} color="#c4d8ff"/><mesh rotation={[-Math.PI/2,0,0]} position={[0,-.03,0]} receiveShadow><circleGeometry args={[3,64]}/><meshStandardMaterial color="#e7f2fc" roughness={.35}/></mesh><LearningVehicle brake={brake?1:0} ready={!snapshot.issues.length&&snapshot.outputs.drive===true} focus={focus} paused={paused} torqueNm={torqueNm} onInspect={onInspect}/></Canvas><span className="platform-status">{referenceOnly?'에너지 모델 미구현 · 참고 배치':snapshot.issues.length?'연결 미완료 · 구동 차단':snapshot.outputs.drive?'READY · 구동 허용 / 가속 대기':snapshot.outputs.request?'진입 요청만 참 · 구동은 차단':'조건 확인 중 · 구동 차단'}</span><small>{referenceOnly?'배터리 형상만 표시 · SOC·전류·에너지 계산 없음':'부품 배치 · READY는 회전 명령이 아니에요.'}</small></div>
}
