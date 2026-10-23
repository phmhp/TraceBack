import type {WorkshopRecord} from '../workshop/model'
import type {AssemblyPartId} from '../workshop/assembly'
import type {Kit} from './domains'
const paths:Record<string,{id:AssemblyPartId;label:string;role:string}[]>={
 drive:[{id:'motor',label:'모터',role:'힘을 만듦'},{id:'gearbox',label:'감속·차동',role:'속도·힘 전달'},{id:'axle',label:'구동축',role:'바퀴까지 전달'}],
 wheels:[{id:'rearLeft',label:'뒤 왼쪽',role:'1'},{id:'rearRight',label:'뒤 오른쪽',role:'2'},{id:'frontLeft',label:'앞 왼쪽',role:'3'},{id:'frontRight',label:'앞 오른쪽',role:'4'}],
 power:[{id:'battery',label:'배터리',role:'에너지 공급'},{id:'inverter',label:'인버터',role:'전력 변환'},{id:'motor',label:'모터',role:'회전 출력'}],
 control:[{id:'pedal',label:'페달 센서',role:'입력'},{id:'vcu',label:'VCU / SW',role:'판단'},{id:'inverter',label:'인버터',role:'명령을 받음'}],
 brake:[{id:'brakePedal',label:'브레이크 입력',role:'입력·제어'},{id:'brakes',label:'캘리퍼·디스크',role:'제동력 출력'},{id:'rearLeft',label:'바퀴',role:'감속 반응'}],
 steer:[{id:'steeringWheel',label:'핸들',role:'입력·제어'},{id:'steeringRack',label:'랙·타이로드',role:'방향 전달'},{id:'frontLeft',label:'앞바퀴',role:'각도 출력'}],
}
export function KitFlow({kit,record}:{kit:Kit;record:WorkshopRecord}){const nodes=paths[kit.id],w=nodes.length*170;return <section className="v14-kit-flow"><small>{kit.domain} · {kit.id==='wheels'?'장착 순서':'장착하며 완성하는 동작 경로'}</small><svg viewBox={`0 0 ${w} 118`} role="img" aria-label={kit.name+' 장착 상태와 기능 흐름'}>{nodes.map((n,i)=>{const fixed=record.assembly[n.id]==='FIXED',linked=i>0&&fixed&&record.assembly[nodes[i-1].id]==='FIXED';return <g key={n.id} transform={`translate(${i*170+6},12)`}>{i>0&&<path d="M-23 37H-5L-11 31M-5 37L-11 43" fill="none" stroke={linked?'#4eaa9c':'#c3d0dc'} strokeWidth="3" strokeDasharray={linked?undefined:'4 4'}/>}<rect x="0" y="0" width="142" height="78" rx="16" fill={fixed?'#dcefe7':'#eef1f7'} stroke={fixed?'#8dbfb3':'#c1cddd'}/><text x="71" y="25" textAnchor="middle">{fixed?'✓':'○'} {n.label}</text><text className="kit-role" x="71" y="49" textAnchor="middle">{n.role}</text><text className="kit-role" x="71" y="68" textAnchor="middle">{fixed?'차량에 장착됨':'장착할 자리'}</text></g>})}</svg></section>}
