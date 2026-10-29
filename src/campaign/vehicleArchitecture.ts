import type {LogicId} from './domainTraining'

// This is a reference allocation for this one BEV, not a claim about every OEM.
export const BASELINE_ARCHITECTURE={
 vehicle:'단일 모터 후륜구동 BEV',
 steering:'운전대와 앞바퀴가 기계적으로 연결된 전동식 파워 스티어링(EPS)',
 braking:'회생·마찰 제동 협조',
 ee:'기능별 제어기: VCU / BMS / 인버터 제어 / 제동 제어 / EPS 제어',
 software:'기능 → 제어기 할당 → Application SWC → Runnable → 신호/액추에이터',
} as const

export const MODEL_ALLOCATION:Record<LogicId,{ecu:string;swc:string;runnable:string;boundary:string}>={
 bms:{ecu:'BMS',swc:'PackMonitorSWC',runnable:'EvaluatePackSafe',boundary:'SOC·온도·절연 판단 → PackSafe'},
 start:{ecu:'VCU',swc:'VehicleModeSWC',runnable:'EvaluateStartPermit',boundary:'START 상승·P·브레이크·플러그·BMS → 프리차지 요청'},
 power:{ecu:'VCU',swc:'PowerAvailabilitySWC',runnable:'ComputePowerEnable',boundary:'READY와 BMS 신호를 결합한 사용 허용'},
 request:{ecu:'VCU',swc:'DriverDemandSWC',runnable:'ComputeDriverTorque',boundary:'페달 신호에서 모터 축 토크 요청 계산'},
 drive:{ecu:'VCU',swc:'DriveInterlockSWC',runnable:'CheckDriveAllow',boundary:'전력·기어·브레이크로 전진 허용 판단'},
 brake:{ecu:'제동 제어기',swc:'BrakeDemandSWC',runnable:'ComputeBrakeForce',boundary:'페달 입력에서 제동력 요청 계산'},
 steer:{ecu:'조향 제어기',swc:'SteeringGeometrySWC',runnable:'MapDriverToFrontAngle',boundary:'운전자 조향의 앞바퀴 각도 표현; EPS 보조 토크 제어와 별개'},
 integration:{ecu:'VCU + 제동 + EPS 제어기',swc:'VehicleCommandInterface',runnable:'RouteActuatorRequests',boundary:'검증한 기능 출력을 액추에이터 경계로 전달'},
}

export type SupportRoute={id:string;domain:string;name:string;input:string;ecu:string;software:string;output:string;effect:string}
export const SUPPORT_ROUTES=[
 {id:'ready',domain:'에너지·전원',name:'프리차지·READY·기어 상태',input:'검증된 START 허용 · 브레이크 · 기어 선택',ecu:'VCU / 차체 제어',software:'주행 상태 전이',output:'READY · GearState',effect:'접촉기 준비와 구동 허용 판단의 입력'},
 {id:'packLimit',domain:'에너지·전원',name:'배터리 출력 가용량',input:'전압 · 온도 · 충전량 · 접촉기 상태',ecu:'BMS',software:'가용 출력 산정',output:'PackAvailable · AvailableTorque',effect:'최대 모터 토크를 제한'},
 {id:'hv',domain:'에너지·전원',name:'접촉기·프리차지',input:'START · 절연 · DC 링크 전압',ecu:'BMS / 배터리 접속 장치',software:'고전압 접속 상태 전이',output:'프리차지 · 주 접촉기 명령',effect:'배터리와 인버터 사이 고전압 경로를 형성'},
 {id:'charge',domain:'에너지·전원',name:'충전·DC/DC·저전압',input:'충전 연결 · SOC · 저전압 부하',ecu:'OBC / DC-DC / BMS',software:'충전 허용 · 전압 변환 제어',output:'배터리 충전 전류 · 12V 공급',effect:'배터리를 다시 채우고 전장 부하에 전력을 공급'},
 {id:'inverter',domain:'구동',name:'인버터 전류·모터 토크',input:'MotorTorqueCmd · DC 전력',ecu:'인버터 제어기',software:'전류·토크 제어',output:'3상 모터 전류 · 축 토크',effect:'구동 모터가 회전력을 생성'},
 {id:'driveline',domain:'구동',name:'감속기·차동기어·후륜축',input:'모터 축 토크',ecu:'기계 전달 경로',software:'—',output:'좌우 뒤 바퀴 토크',effect:'타이어 접지력을 통해 차량 가속'},
 {id:'blend',domain:'제동',name:'회생·마찰 협조·ABS/ESC',input:'BrakeForceReq · 속도 · 휠 슬립',ecu:'제동 제어기 / VCU',software:'제동력 배분 · 휠별 제어',output:'회생 토크 · 캘리퍼 제동력',effect:'감속·에너지 회수·차체 안정'},
 {id:'eps',domain:'조향',name:'EPS 보조·조향 피드백',input:'운전자 토크 · 차속 · 조향각',ecu:'EPS 제어기',software:'보조 토크 제어',output:'EPS 모터 전류 · 보조 토크',effect:'기계식 랙에서 운전자 조향력을 보조'},
 {id:'chassis',domain:'섀시',name:'타이어·현가·차량 운동',input:'바퀴 토크 · 제동력 · 앞바퀴 각도',ecu:'물리·기계 경로',software:'—',output:'차속 · 자세 · 접지 상태',effect:'도로에 힘을 전달하고 차체를 지지'},
 {id:'thermal',domain:'열관리',name:'배터리·모터·인버터 냉각',input:'부품 온도 · 전력 사용량',ecu:'열관리 제어기',software:'펌프·팬 · 출력 제한',output:'냉각 장치 명령 · 가용 토크',effect:'온도를 관리하고 부품 출력을 조정'},
 {id:'network',domain:'차량 통합·진단',name:'통신·신호 유효성·진단',input:'ECU 상태 · 센서 신호 · 통신 지연',ecu:'각 ECU / 게이트웨이',software:'신호 감시 · 진단 상태 처리',output:'유효 신호 · 진단 정보',effect:'제어기 사이의 데이터 흐름과 고장 대응'},
] as const satisfies readonly SupportRoute[]

