import { useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Group, Vector3 } from 'three'
import { PlaceholderVehicle } from '../../simulation/src/graphics/PlaceholderVehicle'
import { CatDriver } from '../../simulation/src/graphics/CatDriver'
import { SoftBox, Blob } from '../graphics/SoftShapes'
import { sound } from './audio'
export function Breakdown({ paused, reduced }: { paused: boolean; reduced: boolean }) {
  const car = useRef<Group>(null), cat = useRef<Group>(null), tears = useRef<Group>(null), time = useRef(0), originals = useRef<Vector3[]>([])
  useFrame((_, dt) => {
    if (paused) return
    time.current += Math.min(dt, .05)
    const t = reduced ? 3 : Math.min(3, time.current)
    const parts = car.current?.children[0]?.children ?? []
    if (!originals.current.length && parts.length) originals.current = parts.map(p => p.position.clone())
    parts.forEach((part, i) => { const base = originals.current[i]; if (!base) return; const k = Math.min(1, Math.max(0, t - .4)); if (i < 3) { part.position.y = base.y - k * .3; part.rotation.z = Math.sin(t * 17) * Math.max(0, 1 - k) * .06 } else { const side = i % 2 ? 1 : -1; part.position.set(base.x + side * k * (1 + i % 3 * .4), Math.max(.15, base.y + Math.sin(k * Math.PI) * (1 + i % 3) - k * .4), base.z + k * (i % 3 - 1) * 1.4); part.rotation.z = side * k * .7 } })
    if (cat.current) { cat.current.position.y = reduced?0:t < 1 ? Math.sin(t * Math.PI) * .35 : Math.sin(time.current * 12) * .02; cat.current.rotation.z = reduced?0:Math.sin(time.current * 13) * .025 }
    tears.current?.children.forEach((tear, i) => { tear.position.y = reduced?1.6:1.9 - (time.current * .8 + i * .35) % .7 })
  })
  return <><color attach="background" args={['#dff2ff']}/><hemisphereLight args={['#fff', '#a8c5d0', 2.5]}/><directionalLight castShadow position={[-5, 8, -5]} intensity={3}/><mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[100, 100]}/><meshStandardMaterial color="#b7d2db"/></mesh><group ref={car}><PlaceholderVehicle showDriver={false}/></group><group ref={cat}><CatDriver/></group><group ref={tears}>{[-1, 1].map(side => <Blob key={side} position={[side * .22, 1.9, -.63]} scale={[.045, .11, .04]} color="#65caff" roughness={.15}/>)}</group>{Array.from({ length: 8 }, (_, i) => <SoftBox key={i} size={[.08, .08, .08]} position={[Math.sin(i * 2) * 2.5, .08, Math.cos(i * 2) * 2]} rotation={[i, i, i]} color="#9eaec0" metalness={.7}/>)}</>
}
export function FaultCutscene({ paused, reduced, volume }: { paused: boolean; reduced: boolean; volume: number }) {
  useEffect(() => { sound('crash', volume) }, [volume])
  return <section className="fault-cutscene"><Canvas shadows camera={{ position: [4.4, 3.3, -5.8], fov: 43 }} dpr={[1, 1.5]} onCreated={({camera})=>camera.lookAt(0,1,0)}><Breakdown paused={paused} reduced={reduced}/></Canvas><div className="fault-story-label"><b>와르르… 꼬마차의 시험 날!</b><p>모모는 무사해요. 떨어진 부품은 정비소에서 수리해요.</p><small>예정된 코믹 연출 · 운전 실수가 고장 원인은 아니에요.</small></div></section>
}
