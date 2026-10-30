// Application-function models for the campaign's fixed BEV configuration.
import type {AssemblyPartId} from '../workshop/assembly.ts'
import {commitStateBlock,executeBlock,isStateBlock,newRuntime,readStateBlock} from './signalBlocks.ts'
import type {BlockConfig,BlockKind,Runtime,Signal} from './signalBlocks.ts'
export type Value=Signal
export type Unit='bool'|'%'|'°C'|'Nm'|'N'|'rad'|'ratio'|'gear'|'any'
export type Kind='in'|'out'|'and'|'or'|'gain'|'limit'|'min'|'gearD'|'brakeClear'|'gate'|'subsystem'|'library'
export type Port={name:string;unit:Unit;about:string}
export type DNode={id:string;kind:Kind;name:string;x:number;y:number;unit:Unit;source?:string;k?:number;low?:number;high?:number;inputUnit?:Unit;subgraph?:DGraph;libraryKind?:BlockKind;config?:BlockConfig;portUnits?:Unit[]}
export type DWire={from:string;to:string;port:number}
export type DGraph={nodes:DNode[];wires:DWire[]}
export type ExecutionEvent={scope:string;nodeId:string;name:string;kind:Kind;value:Value;inputs:{port:number;portName:string;from:string|null;fromName:string|null;value:Value}[];errors:string[]}
export type LogicId='bms'|'start'|'power'|'request'|'drive'|'brake'|'steer'|'integration'
export type DomainId='power'|'drive'|'brake'|'steer'
export type Designs=Record<LogicId,DGraph>
export type Case={name:string;input:Record<string,Value>;expected:Record<string,Value>}
export type ModelSpec={id:LogicId;domain:string;function:string;ecu:string;question:string;requirement:string;steps:string[];parts:AssemblyPartId[];inputs:{id:string;name:string;unit:Unit;about:string}[];outputs:{id:string;name:string;unit:Unit;about:string}[];blocks:Omit<DNode,'id'|'x'|'y'>[];cases:Case[]}
export const MODEL_SPECS:Record<LogicId,ModelSpec>={
 bms:{id:'bms',domain:'에너지 · 전력',function:'배터리 사용 가능 판단',ecu:'BMS-PackMonitor',question:'배터리 상태가 어느 범위일 때 전력 사용을 허용할까?',requirement:'충전량이 5%보다 크고 배터리 온도가 60°C보다 낮으며 절연 상태가 정상일 때만 배터리 사용 가능 신호를 출력해야 한다.',steps:['SOC를 5% 기준과 비교','배터리 온도를 60°C 기준과 비교','절연 상태와 두 비교 결과를 결합'],parts:['battery','vcu'],inputs:[{id:'soc',name:'PackSOC',unit:'%',about:'배터리 잔량 측정값.'},{id:'temp',name:'PackTemp',unit:'°C',about:'배터리 온도 측정값.'},{id:'isolation',name:'IsolationOK',unit:'bool',about:'절연 감시 장치가 전달하는 정상 여부.'}],outputs:[{id:'safe',name:'PackSafe',unit:'bool',about:'BMS가 전력 사용을 허용하는 상태 신호. 실제 접촉기 명령과는 별개.'}],blocks:[{kind:'library',name:'SOC 기준 5%',unit:'%',libraryKind:'constant',portUnits:[],config:{value:5}},{kind:'library',name:'SOC > 5%',unit:'bool',libraryKind:'relational',portUnits:['%','%'],config:{operation:'>'}},{kind:'library',name:'온도 기준 60°C',unit:'°C',libraryKind:'constant',portUnits:[],config:{value:60}},{kind:'library',name:'온도 < 60°C',unit:'bool',libraryKind:'relational',portUnits:['°C','°C'],config:{operation:'<'}},{kind:'and',name:'사용 가능 조건',unit:'bool',k:3}],cases:[{name:'정상 팩',input:{soc:65,temp:25,isolation:true},expected:{safe:true}},{name:'잔량 경계',input:{soc:5,temp:25,isolation:true},expected:{safe:false}},{name:'잔량 부족',input:{soc:3,temp:25,isolation:true},expected:{safe:false}},{name:'배터리 과열',input:{soc:65,temp:60,isolation:true},expected:{safe:false}},{name:'절연 이상',input:{soc:65,temp:25,isolation:false},expected:{safe:false}},{name:'두 고장 동시',input:{soc:3,temp:70,isolation:false},expected:{safe:false}}]},
 start:{id:'start',domain:'에너지 · 전력',function:'START 요청 허용',ecu:'VCU-VehicleMode',question:'어떤 조건에서 START 요청을 고전압 준비 단계로 보낼까?',requirement:'START 버튼의 상승 순간에 P 기어, 브레이크 5% 이상, 충전 플러그 분리, BMS PackSafe가 모두 확인될 때만 고전압 준비 요청을 출력한다. 버튼을 계속 누르는 상태는 새 요청이 아니다.',steps:['START 상승 이벤트와 P 기어를 확인','브레이크 5% 이상 및 충전 플러그 분리 확인','BMS PackSafe와 결합해 프리차지 요청'],parts:['battery','vcu'],inputs:[{id:'edge',name:'StartEdge',unit:'bool',about:'START 버튼을 새로 누른 순간의 이벤트. 계속 누른 상태는 FALSE.'},{id:'gear',name:'GearState',unit:'gear',about:'실제 기어 상태. P에서만 고전압 준비를 요청한다.'},{id:'brake',name:'BrakePct',unit:'%',about:'START 중 브레이크 페달 위치.'},{id:'plugged',name:'ChargePlugged',unit:'bool',about:'충전 플러그 연결 상태.'},{id:'packSafe',name:'PackSafe',unit:'bool',about:'앞 미션에서 만든 BMS 사용 가능 판단.'}],outputs:[{id:'startPermit',name:'StartPermit',unit:'bool',about:'VCU가 고전압 준비 상태기에 전달하는 1회 요청. 접촉기 제어 명령 자체는 아니다.'}],blocks:[{kind:'library',name:'P 기어 기준',unit:'gear',libraryKind:'constant',portUnits:[],config:{value:'P'}},{kind:'library',name:'기어 == P',unit:'bool',libraryKind:'relational',portUnits:['gear','gear'],config:{operation:'=='}},{kind:'library',name:'브레이크 기준 5%',unit:'%',libraryKind:'constant',portUnits:[],config:{value:5}},{kind:'library',name:'브레이크 ≥ 5%',unit:'bool',libraryKind:'relational',portUnits:['%','%'],config:{operation:'>='}},{kind:'library',name:'플러그 분리',unit:'bool',libraryKind:'logical',portUnits:['bool'],config:{operation:'NOT'}},{kind:'and',name:'운전자 시작 조건',unit:'bool',k:3},{kind:'and',name:'START 허용 결합',unit:'bool',k:3}],cases:[{name:'정상 시동 요청',input:{edge:true,gear:'P',brake:100,plugged:false,packSafe:true},expected:{startPermit:true}},{name:'버튼 상승 없음',input:{edge:false,gear:'P',brake:100,plugged:false,packSafe:true},expected:{startPermit:false}},{name:'D 기어',input:{edge:true,gear:'D',brake:100,plugged:false,packSafe:true},expected:{startPermit:false}},{name:'브레이크 경계 아래',input:{edge:true,gear:'P',brake:4.99,plugged:false,packSafe:true},expected:{startPermit:false}},{name:'충전 플러그 연결',input:{edge:true,gear:'P',brake:100,plugged:true,packSafe:true},expected:{startPermit:false}},{name:'BMS 차단',input:{edge:true,gear:'P',brake:100,plugged:false,packSafe:false},expected:{startPermit:false}}]},
 power:{id:'power',domain:'에너지 · 전력',function:'전력 사용 허용',ecu:'VCU-PowerAvailability',question:'에너지가 준비됐을 때만 구동에 사용해도 될까?',requirement:'차량이 주행 준비 상태이고 배터리 사용이 허용된 동안, 전력 허용 기능은 사용 허용을 출력해야 한다. 어느 조건이든 없으면 허용하지 않아야 한다.',steps:['제공 시동 상태기의 READY 상태','앞서 만든 BMS PackSafe와 고전압 접속 상태 확인','두 조건이 모두 참일 때만 사용 허용'],parts:['battery','inverter','vcu'],inputs:[{id:'ready',name:'VehicleReady',unit:'bool',about:'운전자의 START 요청을 제공 시동 상태기가 처리한 주행 준비 상태.'},{id:'pack',name:'PackAvailable',unit:'bool',about:'앞서 만든 BMS PackSafe와 고전압 접속 준비 상태가 모두 참일 때 들어오는 신호.'}],outputs:[{id:'enable',name:'PowerEnable',unit:'bool',about:'VCU와 인버터가 전력을 사용해도 되는지 나타내는 허용 신호. 배터리 전류 자체가 아님.'}],blocks:[{kind:'and',name:'AND',unit:'bool'},{kind:'or',name:'OR',unit:'bool'}],cases:[{name:'준비 + 배터리 정상',input:{ready:true,pack:true},expected:{enable:true}},{name:'READY 없음',input:{ready:false,pack:true},expected:{enable:false}},{name:'배터리 사용 불가',input:{ready:true,pack:false},expected:{enable:false}},{name:'모두 OFF',input:{ready:false,pack:false},expected:{enable:false}}]},
 request:{id:'request',domain:'구동',function:'운전자 모터 토크 요청',ecu:'VCU-DriverDemand',question:'발의 움직임을 모터 축의 힘 요청으로 어떻게 바꿀까?',requirement:'페달 신호가 주어질 때, 구동 요청 기능은 유효 범위로 제한한 페달량에 변환 계수를 곱한 모터 축 토크 요청을 계산하고, 가용 토크를 넘지 않아야 한다.',steps:['센서의 페달 위치를 유효 범위 안으로 제한','페달 % × 제공 변환 계수 → 모터 축 요청 Nm','배터리·인버터가 제공한 가용 토크 이내로 제한'],parts:['pedal','motor','gearbox','axle'],inputs:[{id:'pedal',name:'AccelPct',unit:'%',about:'가속페달 위치 센서의 값. 전력이나 토크가 아니라 운전자의 가속 의도.'},{id:'cap',name:'AvailableTorque',unit:'Nm',about:'제공 BMS/인버터의 모터 축 가용 토크 상한. 이 신호를 플레이어가 상수로 고정하면 안 됨.'}],outputs:[{id:'request',name:'DriverTorqueReq',unit:'Nm',about:'운전자 가속 의도를 모터 축 토크 목표로 환산한 요청. 실제 전류와 바퀴 토크는 아님.'}],blocks:[{kind:'limit',name:'페달 유효 범위',unit:'%',low:0,high:100},{kind:'gain',name:'페달 → 모터 토크',unit:'Nm',inputUnit:'%',k:1.8},{kind:'min',name:'가용 토크 제한',unit:'Nm'}],cases:[{name:'발을 뗌',input:{pedal:0,cap:180},expected:{request:0}},{name:'중간 페달',input:{pedal:50,cap:180},expected:{request:90}},{name:'끝까지 밟음',input:{pedal:100,cap:180},expected:{request:180}},{name:'가용량 감소',input:{pedal:100,cap:45},expected:{request:45}},{name:'범위 밖 입력 제한',input:{pedal:120,cap:250},expected:{request:180}}]},
 drive:{id:'drive',domain:'구동',function:'전진 구동 허용',ecu:'VCU-DriveInterlock',question:'가속 요청이 있어도 언제는 모터를 돌리면 안 될까?',requirement:'전력이 허용되고 기어가 D이며 브레이크가 개입하지 않은 동안에만 전진 구동을 허용해야 한다. 다른 상태에서는 구동을 허용하지 않아야 한다.',steps:['기어 입력을 D와 비교','브레이크 입력을 개입 경계와 비교','전력 허용 · 전진 · 제동 미개입을 모두 만족하는지 판단'],parts:['motor','gearbox','axle','pedal'],inputs:[{id:'enable',name:'PowerEnable',unit:'bool',about:'앞 판에서 만든 전력 허용 기능의 출력.'},{id:'gear',name:'GearState',unit:'gear',about:'제공 변속 상태기의 실제 기어 상태. READY와는 별개의 Enum 신호.'},{id:'brake',name:'BrakePct',unit:'%',about:'제동 페달 위치. 구동 차단 판단이며 제동력을 생성하는 기능과는 다름.'}],outputs:[{id:'allow',name:'DriveAllow',unit:'bool',about:'정상 전진 구동 허용. 실제 토크 명령은 마지막 시스템 연결에서 요청 토크와 결합.'}],blocks:[{kind:'gearD',name:'기어 비교',unit:'bool'},{kind:'brakeClear',name:'제동 미개입 비교',unit:'bool',k:5},{kind:'and',name:'AND',unit:'bool',k:3},{kind:'or',name:'OR',unit:'bool',k:3}],cases:[{name:'정상 전진',input:{enable:true,gear:'D',brake:0},expected:{allow:true}},{name:'브레이크 ON',input:{enable:true,gear:'D',brake:100},expected:{allow:false}},{name:'기어 P',input:{enable:true,gear:'P',brake:0},expected:{allow:false}},{name:'전력 허용 없음',input:{enable:false,gear:'D',brake:0},expected:{allow:false}},{name:'제동 경계',input:{enable:true,gear:'D',brake:5},expected:{allow:false}}]},
 brake:{id:'brake',domain:'제동',function:'마찰 제동력 요청',ecu:'제동 제어기-BrakeDemand',question:'구동을 끄는 것과 바퀴를 멈추는 힘은 어떻게 다를까?',requirement:'브레이크 페달이 입력될 때, 제동 요청 기능은 유효 범위로 제한한 페달량에 따라 마찰 제동력을 요청해야 한다. 페달을 놓으면 제동력 요청은 0이어야 한다.',steps:['브레이크 센서의 % 입력','유효 범위로 제한','제동력으로 환산 → 캘리퍼가 디스크를 조여 감속'],parts:['brakePedal','brakes'],inputs:[{id:'brake',name:'BrakePct',unit:'%',about:'브레이크 페달 위치 센서. 제동량의 입력이며 가속페달과 다름.'}],outputs:[{id:'force',name:'BrakeForceReq',unit:'N',about:'차량 전체 종방향 제동력 요청. 제동 시스템에서 회생·마찰 배분과 휠 슬립 제어를 거쳐 액추에이터에 적용.'}],blocks:[{kind:'limit',name:'페달 유효 범위',unit:'%',low:0,high:100},{kind:'gain',name:'페달 → 제동력',unit:'N',inputUnit:'%',k:42}],cases:[{name:'브레이크 OFF',input:{brake:0},expected:{force:0}},{name:'중간 제동',input:{brake:50},expected:{force:2100}},{name:'브레이크 ON',input:{brake:100},expected:{force:4200}},{name:'상한 제한',input:{brake:130},expected:{force:4200}},{name:'하한 제한',input:{brake:-10},expected:{force:0}}]},
 steer:{id:'steer',domain:'조향',function:'운전자 조향각 변환',ecu:'조향 제어기-SteeringGeometry',question:'핸들을 돌린 만큼 랙과 앞바퀴가 어떻게 바뀔까?',requirement:'핸들 입력이 주어질 때, 조향 요청 기능은 입력을 좌우 유효 범위로 제한하여 기계 연결에서 나타날 같은 방향의 앞바퀴 각도를 계산해야 한다. 중립 입력이면 각도 요청은 0이어야 한다.',steps:['핸들의 좌/중립/우 입력','좌우 입력 범위로 제한','제공 조향비 → 전륜 기하 각도'],parts:['steeringWheel','steeringRack'],inputs:[{id:'steer',name:'SteerRequest',unit:'ratio',about:'핸들 조작을 -1(왼쪽)~+1(오른쪽)로 정규화한 입력.'}],outputs:[{id:'angle',name:'FrontWheelAngle',unit:'rad',about:'차량 운동 모형에 들어가는 앞바퀴 각도. EPS의 보조 토크·모터 전류 계산과는 별개입니다.'}],blocks:[{kind:'limit',name:'핸들 유효 범위',unit:'ratio',low:-1,high:1},{kind:'gain',name:'입력 → 앞바퀴 각',unit:'rad',inputUnit:'ratio',k:.48}],cases:[{name:'중립',input:{steer:0},expected:{angle:0}},{name:'왼쪽 끝',input:{steer:-1},expected:{angle:-.48}},{name:'오른쪽 중간',input:{steer:.5},expected:{angle:.24}},{name:'오른쪽 끝',input:{steer:1},expected:{angle:.48}},{name:'회전 범위 제한',input:{steer:2},expected:{angle:.48}}]},
 integration:{id:'integration',domain:'차량 시스템 통합',function:'도메인 출력 → 액추에이터',ecu:'도메인 제어기 간 신호 연결',question:'완성한 네 도메인이 같은 차에서 함께 움직이려면?',requirement:'시스템은 구동이 허용된 동안에만 운전자 토크 요청을 인버터로 전달하고, 제동력과 앞바퀴 각도 요청을 각각 해당 액추에이터에 전달해야 한다.',steps:['구동 허용으로 모터 토크 요청을 선택','제동 제어기 → 마찰 제동 액추에이터','조향 제어기 → 조향 액추에이터'],parts:['vcu','inverter','motor','brakes','steeringRack'],inputs:[{id:'request',name:'DriverTorqueReq',unit:'Nm',about:'구동 판에서 만든 운전자 모터 축 토크 요청.'},{id:'allow',name:'DriveAllow',unit:'bool',about:'전력 허용·D·제동 미개입으로 만든 구동 허용.'},{id:'force',name:'BrakeForceReq',unit:'N',about:'제동 판의 실제 계산 출력.'},{id:'angle',name:'FrontWheelAngle',unit:'rad',about:'조향 판의 전륜 각도 계산 출력.'}],outputs:[{id:'torque',name:'MotorTorqueCmd',unit:'Nm',about:'인버터 제공 모터 제어에 전달되는 실제 주행 모형 명령.'},{id:'brakeForce',name:'BrakeActuator',unit:'N',about:'제공 마찰 제동 액추에이터에 전달.'},{id:'wheelAngle',name:'SteerActuator',unit:'rad',about:'차량 운동 모형의 전륜 각도 입력. EPS 보조 토크 신호가 아닙니다.'}],blocks:[{kind:'gate',name:'허용 때만 명령',unit:'Nm'}],cases:[{name:'구동·조향',input:{request:90,allow:true,force:0,angle:.24},expected:{torque:90,brakeForce:0,wheelAngle:.24}},{name:'제동 우선',input:{request:90,allow:false,force:4200,angle:0},expected:{torque:0,brakeForce:4200,wheelAngle:0}},{name:'역방향 조향',input:{request:0,allow:false,force:2100,angle:-.48},expected:{torque:0,brakeForce:2100,wheelAngle:-.48}}]}
}
export const ROUNDS:{id:DomainId;name:string;parts:AssemblyPartId[];models:LogicId[];observe:string;mechanical:string;conversion:string}[]=[
 {id:'power',name:'시동 단계',parts:['battery','inverter','vcu'],models:['bms','start','power'],observe:'시동 조건 | P에서 브레이크를 밟고 START를 눌러 프리차지 후 READY 진입 | BMS의 사용 가능 신호가 있어야 전력 허용',mechanical:'배터리의 DC 전력 → 프리차지·접촉기 → 인버터의 3상 AC 변환 → 구동 모터',conversion:'SOC·온도·절연을 BMS가 판단하고, VCU의 START 허용 요청이 프리차지를 시작한 뒤 READY와 전력 허용으로 이어집니다.'},
 {id:'drive',name:'구동 및 동력 전달 단계',parts:['motor','gearbox','axle','pedal'],models:['request','drive'],observe:'구동 조건 | READY·D·브레이크 해제 후 가속페달을 밟으면 모터 토크가 뒷바퀴로 전달됨 | 페달을 놓으면 구동 요청이 줄지만 제동력과 같지는 않음',mechanical:'모터 회전 → 감속·차동기어 → 좌우 구동축 → 뒷바퀴. 가속페달은 힘이 아니라 운전자 의도를 센서 신호로 전달합니다.',conversion:'페달 센서 입력은 VCU의 토크 요청으로 바뀌고, 인버터와 모터를 거쳐 감속기·차축·뒷바퀴를 움직입니다.'},
 {id:'brake',name:'제동 단계',parts:['brakePedal','brakes'],models:['brake'],observe:'제동 조건 | 움직이는 상태에서 브레이크 페달을 밟아 제동력 요청 | 캘리퍼·디스크 마찰로 감속·정차',mechanical:'브레이크 페달 위치 → 제동 제어기의 힘 요청 → 제동 액추에이터 → 패드·디스크 마찰 → 감속.',conversion:'브레이크 페달 센서는 제동 요구를 보내고, 제동 제어기의 요청에 따라 마찰 제동 장치가 바퀴에 힘을 가합니다.'},
 {id:'steer',name:'조향 단계',parts:['steeringWheel','steeringRack'],models:['steer'],observe:'조향 조건 | 움직이는 상태에서 핸들을 좌·우로 조작 | 앞바퀴 두 개가 회전하고 차량 진행 방향이 바뀜',mechanical:'운전대·조향축 → 기계식 랙·타이로드 → 앞바퀴 두 개. EPS 모터가 조향력을 보조합니다.',conversion:'이 퍼즐은 운전자 조향을 전륜 각도로 나타냅니다. 실제 EPS 제어는 토크 센서와 보조모터 전류를 별도로 다룹니다.'}
]
export type ModelContext={controller:string;softwareLevel:string;inputBoundary:string;outputBoundary:string;physicalEffect:string;logicFamily:string}
// The function hierarchy and the E/E deployment are orthogonal: these fields make the allocation explicit.
export const MODEL_CONTEXT:Record<LogicId,ModelContext>={
 bms:{controller:'BMS',softwareLevel:'Application SW · 팩 상태 판단',inputBoundary:'SOC + 배터리 온도 + 절연 상태',outputBoundary:'PackSafe → 전원 접속·전력 허용',physicalEffect:'사용 불가 판단은 접촉기와 모터 토크 경로를 차단합니다.',logicFamily:'센서 기준 비교·논리 결합'},
 start:{controller:'VCU',softwareLevel:'Application SW · 차량 모드 시작 요청',inputBoundary:'START 상승 이벤트 + 기어 + 브레이크 + 플러그 + BMS PackSafe',outputBoundary:'StartPermit → 프리차지 상태기',physicalEffect:'허용 요청은 프리차지와 접촉기 준비를 시작합니다. READY 전에는 구동력이 없습니다.',logicFamily:'상승 이벤트·기어/브레이크 비교·논리 결합'},
 power:{controller:'VCU',softwareLevel:'Application SW · 주행 허용 판단',inputBoundary:'READY 상태 + BMS 사용 가능 신호',outputBoundary:'PowerEnable → 구동 허용 판단',physicalEffect:'허용 신호만으로 모터에 토크가 생기지는 않습니다.',logicFamily:'조건 결합'},
 request:{controller:'VCU',softwareLevel:'Application SW · 운전자 요구 계산',inputBoundary:'가속페달 센서 + 가용 모터 토크',outputBoundary:'DriverTorqueReq → 구동 인터록',physicalEffect:'요청값은 모터 축 목표 토크이며 바퀴 토크나 전류가 아닙니다.',logicFamily:'입력 제한·비례 변환·상한'},
 drive:{controller:'VCU',softwareLevel:'Application SW · 구동 인터록',inputBoundary:'PowerEnable + D 기어 + 브레이크 신호',outputBoundary:'DriveAllow → 시스템 명령 선택',physicalEffect:'차단은 제동이 아닙니다. 제동력은 별도 제동 기능이 만듭니다.',logicFamily:'조건 비교·논리 결합'},
 brake:{controller:'제동 제어기',softwareLevel:'Application SW · 제동 요구 계산',inputBoundary:'브레이크 페달 센서',outputBoundary:'BrakeForceReq → 제동 액추에이터',physicalEffect:'캘리퍼·디스크 마찰이 차량을 감속합니다.',logicFamily:'입력 제한·비례 변환'},
 steer:{controller:'조향 제어기',softwareLevel:'Application SW · 전륜 운동 표현',inputBoundary:'운전대 조작 신호',outputBoundary:'FrontWheelAngle → 차량 운동 모형',physicalEffect:'운전대의 기계 연결과 EPS 보조 장치가 앞바퀴 두 개의 방향을 바꿉니다. 이 블록은 각도만 계산합니다.',logicFamily:'입력 제한·비례 변환'},
 integration:{controller:'VCU · 제동 제어기 · 조향 제어기',softwareLevel:'Application 기능 간 출력 조합',inputBoundary:'각 제어기의 검증된 요구 출력',outputBoundary:'MotorTorqueCmd / BrakeActuator / SteerActuator',physicalEffect:'각 명령이 모터·제동·조향 장치에 전달되어 하나의 차를 움직입니다.',logicFamily:'허용 조건 선택·신호 연결'},
}
export type FunctionCoverage={domain:string;function:string;role:'직접 구성'|'차량 기반'|'다음 설계';reason:string}
// A function inventory, not another playable puzzle list. No item is silently counted as completed.
export const VEHICLE_FUNCTIONS:readonly FunctionCoverage[]=[
 {domain:'주행 상태',function:'START 요청 허용',role:'직접 구성',reason:'버튼 상승·P 기어·브레이크·플러그·BMS 상태를 결합'},
 {domain:'주행 상태',function:'READY·기어 상태 전이',role:'차량 기반',reason:'프리차지 뒤 접촉기 상태와 운전자 이벤트'},
 {domain:'에너지',function:'배터리 상태 감시·사용 가능 판단',role:'직접 구성',reason:'SOC·온도·절연을 비교해 사용 가능 신호 생성'},
 {domain:'에너지',function:'출력 가용량',role:'차량 기반',reason:'배터리·인버터의 토크 상한을 계산'},
 {domain:'에너지',function:'전력 사용 허용',role:'직접 구성',reason:'READY와 배터리 상태를 결합'},
 {domain:'에너지',function:'고전압 접촉기·프리차지·절연 감시',role:'다음 설계',reason:'배터리와 인버터를 연결하기 전 전원 경로 관리'},
 {domain:'에너지',function:'충전/OBC·DC/DC·12V 전원',role:'다음 설계',reason:'재충전과 보조 전원 공급'},
 {domain:'구동',function:'운전자 토크 요청·D 기어 인터록',role:'직접 구성',reason:'가속 의도와 허용 조건을 모터 명령으로 전환'},
 {domain:'구동',function:'인버터 전류 제어·모터 토크 응답',role:'차량 기반',reason:'토크 명령을 전기·기계 출력으로 전환'},
 {domain:'구동',function:'감속기·차동기어·후륜 구동축',role:'차량 기반',reason:'모터 회전을 좌우 뒷바퀴로 전달'},
 {domain:'제동',function:'마찰 제동력 요청',role:'직접 구성',reason:'페달 의도를 감속력 요구로 변환'},
 {domain:'제동',function:'회생제동 협조·ABS/EBD/ESC',role:'다음 설계',reason:'에너지 회수와 휠·차체 안정 제어'},
 {domain:'조향',function:'앞바퀴 각도 요청',role:'직접 구성',reason:'핸들 입력을 조향 장치 목표로 전환'},
 {domain:'조향',function:'EPS 보조·조향 피드백',role:'다음 설계',reason:'조향 힘과 각도 추종을 제어'},
 {domain:'섀시',function:'타이어 접지·수동 현가·차량 운동',role:'차량 기반',reason:'구동·제동·조향 결과가 차량 자세에 반영'},
 {domain:'열관리',function:'배터리·모터·인버터 냉각',role:'다음 설계',reason:'출력 가용성과 장치 온도 관리'},
 {domain:'차량 통합·진단',function:'도메인 출력과 액추에이터 연결',role:'직접 구성',reason:'VCU·제동·조향 명령을 각 장치에 전달'},
 {domain:'차량 통합·진단',function:'네트워크 신호 유효성·진단·고장 반응',role:'다음 설계',reason:'신호 상실과 고장 상태를 다룸'},
]
export const cloneGraph=(g:DGraph):DGraph=>structuredClone(g)
// Collapse one computational block into a real nested graph without changing its external wiring.
export function wrapBlockAsSubsystem(g:DGraph,nodeId:string):DGraph{
 const original=g.nodes.find(n=>n.id===nodeId)
 if(!original||['in','out','subsystem'].includes(original.kind))return g
 const inputs=ports(original)
 const innerNode:{[key:string]:unknown}={...original,id:'operation',x:250,y:80}
 const innerInputs:DNode[]=inputs.map((port,i)=>({id:`input-${i}`,kind:'in',name:port.name,x:24,y:35+i*105,unit:port.unit,source:`u${i}`}))
 const innerOutput:DNode={id:'output',kind:'out',name:'결과',x:510,y:80,unit:original.unit,source:'result'}
 const inner:DGraph={nodes:[...innerInputs,innerNode as DNode,innerOutput],wires:[...inputs.map((_,i)=>({from:`input-${i}`,to:'operation',port:i})),{from:'operation',to:'output',port:0}]}
 return{...g,nodes:g.nodes.map(n=>n.id===nodeId?{id:n.id,kind:'subsystem',name:n.name+' Subsystem',x:n.x,y:n.y,unit:n.unit,subgraph:inner}:n)}
}
export function emptyModel(id:LogicId):DGraph{const s=MODEL_SPECS[id];return{nodes:[...s.inputs.map((p,i)=>({id:'in-'+p.id,kind:'in' as const,name:p.name,x:id==='integration'&&i===3?520:25,y:id==='start'?20+i*100:id==='integration'&&i>=2?340:45+i*150,unit:p.unit,source:p.id})),...s.outputs.map((p,i)=>({id:'out-'+p.id,kind:'out' as const,name:p.name,x:id==='integration'&&i===1?290:810,y:id==='start'?210:id==='integration'&&i>=1?340:80+i*150,unit:p.unit,source:p.id}))],wires:[]}}
export function ports(n:DNode):Port[]{const p=(unit:Unit,name:string,about:string)=>({unit,name,about});if(n.kind==='in')return[];if(n.kind==='library')return(n.portUnits??[]).map((unit,i)=>p(unit,`u${i+1}`,`${n.name}의 ${i+1}번째 입력`));if(n.kind==='subsystem')return(n.subgraph?.nodes.filter(a=>a.kind==='in')??[]).map(a=>p(a.unit,a.name,'Subsystem 내부 입력 '+a.name));if(n.kind==='out')return[p(n.unit,'u','이 기능에서 계산된 값을 받는 출력 경계')];if(n.kind==='and'||n.kind==='or')return Array.from({length:n.k??2},(_,i)=>p('bool','u'+(i+1),'어떤 참/거짓 조건이든 연결할 수 있는 논리 연산 입력. 정답 신호가 미리 지정되지 않음.'));if(n.kind==='gearD')return[p('gear','u','실제 기어 상태를 D와 비교')];if(n.kind==='brakeClear')return[p('%','u','브레이크 개입 경계 미만인지 비교')];if(n.kind==='gate')return[p(n.unit,'u1','허용 때 전달할 수치 요청'),p('bool','u2','참이면 u1, 거짓이면 0을 선택')];if(n.kind==='min')return[p(n.unit,'u1','비교할 첫 값'),p(n.unit,'u2','비교할 두 번째 값. 더 작은 값을 출력')];return[p(n.inputUnit??n.unit,'u',n.kind==='gain'?'입력 × 제공 변환 계수':'입력을 하한과 상한 사이로 제한')]}
export function connectModel(g:DGraph,from:string,to:string,port:number):{graph:DGraph;error:string}{const a=g.nodes.find(n=>n.id===from),b=g.nodes.find(n=>n.id===to),target=b&&ports(b)[port];if(!a||!b||a.kind==='out'||!target)return{graph:g,error:'출력 포트 → 입력 포트 순서로 선택해요.'};const next={...g,wires:[...g.wires.filter(w=>!(w.to===to&&w.port===port)),{from,to,port}]};const seen=new Set<string>();function cycle(id:string,stack:Set<string>):boolean{if(stack.has(id))return true;if(seen.has(id))return false;stack.add(id);for(const w of next.wires.filter(w=>w.from===id&&!next.nodes.some(n=>n.id===w.to&&n.kind==='library'&&n.libraryKind&&isStateBlock(n.libraryKind))))if(cycle(w.to,stack))return true;stack.delete(id);seen.add(id);return false}if(next.nodes.some(n=>cycle(n.id,new Set())))return{graph:g,error:'지연 없는 순환은 실행할 수 없어요. 연결을 되돌렸어요.'};return{graph:next,error:''}}
export function evaluateModel(g:DGraph,input:Record<string,Value>,runtime:Runtime=newRuntime(),scope=''){
 const values:Record<string,Value>={},errors:string[]=[],events:ExecutionEvent[]=[],stack=new Set<string>(),delayed:DNode[]=[]
 const byId=new Map(g.nodes.map(node=>[node.id,node]))
 const number=(v:Value|undefined)=>typeof v==='number'&&Number.isFinite(v)?v:0
 function evaluate(id:string):Value{
  if(id in values)return values[id]
  const n=byId.get(id)
  if(!n||stack.has(id)){errors.push('실행할 수 없는 경로');return 0}
  if(n.kind==='library'&&n.libraryKind&&isStateBlock(n.libraryKind)){
   const value=readStateBlock(n.libraryKind,n.config??{},runtime,scope+n.id)
   values[id]=value;delayed.push(n);events.push({scope,nodeId:id,name:n.name,kind:n.kind,value,inputs:[],errors:[]});return value
  }
  stack.add(id)
  const errorStart=errors.length,links:ExecutionEvent['inputs']=[]
  const args=ports(n).map((p,i)=>{
   const w=g.wires.find(w=>w.to===id&&w.port===i),source=w&&byId.get(w.from)
   if(!source||(source.unit!==p.unit&&source.unit!=='any'&&p.unit!=='any')){errors.push(n.name+' / '+p.name+' 연결 필요');const fallback=p.unit==='bool'?false:0;links.push({port:i,portName:p.name,from:null,fromName:null,value:fallback});return fallback}
   const value=evaluate(source.id);links.push({port:i,portName:p.name,from:source.id,fromName:source.name,value});return value
  })
  let value:Value=0
  switch(n.kind){
   case'in':value=input[n.source!]??(n.unit==='bool'?false:0);break
   case'out':value=args[0];break
   case'and':value=args.every(v=>v===true);break
   case'or':value=args.some(v=>v===true);break
   case'gain':value=number(args[0])*(n.k??1);break
   case'limit':value=Math.max(n.low??0,Math.min(n.high??100,number(args[0])));break
   case'min':value=Math.min(number(args[0]),number(args[1]));break
   case'gearD':value=args[0]==='D';break
   case'brakeClear':value=number(args[0])<(n.k??5);break
   case'gate':value=args[1]===true?number(args[0]):0;break
   case'library':value=n.libraryKind?executeBlock(n.libraryKind,args,n.config,runtime,scope+n.id):0;break
   case'subsystem':{
    if(!n.subgraph){errors.push('Subsystem 내부 모델 없음');value=0;break}
    const innerInput:Record<string,Value>={}
    n.subgraph.nodes.filter(a=>a.kind==='in').forEach((a,i)=>{innerInput[a.source!]=args[i]})
    const nested=evaluateModel(n.subgraph,innerInput,runtime,scope+n.id+'/')
    errors.push(...nested.errors.map(error=>n.name+' / '+error))
    events.push(...nested.events)
    value=nested.output.result??0
    break
   }
  }
  stack.delete(id);values[id]=value;events.push({scope,nodeId:id,name:n.name,kind:n.kind,value,inputs:links,errors:errors.slice(errorStart)});return value
 }
 for(const n of g.nodes.filter(n=>n.kind==='library'&&(n.libraryKind&&isStateBlock(n.libraryKind)||['goto','dataMemory','dataWrite'].includes(n.libraryKind??''))))evaluate(n.id)
 const output:Record<string,Value>={}
 for(const n of g.nodes.filter(n=>n.kind==='out'))output[n.source!]=evaluate(n.id)
 for(const n of g.nodes.filter(n=>n.kind==='in'))if(!(n.id in values))evaluate(n.id)
 for(let i=0;i<delayed.length;i++){
  const n=delayed[i],wire=g.wires.find(w=>w.to===n.id&&w.port===0),source=wire&&byId.get(wire.from)
  if(!source){errors.push(n.name+' / u1 연결 필요');continue}
  commitStateBlock(n.libraryKind!,evaluate(source.id),n.config??{},runtime,scope+n.id)
 }
 return{output,values,events,errors:[...new Set(errors)]}
}
// Separate expectation table above. The learner's graph never defines the oracle.
export function verifyModel(id:LogicId,g:DGraph){return MODEL_SPECS[id].cases.map(c=>{const actual=evaluateModel(g,c.input);return{...c,actual,pass:actual.errors.length===0&&Object.entries(c.expected).every(([k,v])=>typeof v==='number'?typeof actual.output[k]==='number'&&Math.abs((actual.output[k] as number)-v)<1e-7:actual.output[k]===v)}})}
export function addBlock(g:DGraph,id:LogicId,index:number){const spec=MODEL_SPECS[id].blocks[index],count=g.nodes.filter(n=>n.kind!=='in'&&n.kind!=='out').length;if(!spec||count>=8)return g;const bmsPositions=[[245,25],[430,75],[245,255],[430,295],[630,180]],startPositions=[[205,110],[345,100],[205,255],[345,245],[345,385],[535,165],[680,205]];return{...g,nodes:[...g.nodes,{...spec,id:'b'+(Math.max(0,...g.nodes.map(n=>Number(n.id.slice(1))||0))+1),x:id==='bms'?bmsPositions[count%5][0]:id==='start'?startPositions[count%7][0]:id==='request'?230+count%3*195:id==='drive'?(count<2?290:540):id==='brake'||id==='steer'?300+count%2*250:440,y:id==='bms'?bmsPositions[count%5][1]:id==='start'?startPositions[count%7][1]:id==='request'?85+Math.floor(count/3)*170:id==='drive'?(count<2?155+count*135:100+(count-2)*130):id==='brake'||id==='steer'?100+Math.floor(count/2)*150:95+count*150}]}}
export function addLibraryBlock(g:DGraph,kind:BlockKind,name:string,config:BlockConfig,inputCount:number):DGraph{
 const count=g.nodes.filter(n=>n.kind!=='in'&&n.kind!=='out').length
 const id='lib-'+(Math.max(0,...g.nodes.map(n=>Number(n.id.replace(/\D/g,''))||0))+1)
 return{...g,nodes:[...g.nodes,{id,kind:'library',libraryKind:kind,name,x:260+count%3*175,y:85+Math.floor(count/3)*150,unit:'any',portUnits:Array.from({length:inputCount},()=> 'any' as Unit),config:structuredClone(config)}]}
}
export function referenceModel(id:LogicId):DGraph{let g=emptyModel(id);const indexes=id==='power'?[0]:id==='drive'?[0,1,2]:MODEL_SPECS[id].blocks.map((_,i)=>i);for(const i of indexes)g=addBlock(g,id,i);const link=(from:string,to:string,port=0)=>{g=connectModel(g,from,to,port).graph};if(id==='bms'){link('in-soc','b2');link('b1','b2',1);link('in-temp','b4');link('b3','b4',1);link('b2','b5');link('b4','b5',1);link('in-isolation','b5',2);link('b5','out-safe')}if(id==='start'){link('in-gear','b2');link('b1','b2',1);link('in-brake','b4');link('b3','b4',1);link('in-plugged','b5');link('in-edge','b6');link('b2','b6',1);link('b4','b6',2);link('b6','b7');link('b5','b7',1);link('in-packSafe','b7',2);link('b7','out-startPermit')}if(id==='power'){link('in-ready','b1');link('in-pack','b1',1);link('b1','out-enable')}if(id==='request'){link('in-pedal','b1');link('b1','b2');link('b2','b3');link('in-cap','b3',1);link('b3','out-request')}if(id==='drive'){link('in-gear','b1');link('in-brake','b2');link('in-enable','b3');link('b1','b3',1);link('b2','b3',2);link('b3','out-allow')}if(id==='brake'||id==='steer'){link('in-'+(id==='brake'?'brake':'steer'),'b1');link('b1','b2');link('b2','out-'+(id==='brake'?'force':'angle'))}if(id==='integration'){link('in-request','b1');link('in-allow','b1',1);link('b1','out-torque');link('in-force','out-brakeForce');link('in-angle','out-wheelAngle')}return g}
export const newDesigns=():Designs=>Object.fromEntries((Object.keys(MODEL_SPECS) as LogicId[]).map(id=>[id,emptyModel(id)])) as Designs
export const providedDesigns=():Designs=>Object.fromEntries((Object.keys(MODEL_SPECS) as LogicId[]).map(id=>[id,referenceModel(id)])) as Designs
export type VehicleModelInput={ready:boolean;pack:boolean;pedal:number;brake:number;gear:string;steer:number;cap:number;soc?:number;packTempC?:number;isolationOk?:boolean;startEdge?:boolean;plugged?:boolean}
export function executeVehicle(designs:Designs,i:VehicleModelInput){const bms=evaluateModel(designs.bms,{soc:i.soc??65,temp:i.packTempC??25,isolation:i.isolationOk??true}),start=evaluateModel(designs.start,{edge:i.startEdge??false,gear:i.gear,brake:i.brake,plugged:i.plugged??false,packSafe:bms.output.safe===true}),power=evaluateModel(designs.power,{ready:i.ready,pack:i.pack&&bms.output.safe===true}),request=evaluateModel(designs.request,{pedal:i.pedal,cap:i.cap}),drive=evaluateModel(designs.drive,{enable:power.output.enable,gear:i.gear,brake:i.brake}),brake=evaluateModel(designs.brake,{brake:i.brake}),steer=evaluateModel(designs.steer,{steer:i.steer});const integrated=evaluateModel(designs.integration,{request:request.output.request,allow:drive.output.allow,force:brake.output.force,angle:steer.output.angle});return{bms,start,power,request,drive,brake,steer,integrated}}
