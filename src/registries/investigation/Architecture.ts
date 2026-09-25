import type { IncidentFrame } from '../../runtime/case/PropulsionCase.ts'
import { inspectBoundary } from '../../runtime/investigation/Boundary.ts'

export type RuntimeComponent = 'DriverInput' | 'GearLogic' | 'PropulsionFunction' | 'VMC' | 'eDrive' | 'VehiclePhysics'
export interface ArchitectureNode {
  id: string; label: string; area: string; kind: 'DRIVER' | 'SW' | 'PLANT' | 'REFERENCE' | 'ADAPTER'
  implementation: 'IMPLEMENTED' | 'REFERENCE_ONLY'; role: string; inputs: string[]; outputs: string[]
}
export type SignalValue = number | string | boolean | Record<string, unknown> | null
export interface SignalDefinition {
  id: string
  label: string
  producerIds: string[]
  consumerIds: string[]
  interfaceIds: string[]
  unit?: string
  readIncidentActual?: (frame: IncidentFrame) => SignalValue
  readOracleExpected?: (frame: IncidentFrame, previous?: IncidentFrame) => SignalValue
}
export interface InterfaceEdge {
  id: string
  sourceId: string
  targetId: string
  signalIds: string[]
}
export type SignalObservation = {
  actual: { semantics: 'INCIDENT_ACTUAL'; value: SignalValue }
  expected?: { semantics: 'ORACLE_EXPECTED'; value: SignalValue }
  recordedReference?: { semantics: 'RECORDED_REFERENCE'; value: SignalValue }
}
export const architectureNodes: ArchitectureNode[] = [
  { id:'DriverInput',label:'Driver Demand',area:'Driver Boundary',kind:'DRIVER',implementation:'IMPLEMENTED',role:'페달·조향·기어 조작을 입력으로 전달합니다.',inputs:['Keyboard'],outputs:['AcceleratorPedalPosition','GearRequest','Brake','Steering'] },
  { id:'VehicleState',label:'Vehicle State / Mode',area:'Vehicle State / Mode',kind:'REFERENCE',implementation:'REFERENCE_ONLY',role:'차량 상태·운전 모드·기능 허용을 관리하는 참조 영역입니다. 현재 Ready/Enable은 host에서 제공하며 독립 State SW는 없습니다.',inputs:['Vehicle feedback'],outputs:['VehicleReady / Enable / Mode (reference)'] },
  { id:'GearLogic',label:'GearLogic',area:'Gear',kind:'SW',implementation:'IMPLEMENTED',role:'기어 요청과 종방향 속도를 확인하여 실제 기어를 결정합니다. 추진 허용과 방향에 영향을 주는 논리 기능입니다.',inputs:['GearRequest','GearRequestValidity','LongitudinalVelocity','Previous GearState'],outputs:['GearState','GearStateValidity','TransitionAccepted'] },
  { id:'PropulsionFunction',label:'PropulsionFunction',area:'Propulsion',kind:'SW',implementation:'IMPLEMENTED',role:'유효성·추진 허용·실제 기어를 확인하여 정규화 추진 요청을 만듭니다.',inputs:['AcceleratorPedalPosition','AcceleratorPedalValidity','GearState','GearStateValidity','VehicleReady','PropulsionEnable'],outputs:['PropulsionRequest','PropulsionState'] },
  { id:'VMC',label:'VMC',area:'Propulsion',kind:'SW',implementation:'IMPLEMENTED',role:'현재 C 함수는 추진 요청과 속력으로 토크를 계산합니다. 전체 Vehicle Motion coordination/arbitration 구현은 아닙니다.',inputs:['PropulsionRequest','VehicleSpeed'],outputs:['DriveTorqueRequest'] },
  { id:'eDrive',label:'eDrive',area:'Propulsion',kind:'SW',implementation:'IMPLEMENTED',role:'요청 토크를 전진·후진 한계로 제한합니다. 모터·인버터의 전기 모델은 포함하지 않습니다.',inputs:['DriveTorqueRequest'],outputs:['EDriveCommand'] },
  { id:'Brake',label:'Brake',area:'Brake',kind:'REFERENCE',implementation:'REFERENCE_ONLY',role:'제동 제어 SW의 참조 영역입니다. 현재 주행 제동은 임시 TS adapter로 처리됩니다.',inputs:['Brake demand'],outputs:['Brake command (reference)'] },
  { id:'Steering',label:'Steering',area:'Steering',kind:'REFERENCE',implementation:'REFERENCE_ONLY',role:'조향 제어 SW의 참조 영역입니다. 현재 조향은 임시 TS adapter로 처리됩니다.',inputs:['Steering demand'],outputs:['Steering command (reference)'] },
  { id:'VehicleMotion',label:'Vehicle Motion Control',area:'Vehicle Motion',kind:'REFERENCE',implementation:'REFERENCE_ONLY',role:'종·횡방향 요청 coordination/arbitration의 참조 영역입니다. 현재 실행 함수 VMC보다 넓은 개념입니다.',inputs:['Motion requests','Vehicle feedback'],outputs:['Coordinated actuation (reference)'] },
  { id:'DriveAdapter',label:'Drive Force Adapter',area:'Host / Plant boundary',kind:'ADAPTER',implementation:'IMPLEMENTED',role:'최종 토크와 논리 방향을 signed force로 변환합니다. 제동 입력이 있으면 추진력을 차단합니다.',inputs:['EDriveCommand','Brake'],outputs:['driveForce'] },
  { id:'BrakeAdapter',label:'Temporary Brake Adapter',area:'Host / Plant boundary',kind:'ADAPTER',implementation:'IMPLEMENTED',role:'TS에서 brake ratio를 제동력으로 변환합니다.',inputs:['Brake'],outputs:['brakeForce'] },
  { id:'SteeringAdapter',label:'Temporary Steering Adapter',area:'Host / Plant boundary',kind:'ADAPTER',implementation:'IMPLEMENTED',role:'TS에서 조향 입력과 속력으로 바퀴 조향각을 계산합니다.',inputs:['Steering','VehicleSpeed'],outputs:['steering radians'] },
  { id:'VehiclePhysics',label:'Vehicle Dynamics',area:'Vehicle Dynamics',kind:'PLANT',implementation:'IMPLEMENTED',role:'Rapier가 힘·노면·충돌에 따른 차량 운동과 피드백을 계산합니다.',inputs:['driveForce','brakeForce','steering'],outputs:['VehicleSpeed','LongitudinalVelocity','LongitudinalAcceleration','Position'] },
]
export const componentIds: RuntimeComponent[] = ['DriverInput','GearLogic','PropulsionFunction','VMC','eDrive','VehiclePhysics']
export const architectureNode = (id:string) => architectureNodes.find(n=>n.id===id)!

