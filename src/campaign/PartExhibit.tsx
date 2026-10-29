import {useEffect,useRef,useState} from 'react'
import {Canvas,useFrame,useThree} from '@react-three/fiber'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import type {Group} from 'three'
import {PartVisual} from '../workshop/Hardware'
import {partById} from '../workshop/assembly'
import type {AssemblyPartId,WorkshopDrive} from '../workshop/assembly'
import type {TorqueFrame,TorqueInput} from '../engineering/torqueModel'
import {kitForPart} from './domains'

function ExhibitScene({id,active,frame,reduced,input}:{input?:TorqueInput;id:AssemblyPartId;active:boolean;frame?:TorqueFrame;reduced:boolean}){
 const {camera,gl}=useThree(),rotor=useRef<Group>(null),indicators=useRef<Group>(null),clock=useRef(0),orbit=useRef<OrbitControls|null>(null),drive=useRef<WorkshopDrive>({distance:0,x:0,speed:0,heading:0,motorRpm:0,wheelAngle:0,pedal:0,brake:0,steering:0})
 useEffect(()=>{camera.position.set(...(['axle','steeringRack','brakes'].includes(id)?[2.6,1.8,2.8]:[1.4,.95,1.6]) as [number,number,number]);const c=new OrbitControls(camera,gl.domElement);c.target.set(0,.08,0);c.enablePan=false;c.minDistance=1;c.maxDistance=7;c.enableDamping=true;c.update();orbit.current=c;return()=>{c.dispose();orbit.current=null}},[camera,gl,id])
 useFrame((_,dt)=>{orbit.current?.update();clock.current+=reduced?0:dt;const torque=frame?.values['command.torque'],request=frame?.values['ceiling.torque'];const amount=frame?typeof torque==='number'&&Number.isFinite(torque)?Math.max(0,torque)/180:typeof request==='number'&&Number.isFinite(request)?Math.max(0,request)/180:0:active?.5:0
  // Deliberately labelled principle animation; not a current/voltage or free-running plant estimate.
  const brakeDemo=kitForPart(id).id==='brake'&&!frame?Math.max(0,Math.min(1,((clock.current%4)-1)/1.5)):0;drive.current.motorRpm=active?amount*420*(1-brakeDemo):0;drive.current.pedal=active?(input?.pedalA??amount*100)/100:0;drive.current.brake=active?(input?input.brakePct/100:brakeDemo):0;drive.current.steering=active&&kitForPart(id).id==='steer'?Math.sin(clock.current)*.35:0
  if(indicators.current)indicators.current.children.forEach((c,i)=>{c.scale.y=active?.35+Math.abs(Math.sin(clock.current*3+i*2.094))*.65:.18});if(rotor.current&&id==='steeringWheel')rotor.current.rotation.z=drive.current.steering*2
 })
 return <><color attach="background" args={['#f5f3ee']}/><ambientLight intensity={1.6}/><directionalLight position={[3,5,4]} intensity={2.5}/><directionalLight position={[-3,2,-2]} intensity={1}/><group ref={rotor}><PartVisual id={id} drive={drive} ratio={7} spinning={!reduced} separateController cutaway/></group>{['battery','inverter','vcu'].includes(id)&&<group ref={indicators} position={[0,.6,0]}>{[-.18,0,.18].map((x,i)=><mesh key={x} position={[x,0,0]}><boxGeometry args={[.08,.18,.08]}/><meshStandardMaterial color={i===1?'#d99562':'#7eaa91'} emissive={active?'#66af8a':'#000000'} emissiveIntensity={.4}/></mesh>)}</group>}<mesh rotation={[-Math.PI/2,0,0]} position={[0,-.55,0]}><circleGeometry args={[2,64]}/><meshStandardMaterial color="#e8e3d9" roughness={1}/></mesh></>
}
export function PartExhibit({id,frame,reduced=false,automatic=false,onObserve,input}:{input?:TorqueInput;id:AssemblyPartId;frame?:TorqueFrame;reduced?:boolean;automatic?:boolean;onObserve?:()=>void}){
 const [active,setActive]=useState(automatic),part=partById(id)
 useEffect(()=>setActive(automatic),[id,automatic])
 return <section className="v15-exhibit" aria-label="선택 부품 360도 동작 보기"><header><small>{kitForPart(id).domain} · 개별 장치</small><b>{id==='pedal'?'가속페달 센서':part.name}</b></header><div className="v15-exhibit-canvas"><Canvas camera={{position:[2.6,1.8,2.8],fov:34}} dpr={[1,1.5]}><ExhibitScene key={id} id={id} active={active} frame={frame} input={input} reduced={reduced}/></Canvas></div><small>드래그로 360° 회전 · 휠로 확대 / 축소</small>{!automatic&&<button onClick={()=>{setActive(v=>!v);onObserve?.()}}>{active?'동작 멈추기':'이 부품 동작해 보기'}</button>}{input&&<output className="v15-part-display">페달 {input.pedalA}% · 브레이크 {input.brakePct>=5?'ON':'OFF'} · {input.gear} · 명령 {Number.isFinite(frame?.torqueNm)?frame!.torqueNm.toFixed(1):'—'} Nm</output>}<p>{id==='pedal'?'페달 센서는 발의 위치를 두 채널의 신호로 보냅니다. 명령을 계산하는 VCU는 별도로 장착한 ECU이며, 페달이 모터 전력을 직접 보내는 것은 아니에요.':part.description}</p><small>{frame?'현재 로직 출력에 따라 장치의 회전과 반응이 달라집니다.':'장치가 어떤 입력을 받아 어떤 물리 반응을 내는지 살펴보세요.'}</small></section>
}


