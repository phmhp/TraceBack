// Adapted from teammate TraceBack-develop buildGarage/assemblyModel.ts. Original preserved.
export type Vec3 = [number, number, number]
export type AssemblyPartId = 'motor' | 'gearbox' | 'axle' | 'rearLeft' | 'rearRight' | 'frontLeft' | 'frontRight' | 'battery' | 'inverter' | 'pedal' | 'vcu' | 'brakes' | 'brakePedal' | 'steeringRack' | 'steeringWheel'
export type AssemblyStage = 0 | 1 | 2 | 3 | 4
export type PartStatus = 'TRAY' | 'SEATED' | 'FIXED'
export type Assembly = Record<AssemblyPartId, PartStatus>
export interface AssemblyPart {
  id: AssemblyPartId
  name: string
  english: string
  stage: AssemblyStage
  position: Vec3
  tray: Vec3
  angle: number
  description: string
  discovery: string
  color: string
}

export const assemblyParts: readonly AssemblyPart[] = [
  { id: 'motor', name: '전기 모터(Electric Motor)', english: 'ELECTRIC MOTOR', stage: 0, position: [0, .85, -.15], tray: [-3.25, .95, -1.3], angle: 0, description: '전기를 회전하는 힘으로 바꿔요. 축이 감속기를 향하도록 놓아 주세요.', discovery: '모터는 회전하는 힘을 만드는 출발점이에요.', color: '#cc8b4b' },
  { id: 'gearbox', name: '감속·차동기어(Reduction & Differential)', english: 'REDUCTION & DIFFERENTIAL', stage: 0, position: [0, .75, .95], tray: [-3.25, .95, 0], angle: 0, description: '빠른 모터 회전을 줄여 바퀴에 더 큰 힘을 전달해요. 좌우 바퀴로 나누는 차동기어도 들어 있어요.', discovery: '모터의 기어비가 바퀴의 속도와 힘을 바꿔요.', color: '#719b99' },
  { id: 'axle', name: '좌우 구동축(Drive Shafts)', english: 'DRIVE SHAFTS', stage: 0, position: [0, .75, .95], tray: [-3.25, .95, 1.3], angle: 0, description: '차동기어에서 양쪽 바퀴까지 회전하는 힘을 이어 줘요.', discovery: '기어에서 나온 힘이 구동축을 따라 좌우 바퀴까지 이어져요.', color: '#a8b3b3' },
  { id: 'rearLeft', name: '뒷 바퀴(Rear Wheel)', english: 'REAR WHEEL · L', stage: 1, position: [-1.22, .68, .95], tray: [-3.35, .95, -1.5], angle: 0, description: '구동축 끝에 허브를 맞춰요. 브레이크는 나중에 따로 조립해요.', discovery: '구동축과 바퀴가 연결되면 회전하는 힘이 도로를 미는 힘이 돼요.', color: '#535c56' },
  { id: 'rearRight', name: '뒷 바퀴(Rear Wheel)', english: 'REAR WHEEL · R', stage: 1, position: [1.22, .68, .95], tray: [-3.35, .95, -.4], angle: 0, description: '반대편 구동축에도 바퀴를 끼워요. 바깥쪽 휠 면이 차 밖을 향해요.', discovery: '한 구동계가 좌우 바퀴를 함께 움직이게 되었어요.', color: '#535c56' },
  { id: 'frontLeft', name: '앞 바퀴(Front Wheel)', english: 'FRONT WHEEL · L', stage: 1, position: [-1.22, .68, -1.3], tray: [-3.35, .95, .7], angle: 0, description: '프레임 앞쪽 허브에 끼워요. 조향은 지금 제공된 시험 장치를 쓰고, 다음 제작에서 랙과 핸들을 직접 더해요.', discovery: '이번 제작 대상은 전진 구동계예요. 조향 시험 장치의 동작을 직접 제작 완료로 세지 않아요.', color: '#535c56' },
  { id: 'frontRight', name: '앞 바퀴(Front Wheel)', english: 'FRONT WHEEL · R', stage: 1, position: [1.22, .68, -1.3], tray: [-3.35, .95, 1.8], angle: 0, description: '마지막 바퀴를 끼우면 굴러갈 준비가 돼요.', discovery: '바퀴를 다 달았어도 모터에 전원과 운전 요청이 전달되어야 스스로 달릴 수 있어요.', color: '#535c56' },
  { id: 'battery', name: '배터리 팩(Battery Pack)', english: 'BATTERY PACK', stage: 2, position: [0, .64, -1.35], tray: [-3.25, .95, -1.3], angle: 0, description: '차를 움직일 에너지를 저장해요. 주황색 단자는 인버터 전원과 연결해요.', discovery: '배터리는 에너지를 공급해요. 모터의 출력을 조절하는 일은 다른 장치가 맡아요.', color: '#8c9b6b' },
  { id: 'inverter', name: '인버터(Inverter)', english: 'INVERTER', stage: 2, position: [.67, 1.02, -.35], tray: [-3.25, .95, .1], angle: 0, description: '배터리 전원을 모터에 필요한 전력으로 바꾸고, 제어 요청에 따라 공급해요.', discovery: '전력이 흐르는 연결과 운전자의 요청이 흐르는 연결은 역할이 달라요.', color: '#8da7b2' },
  { id: 'pedal', name: '페달·제어기(Pedal & Controller)', english: 'PEDAL & CONTROLLER', stage: 2, position: [-.59, 1.02, -1.02], tray: [-3.25, .95, 1.5], angle: 0, description: '페달 입력을 읽어 얼마나 구동할지 요청해요. 이 예시에서는 페달과 제어기를 한 모듈로 묶었어요.', discovery: '운전자의 요청 → 제어기 → 인버터 → 모터. 장치마다 하는 일이 나뉘어 있어요.', color: '#bd957a' },
]