/** One authoritative source for currently supported runtime/reference interfaces. */
export const interfaceEdges: InterfaceEdge[] = [
  {id:'DriverInput->GearLogic',sourceId:'DriverInput',targetId:'GearLogic',signalIds:['GearRequest','GearRequestValidity']},
  {id:'DriverInput->PropulsionFunction',sourceId:'DriverInput',targetId:'PropulsionFunction',signalIds:['AcceleratorPedalPosition','AcceleratorPedalValidity']},
  {id:'GearLogic->PropulsionFunction',sourceId:'GearLogic',targetId:'PropulsionFunction',signalIds:['GearState','GearStateValidity','TransitionAccepted']},
  {id:'PropulsionFunction->VMC',sourceId:'PropulsionFunction',targetId:'VMC',signalIds:['PropulsionRequest','PropulsionState']},
  {id:'VMC->eDrive',sourceId:'VMC',targetId:'eDrive',signalIds:['DriveTorqueRequest']},
  {id:'eDrive->DriveAdapter',sourceId:'eDrive',targetId:'DriveAdapter',signalIds:['EDriveCommand']},
  {id:'DriveAdapter->VehiclePhysics',sourceId:'DriveAdapter',targetId:'VehiclePhysics',signalIds:['driveForce']},
  {id:'DriverInput->BrakeAdapter',sourceId:'DriverInput',targetId:'BrakeAdapter',signalIds:['Brake']},
  {id:'DriverInput->SteeringAdapter',sourceId:'DriverInput',targetId:'SteeringAdapter',signalIds:['Steering']},
  {id:'BrakeAdapter->VehiclePhysics',sourceId:'BrakeAdapter',targetId:'VehiclePhysics',signalIds:['brakeForce']},
  {id:'SteeringAdapter->VehiclePhysics',sourceId:'SteeringAdapter',targetId:'VehiclePhysics',signalIds:['steering']},
  {id:'VehiclePhysics->GearLogic',sourceId:'VehiclePhysics',targetId:'GearLogic',signalIds:['LongitudinalVelocity']},
  {id:'VehiclePhysics->VMC',sourceId:'VehiclePhysics',targetId:'VMC',signalIds:['VehicleSpeed']},
  {id:'VehiclePhysics->SteeringAdapter',sourceId:'VehiclePhysics',targetId:'SteeringAdapter',signalIds:['VehicleSpeed']},
]

