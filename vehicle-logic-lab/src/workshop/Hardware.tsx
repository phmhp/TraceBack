// Adapted teammate procedural hardware, integrated with existing TRACKBACK art.
import {useRef} from 'react'
import type {MutableRefObject} from 'react'
import {useFrame} from '@react-three/fiber'
import type {Group} from 'three'
import {SoftBox} from '../graphics/SoftShapes'
import type {AssemblyPartId,WorkshopDrive,Vec3} from './assembly'
function PartMaterial({ color, ghost = false, metalness = .3 }: { color: string; ghost?: boolean; metalness?: number }) {
  return <meshStandardMaterial color={color} metalness={ghost ? 0 : metalness} roughness={.42} transparent={ghost} opacity={ghost ? .18 : 1} depthWrite={!ghost} />
}

function Cuboid({ position = [0, 0, 0], size, color, ghost = false }: { position?: Vec3; size: Vec3; color: string; ghost?: boolean }) {
  return <mesh position={position} castShadow={!ghost} receiveShadow={!ghost}><boxGeometry args={size} /><PartMaterial color={color} ghost={ghost} /></mesh>
}

function Cylinder({ position = [0, 0, 0], radius, length, color, axis = 'z', ghost = false }: { position?: Vec3; radius: number; length: number; color: string; axis?: 'x' | 'y' | 'z'; ghost?: boolean }) {
  return <mesh position={position} rotation={axis === 'x' ? [0, 0, Math.PI / 2] : axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0]} castShadow={!ghost}><cylinderGeometry args={[radius, radius, length, 24]} /><PartMaterial color={color} ghost={ghost} /></mesh>
}

function ChipBadge({ position, small = false }: { position: Vec3; small?: boolean }) {
  return <group position={position} scale={small ? .55 : 1}><Cuboid size={[.17, .14, .018]} color="#244965" />{[-.045, 0, .045].map(n => <group key={n}><Cuboid position={[-.11, n, 0]} size={[.045, .018, .014]} color="#e4d4a7" /><Cuboid position={[.11, n, 0]} size={[.045, .018, .014]} color="#e4d4a7" /></group>)}<Cuboid position={[0, 0, .013]} size={[.085, .065, .012]} color="#8cbbdd" /></group>
}

