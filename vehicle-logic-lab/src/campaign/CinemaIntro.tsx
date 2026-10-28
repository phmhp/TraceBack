import {useEffect,useMemo,useRef,useState} from 'react'
import {Canvas,createPortal,useFrame,useThree} from '@react-three/fiber'
import {PerspectiveCamera,Scene,WebGLRenderTarget,Color,Vector3} from 'three'
import type {Group,PointLight} from 'three'
import {CatDriver} from '../graphics/CatDriver'
import type {CatMotion} from '../graphics/CatDriver'
import {SoftBox,Blob} from '../graphics/SoftShapes'

/** An original rendered racing short: no film stills, logos, soundtrack or external media. */
function FilmRacer({blue=false}:{blue?:boolean}){return <group><SoftBox size={[2.05,.4,3.8]} position={[0,.55,0]} color={blue?'#3978b4':'#cc4b43'} radius={.19}/><SoftBox size={[1.5,.27,1.45]} position={[0,.83,.15]} color="#253d51" radius={.13}/><SoftBox size={[.22,.025,3.75]} position={[-.22,.77,0]} color="#f5f3ea" radius={.005}/><SoftBox size={[.22,.025,3.75]} position={[.22,.77,0]} color="#f5f3ea" radius={.005}/>{[-1,1].flatMap(s=>[-1.25,1.2].map(z=><mesh key={s+','+z} position={[s*1.05,.43,z]} rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[.39,.39,.27,32]}/><meshStandardMaterial color="#202f3d" roughness={.7}/></mesh>))}{[-.68,.68].map(x=><mesh key={x} position={[x,.63,-1.92]}><circleGeometry args={[.16,32]}/><meshBasicMaterial color="#faf5d9"/></mesh>)}</group>}
 function RacingShort({time}:{time:React.MutableRefObject<number>}){
 const a=useRef<Group>(null),b=useRef<Group>(null)
 useFrame(()=>{if(a.current)a.current.position.z=-Math.sin(time.current*.8)*2;if(b.current)b.current.position.z=Math.cos(time.current*.7)*2-1})
 return <><color attach="background" args={['#b3cad8']}/><ambientLight intensity={1}/><directionalLight position={[-5,7,-6]} intensity={2.6}/><mesh rotation={[-Math.PI/2,0,0]} position={[0,-.02,0]}><planeGeometry args={[100,180]}/><meshStandardMaterial color="#7b9f92"/></mesh><SoftBox size={[11,.03,140]} position={[0,0,0]} color="#566775" radius={.01}/>{Array.from({length:20},(_,i)=><SoftBox key={i} size={[.12,.02,2]} position={[0,.03,-50+i*5]} color="#f0f5f5" radius={.01}/>)}{[-1,1].flatMap(s=>Array.from({length:15},(_,i)=><group key={s+','+i} position={[s*6,0,-45+i*7]}><SoftBox size={[.4,.7,3]} position={[0,.35,0]} color={i%2?'#d96861':'#e9f0f2'}/><SoftBox size={[1.2,1.2,.15]} position={[s*2,1.5,0]} color="#7f94a4"/></group>))}{[a,b].map((ref,i)=><group ref={ref} key={i} position={[i?2:-2,0,0]}><FilmRacer blue={!i}/></group>)}</>
 }
 function MovieRoom({paused,reduced,onBeat}:{paused:boolean;reduced:boolean;onBeat:(beat:number)=>void}){
 const {gl,camera}=useThree(),time=useRef(0),motion=useRef<CatMotion>({walking:false,watching:true}),screenLight=useRef<PointLight>(null),lastBeat=useRef(-1)
 const film=useMemo(()=>{const target=new WebGLRenderTarget(1280,720),scene=new Scene(),camera=new PerspectiveCamera(46,16/9,.1,150);return{target,scene,camera}},[])
 useEffect(()=>()=>{film.target.dispose()},[film])
 useFrame((_,dt)=>{if(paused&&lastBeat.current>=0)return;if(!paused&&!reduced)time.current+=Math.min(dt,.1);const t=reduced?7:time.current%14,beat=Math.min(3,Math.floor(t/3.5));if(beat!==lastBeat.current){lastBeat.current=beat;onBeat(beat)}motion.current.surprise=t>7&&t<11?1:0;motion.current.watching=t<8
  const shot=Math.floor(t/3.5)%4;film.camera.fov=shot===2?55:42;film.camera.updateProjectionMatrix();film.camera.position.set(...([[4,.7,-5.7],[-4.2,1.1,1.1],[.1,1.25,3.7],[4.5,2.1,-6]][shot] as [number,number,number]));film.camera.lookAt(0,.65,shot===2?-5:0);const previous=gl.getRenderTarget();gl.setRenderTarget(film.target);gl.render(film.scene,film.camera);gl.setRenderTarget(previous)
  if(screenLight.current){screenLight.current.color.lerp(new Color(t>7?'#b9c8ff':'#80dfef'),.08);screenLight.current.intensity=9+(reduced?0:Math.sin(t*8)*1.2)}
  const pos=beat===0?new Vector3(4,2.6,4.8):beat===1?new Vector3(2,2.1,-1.6):beat===2?new Vector3(.6,2.35,-1.9):new Vector3(3.5,2.4,3.5),look=beat===0?new Vector3(0,1.3,-.5):new Vector3(0,1.5,.55);camera.position.lerp(pos,reduced?1:1-Math.exp(-dt*2));camera.lookAt(look)
 })
 return <><color attach="background" args={['#17233e']}/><fog attach="fog" args={['#17233e',9,23]}/><ambientLight intensity={.2}/><directionalLight position={[3,5,3]} intensity={.35} color="#a8b8df"/><pointLight ref={screenLight} position={[0,1.8,-1.6]} intensity={10} distance={8} color="#91dbff"/>
 {createPortal(<RacingShort time={time}/>,film.scene)}
 <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[30,30]}/><meshStandardMaterial color="#252d48" roughness={.82}/></mesh>
 <SoftBox size={[3.8,2.1,.18]} position={[0,1.8,-2.9]} color="#101b30" radius={.1}/><mesh position={[0,1.8,-2.795]}><planeGeometry args={[3.5,1.97]}/><meshBasicMaterial map={film.target.texture} toneMapped={false}/></mesh><SoftBox size={[2.8,.55,.8]} position={[0,.28,-2.85]} color="#374467"/>
 <SoftBox size={[3.6,.4,1.5]} position={[0,.27,1.1]} color="#665785" radius={.2}/><SoftBox size={[3.6,1.3,.35]} position={[0,.85,1.8]} color="#75628e" radius={.18}/>{[-1.75,1.75].map(x=><SoftBox key={x} size={[.3,.8,1.6]} position={[x,.65,1.1]} color="#665785" radius={.13}/>)}
 <group position={[0,.05,.6]} scale={.85}><CatDriver seated motion={motion} paused={paused} reduced={reduced}/><group position={[.18,1.08,-.3]}><mesh><cylinderGeometry args={[.23,.17,.4,32]}/><meshStandardMaterial color="#e57991"/></mesh>{Array.from({length:9},(_,i)=><SoftBox key={i} size={[.045,.32,.015]} position={[Math.sin(i*6.28/9)*.2,0,Math.cos(i*6.28/9)*.2]} rotation={[0,i*6.28/9,0]} color="#fff6f1" radius={.005}/>)}{Array.from({length:18},(_,i)=><Blob key={i} scale={[.065,.06,.065]} position={[Math.sin(i*2.4)*.15,.2+Math.floor(i/6)*.035,Math.cos(i*2.4)*.15]} color={i%3?'#fff6dd':'#eac987'}/>)}</group></group>
 <SoftBox size={[.45,.08,.8]} position={[1.1,.55,.9]} color="#ded4e7" radius={.03}/>
 </>
}
const captions=['늦은 밤, 흰둥이의 작은 영화관📽️ ','와 차가 어떻게 저렇게 달리냐','나도 내 자동차 만들어야겠다','오케이 1등 레츠고']
export function CinemaIntro({paused,reduced,onDone}:{paused:boolean;reduced:boolean;onDone:()=>void}){
 const [beat,setBeat]=useState(0),[replay,setReplay]=useState(0)
 return <div className="mc-cinema"><Canvas key={replay} shadows dpr={[1,2]} gl={{antialias:true}} camera={{position:[4,2.6,4.8],fov:42}}><MovieRoom paused={paused} reduced={reduced} onBeat={setBeat}/></Canvas><div className="mc-film-top"><span>PROLOGUE / 흰둥'S DREAM</span><button onClick={()=>setReplay(v=>v+1)}>↻ 다시 보기</button></div><div className="mc-film-caption"><span>흰둥, 〈포드 v 페라리〉를 보다</span><b>{captions[beat]}</b><button onClick={onDone}>다음으로.. →</button></div></div>
}