const actualReaders: Record<string, (frame: IncidentFrame) => SignalValue> = {
  AcceleratorPedalPosition: frame => frame.sw.input.acceleratorPedalPosition,
  AcceleratorPedalValidity: frame => frame.sw.input.acceleratorPedalValidity,
  GearRequest: frame => frame.sw.input.gearRequest,
  GearRequestValidity: frame => frame.sw.input.gearRequestValidity,
  VehicleReady: frame => frame.sw.input.vehicleReady,
  PropulsionEnable: frame => frame.sw.input.propulsionEnable,
  Brake: frame => frame.brake,
  Steering: frame => frame.steering,
  GearState: frame => frame.sw.output.gearState,
  GearStateValidity: frame => frame.sw.output.gearStateValidity,
  TransitionAccepted: frame => frame.sw.output.transitionAccepted,
  PropulsionRequest: frame => frame.sw.output.propulsionRequest.magnitude,
  PropulsionState: frame => frame.sw.output.propulsionState,
  DriveTorqueRequest: frame => frame.sw.output.driveTorqueRequest.magnitudeNm,
  EDriveCommand: frame => frame.sw.output.eDriveCommand.magnitudeNm,
  VehicleSpeed: frame => frame.plant?.speed ?? frame.sw.input.vehicleSpeed,
  LongitudinalVelocity: frame => frame.plant?.longitudinalVelocity ?? frame.sw.input.longitudinalVelocity,
  LongitudinalAcceleration: frame => frame.plant?.longitudinalAcceleration ?? null,
  driveForce: frame => frame.command?.driveForce ?? null,
  brakeForce: frame => frame.command?.brakeForce ?? null,
  steering: frame => frame.command?.steering ?? null,
}

const oracleReaders: Partial<Record<string, (frame: IncidentFrame, previous?: IncidentFrame) => SignalValue>> = {
  GearState: (frame, previous) => (inspectBoundary(frame, 'GearLogic', previous).expected as {gearState?:string}|null)?.gearState ?? null,
  PropulsionRequest: frame => (inspectBoundary(frame, 'PropulsionFunction').expected as {magnitude?:number}|null)?.magnitude ?? null,
  DriveTorqueRequest: frame => inspectBoundary(frame, 'VMC').expected as SignalValue,
  EDriveCommand: frame => inspectBoundary(frame, 'eDrive').expected as SignalValue,
}

const units: Partial<Record<string,string>> = {
  AcceleratorPedalPosition:'ratio', Brake:'ratio', Steering:'ratio', PropulsionRequest:'ratio',
  DriveTorqueRequest:'Nm', EDriveCommand:'Nm', VehicleSpeed:'m/s', LongitudinalVelocity:'m/s',
  LongitudinalAcceleration:'m/s²', driveForce:'N', brakeForce:'N', steering:'rad',
}