export type SupportAllocation={ecu:string;swc:string|null;runnable:string|null;episode:number}
/** Allocation belongs to the selected distributed-ECU vehicle, not to the function tree. */
export const SUPPORT_ALLOCATION:Record<(typeof SUPPORT_ROUTES)[number]['id'],SupportAllocation>={
 ready:{ecu:'VCU',swc:'VehicleModeSWC',runnable:'UpdateReadyMode',episode:1},
 packLimit:{ecu:'BMS',swc:'PackLimitSWC',runnable:'ComputeAvailableTorque',episode:1},
 hv:{ecu:'BMS / 배터리 접속 장치',swc:'HvConnectionSWC',runnable:'AdvancePrecharge',episode:1},
 charge:{ecu:'OBC / 전원 제어기',swc:'ChargeControlSWC + LowVoltageSupplySWC',runnable:'ManageAcCharge + RegulateSupply',episode:2},
 inverter:{ecu:'인버터 제어기',swc:'MotorControlSWC',runnable:'TrackTorqueRequest',episode:3},
 driveline:{ecu:'기계 전달 경로',swc:null,runnable:null,episode:3},
 blend:{ecu:'제동 제어기 / VCU',swc:'BrakeBlendSWC + WheelStabilitySWC',runnable:'AllocateDeceleration + AdjustWheelForces',episode:4},
 eps:{ecu:'EPS 제어기',swc:'AssistControlSWC',runnable:'ComputeAssistTorque',episode:5},
 chassis:{ecu:'물리·기계 경로',swc:null,runnable:null,episode:6},
 thermal:{ecu:'열관리 제어기',swc:'ThermalControlSWC',runnable:'RequestPumpFan',episode:2},
 network:{ecu:'각 ECU / 게이트웨이',swc:'SignalHealthSWC',runnable:'CheckSignalFreshness',episode:7},
}

export type TopologyPath={id:string;view:'전력'|'신호'|'기계';title:string;steps:readonly string[]}
export const TOPOLOGY_PATHS:readonly TopologyPath[]=[
 {id:'traction-energy',view:'전력',title:'구동 전력',steps:['고전압 배터리','접촉기·프리차지','인버터','모터']},
 {id:'charging',view:'전력',title:'충전·보조 전원',steps:['충전 포트','OBC','배터리','DC/DC → 12V']},
 {id:'driver-drive',view:'신호',title:'가속 명령',steps:['가속페달 센서','VCU','인버터 제어기','모터 토크']},
 {id:'driver-brake',view:'신호',title:'제동 협조',steps:['브레이크 페달','제동 제어기','VCU / 인버터','회생 + 캘리퍼']},
 {id:'driver-steer',view:'신호',title:'EPS 보조',steps:['운전대 토크 센서','EPS 제어기','EPS 모터','랙 보조 토크']},
 {id:'rear-drive',view:'기계',title:'후륜 구동',steps:['모터 축','감속·차동기어','좌우 구동축','뒤 바퀴·노면']},
 {id:'front-steer',view:'기계',title:'전륜 조향',steps:['운전대·조향축','기계식 랙','타이로드','앞 바퀴·노면']},
]