export const chassisParts: readonly AssemblyPart[] = [
  { id: 'brakes', name: '디스크·캘리퍼 세트', english: 'BRAKE HARDWARE', stage: 3, position: [0, .68, .95], tray: [-3.25, .95, -.8], angle: 0, description: '좌우 뒷바퀴 안쪽에 디스크와 캘리퍼를 장착해요. 제동 제어기의 요청을 마찰력으로 바꿔 바퀴를 감속합니다.', discovery: '브레이크는 구동 요청 0과 달라요. 회전하는 바퀴에 멈추는 힘을 가해요.', color: '#bc8069' },
  { id: 'brakePedal', name: '브레이크 페달·제어기', english: 'BRAKE PEDAL & CONTROL', stage: 3, position: [-.18, 1.02, -1.02], tray: [-3.25, .95, 1], angle: 0, description: '페달·제어기를 고정하고 청록 단자를 제동 장치에 연결해요.', discovery: '제동 페달 입력 → 제동 요청 → 브레이크. 전진 기능과 다른 흐름이 자라요.', color: '#739db0' },
  { id: 'steeringRack', name: '조향 랙·보조장치', english: 'STEERING RACK', stage: 4, position: [0, .75, -1.3], tray: [-3.25, .95, -.8], angle: 0, description: '앞바퀴 사이에 랙과 타이로드를 끼워요. 이제 앞바퀴 방향을 바꿀 수 있어요.', discovery: '조향은 앞바퀴 방향을 바꿔요. 차체만 옆으로 움직이는 것과 달라요.', color: '#8caaa0' },
  { id: 'steeringWheel', name: '핸들·조향 제어기', english: 'STEERING INPUT & CONTROL', stage: 4, position: [-.35, 1.4, -.5], tray: [-3.25, .95, 1], angle: 0, description: '운전석에 핸들을 고정하고 조향 요청 케이블을 연결해요.', discovery: '핸들 입력 → 조향 요청 → 조향 장치 → 앞바퀴. 갈 수 있는 길이 늘었어요.', color: '#6b9988' },
]
export const campaignParts:readonly AssemblyPart[]=[{id:'vcu',name:'VCU · 차량 제어 ECU',english:'VEHICLE CONTROL UNIT',stage:2,position:[-.6,1.04,.08],tray:[-3.25,.95,.4],angle:0,color:'#8c82cd',description:'페달 센서의 값을 받아 구동 허용과 목표 토크를 계산해 인버터에 명령해요.',discovery:''}]
export const allAssemblyParts = [...assemblyParts, ...chassisParts,...campaignParts]
export const partById = (id: AssemblyPartId) => allAssemblyParts.find(part => part.id === id)!
export const createAssembly = (): Assembly => Object.fromEntries(allAssemblyParts.map(part => [part.id, 'TRAY'])) as Assembly
export function assemblyStage(assembly: Assembly, maxStage: AssemblyStage = 2): AssemblyStage {
  if (assemblyParts.some(part => part.stage === 0 && assembly[part.id] !== 'FIXED')) return 0
  if (assemblyParts.some(part => part.stage === 1 && assembly[part.id] !== 'FIXED')) return 1
  if (assemblyParts.some(part => part.stage === 2 && assembly[part.id] !== 'FIXED') || maxStage === 2) return 2
  if (maxStage === 3 || chassisParts.some(part => part.stage === 3 && assembly[part.id] !== 'FIXED')) return 3
  return 4
}
export function placement(assembly: Assembly, id: AssemblyPartId, position: Vec3, angle: number, maxStage: AssemblyStage = 2): 'READY' | 'FAR' | 'ROTATE' | 'LOCKED' {
  const part = partById(id)
  if (part.stage > assemblyStage(assembly, maxStage) || assembly[id] !== 'TRAY' || allAssemblyParts.some(candidate => assembly[candidate.id] === 'SEATED')) return 'LOCKED'
  if (!position.every(Number.isFinite) || !Number.isFinite(angle)) return 'FAR'
  const distance = Math.hypot(position[0] - part.position[0], position[2] - part.position[2])
  if (distance > .48 || Math.abs(position[1] - part.position[1]) > .8) return 'FAR'
  const turn = ((angle - part.angle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)
  return Math.min(turn, Math.PI * 2 - turn) <= .18 ? 'READY' : 'ROTATE'
}
export function seatPart(assembly: Assembly, id: AssemblyPartId, position: Vec3, angle: number, maxStage: AssemblyStage = 2): Assembly {
  return placement(assembly, id, position, angle, maxStage) === 'READY' ? { ...assembly, [id]: 'SEATED' } : assembly
}
export function fastenPart(assembly: Assembly, id: AssemblyPartId): Assembly {
  return assembly[id] === 'SEATED' ? { ...assembly, [id]: 'FIXED' } : assembly
}

export type PortId = 'batteryOut' | 'inverterIn' | 'inverterOut' | 'motorIn' | 'pedalOut' | 'controllerIn' | 'vcuIn' | 'vcuOut' | 'brakeOut' | 'brakeIn' | 'steeringOut' | 'steeringIn'
export type CableId = 'power' | 'motorPower' | 'control' | 'sensorLink' | 'brakeControl' | 'steeringControl'
export interface Port { id: PortId; part: AssemblyPartId; label: string; position: Vec3; color: string }
export const ports: readonly Port[] = [
  { id: 'batteryOut', part: 'battery', label: '배터리 · 전원', position: [.4, .88, -1.05], color: '#e49a50' },
  { id: 'inverterIn', part: 'inverter', label: '인버터 · 전원 입력', position: [1.02, 1.08, -.58], color: '#e49a50' },
  { id: 'inverterOut', part: 'inverter', label: '인버터 · 모터 출력', position: [.66, 1.13, .02], color: '#debb63' },
  { id: 'motorIn', part: 'motor', label: '모터 · 전력 입력', position: [.24, 1.11, .03], color: '#debb63' },
  { id: 'pedalOut', part: 'pedal', label: '제어기 · 구동 요청', position: [-.59, 1.16, -.79], color: '#86b9c0' },
  { id: 'controllerIn', part: 'inverter', label: '인버터 · 요청 입력', position: [.43, 1.18, -.55], color: '#86b9c0' },
  { id: 'vcuIn', part:'vcu',label:'VCU · 센서 입력',position:[-.85,1.16,.02],color:'#86b9c0'},
  { id: 'vcuOut', part:'vcu',label:'VCU · 토크 명령',position:[-.35,1.16,.02],color:'#86b9c0'},
  { id: 'brakeOut', part: 'brakePedal', label: '제동 제어기 · 요청 출력', position: [-.18, 1.2, -.9], color: '#c18b92' },
  { id: 'brakeIn', part: 'brakes', label: '브레이크 · 요청 입력', position: [-.8, .93, .95], color: '#c18b92' },
  { id: 'steeringOut', part: 'steeringWheel', label: '조향 제어기 · 요청 출력', position: [-.16, 1.42, -.46], color: '#89b9c0' },
  { id: 'steeringIn', part: 'steeringRack', label: '조향 장치 · 요청 입력', position: [.4, .95, -1.3], color: '#89b9c0' },
]
export const chassisCables: typeof cables = [
  { id: 'brakeControl', from: 'brakeOut', to: 'brakeIn', name: '제동 요청을 연결해요', description: '브레이크 페달·제어기 → 디스크·캘리퍼' },
  { id: 'steeringControl', from: 'steeringOut', to: 'steeringIn', name: '조향 요청을 연결해요', description: '핸들·조향 제어기 → 조향 랙' },
]
export const cables: readonly { id: CableId; from: PortId; to: PortId; name: string; description: string }[] = [
  { id: 'power', from: 'batteryOut', to: 'inverterIn', name: '전원을 공급해요', description: '배터리 → 인버터' },
  { id: 'motorPower', from: 'inverterOut', to: 'motorIn', name: '모터에 전력을 보내요', description: '인버터 → 모터' },
  { id: 'control', from: 'pedalOut', to: 'controllerIn', name: '얼마나 움직일지 요청해요', description: '페달·제어기 → 인버터' },
]
export const sensorCable={id:'sensorLink' as const,from:'pedalOut' as const,to:'vcuIn' as const,name:'센서 값을 ECU로',description:'페달 센서 → VCU'}
export const allCables = [...cables, ...chassisCables,sensorCable]
export const portById = (id: PortId) => ports.find(port => port.id === id)!
export function cableFor(a: PortId, b: PortId) { if((a==='vcuOut'&&b==='controllerIn')||(b==='vcuOut'&&a==='controllerIn'))return{...cables[2],from:'vcuOut' as const};return allCables.find(cable => (cable.from === a && cable.to === b) || (cable.from === b && cable.to === a)) }
export function connectCable(assembly: Assembly, connected: readonly CableId[], a: PortId, b: PortId): CableId[] | null {
  const cable = cableFor(a, b)
  if (!cable || connected.includes(cable.id) || assembly[portById(a).part] !== 'FIXED' || assembly[portById(b).part] !== 'FIXED') return null
  return [...connected, cable.id]
}
export const canDrive = (assembly: Assembly, connected: readonly CableId[]) => assemblyParts.every(part => assembly[part.id] === 'FIXED') && cables.every(cable => connected.includes(cable.id))
export const ecuReady=(assembly:Assembly,connected:readonly CableId[])=>assembly.vcu==='FIXED'&&connected.includes('sensorLink')

export interface WorkshopDrive { distance: number; x: number; speed: number; heading: number; motorRpm: number; wheelAngle: number; pedal: number; brake: number; brakeCommand?:number; steering: number; corridorViolation?: boolean; cushion?: 'bakery' | 'home'; brakeUsed?: boolean; steeringUsed?: boolean }
