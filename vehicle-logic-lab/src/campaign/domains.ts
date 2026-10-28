import type {AssemblyPartId} from '../workshop/assembly.ts'
export type Kit={id:string;name:string;domain:string;parts:AssemblyPartId[];input:string;control:string;output:string;principle:string}
export const ASSEMBLY_KITS:Kit[]=[
 {id:'drive',name:'회전 전달 장치',domain:'파워트레인 - 구동 및 동력 전달',parts:['motor','gearbox','axle'],input:'전기 에너지',control:'모터의 회전',output:'감속기 → 구동축',principle:'모터가 만든 회전이 감속기와 축을 통해 바퀴까지 전달돼요. 감속기는 실제 기계이고, PRND는 운전자가 고르는 주행 상태 입력입니다.'},
 {id:'wheels',name:'네 바퀴 한 세트',domain:'섀시 · 접지 / 현가',parts:['rearLeft','rearRight','frontLeft','frontRight'],input:'구동축의 회전',control:'허브 · 기본 현가',output:'타이어 → 도로',principle:'네 바퀴를 차례로 장착해요. 스프링·댐퍼는 차체를 지지하고 노면 충격을 줄이는 제공 섀시입니다. 수동 현가는 ECU가 없어도 동작해요.'},
 {id:'power',name:'에너지와 전력 변환',domain:'전력 · 구동',parts:['battery','inverter'],input:'배터리 DC',control:'인버터의 전력 변환',output:'모터 AC 전력',principle:'전력을 공급하는 경로예요. 인버터는 나중에 VCU가 계산한 명령에 따라 모터 전력을 제어합니다.'},
 {id:'control',name:'운전자 입력과 ECU',domain:'E/E · 구동 제어',parts:['pedal','vcu'],input:'페달 위치 센서',control:'VCU · 이후 만들 SW',output:'인버터 토크 명령',principle:'센서는 발의 움직임을 신호로 바꾸고 ECU의 소프트웨어가 명령을 계산해요. 이 다음에 만드는 퍼즐이 VCU 안의 기능입니다.'},
 {id:'brake',name:'멈추는 장치',domain:'제동',parts:['brakes','brakePedal'],input:'브레이크 입력',control:'제공 제동 모델',output:'캘리퍼 → 디스크',principle:'구동 토크를 0으로 만드는 일과 바퀴를 멈추게 하는 제동력은 달라요. 이번에는 제동 장치를 장착하고 제공 모델을 사용합니다.'},
 {id:'steer',name:'방향을 바꾸는 장치',domain:'조향',parts:['steeringRack','steeringWheel'],input:'핸들 입력',control:'제공 조향 모델',output:'랙 → 앞바퀴 각도',principle:'핸들 입력과 바퀴 방향이 연결돼요. EPS의 보조 토크 제어 전체를 직접 설계한 것으로 표시하지 않습니다.'},
]
export const kitForPart=(id:AssemblyPartId)=>ASSEMBLY_KITS.find(k=>k.parts.includes(id))!
export const kitComplete=(kit:Kit,assembly:Record<AssemblyPartId,string>)=>kit.parts.every(id=>assembly[id]==='FIXED')
