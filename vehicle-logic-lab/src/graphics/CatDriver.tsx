import { useEffect, useMemo, useRef } from 'react'
import { CatmullRomCurve3, ExtrudeGeometry, Shape, Vector3 } from 'three'
import type { Group } from 'three'
import type {MutableRefObject} from 'react'
import { useFrame } from '@react-three/fiber'
import { Blob } from './SoftShapes'

const cream = '#f7e9d3'
const sadMouth=new CatmullRomCurve3([new Vector3(-.1,.67,-.555),new Vector3(0,.72,-.575),new Vector3(.1,.67,-.555)])

/** Rounded triangular ears, with the base embedded into the head. */
function SoftEar({ side }: { side: number }) {
  const geometry = useMemo(() => {
    const shape = new Shape()
    shape.moveTo(-0.2, 0)
    shape.quadraticCurveTo(-0.24, 0.15, -0.12, 0.39)
    shape.quadraticCurveTo(-0.07, 0.49, 0.02, 0.39)
    shape.quadraticCurveTo(0.18, 0.24, 0.22, 0)
    shape.quadraticCurveTo(0, -0.07, -0.2, 0)
    return new ExtrudeGeometry(shape, {
      depth: 0.14, bevelEnabled: true, bevelThickness: 0.065,
      bevelSize: 0.055, bevelSegments: 5, steps: 1, curveSegments: 16,
    })
  }, [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <group position={[side * 0.43, 1.25, -0.08]} rotation={[0, 0, side * -0.13]}>
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={cream} roughness={0.85} />
    </mesh>
    <Blob position={[-0.02, 0.2, -0.065]} scale={[0.095, 0.16, 0.014]} rotation={[0, 0, 0.17]} color="#eed4c6" roughness={0.9} />
  </group>
}

/** Cream plush-like driver inspired by the latest references. Presentation only. */
export type CatMotion={walking:boolean;surprise?:number;watching?:boolean}
export function CatDriver({ celebrating = false,working=false,upset=false,reduced=false,paused=false,seated=false,externalTool=false,motion }: { celebrating?: boolean;working?:boolean;upset?:boolean;reduced?:boolean;paused?:boolean;seated?:boolean;externalTool?:boolean;motion?:MutableRefObject<CatMotion> }) {
  const root = useRef<Group>(null)
  const leftArm = useRef<Group>(null)
  const rightArm = useRef<Group>(null)
  const legs=useRef<Group>(null),eyes=useRef<Group>(null),sweat=useRef<Group>(null),phase=useRef(0)
  useFrame(({ clock }, delta) => {
    if (paused) return
    const blend = 1 - Math.exp(-7 * Math.min(delta, .1))
    const walking=!!motion?.current.walking,watching=!!motion?.current.watching
    phase.current+=Math.min(delta,.1)*(walking?7:watching?2:working?5:1)
    if (root.current) {
      root.current.rotation.y += (0 - root.current.rotation.y) * blend
      root.current.position.y = .46 + (!reduced&&(celebrating||walking) ? Math.abs(Math.sin(phase.current)) * (walking?.045:.12) : 0)
      root.current.rotation.x = working ? -.12 : upset ? .15 : 0
    }
    if (leftArm.current) leftArm.current.rotation.z += ((celebrating ? -2.55 : 0) - leftArm.current.rotation.z) * blend
    if (rightArm.current) rightArm.current.rotation.z += ((celebrating ? 2.2 : working ? .55+(reduced?0:Math.sin(clock.elapsedTime*5)*.12) : 0) - rightArm.current.rotation.z) * blend
    if(leftArm.current)leftArm.current.rotation.x=walking&&!reduced?Math.sin(phase.current)*.55:watching?-.6:0
    if(rightArm.current)rightArm.current.rotation.x=watching?-.7-(reduced?0:Math.max(0,Math.sin(phase.current))*.9):walking&&!reduced?-Math.sin(phase.current)*.55:0
    legs.current?.children.forEach((leg,i)=>{leg.rotation.x=seated?-1.1:walking&&!reduced?Math.sin(phase.current+i*Math.PI)*.55:0})
    if(eyes.current)eyes.current.scale.y=1+(motion?.current.surprise??0)*.8
    if(sweat.current)sweat.current.position.y=.75+(working&&!reduced?Math.sin(phase.current)*.05:0)
  })
  return <group ref={root} position={[0, 0.46, 0.15]}>
    <Blob position={[0, 0.25, 0.05]} scale={[0.46, 0.48, 0.36]} color={cream} roughness={0.85} />
    <group ref={legs} name="momo-grounded-legs">{[-1,1].map(side=><group key={side} position={[side*.2,-.03,.03]}><Blob position={[0,-.16,0]} scale={[.18,.17,.18]} color={cream}/><Blob position={[0,-.32,-.1]} scale={[.22,.12,.27]} color={cream}/></group>)}</group>
    <Blob position={[0,.2,-.265]} scale={[.3,.32,.07]} color="#fff7e9" roughness={.9}/>
    <Blob position={[0,.58,-.24]} scale={[.32,.06,.16]} color="#73bfc4"/>
    <SoftEar side={-1} />
    <SoftEar side={1} />
    <Blob position={[0, 0.96, -0.04]} scale={[0.7, 0.55, 0.52]} color={cream} roughness={0.85} />
    <group ref={eyes} name="momo-crisp-eyes" position={[0,.99,-.579]}>{[-1,1].map(side=><group key={side} position={[side*.18,0,0]}><mesh scale={[.047,.075,.025]} renderOrder={3}><sphereGeometry args={[1,32,24]}/><meshBasicMaterial color="#292e35" toneMapped={false}/></mesh><mesh position={[-.011,.024,-.025]} scale={[.011,.014,.008]} renderOrder={4}><sphereGeometry args={[1,16,12]}/><meshBasicMaterial color="#fff" toneMapped={false}/></mesh></group>)}</group>
    {working&&<group ref={sweat} name="momo-effort" position={[.48,.78,-.47]}><Blob scale={[.05,.12,.04]} color="#6fcce7"/>{[-1,1].map(side=><Blob key={side} position={[side*.3,.33,-.03]} scale={[.1,.018,.02]} rotation={[0,0,side*.35]} color="#806855"/>)}</group>}
    <Blob position={[0,.82,-.55]} scale={[.035,.025,.02]} color="#b88782"/>
    {upset&&<><mesh><tubeGeometry args={[sadMouth,16,.013,6,false]}/><meshStandardMaterial color="#775d60"/></mesh>{[-1,1].map(side=><Blob key={'brow'+side} position={[side*.18,1.12,-.55]} scale={[.09,.014,.012]} rotation={[0,0,side*.3]} color="#8a7269"/>)}</>}
    {[-1, 1].map((side) => <group key={side}>
      {upset&&<Blob position={[side*.21,.82,-.54]} scale={[.045,.12,.03]} color="#78cce8" roughness={.15}/>}
      <group name={side < 0 ? 'momo-left-arm' : 'momo-right-arm'} ref={side < 0 ? leftArm : rightArm} position={[side * .31, .42, -.2]}>
        <Blob position={[-side*.025, -0.2, -0.14]} scale={[0.145, 0.25, 0.16]} rotation={[0.45, 0, side * -0.25]} color={cream} roughness={0.85} />
        {working&&!externalTool&&side>0&&<group name="momo-wrench" position={[0,-.3,-.42]} rotation={[.5,0,0]}><mesh><boxGeometry args={[.06,.35,.045]}/><meshStandardMaterial color="#a4bfcd" metalness={.85} roughness={.2}/></mesh><mesh position={[0,-.2,0]}><torusGeometry args={[.08,.025,8,24,Math.PI*1.65]}/><meshStandardMaterial color="#c7e0ee" metalness={.8}/></mesh></group>}
      </group>
    </group>)}
    <group position={[0.4, 0.12, 0.33]} rotation={[0, 0.4, 0]}>
      <mesh rotation={[0, 0, -0.5]} castShadow>
        <torusGeometry args={[0.23, 0.09, 12, 32, Math.PI * 1.2]} />
        <meshStandardMaterial color={cream} roughness={0.85} />
      </mesh>
      <Blob position={[0.2, -0.11, 0]} scale={[0.095, 0.095, 0.095]} color={cream} roughness={0.85} />
    </group>
  </group>
}
