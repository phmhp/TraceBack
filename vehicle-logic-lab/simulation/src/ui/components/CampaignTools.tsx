import {useState,useRef} from 'react'
import {KnowledgeAtlas} from './KnowledgeAtlas'
import {SignalBench} from '../../graphics/SignalBench'
import {useRaceHud} from '../state/raceHud'
import {useNavigation} from '../state/navigation'
import {useRaceActions} from '../state/RaceActionsContext'
import {useCase} from '../state/CaseContext'
import {useSimulationRuntime} from '../state/SimulationRuntimeContext'

export function CampaignTools() {
  const [tool,setTool]=useState<'knowledge'|'mechanics'|null>(null),[part,setPart]=useState(1)
  const previousDriving=useRef(false),actions=useRaceActions(),telemetry=useRaceHud(),phase=useNavigation(s=>s.phase),screen=useNavigation(s=>s.screen),{state}=useCase(),{scenario}=useSimulationRuntime()
  const frame=state.frames[state.selected]
  const recorded=screen==='xray'&&scenario.status==='IDLE'&&frame
  const brake=recorded?frame.brake:telemetry.brake
  const open=(next:'knowledge'|'mechanics')=>{previousDriving.current=phase==='NORMAL_DRIVE'||phase==='RECOVERY_DRIVE';if(previousDriving.current)actions.pause();setTool(next)}
  const close=()=>{setTool(null);if(previousDriving.current){previousDriving.current=false;actions.resume()}}
  return <><nav className="campaign-tools" aria-label="자동차 학습 도구"><button onClick={()=>open('knowledge')}>차량 아키텍처·자료</button><button onClick={()=>open('mechanics')}>입체 부품·실행값</button></nav>{tool==='knowledge'&&<KnowledgeAtlas onClose={close}/>} {tool==='mechanics'&&<section className="mechanical-drawer" role="dialog" aria-modal="true" aria-label="입체 부품과 실제 차량 신호"><header><div><small>MECHANICS + SOFTWARE</small><h2>입력에서 차량 반응까지.</h2><p>{recorded?`사건 기록 ${frame.sw.executionTime.toFixed(3)}초`:'현재 차량 실행값'} · 부품은 개념 모형, 수치는 실행 기록입니다.</p></div><button onClick={close}>돌아가기 ×</button></header><div className="mechanical-visual"><img src="../art/vehicle-cutaway-v4.png" alt="차량 내부 관계 개념 그림"/><SignalBench snapshot={{outputs:{ready:recorded?frame.sw.input.vehicleReady:telemetry.vehicleReady,request:(recorded?frame.sw.output.eDriveCommand.magnitudeNm:telemetry.eDriveCommand.magnitudeNm)>0}}} brake={brake>0} pressure={brake} focus={part} isolated/></div><nav>{['페달·센서','제어 프로그램','계기판·출력'].map((v,i)=><button key={i} aria-pressed={part===i} onClick={()=>setPart(i)}>{i+1}. {v}</button>)}</nav><div className="mechanical-values"><span>브레이크 <b>{(brake*100).toFixed(0)}%</b></span><span>가속 입력 <b>{((recorded?frame.sw.input.acceleratorPedalPosition:telemetry.accelerator)*100).toFixed(0)}%</b></span><span>VMC 요청 <b>{(recorded?frame.sw.output.driveTorqueRequest.magnitudeNm:telemetry.driveTorqueRequest.magnitudeNm).toFixed(1)} Nm</b></span><span>eDrive 출력 <b>{(recorded?frame.sw.output.eDriveCommand.magnitudeNm:telemetry.eDriveCommand.magnitudeNm).toFixed(1)} Nm</b></span><span>차량 속도 <b>{(recorded?(frame.plant?.speed??frame.sw.input.vehicleSpeed)*3.6:telemetry.speedKmh).toFixed(1)} km/h</b></span></div><p>토크 명령은 구동력 어댑터를 거쳐 Rapier 차량에 전달됩니다. 원화 속 배선과 모형 바늘은 실차 구조·실제 속도계가 아닙니다.</p></section>}</>
}
