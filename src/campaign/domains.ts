import type {AssemblyPartId} from '../workshop/assembly.ts'
export type Kit={id:string;name:string;domain:string;parts:AssemblyPartId[];input:string;control:string;output:string;principle:string}
// This is the configuration of the single car in this journey, not a universal EV layout.
export const VEHICLE_CONFIGURATION={
 powertrain:'배터리 전기차(BEV) · 단일 구동모터 · 후륜구동',
 steering:'앞바퀴 2륜 조향 · 기계식 랙/타이로드 + EPS 보조',
 braking:'차량 수준 회생·마찰 협조 · 직접 구성은 마찰 제동력 요청',
 ee:'VCU + BMS + 인버터 제어 + 제동 제어기 + EPS 제어기 · 기능별 배치',
 software:'각 제어기의 Application 기능 내부 블록 계산',
} as const
export const PART_CLASS:Record<AssemblyPartId,{view:string;kind:string;ev:string}>={
 battery:{view:'물리·전원',kind:'에너지 저장',ev:'BEV 전용 구동 에너지원'},
 inverter:{view:'물리·전력전자',kind:'DC→AC 전력 변환',ev:'BEV 구동계'},
 motor:{view:'물리·액추에이터',kind:'전기→회전 에너지 변환',ev:'BEV 구동계'},
 gearbox:{view:'물리·동력전달',kind:'감속·차동기어',ev:'BEV·ICE 공통 원리, 기어 구성은 차량별 상이'},
 axle:{view:'물리·동력전달',kind:'좌우 구동축',ev:'BEV·ICE 공통'},
 rearLeft:{view:'물리·섀시',kind:'뒤 왼쪽 접지',ev:'BEV·ICE 공통'},
 rearRight:{view:'물리·섀시',kind:'뒤 오른쪽 접지',ev:'BEV·ICE 공통'},
 frontLeft:{view:'물리·섀시',kind:'앞 왼쪽 접지·조향',ev:'BEV·ICE 공통'},
 frontRight:{view:'물리·섀시',kind:'앞 오른쪽 접지·조향',ev:'BEV·ICE 공통'},
 pedal:{view:'E/E·센서',kind:'가속 의도 측정',ev:'BEV·ICE 공통 역할'},
 vcu:{view:'E/E·제어기',kind:'상위 구동 요구·허용 계산',ev:'이 BEV의 VCU'},
 brakePedal:{view:'E/E·센서/제어기',kind:'제동 입력·제동 제어',ev:'BEV·ICE 공통 역할'},
 brakes:{view:'물리·액추에이터',kind:'마찰 제동',ev:'BEV·ICE 공통'},
 steeringWheel:{view:'E/E·입력/제어기',kind:'운전자 조향 입력·조향 제어',ev:'BEV·ICE 공통 역할'},
 steeringRack:{view:'물리·액추에이터',kind:'랙·타이로드로 앞바퀴 조향',ev:'BEV·ICE 공통'},
}
export const ASSEMBLY_KITS:Kit[]=[
 {id:'drive',name:'회전 전달 장치',domain:'파워트레인 - 구동 및 동력 전달',parts:['motor','gearbox','axle'],input:'전기 에너지',control:'모터의 회전',output:'감속기 → 구동축',principle:'모터가 만든 회전이 감속기와 축을 통해 바퀴까지 전달돼요. 감속기는 실제 기계이고, PRND는 운전자가 고르는 주행 상태 입력입니다.'},
 {id:'wheels',name:'앞·뒤 바퀴 두 쌍',domain:'섀시 · 접지 / 현가',parts:['frontLeft','frontRight','rearLeft','rearRight'],input:'구동축의 회전',control:'허브 · 수동 현가',output:'타이어 → 도로',principle:'앞바퀴 좌우 한 쌍과 뒷바퀴 좌우 한 쌍을 각각 장착해요. 뒤 바퀴는 구동력을, 앞 바퀴는 조향 방향을 도로에 전달합니다. 스프링·댐퍼는 차체를 지지하고 노면 충격을 줄입니다.'},
 {id:'power',name:'에너지와 전력 변환',domain:'전력 · 구동',parts:['battery','inverter'],input:'배터리 DC',control:'인버터의 전력 변환',output:'모터 AC 전력',principle:'전력을 공급하는 경로예요. 인버터는 나중에 VCU가 계산한 명령에 따라 모터 전력을 제어합니다.'},
 {id:'control',name:'운전자 입력과 ECU',domain:'E/E · 구동 제어',parts:['pedal','vcu'],input:'페달 위치 센서',control:'VCU · 이후 만들 SW',output:'인버터 토크 명령',principle:'센서는 발의 움직임을 신호로 바꾸고 ECU의 소프트웨어가 명령을 계산해요. 이 다음에 만드는 퍼즐이 VCU 안의 기능입니다.'},
 {id:'brake',name:'멈추는 장치',domain:'제동',parts:['brakes','brakePedal'],input:'브레이크 입력',control:'제동력 요청 계산',output:'캘리퍼 → 디스크',principle:'가속페달을 놓아 구동 토크를 낮추는 일과 브레이크로 마찰 제동력을 만드는 일은 달라요. 페달 센서·제동 제어기·캘리퍼의 역할을 분리해 살펴보세요.'},
 {id:'steer',name:'방향을 바꾸는 장치',domain:'조향',parts:['steeringRack','steeringWheel'],input:'핸들 입력',control:'앞바퀴 각도 요청 계산',output:'랙 → 앞바퀴 각도',principle:'이 차는 앞바퀴 두 개만 조향합니다. 핸들 입력이 조향 제어기의 각도 요청으로 바뀌고, 랙·타이로드가 앞바퀴 방향을 바꿉니다.'},
]
export const kitForPart=(id:AssemblyPartId)=>ASSEMBLY_KITS.find(k=>k.parts.includes(id))!
export const kitComplete=(kit:Kit,assembly:Record<AssemblyPartId,string>)=>kit.parts.every(id=>assembly[id]==='FIXED')
