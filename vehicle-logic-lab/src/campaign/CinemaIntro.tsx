import {useEffect,useMemo,useRef,useState} from 'react'
import {Canvas,createPortal,useFrame,useThree} from '@react-three/fiber'
import {PerspectiveCamera,Scene,WebGLRenderTarget,Color,Vector3} from 'three'
import type {Group,PointLight} from 'three'
import {CatDriver} from '../graphics/CatDriver'
import type {CatMotion} from '../graphics/CatDriver'
import {SoftBox,Blob} from '../graphics/SoftShapes'
import {CarShell} from './Scenery'

/** An original rendered racing short: no film stills, logos, soundtrack or external media. */
function RacingShort({time}:{time:React.MutableRefObject<number>}){
 const a=useRef<Group>(null),b=useRef<Group>(null)
 useFrame(()=>{if(a.current)a.current.position.z=-Math.sin(time.current*.8)*2;if(b.current)b.current.position.z=Math.cos(time.current*.7)*2-1})
 return <><color attach="background" args={['#afdcf0']}/><ambientLight intensity={1.3}/><directionalLight position={[3,7,4]} intensity={3}/><mesh rotation={[-Math.PI/2,0,0]} position={[0,-.02,0]}><planeGeometry args={[100,140]}/><meshStandardMaterial color="#76a889"/></mesh><SoftBox size={[9,.03,100]} position={[0,0,0]} color="#647a87" radius={.01}/>{Array.from({length:18},(_,i)=><SoftBox key={i} size={[.1,.02,2]} position={[0,.03,-34+i*4]} color="#f0fafc" radius={.01}/>)}{[-1,1].flatMap(s=>Array.from({length:10},(_,i)=><group key={`${s}${i}`} position={[s*6,0,-35+i*7]}><SoftBox size={[.18,.8,1.4]} position={[0,.4,0]} color={i%2?'#e96e86':'#e8eef4'}/><Blob position={[s*3,2,0]} scale={[2,2,2]} color="#4f8f86"/></group>))}{[a,b].map((ref,i)=><group ref={ref} key={i} position={[i?1.7:-1.7,0,0]} scale={.8}><CarShell mint={i===1} ready/>{[-1,1].flatMap(s=>[-1.3,.95].map(z=><mesh key={`${s}${z}`} position={[s*1.1,.6,z]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.45,.45,.25,24]}/><meshStandardMaterial color="#263e49"/></mesh>))}</group>)}</>
}
function MovieRoom({paused,reduced,onBeat}:{paused:boolean;reduced:boolean;onBeat:(beat:number)=>void}){
 const {gl,camera}=useThree(),time=useRef(0),motion=useRef<CatMotion>({walking:false,watching:true}),screenLight=useRef<PointLight>(null),lastBeat=useRef(-1)
 const film=useMemo(()=>{const target=new WebGLRenderTarget(640,360),scene=new Scene(),camera=new PerspectiveCamera(46,16/9,.1,150);return{target,scene,camera}},[])
 useEffect(()=>()=>{film.target.dispose()},[film])
 useFrame((_,dt)=>{if(paused&&lastBeat.current>=0)return;if(!paused&&!reduced)time.current+=Math.min(dt,.1);const t=reduced?7:time.current%14,beat=Math.min(3,Math.floor(t/3.5));if(beat!==lastBeat.current){lastBeat.current=beat;onBeat(beat)}motion.current.surprise=t>7&&t<11?1:0;motion.current.watching=t<8
  film.camera.position.set(4+Math.sin(t*.3),2.8,7);film.camera.lookAt(0,.8,0);const previous=gl.getRenderTarget();gl.setRenderTarget(film.target);gl.render(film.scene,film.camera);gl.setRenderTarget(previous)
  if(screenLight.current){screenLight.current.color.lerp(new Color(t>7?'#b9c8ff':'#80dfef'),.08);screenLight.current.intensity=9+(reduced?0:Math.sin(t*8)*1.2)}
  const pos=beat===0?new Vector3(4,2.6,4.8):beat===1?new Vector3(2,2.1,-1.6):beat===2?new Vector3(.6,2.35,-1.9):new Vector3(3.5,2.4,3.5),look=beat===0?new Vector3(0,1.3,-.5):new Vector3(0,1.5,.55);camera.position.lerp(pos,reduced?1:1-Math.exp(-dt*2));camera.lookAt(look)
 })
 return <><color attach="background" args={['#17233e']}/><fog attach="fog" args={['#17233e',9,23]}/><ambientLight intensity={.2}/><directionalLight position={[3,5,3]} intensity={.35} color="#a8b8df"/><pointLight ref={screenLight} position={[0,1.8,-1.6]} intensity={10} distance={8} color="#91dbff" castShadow/>
 {createPortal(<RacingShort time={time}/>,film.scene)}
 <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[30,30]}/><meshStandardMaterial color="#252d48" roughness={.82}/></mesh>
 <SoftBox size={[3.8,2.1,.18]} position={[0,1.8,-2.9]} color="#101b30" radius={.1}/><mesh position={[0,1.8,-2.795]}><planeGeometry args={[3.5,1.97]}/><meshBasicMaterial map={film.target.texture} toneMapped={false}/></mesh><SoftBox size={[2.8,.55,.8]} position={[0,.28,-2.85]} color="#374467"/>
 <SoftBox size={[3.6,.4,1.5]} position={[0,.27,1.1]} color="#665785" radius={.2}/><SoftBox size={[3.6,1.3,.35]} position={[0,.85,1.8]} color="#75628e" radius={.18}/>{[-1.75,1.75].map(x=><SoftBox key={x} size={[.3,.8,1.6]} position={[x,.65,1.1]} color="#665785" radius={.13}/>)}
 <group position={[0,.05,.6]} scale={.85}><CatDriver seated motion={motion} paused={paused} reduced={reduced}/><group position={[.18,1.08,-.3]}><mesh><cylinderGeometry args={[.23,.17,.4,32]}/><meshStandardMaterial color="#e57991"/></mesh>{Array.from({length:9},(_,i)=><SoftBox key={i} size={[.045,.32,.015]} position={[Math.sin(i*6.28/9)*.2,0,Math.cos(i*6.28/9)*.2]} rotation={[0,i*6.28/9,0]} color="#fff6f1" radius={.005}/>)}{Array.from({length:18},(_,i)=><Blob key={i} scale={[.065,.06,.065]} position={[Math.sin(i*2.4)*.15,.2+Math.floor(i/6)*.035,Math.cos(i*2.4)*.15]} color={i%3?'#fff6dd':'#eac987'}/>)}</group></group>
 <SoftBox size={[.45,.08,.8]} position={[1.1,.55,.9]} color="#ded4e7" radius={.03}/>
 </>
}
const captions=['늦은 밤, 모모의 작은 영화관.','팝콘 한 입… 저 차는 어떻게 저렇게 달리지?','반짝. 나도 내 손으로 차를 만들고 싶어!','언젠가 내 EV로 대회에 나갈 거야.']
export function CinemaIntro({paused,reduced,onDone}:{paused:boolean;reduced:boolean;onDone:()=>void}){
 const [beat,setBeat]=useState(0),[replay,setReplay]=useState(0)
 return <div className="mc-cinema"><Canvas key={replay} shadows dpr={[1,1.5]} camera={{position:[4,2.6,4.8],fov:42}}><MovieRoom paused={paused} reduced={reduced} onBeat={setBeat}/></Canvas><div className="mc-film-top"><span>PROLOGUE / MOMO'S DREAM</span><button onClick={()=>setReplay(v=>v+1)}>↻ 다시 보기</button></div><div className="mc-film-caption"><span>〈포드 v 페라리〉를 본 밤 · 화면은 자체 제작 레이싱 단편</span><b>{captions[beat]}</b><button onClick={onDone}>모모의 모험 계속하기 →</button></div></div>
}
