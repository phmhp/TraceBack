import {Suspense,useEffect,useLayoutEffect,useMemo,useRef} from 'react'
import {Canvas,useFrame,useThree} from '@react-three/fiber'
import type {ThreeEvent} from '@react-three/fiber'
import {Physics,useRapier} from '@react-three/rapier'
import {CanvasTexture,CatmullRomCurve3,Group,Mesh,Plane,Quaternion,Vector3} from 'three'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import {RapierVehiclePhysics} from '../../simulation/src/physics/rapier/RapierVehiclePhysics'
import {drivingWorld,drivingSurfaces} from '../game/driving/DrivingRuntime'
import {CatDriver} from '../graphics/CatDriver'
import {CarShell,CupTrack,DreamSet} from '../campaign/Scenery'
import {cupWorld} from '../campaign/race'
import {Cabin} from '../game/DriveExperience'
import type {RaceTelemetry} from '../../simulation/src/runtime/SimulationRuntime'
import type {TorqueFrame} from '../engineering/torqueModel'
import {SoftBox} from '../graphics/SoftShapes'
import {assemblyParts,campaignParts,assemblyStage,cables,allCables,partById,portById,ports} from './assembly'
import {Mechanic} from '../campaign/Mechanic'
import type {AssemblyPartId,PortId,Vec3,WorkshopDrive} from './assembly'
import {PartVisual,Chassis} from './Hardware'
import {hardwareReady,MECHANICS} from './model'
import type {WorkshopRecord} from './model'
import type {createWorkshopRuntime} from './WorkshopController'
type Engine=ReturnType<typeof createWorkshopRuntime>
export type Held={id:AssemblyPartId;position:Vec3;angle:number}
export type SceneControls={accelerator:number;brake:number;steering:number;gear:'P'|'R'|'N'|'D';ready:boolean}
export type WorkshopSceneProps={onMechanicReady?:()=>void;repairing?:boolean;task?:'place'|'wire';lab?:boolean;cup?:boolean;suspended?:boolean;view?:'xray'|'cinema'|'race'|'cabin';footwell?:boolean;paint?:'scrap'|'mint';damage?:number;dream?:boolean;telemetry?:RaceTelemetry;benchFrame?:TorqueFrame;course?:{gate:number;stars:boolean[];time:number};onTick?:(sample:{x:number;z:number;speed:number;dt:number})=>void;steeringRad?:number;engine:Engine;record:WorkshopRecord;selected:AssemblyPartId;held:Held|null;exploded:number;road:boolean;paused:boolean;reduced:boolean;working:boolean;celebrating:boolean;controls:SceneControls;pending:PortId|null;onSelect:(id:AssemblyPartId)=>void;onHeld:(held:Held|null)=>void;onDrop:(held:Held)=>void;onPort:(id:PortId)=>void;onControl:(patch:Partial<SceneControls>)=>void;onStart:()=>void}
const offsets:Record<string,Vec3>={motor:[0,.5,0],gearbox:[0,.5,1],axle:[0,.5,1],battery:[0,1,-.5],inverter:[1,1,0],pedal:[-1,1,0],rearLeft:[-.8,.2,0],rearRight:[.8,.2,0],frontLeft:[-.8,.2,0],frontRight:[.8,.2,0]}
function location(id:AssemblyPartId,amount:number):Vec3{const p=partById(id).position,o=offsets[id]??[0,0,0];return[p[0]+o[0]*amount,p[1]+o[1]*amount,p[2]+o[2]*amount]}
function Label({text,position,small=false}:{text:string;position:Vec3;small?:boolean}){
 const texture=useMemo(()=>{const c=document.createElement('canvas');c.width=512;c.height=96;const ctx=c.getContext('2d');if(ctx){ctx.fillStyle='#f5fbff';ctx.beginPath();ctx.roundRect(0,0,512,96,25);ctx.fill();ctx.font='600 36px sans-serif';ctx.fillStyle='#355571';ctx.textAlign='center';ctx.fillText(text,256,61)}return new CanvasTexture(c)},[text]);useEffect(()=>()=>texture.dispose(),[texture])
 return <sprite position={position} scale={small?[.8,.15,1]:[1.6,.3,1]}><spriteMaterial map={texture} depthTest={false}/></sprite>
}
function Cable({from,to,active,color,reduced}:{from:Vec3;to:Vec3;active:boolean;color:string;reduced:boolean}){
 const curve=useMemo(()=>{const a=new Vector3(...from),b=new Vector3(...to);return new CatmullRomCurve3([a,a.clone().add(new Vector3(0,.25,0)),b.clone().add(new Vector3(0,.25,0)),b])},[...from,...to]),bead=useRef<Mesh>(null)
 useFrame(({clock})=>{if(bead.current&&active&&!reduced)bead.current.position.copy(curve.getPoint(clock.elapsedTime*.5%1))})
 return <><mesh><tubeGeometry args={[curve,32,.023,8,false]}/><meshStandardMaterial color={color} transparent opacity={active?1:.45}/></mesh>{active&&!reduced&&<mesh ref={bead}><sphereGeometry args={[.045,12,12]}/><meshStandardMaterial color="#fff" emissive={color} emissiveIntensity={2}/></mesh>}</>
}
function PartActor({id,p,drive}:{id:AssemblyPartId;p:WorkshopSceneProps;drive:React.MutableRefObject<WorkshopDrive>}){
 const part=partById(id),status=p.record.assembly[id],actor=useRef<Group>(null),dragging=useRef(false),dragValue=useRef<Held|null>(null),current=useRef(p);current.current=p
 const fixed=status!=='TRAY',pos=fixed?location(id,p.exploded+(p.damage??0)):p.held?.id===id?p.held.position:part.tray
 useFrame((_,dt)=>{if(actor.current&&!dragging.current){actor.current.position.lerp(new Vector3(...pos),1-Math.exp(-dt*12));actor.current.rotation.y=fixed&&id.startsWith('front')?-drive.current.steering:p.held?.id===id?p.held.angle:0}})
 function down(e:ThreeEvent<PointerEvent>){e.stopPropagation();if(p.task||p.working)return;p.onSelect(id);if(status!=='TRAY'||p.road)return;dragging.current=true;dragValue.current={id,position:[...part.tray],angle:0};p.onHeld(dragValue.current);(e.target as unknown as {setPointerCapture:(id:number)=>void}).setPointerCapture(e.pointerId)}
 function move(e:ThreeEvent<PointerEvent>){if(!dragging.current)return;e.stopPropagation();const v=e.ray.intersectPlane(new Plane(new Vector3(0,1,0),-part.position[1]),new Vector3());if(v){const next:Vec3=[Math.max(-4.8,Math.min(3,v.x)),part.position[1],Math.max(-3,Math.min(3,v.z))];actor.current?.position.set(...next);dragValue.current={id,position:next,angle:current.current.held?.angle??dragValue.current?.angle??0};p.onHeld(dragValue.current)}}
 function up(e:ThreeEvent<PointerEvent>){if(!dragging.current)return;e.stopPropagation();dragging.current=false;const held=dragValue.current;if(held)p.onDrop({...held,angle:current.current.held?.angle??held.angle});dragValue.current=null;p.onHeld(null)}
 return <group ref={actor} position={pos} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={()=>{dragging.current=false;dragValue.current=null;p.onHeld(null)}}><PartVisual id={id} drive={drive} ratio={MECHANICS.ratio} separateController={p.cup} cutaway={p.cup&&(p.lab||p.view==='xray')} spinning={fixed&&!p.paused&&!p.reduced} ghost={false}/>{p.selected===id&&<mesh rotation={[-Math.PI/2,0,0]} position={[0,-.15,0]}><ringGeometry args={[.45,.49,48]}/><meshBasicMaterial color={status==='FIXED'?'#53c9b6':'#9d89e7'}/></mesh>}{status==='SEATED'&&<Label text="볼트 고정 대기" position={[0,.65,0]}/>}</group>
}
function ControlPod({p}:{p:WorkshopSceneProps}){
 return <group position={[-2.25,0,-1.6]}>
 <SoftBox size={[1.25,.65,1.4]} position={[0,.4,0]} color="#d8e9f6" radius={.12}/><Label text="START · 시험 조작대" position={[0,1.22,0]}/>
 <group position={[0,.8,-.25]} onClick={e=>{e.stopPropagation();p.onStart()}}><mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.2,.2,.09,36]}/><meshStandardMaterial color={p.controls.ready?'#49d8b8':'#9b8ce7'} emissive={p.controls.ready?'#20a98f':'#6753ad'} emissiveIntensity={.3}/></mesh><Label text="⏻" position={[0,.12,0]} small/></group>
 {(['P','D'] as const).map((gear,i)=><group key={gear} position={[-.27+i*.54,.78,.35]} onClick={e=>{e.stopPropagation();p.onControl({gear})}}><SoftBox size={[.4,.13,.35]} color={p.controls.gear===gear?'#63cbbb':'#a5bdcf'}/><Label text={gear} position={[0,.15,0]} small/></group>)}
 {(['brake','accelerator'] as const).map((key,i)=><group key={key} name={`workshop-${key}`} position={[-.3+i*.6,.22,-.93]} rotation={[-p.controls[key]*.45,0,0]} onPointerDown={e=>{e.stopPropagation();(e.target as unknown as {setPointerCapture:(id:number)=>void}).setPointerCapture(e.pointerId);p.onControl({[key]:1})}} onPointerUp={e=>{e.stopPropagation();p.onControl({[key]:0})}} onPointerCancel={()=>p.onControl({[key]:0})}><SoftBox size={[.4,.12,.7]} color={key==='brake'?'#cc91a7':'#6dc9bf'}/><Label text={key==='brake'?'BRAKE':'ACCEL'} position={[0,.3,0]} small/></group>)}
 </group>
}
function World({p}:{p:WorkshopSceneProps}){
 const {world,rapier,step}=useRapier(),{camera,gl,size}=useThree(),car=useRef<Group>(null),cabin=useRef<Group>(null),mechanic=useRef<Group>(null),orbit=useRef<OrbitControls|null>(null),previousRoad=useRef<boolean|undefined>(undefined),q=useRef(new Quaternion())
 const drive=useRef<WorkshopDrive>({distance:0,x:0,speed:0,heading:0,motorRpm:0,wheelAngle:0,pedal:0,brake:0,steering:0})
 useLayoutEffect(()=>{const adapter=new RapierVehiclePhysics(rapier,world,step,p.cup?cupWorld:drivingWorld,drivingSurfaces,{massKg:MECHANICS.massKg}),detach=p.engine.runtime.attach(adapter);p.engine.runtime.start();return()=>{p.engine.runtime.pause();detach();adapter.dispose()}},[p.engine,rapier,world,step])
 useEffect(()=>{const c=new OrbitControls(camera,gl.domElement);c.target.set(-.65,.75,0);c.minDistance=3.3;c.maxDistance=16;c.maxPolarAngle=Math.PI*.48;c.enableDamping=true;orbit.current=c;return()=>{c.dispose();orbit.current=null}},[camera,gl])
 useEffect(()=>{if(p.road)return;const k=Math.max(1,(p.cup&&!p.lab?1.6:1.25)/(size.width/size.height))*(p.view==='cinema'?1.22:1);camera.position.set(4.3*k,3.9*k,-4.7*k);orbit.current?.target.set(-.35,.85,0)},[p.road,p.view,size.width,size.height,camera])
 useEffect(()=>{if(p.paused||p.suspended)p.engine.runtime.pause();else p.engine.runtime.resume()},[p.engine,p.paused,p.suspended])
 useEffect(()=>{if(!p.cup||p.road||!orbit.current)return;orbit.current.target.set(...location(p.selected,p.exploded));orbit.current.update()},[p.cup,p.road,p.selected])
 useFrame((_,dt)=>{
  const r=p.engine.runtime;r.driverInput.setAccelerator(p.controls.accelerator);r.driverInput.setBrake(p.controls.brake);r.driverInput.setSteering(p.controls.steering);r.driverInput.setGearRequest(p.controls.gear);if(!p.paused&&!p.suspended){r.advance(dt);const sample=r.readVehicleState();p.onTick?.({x:sample.position.x,z:sample.position.z,speed:sample.speed,dt:Math.min(dt,.1)})}
  const state=r.readVehicleState();drive.current.motorRpm=p.suspended?0:state.longitudinalVelocity/MECHANICS.wheelRadiusM*MECHANICS.ratio/(Math.PI*2)*60;drive.current.pedal=p.controls.accelerator;drive.current.brake=p.controls.brake;drive.current.steering=p.steeringRad??0
  const c=orbit.current;if(c){c.enabled=!p.road&&!p.held;if(previousRoad.current!==p.road){previousRoad.current=p.road;if(!p.road)c.update()}if(p.road){const at=new Vector3(state.position.x,state.position.y-.55,state.position.z);if(car.current){car.current.position.copy(at);q.current.set(state.rotation.x,state.rotation.y,state.rotation.z,state.rotation.w);car.current.quaternion.copy(q.current)}if(cabin.current){cabin.current.position.copy(at);cabin.current.quaternion.copy(q.current)}if(p.view==='cabin'){const pos=new Vector3(...(p.footwell?[-.05,.9,.75]:[0,1.5,1.2]) as [number,number,number]).applyQuaternion(q.current).add(at),look=new Vector3(...(p.footwell?[0,.25,-.65]:[0,.9,-1.2]) as [number,number,number]).applyQuaternion(q.current).add(at);camera.position.lerp(pos,1-Math.exp(-dt*12));camera.lookAt(look)}else{camera.position.lerp(at.clone().add(new Vector3(...(p.cup?[4,3.5,7]:[5,4,-7]) as [number,number,number])),1-Math.exp(-dt*6));camera.lookAt(at.clone().add(new Vector3(0,.8,p.cup?-5:0)))}}else{if(car.current){car.current.position.set(0,.12,0);car.current.rotation.set(0,0,0)}c.update()}}
  if(mechanic.current){const target=p.working?new Vector3(...partById(p.selected).position).add(new Vector3(1.5,-.5,0)):new Vector3(2.4,0,1.7);mechanic.current.position.lerp(target,1-Math.exp(-dt*5))}
 })
 const sceneParts=p.cup?[...assemblyParts,...campaignParts]:assemblyParts,stage=assemblyStage(p.record.assembly),installed=sceneParts.filter(a=>p.record.assembly[a.id]!=='TRAY'),tray=sceneParts.filter(a=>a.stage===stage&&p.record.assembly[a.id]==='TRAY'&&!(p.task==='place'&&p.selected===a.id)),powered=hardwareReady(p.record)&&(p.benchFrame?.torqueNm??(p.suspended?0:p.engine.controller.frame.torqueNm))>0
 return <><color attach="background" args={['#edf6ff']}/><hemisphereLight args={['#fff','#a3b9d2',1.8]}/><directionalLight position={[5,10,-4]} intensity={2.5} castShadow shadow-mapSize={[2048,2048]}/><directionalLight position={[-4,4,5]} intensity={1.3} color="#b6cfff"/>
 <mesh rotation={[-Math.PI/2,0,0]} receiveShadow position={[0,-.04,0]}><planeGeometry args={[500,800]}/><meshStandardMaterial color={p.road?'#d7e4ed':'#edf4fc'}/></mesh>
 {p.cup&&p.road?<CupTrack {...p.course} paused={p.paused||p.suspended} reduced={p.reduced}/>:p.road?<><mesh rotation={[-Math.PI/2,0,0]} position={[0,-.025,-150]}><planeGeometry args={[18,600]}/><meshStandardMaterial color="#a3b6c7"/></mesh>{Array.from({length:28},(_,i)=><SoftBox key={i} size={[.12,.03,3]} position={[0,0,-i*12]} color="#f5fdff"/>)}{[-1,1].flatMap(s=>Array.from({length:12},(_,i)=><group key={`${s}-${i}`} position={[s*13,0,-i*24]}><SoftBox size={[.3,1.1,.3]} position={[0,.55,0]} color="#a8b9bc"/><mesh position={[0,2,0]}><sphereGeometry args={[1.25,20,16]}/><meshStandardMaterial color="#8dcbbb"/></mesh></group>))}</>:<><gridHelper args={[20,20,'#d0dfeb','#e0ebf4']}/><SoftBox size={[2,.16,5]} position={[-3.25,.48,.2]} color="#bacfdf" radius={.09}/><SoftBox size={[1.5,.65,.7]} position={[3.2,.32,2]} color="#98b8d3" radius={.1}/></>}
 {p.dream&&<DreamSet/>}
 <group ref={car} visible={p.view!=='cabin'}><Chassis paint="#73b8c1"/>{installed.filter(a=>!p.view||p.view==='xray'||(p.damage??0)>0||a.id.includes('Left')||a.id.includes('Right')).map(a=><PartActor key={a.id} id={a.id} p={p} drive={drive}/>)}{p.view&&p.view!=='xray'&&<CarShell mint={p.paint==='mint'} damage={p.damage} ready={p.controls.ready} brake={p.controls.brake}/ >}{p.road&&<group name="momo-seated-driver" scale={p.cup?.48:.6} position={p.cup?[-.3,.4,.15]:[-.3,-.1,-1.05]}><CatDriver celebrating={p.celebrating} reduced={p.reduced} paused={p.paused}/></group>}
 {!p.road&&tray.map(a=><PartActor key={a.id} id={a.id} p={p} drive={drive}/>)}
 {p.record.cables.map(id=>{const cable=allCables.find(c=>c.id===id);if(!cable)return null;const from=portById(p.cup&&id==='control'?'vcuOut':cable.from),to=portById(cable.to),offset=(port:typeof from):Vec3=>{const base=partById(port.part).position,pos=location(port.part,p.exploded);return[port.position[0]+pos[0]-base[0],port.position[1]+pos[1]-base[1],port.position[2]+pos[2]-base[2]]};return <Cable key={id} from={offset(from)} to={offset(to)} color={id==='control'||id==='sensorLink'?'#48bad0':'#e7a270'} active={powered} reduced={p.reduced||p.paused}/>})}
 {p.cup&&(p.lab||p.view==='xray')&&<group position={[0,.68,.95]}><PartVisual id="brakes" drive={drive} ratio={7} spinning={!p.suspended&&!p.paused&&!p.reduced}/></group>}
 {!p.road&&ports.filter(port=>p.record.assembly[port.part]==='FIXED'&&(p.cup?allCables:cables).some(c=>c.from===port.id||c.to===port.id||p.cup&&port.id==='vcuOut')).map(port=>{const base=partById(port.part).position,pos=location(port.part,p.exploded);return <group key={port.id} position={[port.position[0]+pos[0]-base[0],port.position[1]+pos[1]-base[1],port.position[2]+pos[2]-base[2]]} onClick={e=>{e.stopPropagation();p.onPort(port.id)}}><mesh><sphereGeometry args={[p.pending===port.id ? .12 : .08,20,16]}/><meshStandardMaterial color={port.color} emissive={port.color} emissiveIntensity={p.pending===port.id?1:.25}/></mesh>{p.pending===port.id&&<Label text={port.label} position={[0,.5,0]}/>}</group>})}
 </group>
 {p.road&&p.view==='cabin'&&<group ref={cabin}><group position={[0,.65,0]}><Cabin t={p.telemetry!} power={p.onStart} gear={()=>p.onControl({gear:p.controls.gear==='P'?'D':'P'})} onPedal={(kind,value)=>{if(p.cup&&kind==='brake'){if(value)p.onControl({brake:p.controls.brake>0?0:1})}else p.onControl({[kind]:value?1:0})}} footwell={p.footwell}/></group></group>}
 {!p.road&&<>{!p.cup&&p.view!=='cinema'&&<ControlPod p={p}/>}<group ref={mechanic} visible={!p.cup} position={[2.4,0,1.7]} rotation={[0,Math.PI/2,0]} scale={.7}><CatDriver working={p.working} upset={(p.damage??0)>0} celebrating={p.celebrating} reduced={p.reduced} paused={p.paused}/></group>{p.cup&&(p.repairing||p.view==='cinema')&&<Mechanic onArrived={p.onMechanicReady} selected={p.selected} active={!!p.repairing} working={p.working} task={p.task} drive={drive} paused={p.paused} reduced={p.reduced} upset={(p.damage??0)>0} celebrating={p.celebrating}/ >}{p.record.assembly[p.selected]==='TRAY'&&partById(p.selected).stage===stage&&<group position={partById(p.selected).position}><PartVisual id={p.selected} drive={drive} ratio={7} ghost/></group>}</>}
 </>
}
export function WorkshopScene(props:WorkshopSceneProps){return <Canvas shadows dpr={[1,1.5]} camera={{position:[4.3,3.9,-4.7],fov:38,near:.1,far:900}} onContextMenu={e=>e.preventDefault()}><Suspense fallback={null}><Physics paused colliders={false} interpolate={false}><World p={props}/></Physics></Suspense></Canvas>}