export function PartVisual({ id, ghost = false, spinning = false, cutaway=false,separateController=false,drive, ratio }: { id: AssemblyPartId; ghost?: boolean; spinning?: boolean;cutaway?:boolean;separateController?:boolean; drive: MutableRefObject<WorkshopDrive>; ratio: number }) {
  const spinner = useRef<Group>(null)
  const shaft = useRef<Group>(null)
  const lever = useRef<Group>(null)
  const pads=useRef<Group>(null)
  useFrame((_, dt) => {
    if(lever.current&&!ghost)lever.current.rotation.x=-.45-(id==='brakePedal'?drive.current.brake:drive.current.pedal)*.45
    if(pads.current&&!ghost)pads.current.children.forEach(pad=>{pad.position.z=.19-drive.current.brake*.09})
    if (!spinning || ghost) return
    const state = drive.current
    const motorAngle = state.motorRpm / 60 * Math.PI * 2 * dt
    if (spinner.current) {
      if (id.includes('Left') || id.includes('Right') || id === 'axle'||id==='brakes') spinner.current.rotation.x -= motorAngle / ratio
      else spinner.current.rotation.z += motorAngle
    }
    if (shaft.current) shaft.current.rotation.z += motorAngle / ratio
  })
  const muted = ghost ? '#9bbd9c' : undefined
  if(id==='vcu')return <group name="vehicle-control-ecu"><SoftBox size={[.62,.2,.48]} color={muted??'#8b80c6'} radius={.045}/>{[-.2,-.1,0,.1,.2].map(x=><Cuboid key={x} position={[x,.12,0]} size={[.035,.06,.42]} color={muted??'#c3b8e8'} ghost={ghost}/>)}<Cuboid position={[.34,0,0]} size={[.1,.12,.26]} color={muted??'#526a8e'} ghost={ghost}/>{!ghost&&<ChipBadge position={[0,.17,0]} small/>}</group>
  if (id === 'brakes') return <group><group ref={spinner}>{[-1,1].map(side=><group key={side} position={[side*1.05,0,0]}><Cylinder axis="x" radius={.27} length={.055} color={muted??'#b8c6c4'} ghost={ghost}/>{[0,1,2,3].map(n=><Cuboid key={n} position={[0,Math.sin(n*1.57)*.17,Math.cos(n*1.57)*.17]} size={[.065,.03,.03]} color="#758b9d"/>)}</group>)}</group><group ref={pads}>{[-1,1].map(side=><group key={side} position={[side*1.05,.14,.19]}><Cuboid size={[.17,.25,.19]} color={muted??'#d5819b'} ghost={ghost}/></group>)}</group><Cylinder axis="x" length={1.8} radius={.025} color={muted ?? '#c18b92'} ghost={ghost} /></group>
  if (id === 'steeringRack') return <group><Cylinder axis="x" radius={.065} length={1.85} color={muted ?? '#a6bcb2'} ghost={ghost} /><Cuboid size={[.45, .22, .24]} color={muted ?? '#75a196'} ghost={ghost} />{[-1, 1].map(side => <Cylinder key={side} axis="z" position={[side * .97, -.05, -.1]} radius={.035} length={.35} color={muted ?? '#b9cbbb'} ghost={ghost} />)}{!ghost && <ChipBadge position={[0, 0, .13]} small />}</group>
  if (id === 'steeringWheel') return <group rotation={[-.5, 0, 0]}><mesh><torusGeometry args={[.25, .035, 10, 28]} /><PartMaterial color={muted ?? '#486e60'} ghost={ghost} /></mesh><Cuboid size={[.45, .04, .04]} color={muted ?? '#90a98c'} ghost={ghost} /><Cylinder position={[0, 0, .22]} radius={.045} length={.42} color={muted ?? '#b9cbbb'} ghost={ghost} /><Cuboid position={[.24, -.1, .15]} size={[.22, .17, .22]} color={muted ?? '#4788c2'} ghost={ghost} />{!ghost && <ChipBadge position={[.24, -.1, .27]} small />}</group>
  if (id === 'motor') return <group>
    {cutaway?<><mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.31,.31,.61,40,1,true,0,Math.PI]}/><meshStandardMaterial color="#b9b7d2" side={2} metalness={.5} roughness={.3}/></mesh>{[-.2,0,.2].map(z=><mesh key={z} position={[0,0,z]}><torusGeometry args={[.25,.035,10,32]}/><meshStandardMaterial color="#db9369" metalness={.6} roughness={.3}/></mesh>)}</>:<Cylinder radius={.31} length={.61} color={muted ?? '#d39c58'} ghost={ghost} />}
    {[-.23, -.12, 0, .12, .23].map(z => <Cylinder key={z} position={[0, 0, z]} radius={.323} length={.023} color={muted ?? '#b57d3f'} ghost={ghost} />)}
    <Cylinder position={[0, 0, .34]} radius={.24} length={.08} color={muted ?? '#bcc7c4'} ghost={ghost} />
    <group ref={spinner}>{cutaway&&<><Cylinder radius={.17} length={.5} color="#7a98b3"/>{[-1,1].map(s=><Cuboid key={s} position={[s*.16,0,0]} size={[.04,.1,.44]} color={s<0?'#7e8bd2':'#d08baa'}/>)}</>}<Cylinder position={[0, 0, .48]} radius={.072} length={.25} color={muted ?? '#d5dcd7'} ghost={ghost} /><Cuboid position={[0, .075, .48]} size={[.08, .03, .2]} color={muted ?? '#6c8275'} ghost={ghost} /></group>
    <Cuboid position={[0, -.28, 0]} size={[.61, .09, .45]} color={muted ?? '#b1bdb4'} ghost={ghost} />
    <Cuboid position={[.24, .2, .08]} size={[.14, .16, .2]} color={muted ?? '#c49358'} ghost={ghost} />
  </group>
  if (id === 'gearbox') return <group>
    <Cuboid size={[.69, .43, .57]} color={muted ?? '#9da7ac'} ghost={ghost} />
    <Cylinder position={[0, 0, -.33]} radius={.105} length={.13} color={muted ?? '#d8ddcf'} ghost={ghost} />
    <group ref={spinner}><Cylinder position={[0, 0, -.41]} radius={.2} length={.07} color={muted ?? '#c6a95b'} ghost={ghost} />{Array.from({ length: 10 }, (_, i) => <group key={i} rotation={[0, 0, i * Math.PI / 5]}><Cuboid position={[0, .195, -.41]} size={[.065, .07, .07]} color={muted ?? '#c6a95b'} ghost={ghost} /></group>)}</group>
    <group ref={shaft}><Cylinder position={[.24, .02, -.345]} radius={.1} length={.06} color={muted ?? '#dfd2a0'} ghost={ghost} /></group>
    <Cylinder axis="x" radius={.19} length={.85} color={muted ?? '#bac2c5'} ghost={ghost} />
    {[-.25, 0, .25].map(x => <Cuboid key={x} position={[x, .235, 0]} size={[.035, .06, .5]} color={muted ?? '#b1c1b4'} ghost={ghost} />)}
  </group>
  if (id === 'axle') return <group ref={spinner}>
    {[-1, 1].map(sign => <group key={sign}><Cylinder position={[sign * .76, 0, 0]} axis="x" radius={.059} length={.75} color={muted ?? '#c2ccc8'} ghost={ghost} />{[.43, 1.07].map(x => <group key={x}><Cylinder position={[sign * x, 0, 0]} axis="x" radius={.11} length={.12} color={muted ?? '#5b6b62'} ghost={ghost} />{[-.04, 0, .04].map(offset => <Cylinder key={offset} position={[sign * (x + offset), 0, 0]} axis="x" radius={.12} length={.016} color={muted ?? '#7b8981'} ghost={ghost} />)}</group>)}</group>)}
  </group>
  if (id.includes('Left') || id.includes('Right')) return <group ref={spinner}>
    <mesh rotation={[0, Math.PI / 2, 0]} castShadow={!ghost}><torusGeometry args={[.38, .14, 12, 40]} /><PartMaterial color={muted ?? '#3c4843'} ghost={ghost} metalness={.05} /></mesh>
    <Cylinder axis="x" radius={.29} length={.23} color={muted ?? '#c3ccc3'} ghost={ghost} />
    <Cylinder axis="x" radius={.075} length={.29} color={muted ?? '#8b9c8e'} ghost={ghost} />
    {Array.from({ length: 5 }, (_, i) => <group key={i} rotation={[i * Math.PI * 2 / 5, 0, 0]}><Cuboid position={[0, .16, 0]} size={[.25, .2, .055]} color={muted ?? '#e3e6d8'} ghost={ghost} /></group>)}
    {!ghost && Array.from({ length: 20 }, (_, i) => <group key={i} rotation={[i * Math.PI / 10, 0, 0]}><Cuboid position={[0, .502, 0]} size={[.16, .018, .04]} color="#323e39" /></group>)}
  </group>
  if (id === 'battery') return <group>
    <Cuboid size={[1.03, .28, .84]} color={muted ?? '#89996e'} ghost={ghost} />
    <Cuboid position={[0, .16, 0]} size={[1.07, .045, .88]} color={muted ?? '#a7b78c'} ghost={ghost} />
    {[-.28, .28].map(x => <Cuboid key={x} position={[x, .19, 0]} size={[.055, .02, .86]} color={muted ?? '#6b7c55'} ghost={ghost} />)}
    <Cuboid position={[.4, .19, .28]} size={[.13, .12, .12]} color={muted ?? '#de9b4b'} ghost={ghost} />
    <Cuboid position={[0, .185, 0]} size={[.2, .012, .18]} color={muted ?? '#e3d7a4'} ghost={ghost} />
  </group>
  if (id === 'inverter') return <group>
    <Cuboid size={[.58, .3, .6]} color={muted ?? '#4788c2'} ghost={ghost} />
    {Array.from({ length: 7 }, (_, i) => <Cuboid key={i} position={[-.24 + i * .08, .19, 0]} size={[.025, .12, .5]} color={muted ?? '#83b4dc'} ghost={ghost} />)}
    <Cuboid position={[.32, 0, -.2]} size={[.12, .12, .14]} color={muted ?? '#e39c53'} ghost={ghost} />
    {!ghost && <ChipBadge position={[0, -.015, .311]} />}
  </group>
  return <group>
    <Cuboid size={[.37, .1, .45]} color={muted ?? (id === 'brakePedal' ? '#bc8069' : '#af876c')} ghost={ghost} />
    <group ref={lever} rotation={[-.45, 0, 0]}><Cuboid position={[0, .16, -.07]} size={[.23, .07, .32]} color={muted ?? '#56685e'} ghost={ghost} />{[-.13, -.05, .03].map(z => <Cuboid key={z} position={[0, .2, z]} size={[.19, .025, .018]} color={muted ?? '#8a9b88'} ghost={ghost} />)}</group>
    {!separateController&&<Cuboid position={[.22, .08, .1]} size={[.23, .2, .24]} color={muted ?? '#4788c2'} ghost={ghost} />}
    {!ghost && !separateController && <ChipBadge position={[.22, .08, .229]} small />}
  </group>
}