const signalIds = [...new Set([
  ...architectureNodes.flatMap(node => [...node.inputs, ...node.outputs]),
  ...interfaceEdges.flatMap(edge => edge.signalIds),
  'AcceleratorPedalValidity','GearRequestValidity','VehicleReady','PropulsionEnable','LongitudinalAcceleration',
])].filter(id => id !== 'Keyboard' && !id.includes('reference') && !id.includes(' / ') && !id.includes(' feedback') && !id.includes(' requests') && !id.includes(' actuation') && id !== 'Previous GearState' && id !== 'Motion requests')

export const signalDefinitions: SignalDefinition[] = signalIds.map(id => {
  const carried = interfaceEdges.filter(edge => edge.signalIds.includes(id))
  const declaredProducers=architectureNodes.filter(node => node.outputs.includes(id)).map(node => node.id)
  const declaredConsumers=architectureNodes.filter(node => node.inputs.includes(id)).map(node => node.id)
  return {
    id, label:id,
    producerIds:[...new Set([...declaredProducers,...carried.map(edge => edge.sourceId)])],
    consumerIds:[...new Set([...declaredConsumers,...carried.map(edge => edge.targetId)])],
    interfaceIds:carried.map(edge => edge.id), unit:units[id],
    readIncidentActual:actualReaders[id], readOracleExpected:oracleReaders[id],
  }
})

export const getArchitectureNode = (id:string) => architectureNodes.find(node => node.id === id)
export const getSignalDefinition = (id:string) => signalDefinitions.find(signal => signal.id === id)
export const getInterface = (id:string) => interfaceEdges.find(edge => edge.id === id)
export const getInputSignals = (nodeId:string) => signalDefinitions.filter(signal => signal.consumerIds.includes(nodeId))
export const getOutputSignals = (nodeId:string) => signalDefinitions.filter(signal => signal.producerIds.includes(nodeId))
export const getIncomingInterfaces = (nodeId:string) => interfaceEdges.filter(edge => edge.targetId === nodeId)
export const getOutgoingInterfaces = (nodeId:string) => interfaceEdges.filter(edge => edge.sourceId === nodeId)
export const getSignalInterfaces = (signalId:string) => interfaceEdges.filter(edge => edge.signalIds.includes(signalId))
export const getSignalValue = (signalId:string, frame:IncidentFrame) => getSignalDefinition(signalId)?.readIncidentActual?.(frame) ?? null
export const getSignalObservation = (signalId:string, frame:IncidentFrame, previous?:IncidentFrame): SignalObservation => {
  const signal=getSignalDefinition(signalId)
  const observation:SignalObservation={actual:{semantics:'INCIDENT_ACTUAL',value:signal?.readIncidentActual?.(frame)??null}}
  if(signal?.readOracleExpected)observation.expected={semantics:'ORACLE_EXPECTED',value:signal.readOracleExpected(frame,previous)}
  // No recorded normal/reference run exists in the repository; do not synthesize one.
  return observation
}

/** Read-only compatibility projection for legacy consumers. */
export const runtimeConnections = interfaceEdges.flatMap(edge => edge.signalIds.map(signalId => [edge.sourceId,edge.targetId,signalId] as const))

/** Readable normal-function flow, separate from physical deployment or task scheduling. */
export const normalFunctionFlows: Record<string,string[]> = {
 GearLogic:['GearRequest 유효성 확인','D ↔ R 전환: |LongitudinalVelocity| ≤ 전환 한계?','허용: 요청 기어 적용 / 거부: 이전 기어 유지','GearState · GearStateValidity · TransitionAccepted'],
 PropulsionFunction:['페달 · GearState 유효성 확인','VehicleReady · PropulsionEnable 확인','P / N: 추진 억제 · D / R: 추진 방향 선택','페달 입력을 0~1 요청으로 제한','PropulsionRequest 출력'],
 VMC:['PropulsionRequest 유효성 · 방향 확인','방향별 토크 맵 선택','요청 크기 × 속력에 따른 토크 계산','DriveTorqueRequest 출력'],
 eDrive:['DriveTorqueRequest 유효성 · 방향 확인','방향별 토크 한계 선택','한계 이하: 유지 / 초과: 한계로 제한','EDriveCommand 출력'],
}
