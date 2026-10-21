import { Component, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Physics, useRapier } from '@react-three/rapier'
import { Euler, Group, Quaternion, Vector3 } from 'three'
import { SoftBox, Blob } from '../graphics/SoftShapes'
import { PlaceholderVehicle } from '../../simulation/src/graphics/PlaceholderVehicle'
import { RapierVehiclePhysics } from '../../simulation/src/physics/rapier/RapierVehiclePhysics'
import { INITIAL_TELEMETRY } from '../../simulation/src/runtime/SimulationRuntime'
import type { RaceTelemetry, SimulationRuntime } from '../../simulation/src/runtime/SimulationRuntime'
import type { Gear } from '../../simulation/src/domain/driver/DriverInputTypes'
import { createDrivingRuntime, drivingWorld, drivingSurfaces } from './driving/DrivingRuntime'
import { compileDrivingSw } from './driving/DrivingAssets'
import { lookPresets, moveLook,cameraOffsetForLook } from './interaction'
import type { Look } from './interaction'
import { motorSound, sound } from './audio'
import {LearningVehicle} from './LearningVehicle'

export type DriveSample = { speedKmh: number; distance: number; torqueNm: number }
type Props = { enabled: boolean; paused?: boolean; cockpit?: boolean; volume?: number; reduced?: boolean; automatic?: boolean; brake?: boolean; onDistance?: (distance: number) => void; onTelemetry?: (sample: DriveSample) => void; onPower?: () => void; onBrake?: () => void; onBrakeValue?: (value: boolean) => void;torqueCeilingNm?:number;acceleratorTarget?:number;cutaway?:boolean;gearTarget?:Gear;steeringTarget?:number;onFrameTelemetry?:(frame:RaceTelemetry)=>void }
class DriveBoundary extends Component<{children: ReactNode}, {error: string}> {
  state = { error: '' }
  static getDerivedStateFromError(error: Error) { return { error: error.message } }
  render() { return this.state.error ? <div className="drive-unavailable">주행 엔진을 열지 못했어요.<small>{this.state.error}</small><p>WebGL을 지원하는 화면에서 다시 열어 주세요. 주행 성공으로 처리하지 않습니다.</p></div> : this.props.children }
}
function Track() {
  return <>
    <color attach="background" args={['#c4eaff']}/><fog attach="fog" args={['#d9efff', 90, 240]}/>
    <hemisphereLight args={['#ffffff', '#a2c5bf', 2.4]}/><directionalLight castShadow position={[-12, 20, 5]} intensity={2.8} shadow-mapSize={[2048, 2048]} shadow-camera-left={-25} shadow-camera-right={25} shadow-camera-top={25} shadow-camera-bottom={-25}/>
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -.015, -150]}><planeGeometry args={[500, 800]}/><meshStandardMaterial color="#b8dfd2" roughness={.9}/></mesh>
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, .006, -150]}><planeGeometry args={[20, 800]}/><meshStandardMaterial color="#8da9bb" roughness={.8}/></mesh>
    {[-1, 1].map(side => <group key={side}><SoftBox size={[.18, .5, 500]} position={[side * 11, .5, -150]} color="#f4fbff" radius={.04}/><mesh rotation={[-Math.PI / 2, 0, 0]} position={[side * 8.5, .015, -150]}><planeGeometry args={[.18, 800]}/><meshBasicMaterial color="#ffffff"/></mesh></group>)}
    {Array.from({ length: 65 }, (_, i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, .02, 60 - i * 8]}><planeGeometry args={[.15, 3]}/><meshBasicMaterial color="#f6fcff"/></mesh>)}
    {Array.from({ length: 38 }, (_, i) => <group key={i} position={[(i % 2 ? 1 : -1) * (18 + i % 4 * 3), 0, 40 - i * 13]}><SoftBox size={[.4, 1.8, .4]} position={[0, .9, 0]} color="#8c9f98"/><Blob position={[0, 3, 0]} scale={[2, 2.5, 2]} color={i % 3 ? '#75c5ba' : '#92cce2'}/></group>)}
    <group position={[0, 0, -90]}><SoftBox size={[23, .6, .6]} position={[0, 5, 0]} color="#7e94df"/>{[-10, 10].map(x => <SoftBox key={x} size={[.5, 5, .5]} position={[x, 2.5, 0]} color="#eaf5ff"/>)}</group>
  </>
}
export function Cabin({ t, power, gear, onPedal,footwell=false }: { t: RaceTelemetry; power?: () => void; gear: () => void; onPedal: (kind:'brake'|'accelerator', value:boolean)=>void;footwell?:boolean }) {
  const wheel = useRef<Group>(null), pedal = useRef<Group>(null), accelerator = useRef<Group>(null)
  useFrame((_, dt) => { const k = Math.min(1, dt * 12); if (wheel.current) wheel.current.rotation.z += (-t.steering * .8 - wheel.current.rotation.z) * k; if (pedal.current) pedal.current.rotation.x += (-t.brake * .65 - pedal.current.rotation.x) * k; if (accelerator.current) accelerator.current.rotation.x += (-t.accelerator * .5 - accelerator.current.rotation.x) * k })
  return <group position={[0, -.65, 0]}>
    <SoftBox size={[1.7, .12, 1.5]} position={[0, .3, .05]} color="#46677b"/>
    <SoftBox size={[1.9, .35, .48]} position={[0, 1.08, -.6]} color="#cbe5ed" radius={.13}/>
    <SoftBox size={[.67, .26, .05]} position={[-.22, 1.18, -.33]} color="#2c5268" radius={.06}/>
    {[0, 1, 2].map(i => <mesh key={i} position={[-.4 + i * .18, 1.2, -.29]}><sphereGeometry args={[.035, 16, 10]}/><meshStandardMaterial color={t.eDriveCommand.magnitudeNm > 0 || t.vehicleSw?.input.vehicleReady ? '#5effd2' : '#839dad'} emissive="#3fffc9" emissiveIntensity={t.vehicleSw?.input.vehicleReady ? 1 : 0}/></mesh>)}
    <group name="driver-wheel" visible={!footwell} ref={wheel} position={[-.24, 1.01, -.18]} rotation={[.3, 0, 0]}><mesh><torusGeometry args={[.32, .045, 16, 48]}/><meshPhysicalMaterial color="#284e65" clearcoat={.8}/></mesh><SoftBox size={[.58, .045, .05]} color="#a9c6d5"/><Blob scale={[.11, .1, .04]} color="#7bd6cd"/></group>
    {[-.3,.3].map(x=><group key={x} position={[x,.34,-.64]}><mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.06,.06,.32,20]}/><meshStandardMaterial color="#b7cedc" metalness={.85}/></mesh>{[-.12,0,.12].map(z=><mesh key={z} position={[0,0,z]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.07,.015,8,20]}/><meshStandardMaterial color="#718da3" metalness={.7}/></mesh>)}</group>)}
    {[-.3, .3].map((x, i) => <group name={i?'driver-accelerator':'driver-brake'} key={i} position={[x, .34, -.55]} ref={i ? accelerator : pedal} onPointerDown={e=>{e.stopPropagation();onPedal(i?'accelerator':'brake',true)}} onPointerUp={e=>{e.stopPropagation();onPedal(i?'accelerator':'brake',false)}}><SoftBox size={[i ? .18 : .3, .45, .1]} position={[0, .18, 0]} color={i ? '#7ed7c5' : '#8ca8bf'} radius={.04}/>{[0, 1, 2, 3].map(j => <SoftBox key={j} size={[i ? .12 : .24, .02, .02]} position={[0, .04 + j * .09, .06]} color="#e5f5ff" radius={.005}/>)}</group>)}
    <group position={[.64, .65, .28]} onClick={e => { e.stopPropagation(); gear() }}><SoftBox size={[.27, .22, .5]} color="#dbeaf2"/><SoftBox size={[.04, .3, .04]} position={[0, .23, 0]} color="#657f94"/><Blob position={[0, .4, 0]} scale={[.12, .08, .12]} color="#2d5c78"/></group>
    <group position={[.67, 1.16, -.27]} onClick={e => { e.stopPropagation(); power?.() }}><mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.09, .09, .045, 32]}/><meshStandardMaterial color="#31c7b5" metalness={.4}/></mesh></group>
  </group>
}
function DriveScene({ runtime, t, look, cockpit, paused, automatic, brake,acceleratorTarget=.38, onDistance, onTelemetry, onPower, cutaway=false,onFrameTelemetry,gearTarget='D',steeringTarget=0,shift, onPedal=(kind,value)=>{if(kind==='brake')runtime.driverInput.setBrake(value?1:0);else runtime.driverInput.setAccelerator(value?1:0)} }: { runtime: SimulationRuntime; t: RaceTelemetry; look: Look; cockpit: boolean; paused: boolean; automatic: boolean; brake: boolean;acceleratorTarget?:number; onDistance?: Props['onDistance']; onTelemetry?: Props['onTelemetry']; onPower?: Props['onPower'];cutaway?:boolean;gearTarget?:Gear;steeringTarget?:number;onFrameTelemetry?:Props['onFrameTelemetry']; shift: () => void; onPedal?:(kind:'brake'|'accelerator',value:boolean)=>void }) {
  const { rapier, world, step } = useRapier()
  const body = useRef<Group>(null), cabin = useRef<Group>(null), elapsed = useRef(0), distance = useRef(0), last = useRef(new Vector3(0, .9, 0))
  const q = useRef(new Quaternion()), local = useRef(new Quaternion()), destination = useRef(new Vector3()), aim = useRef(new Vector3())
  useLayoutEffect(() => { const adapter = new RapierVehiclePhysics(rapier, world, step, drivingWorld, drivingSurfaces); const detach = runtime.attach(adapter); runtime.start(); return () => { runtime.pause(); detach(); adapter.dispose() } }, [runtime, rapier, world, step])
  useEffect(() => { if (paused) runtime.pause(); else runtime.resume() }, [paused, runtime])
  useFrame(({ camera }, delta) => {
    if (paused) return
    if (automatic) { runtime.driverInput.setGearRequest(gearTarget);runtime.driverInput.setSteering(steeringTarget);runtime.driverInput.setAccelerator(brake ? 0 : acceleratorTarget); runtime.driverInput.setBrake(brake ? .6 : 0) }
    runtime.advance(delta)
    const s = runtime.readVehicleState(); q.current.set(s.rotation.x, s.rotation.y, s.rotation.z, s.rotation.w)
    const p = new Vector3(s.position.x, s.position.y, s.position.z)
    if (body.current) { body.current.position.copy(p).add(new Vector3(0, -.65, 0)); body.current.quaternion.copy(q.current); body.current.traverse(o => { if (o.name === 'wheel-spin') o.rotation.z -= s.speed * Math.min(delta, .1) / .425; else if (o.name.startsWith('front-wheel-')) o.rotation.y = -t.steering * .45 }) }
    if (cabin.current) { cabin.current.position.copy(p); cabin.current.quaternion.copy(q.current) }
    if (cockpit) { destination.current.set(...cameraOffsetForLook(look)).applyQuaternion(q.current).add(p); camera.position.lerp(destination.current,Math.min(1,delta*12)); local.current.setFromEuler(new Euler(look.pitch, look.yaw, 0, 'YXZ')); camera.quaternion.copy(q.current).multiply(local.current) }
    else { destination.current.set(cutaway?3:5, cutaway?2.6:4, cutaway?4:7).applyQuaternion(q.current).add(p); camera.position.lerp(destination.current, Math.min(1, delta * 5)); aim.current.copy(p).y += .7; camera.lookAt(aim.current) }
    distance.current += Math.hypot(p.x - last.current.x, p.z - last.current.z); last.current.copy(p)
    elapsed.current += delta
    if (elapsed.current > .15) { elapsed.current = 0;onFrameTelemetry?.(t); onDistance?.(distance.current); onTelemetry?.({ speedKmh: s.speed * 3.6, distance: distance.current, torqueNm: t.appliedDriveForceN===undefined?t.eDriveCommand.magnitudeNm:Math.abs(t.appliedDriveForceN)/10 }) }
  }, -50)
  return <><Track/><group ref={body} visible={!cockpit}>{cutaway?<LearningVehicle brake={t.brake} ready={!!t.vehicleSw?.input.vehicleReady} speedKmh={t.longitudinalVelocity*3.6} torqueNm={t.eDriveCommand.magnitudeNm} steering={t.steering} wheelAngleRad={t.physicsCommand?.frontWheelAngleRad} paused={paused}/>:<PlaceholderVehicle/>}</group><group ref={cabin} visible={cockpit}><Cabin t={t} power={onPower} gear={shift} onPedal={onPedal} footwell={look.zone==='pedals'}/></group></>
}
export function DriveExperience({ enabled, paused = false, cockpit: initialCockpit = false, volume = .25, reduced = false, automatic = false, brake = false, onDistance, onTelemetry, onPower, onBrake, onBrakeValue,torqueCeilingNm,acceleratorTarget,cutaway=false,onFrameTelemetry,gearTarget,steeringTarget }: Props) {
  const gate = useRef(enabled); gate.current = enabled
  const ceiling=useRef(torqueCeilingNm);ceiling.current=torqueCeilingNm
  const [runtime, setRuntime] = useState<SimulationRuntime>(), [error, setError] = useState(''), [t, setT] = useState(INITIAL_TELEMETRY)
  const [look, setLook] = useState<Look>(lookPresets.road), [cockpit, setCockpit] = useState(initialCockpit)
  const drag = useRef<{ x: number; y: number } | undefined>(undefined), keys = useRef(new Set<string>()), pointer = useRef({ accelerator: false, brake: false }), gear = useRef<Gear>('D')
  const motor = useRef<ReturnType<typeof motorSound> | undefined>(undefined)
  const brakeFeedback=useRef(onBrakeValue),lastBrake=useRef<boolean|undefined>(undefined);brakeFeedback.current=onBrakeValue
  useEffect(()=>{const value=t.brake>.15;if(lastBrake.current!==value){lastBrake.current=value;brakeFeedback.current?.(value)}},[t.brake])
  useEffect(() => { let alive = true; compileDrivingSw().then(module => { if (alive) setRuntime(createDrivingRuntime(module, () => gate.current, setT,()=>ceiling.current)) }).catch(e => setError(String(e))); return () => { alive = false } }, [])
  useEffect(() => { if (!runtime || automatic) return; const apply = () => { runtime.driverInput.setAccelerator(keys.current.has('ArrowUp') || keys.current.has('KeyW') || pointer.current.accelerator ? 1 : 0); runtime.driverInput.setBrake(keys.current.has('ArrowDown') || keys.current.has('KeyS') || pointer.current.brake ? 1 : 0); runtime.driverInput.setSteering((keys.current.has('ArrowRight') || keys.current.has('KeyD') ? 1 : 0) - (keys.current.has('ArrowLeft') || keys.current.has('KeyA') ? 1 : 0)) }; const clear = () => { keys.current.clear(); pointer.current = { accelerator: false, brake: false }; runtime.driverInput.resetMotion() }; const down = (e: KeyboardEvent) => { if (paused || (e.target as HTMLElement).closest('input,select,textarea,[role=slider]')) return; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(e.code)) { e.preventDefault(); keys.current.add(e.code); apply() } }; const up = (e: KeyboardEvent) => { keys.current.delete(e.code); apply() }; const hidden = () => { if (document.hidden) { clear(); runtime.pause() } else if (!paused) runtime.resume() }; window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear); window.addEventListener('pointerup', clear); document.addEventListener('visibilitychange', hidden); if (paused) clear(); return () => { clear(); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear); window.removeEventListener('pointerup', clear); document.removeEventListener('visibilitychange', hidden) } }, [runtime, paused, automatic])
  useEffect(() => { motor.current = motorSound(volume); return () => motor.current?.stop() }, [volume])
  useEffect(() => { motor.current?.update(enabled && !paused, t.speedKmh, t.accelerator) }, [enabled, paused, t])
  const shift = (next?: Gear) => { const gears: Gear[] = ['P', 'R', 'N', 'D']; gear.current = next ?? gears[(gears.indexOf(gear.current) + 1) % 4]; runtime?.driverInput.setGearRequest(gear.current); sound('gear', volume) }
  const pedal = (kind: 'accelerator' | 'brake', value: boolean) => { pointer.current[kind] = value; if (kind === 'brake') { runtime?.driverInput.setBrake(value ? 1 : 0); onBrake?.() } else runtime?.driverInput.setAccelerator(value ? 1 : 0) }
  return <section className={`drive-experience ${automatic ? 'drive-automatic' : ''}`} aria-label="실시간 C/WASM·Rapier 차량 시험 트랙">
    {error ? <div className="drive-unavailable">{error}</div> : !runtime ? <div className="drive-unavailable">차량 시뮬레이션 준비 중…</div> : <div className="drive-canvas"
      onPointerDown={e=>{if(cockpit&&e.button===0&&(e.target as HTMLElement).tagName==='CANVAS'){drag.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId)}}}
      onPointerMove={e=>{const previous=drag.current;if(!previous||!cockpit)return;const x=e.clientX,y=e.clientY,dx=x-previous.x,dy=y-previous.y;drag.current={x,y};if(Number.isFinite(dx)&&Number.isFinite(dy))setLook(l=>moveLook(l,dx,dy))}}
      onPointerUp={()=>{drag.current=undefined}} onPointerCancel={()=>{drag.current=undefined}} onLostPointerCapture={()=>{drag.current=undefined}}>
      <DriveBoundary><Canvas shadows camera={{position:[4,4,7],fov:65,near:.05,far:800}} dpr={[1,1.5]} fallback={<div className="drive-unavailable">WebGL이 필요해요.</div>}><Suspense fallback={null}><Physics gravity={[0,-9.81,0]} paused colliders={false} interpolate={false}>
        <DriveScene runtime={runtime} t={t} look={look} cockpit={cockpit} paused={paused} automatic={automatic} brake={brake} acceleratorTarget={acceleratorTarget} onDistance={onDistance} onTelemetry={onTelemetry} onPower={onPower} cutaway={cutaway} gearTarget={gearTarget} steeringTarget={steeringTarget} onFrameTelemetry={onFrameTelemetry} shift={()=>shift()} onPedal={pedal}/>
      </Physics></Suspense></Canvas></DriveBoundary></div>}
    <div className="drive-readout"><b>{Math.round(t.speedKmh)}<small>km/h</small></b><span>{enabled?'● 구동 허용':'○ 구동 차단'}</span><span>{t.gear} · C 명령 {Math.round(t.eDriveCommand.magnitudeNm)} Nm</span>{torqueCeilingNm!==undefined&&<span>적용 {Math.round(Math.abs(t.appliedDriveForceN??0)/10)} Nm · 추가 상한 {torqueCeilingNm.toFixed(1)}</span>}{cutaway&&<span>투시 모형 · 실제 모터 RPM 측정 아님</span>}{t.error&&<strong>{t.error}</strong>}</div>
    {!automatic && <><nav className="look-controls" aria-label="운전자 시야"><button onClick={() => { setCockpit(true); setLook(lookPresets.road) }}>정면</button><button onClick={() => { setCockpit(true); setLook(lookPresets.pedals) }}>페달 내려다보기</button><button onClick={() => { setCockpit(true); setLook(lookPresets.gear) }}>기어 보기</button><button onClick={() => setCockpit(c => !c)}>{cockpit ? '차량 바깥 시점' : '운전자 시점'}</button></nav><div className="gear-controls" aria-label="변속기">{(['P', 'R', 'N', 'D'] as Gear[]).map(g => <button key={g} aria-pressed={t.gear === g} onClick={() => shift(g)}>{g}</button>)}{!t.transitionAccepted && <small>정차 후 방향을 바꿔요</small>}</div><div className="drive-pedals">{(['brake', 'accelerator'] as const).map(kind => <button key={kind} aria-label={kind === 'brake' ? '브레이크 누르고 있기' : '가속 페달 누르고 있기'} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); pedal(kind, true) }} onPointerUp={() => pedal(kind, false)} onPointerCancel={() => pedal(kind, false)} onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); pedal(kind, true) } }} onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') pedal(kind, false) }}><i style={{ height: `${(kind === 'brake' ? t.brake : t.accelerator) * 100}%` }}/><b>{kind === 'brake' ? 'BRAKE' : 'ACCEL'}</b><span>{Math.round((kind === 'brake' ? t.brake : t.accelerator) * 100)}%</span></button>)}</div><p className="drive-help">↑ 가속 · ↓ 제동 · ← → 조향 · 화면 드래그로 둘러보기{reduced ? ' · 화면 흔들림 없음' : ''}</p></>}
  </section>
}
