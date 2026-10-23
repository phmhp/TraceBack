import {useEffect,useMemo} from 'react'
import {ExtrudeGeometry,Shape,ShapeGeometry} from 'three'
import {SoftBox,Blob} from '../graphics/SoftShapes'

// Original rounded compact, not a reproduction of a manufacturer's bodywork.
function RearGlass(){
 const geometry=useMemo(()=>{const s=new Shape();s.moveTo(-.67,-.24);s.quadraticCurveTo(-.78,-.24,-.73,-.1);s.lineTo(-.56,.26);s.quadraticCurveTo(-.5,.34,-.38,.34);s.lineTo(.38,.34);s.quadraticCurveTo(.5,.34,.56,.26);s.lineTo(.73,-.1);s.quadraticCurveTo(.78,-.24,.67,-.24);s.closePath();return new ShapeGeometry(s,32)},[]);useEffect(()=>()=>geometry.dispose(),[geometry]);return <group position={[0,1.5,1.2]} rotation={[-.42,0,0]}><mesh geometry={geometry}><meshPhysicalMaterial color="#293d42" roughness={.15} metalness={.3} clearcoat={1}/></mesh><mesh position={[.2,.04,.004]} rotation={[0,0,-.5]}><planeGeometry args={[.035,.43]}/><meshBasicMaterial color="#c9e0dc" transparent opacity={.22}/></mesh></group>
}
function CurvedPanel({roof=false,color}:{roof?:boolean;color:string}){
 const geometry=useMemo(()=>{const s=new Shape();if(roof){s.moveTo(-1.02,1.12);s.bezierCurveTo(-.92,1.75,-.45,2.05,.18,2.03);s.bezierCurveTo(.8,2.02,1.13,1.58,1.12,1.14);s.lineTo(-1.02,1.12)}else{s.moveTo(-1.92,.52);s.bezierCurveTo(-2.03,.89,-1.73,1.15,-1.04,1.2);s.lineTo(1.08,1.2);s.bezierCurveTo(1.7,1.14,1.96,.99,1.93,.56);s.quadraticCurveTo(0,.36,-1.92,.52)}const w=roof?1.62:1.98,g=new ExtrudeGeometry(s,{depth:w,bevelEnabled:true,bevelThickness:.11,bevelSize:.1,bevelSegments:6,curveSegments:32,steps:1});g.translate(0,0,-w/2);g.rotateY(Math.PI/2);return g},[roof]);useEffect(()=>()=>geometry.dispose(),[geometry])
 return <mesh geometry={geometry} castShadow receiveShadow><meshPhysicalMaterial color={color} metalness={.2} roughness={.27} clearcoat={1} clearcoatRoughness={.14}/></mesh>
}
export function CarShell({mint=false,damage=0,ready=false,brake=0,color}:{mint?:boolean;damage?:number;ready?:boolean;brake?:number;color?:string}){
 const paint=color??(mint?'#63bbb9':'#d84d59'),cream=mint?'#dceff2':'#f5e9df'
 return <group name="momo-cup-body"><group scale={[1,1-damage*.24,1-damage*.1]} rotation={[0,damage*.04,damage*.045]}><CurvedPanel color={paint}/></group>
 <group position={[damage*2.7,Math.sin(damage*Math.PI)*1.6-damage*.75,damage*1.2]} rotation={[damage*.7,damage*.4,-damage*1.15]}><CurvedPanel roof color={paint}/>
 <mesh position={[0,1.52,-.96]} rotation={[-.43,Math.PI,0]}><planeGeometry args={[1.5,.63]}/><meshPhysicalMaterial color="#26373b" metalness={.2} roughness={.12} clearcoat={1} transparent opacity={.82}/></mesh>
 <RearGlass/>
 {[-1,1].map(side=><group key={side}><mesh position={[side*.925,1.55,.03]} rotation={[0,side*Math.PI/2,0]}><planeGeometry args={[1.49,.53]}/><meshPhysicalMaterial color="#26373b" transparent opacity={.7} roughness={.1} clearcoat={1}/></mesh><SoftBox size={[.045,.64,.07]} position={[side*.95,1.5,.12]} color={cream} radius={.018}/><SoftBox size={[.045,.04,1.45]} position={[side*1.02,1.2,.04]} color="#c9d8df" radius={.015}/><SoftBox size={[.045,.05,.22]} position={[side*1.06,1.08,.42]} color="#d8e3e9" radius={.02}/></group>)}
 </group>
 {[-1,1].flatMap(side=>[-1.3,.95].map(z=><group key={`${side}${z}`} position={[side*.93,.87,z]}><Blob scale={[.34,.38,.64]} color={paint} metalness={.2} roughness={.25}/></group>))}
 <group position={[0,Math.sin(damage*Math.PI)*.3,-1.42-damage*1.3]} rotation={[-damage*1.4,0,0]}><Blob position={[0,1.01,0]} scale={[.77,.21,.56]} color={paint} roughness={.24}/><SoftBox size={[.035,.018,.7]} position={[0,1.22,0]} color={cream} radius={.006}/></group>
 {[-1,1].map(side=><group key={side}><mesh position={[side*.69,1,-1.88]} rotation={[Math.PI/2,0,0]} castShadow><cylinderGeometry args={[.195,.195,.075,40]}/><meshPhysicalMaterial color="#dce6e9" metalness={.8} roughness={.2}/></mesh><mesh position={[side*.69,1,-1.925]} rotation={[0,Math.PI,0]}><circleGeometry args={[.15,40]}/><meshStandardMaterial color={ready?'#f9f8dc':'#d3e5ed'} emissive="#fcf1cf" emissiveIntensity={ready?.8:0}/></mesh><SoftBox size={[.2,.16,.08]} position={[side*.8,.95,1.91]} color="#a62f4d" radius={.06}/><mesh position={[side*.8,.95,1.96]}><planeGeometry args={[.12,.09]}/><meshStandardMaterial color="#ef7590" emissive="#ff3b55" emissiveIntensity={brake?2:0}/></mesh><Blob position={[side*1.14,1.32,-.65]} scale={[.16,.1,.19]} color={paint}/></group>)}
 {[-1,1].map(end=><SoftBox key={end} size={[1.76,.1,.13]} position={[damage*(end<0?-1.2:1),.65-damage*.45,end*1.97+damage*end*1.5]} color="#d4e0e7" metalness={.75} roughness={.18} radius={.045}/>)}
 {[-1,1].map(side=><group key={'door'+side} name={'detachable-door-'+side} position={[side*(1.015+damage*1.9),.97-damage*.5,.14+damage*(side>0?-1.5:1.3)]} rotation={[damage*.4,side*damage*1.2,side*damage*.8]}><SoftBox size={[.065,.38,1.28]} color={paint} radius={.07}/><SoftBox size={[.075,.028,1.2]} position={[side*.025,.22,0]} color="#cbd1ce" radius={.01}/><SoftBox size={[.08,.045,.2]} position={[side*.055,.04,.34]} color="#d9dfdc" radius={.02}/></group>)}
 {[-1,1].flatMap(side=>[-1.3,.95].map(z=><mesh key={'arch'+side+z} position={[side*1.17,.69,z]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.53,.025,8,40,Math.PI]}/><meshStandardMaterial color="#d6d9d1" metalness={.8} roughness={.2}/></mesh>))}
 {damage>0&&Array.from({length:10},(_,i)=><mesh key={'bolt'+i} name="loosened-fastener" position={[Math.sin(i*2.3)*damage*(1.7+i*.13),.11+Math.sin(damage*Math.PI)*.7,Math.cos(i*2.3)*damage*(2+i*.12)]} rotation={[damage*i,0,damage*i]}><cylinderGeometry args={[.045,.045,.12,6]}/><meshStandardMaterial color="#8a8d89" metalness={.8}/></mesh>)}
 <SoftBox size={[.38,.15,.03]} position={[0,.82,1.99]} color="#f7f4e9" radius={.025}/>
 </group>
}
export function ContactShadow(){return <group name="vehicle-contact-shadow" position={[0,.018,0]} rotation={[-Math.PI/2,0,0]}>{[1,.78,.52].map((s,i)=><mesh key={s} scale={[1.35*s,2.15*s,1]} renderOrder={1}><circleGeometry args={[1,48]}/><meshBasicMaterial color="#233d53" transparent opacity={.055+i*.025} depthWrite={false}/></mesh>)}</group>}