export function Chassis({ paint = '#58766a' }: { paint?: string }) {
  return <group>
    {[-.72, .72].map(x => <SoftBox key={x} position={[x, .47, -.23]} size={[.16, .2, 3.16]} radius={.025} color={paint} metalness={.45} />)}
    {[-1.6, -.55, .5, 1.2].map(z => <SoftBox key={z} position={[0, .47, z]} size={[1.52, .14, .13]} radius={.025} color="#6f8c78" metalness={.4} />)}
    <Cuboid position={[0, .51, -1.25]} size={[1.3, .045, .95]} color="#9aa88a" />
    {[-1, 1].map(sign => <group key={sign}>{[-1.3, .95].map(z => <group key={z}><Cylinder position={[sign * .91, .63, z]} axis="x" radius={.055} length={.54} color="#9fae9f" /><Cylinder position={[sign * .68, .72, z]} radius={.07} length={.35} axis="y" color="#c8ac6a" /></group>)}</group>)}
    <group position={[.15, .88, -1.05]} rotation={[0, 0, .1]}><Cuboid position={[0, 0, 0]} size={[.42, .12, .49]} color="#b99871" /><Cuboid position={[0, .2, .2]} size={[.42, .42, .1]} color="#b99871" /></group>
    <Cylinder position={[0, .55, -1.3]} axis="x" radius={.025} length={2.1} color="#b4c2b1" />
  </group>
}