export type TechnologyChoice={id:string;name:string;summary:string;implication:string;selected?:boolean}
export type TechnologyGroup={id:string;title:string;why:string;choices:TechnologyChoice[]}
export const TECHNOLOGY_GROUPS:TechnologyGroup[]=[
 {id:'drive',title:'구동계',why:'몇 개의 모터가 어느 바퀴를 구동하는지 정합니다.',choices:[
  {id:'rwd',name:'단일 모터 · 후륜구동',summary:'배터리 → 인버터 → 뒤 모터 → 감속기·차동기어 → 뒷바퀴',implication:'현재 차의 구동축과 토크 경로입니다.',selected:true},
  {id:'fwd',name:'단일 모터 · 전륜구동',summary:'전륜 구동축이 조향과 구동을 함께 담당',implication:'모터·감속기·축 배치와 차량 운동 모델을 다시 정해야 합니다.'},
  {id:'awd',name:'전·후 듀얼 모터 · 사륜구동',summary:'두 구동 유닛의 토크를 앞뒤로 나눔',implication:'토크 배분 기능과 모터별 인버터·시험이 추가됩니다.'},
 ]},
 {id:'steer',title:'조향',why:'운전자 입력과 바퀴 사이의 기계 연결 및 제어 경계를 정합니다.',choices:[
  {id:'eps',name:'기계 연결 + EPS',summary:'운전대·조향축·랙이 연결되고 전기모터가 운전자 조향력을 보조',implication:'운전자 조향 경로와 EPS 보조 토크 경로가 기계식 랙에서 합쳐집니다.',selected:true},
  {id:'sbw',name:'Steer-by-Wire',summary:'운전대와 랙의 기계 연결을 제거하고 센서·조향 액추에이터로 전달',implication:'중복 전원·통신·고장 대응, 운전자 피드백 액추에이터와 다른 시험이 필요합니다.'},
  {id:'rws',name:'후륜 조향 추가',summary:'앞바퀴 외에 뒷바퀴 방향도 제어',implication:'후륜 액추에이터·속도별 조향 전략·추가 검증이 필요합니다.'},
 ]},
 {id:'brake',title:'제동',why:'감속 명령을 어떤 장치에 나눠 적용하는지 정합니다.',choices:[
  {id:'friction',name:'마찰 제동',summary:'캘리퍼·디스크 마찰로 감속',implication:'페달·제동 ECU·캘리퍼와 디스크의 힘 전달을 따라갑니다.'},
  {id:'blend',name:'회생 + 마찰 협조',summary:'모터 회생 가능량과 마찰 제동을 함께 조절',implication:'제동 요구를 회생 가능량과 마찰 제동에 배분하고, 배터리 충전 허용·차속·휠 상태를 함께 확인합니다.',selected:true},
 ]},
 {id:'ee',title:'제어기 배치(E/E)',why:'동일한 기능도 제어기를 어디에 배치할지에 따라 통신 경계가 달라집니다.',choices:[
  {id:'distributed',name:'기능별 분산 제어기',summary:'VCU, BMS, 인버터 제어, 제동 제어, EPS 제어가 신호를 주고받음',implication:'각 제어기에 기능을 배치하고 제어기 사이의 신호 경계를 연결합니다.',selected:true},
  {id:'domain',name:'도메인 통합 제어기',summary:'여러 기능을 파워트레인·섀시 등 도메인 컴퓨터로 묶음',implication:'기능 자체와 제어기 배치를 분리해 다시 할당해야 합니다.'},
  {id:'zonal',name:'중앙 컴퓨터 + Zone ECU',summary:'중앙 계산과 위치별 입출력·전원 분배를 나눔',implication:'통신·입출력 경계가 달라지며 모든 액추에이터가 중앙에 직접 붙는 것은 아닙니다.'},
 ]},
]

export const ARCHITECTURE_GLOSSARY=[
 {term:'BEV',meaning:'배터리 전기차. 외부 충전 전력을 배터리에 저장하고 전기모터로 구동합니다.'},
 {term:'VCU',meaning:'Vehicle Control Unit. 차량 수준의 구동 요청과 허용을 조정하는 제어기입니다.'},
 {term:'BMS',meaning:'Battery Management System. 배터리 상태와 사용 가능 범위를 감시합니다.'},
 {term:'EPS',meaning:'Electric Power Steering. 운전자 조향을 전기모터로 보조합니다.'},
 {term:'E/E',meaning:'전기·전자 아키텍처. 제어기, 전원, 통신, 센서와 액추에이터 배치입니다.'},
 {term:'ECU',meaning:'Electronic Control Unit. 특정 기능을 실행하는 전자제어장치입니다.'},
 {term:'SWC',meaning:'Software Component. 제어기 Application 소프트웨어의 기능 단위입니다.'},
 {term:'Runnable',meaning:'SWC 안에서 이벤트나 주기에 따라 실행되는 계산 단위입니다.'},
 {term:'RTE',meaning:'Runtime Environment. AUTOSAR Classic에서 SWC와 서비스 사이의 통신 경계입니다.'},
 {term:'BSW',meaning:'Basic Software. 통신·진단·하드웨어 접근 등 기반 서비스를 제공합니다.'},
] as const
