import type { Block, Graph, Mission, Scenario, Sample, Wire } from '../engine/types.ts'
export const STATES = { OFF: '전원 꺼짐', STANDBY: '시동 대기', READY: '주행 준비 완료' }
export const INPUTS = { power: '전원 버튼', brake: '브레이크 페달', system: '시스템 준비', stopped: '차량 정지' }
export const OUTPUTS = { request: 'READY 진입 요청', ready: 'READY 표시', drive: '구동 허용' }
export const DEFAULT_INPUTS = { power: false, brake: true, system: true, stopped: true }
const node = (id: string, kind: Block['kind'], label: string, x: number, y: number, key?: string): Block => ({ id, kind, label, x, y, key })
export const wire = (from: string, to: string, input = 'value', out = 'value'): Wire => ({ id: `${from}.${out}-${to}.${input}`, from, to, in: input, out })
export function starter(): Graph {
  return { nodes: [node('power', 'input', INPUTS.power, 50, 80, 'power'), node('brake', 'input', INPUTS.brake, 50, 250, 'brake'), node('system', 'input', INPUTS.system, 50, 420, 'system'),
    node('both', 'and', '두 조건 모두', 350, 130), node('allow', 'and', '시동 조건 완성', 650, 280), node('request', 'output', OUTPUTS.request, 950, 280, 'request')], edges: [] }
}
export function withStates(base: Graph): Graph {
  return { nodes: [...structuredClone(base.nodes), node('stopped', 'input', INPUTS.stopped, 50, 600, 'stopped'),
    node('shutdown', 'and', '정차 후 종료', 350, 550),
    node('off', 'state', STATES.OFF, 50, 810, 'OFF'), node('standby', 'state', STATES.STANDBY, 350, 810, 'STANDBY'), node('ready', 'state', STATES.READY, 650, 810, 'READY'),
    node('wake', 'transition', '전원 깨우기', 950, 70), node('start', 'transition', '주행 준비하기', 950, 500), node('stop', 'transition', '안전하게 종료', 950, 820),
    node('lamp', 'output', OUTPUTS.ready, 1250, 450, 'ready'), node('drive', 'output', OUTPUTS.drive, 1250, 650, 'drive')],
    edges: [...structuredClone(base.edges), wire('off', 'wake', 'from'), wire('standby', 'wake', 'to'), wire('standby', 'start', 'from'), wire('ready', 'start', 'to'), wire('ready', 'stop', 'from'), wire('off', 'stop', 'to')] }
}
/** Only used by the read-only normal-behavior observation and engine regression tests. */
export function referenceGraph(machine = false): Graph {
  const graph = starter()
  graph.edges = [wire('power', 'both', 'a'), wire('brake', 'both', 'b'), wire('both', 'allow', 'a'), wire('system', 'allow', 'b'), wire('allow', 'request')]
  if (!machine) return graph
  const machineGraph = withStates(graph)
  machineGraph.edges.push(wire('power', 'wake', 'when'), wire('allow', 'start', 'when'), wire('power', 'shutdown', 'a'), wire('stopped', 'shutdown', 'b'), wire('shutdown', 'stop', 'when'), wire('ready', 'lamp', 'value', 'active'), wire('ready', 'drive', 'value', 'active'))
  return machineGraph
}
const sample = (inputs: Partial<typeof DEFAULT_INPUTS>, state: string, outputs: Record<string, boolean>): Sample => ({ inputs: { ...DEFAULT_INPUTS, ...inputs }, state, outputs })
const machineSample = (inputs: Partial<typeof DEFAULT_INPUTS>, state: string) => sample(inputs, state, { ready: state === 'READY', drive: state === 'READY' })
const normal: Scenario[] = [
  { id: 'boot', name: '전원을 켜고 정상적으로 시동 걸기', initial: 'OFF', steps: [machineSample({ power: true }, 'STANDBY'), machineSample({ power: false }, 'STANDBY'), machineSample({ power: true }, 'READY')], advice: '한 번 눌러 시동 대기, 뗐다 다시 눌러 주행 준비가 되어야 합니다.' },
  { id: 'no-brake', name: '브레이크 없이 시동 걸기', initial: 'STANDBY', steps: [machineSample({ power: true, brake: false }, 'STANDBY')], advice: '브레이크를 밟지 않았는데 시동이 허용됐습니다. 브레이크 조건을 확인하세요.' },
  { id: 'not-ready', name: '시스템이 준비되지 않았을 때 시동 걸기', initial: 'STANDBY', steps: [machineSample({ power: true, system: false }, 'STANDBY')], advice: '시스템 준비가 끝나지 않으면 시동 대기 상태를 유지해야 합니다.' },
  { id: 'off', name: '정차 후 전원 끄기', initial: 'READY', steps: [machineSample({ power: true }, 'OFF')], advice: '정차 중 전원 버튼을 누르면 전원 꺼짐으로 전이하도록 연결하세요.' },
  { id: 'moving', name: '정지 조건 없이 전원 끄기 요청', initial: 'READY', steps: [machineSample({ power: true, stopped: false }, 'READY')], advice: '차량 정지 조건이 없으면 주행 준비 상태를 유지해야 합니다.' },
  ...Object.keys(STATES).map(state => ({ id: `idle-${state}`, name: `${STATES[state as keyof typeof STATES]}에서 입력 없이 유지`, initial: state, steps: [machineSample({ power: false }, state)], advice: '전원 버튼 이벤트가 없으면 현재 상태를 유지해야 합니다.' })),
  { id: 'held', name: '전원 버튼을 계속 누르고 있기', initial: 'OFF', steps: [machineSample({ power: true }, 'STANDBY'), machineSample({ power: true }, 'STANDBY'), machineSample({ power: true }, 'STANDBY')], advice: '버튼을 계속 눌러도 새로운 이벤트가 아닙니다. 한 번의 입력에서 상태를 연속으로 바꾸지 마세요.', challenge: true },
]
const truthTable: Scenario[] = Array.from({ length: 8 }, (_, i) => {
  const power = !!(i & 4), brake = !!(i & 2), system = !!(i & 1)
  return { id: `logic-${i}`, name: `${power ? '버튼 누름' : '버튼 없음'} · ${brake ? '브레이크 밟음' : '브레이크 안 밟음'} · ${system ? '준비 완료' : '준비 미완료'}`,
    initial: 'STANDBY', steps: [sample({ power, brake, system }, 'STANDBY', { request: power && brake && system })],
    advice: '전원 버튼 · 브레이크 · 시스템 준비, 세 조건을 모두 만족할 때만 진입 요청이 참이어야 합니다.', challenge: i === 0 }
})
const exhaustive: Scenario[] = Object.keys(STATES).flatMap(initial => Array.from({ length: 16 }, (_, i) => {
  const power = !!(i & 8), brake = !!(i & 4), system = !!(i & 2), stopped = !!(i & 1)
  // Independent fictional requirement oracle; never invoke the learner graph to compute expectations.
  const state = !power ? initial : initial === 'OFF' ? 'STANDBY' : initial === 'STANDBY' && brake && system ? 'READY' : initial === 'READY' && stopped ? 'OFF' : initial
  return { id: `boundary-${initial}-${i}`, name: `${STATES[initial as keyof typeof STATES]} · 조건 조합 ${i + 1}`, initial, steps: [machineSample({ power, brake, system, stopped }, state), machineSample({ power, brake, system, stopped }, state)], advice: '버튼 이벤트와 현재 상태별 조건을 확인하세요. 버튼을 누른 채 유지할 때는 상태가 다시 바뀌면 안 됩니다.', challenge: true }
}))
export const MISSIONS: Mission[] = [
  { id: 'conditions', title: '시동 조건 만들기', subtitle: '조건을 조립하다', goal: '전원 버튼, 브레이크, 시스템 준비가 모두 참일 때 READY 진입 요청을 만드세요.', initial: 'STANDBY', mode: 'logic', scenarios: truthTable, requiredOutputs: ['request'], allowedBlocks: ['input', 'and', 'or', 'not', 'output'],
    hints: ['조건 하나만 빠져도 시동을 허용하지 않아야 해요.', '전원 버튼 · 브레이크 · 시스템 준비, 세 입력이 모두 필요해요.', 'AND 두 개로 세 조건을 하나의 결과로 묶을 수 있어요.', '전원 버튼 + 브레이크 → AND → 시스템 준비와 다시 AND → READY 진입 요청. 출력 포트를 먼저 선택하고 입력 포트를 누르세요.'], concept: 'AND는 모든 조건이 참일 때만 참입니다. 진입 요청과 실제 차량 상태는 서로 달라요.' },
  { id: 'states', title: '차량 상태 연결하기', subtitle: '차량에 기억을 더하다', goal: '전원 깨우기 → 주행 준비 → 정차 후 종료. 각 전이의 조건과 READY 출력을 연결하세요.', initial: 'OFF', mode: 'machine', scenarios: normal, requiredOutputs: ['request', 'ready', 'drive'], allowedBlocks: ['input', 'and', 'or', 'not', 'state', 'transition', 'output'],
    hints: ['상태 전이는 현재 상태와 조건을 함께 판단해요.', '전원 깨우기는 버튼, 주행 준비는 앞에서 만든 시동 조건, 종료는 버튼과 정지 조건이 필요해요.', '정차 후 종료용 AND를 연결하고 주행 준비 상태의 현재 활성 출력을 사용하세요.', '버튼 → 전원 깨우기 조건. 시동 조건 완성 → 주행 준비 조건. 버튼 AND 정지 → 종료 조건. 주행 준비 현재 활성 → READY 표시와 구동 허용.'], concept: '상태는 입력이 사라져도 유지됩니다. 전원 버튼은 새로 누르는 순간에 한 번만 처리해요.' },
  { id: 'validation', title: '다양한 시동 조건 시험하기', subtitle: '좋은 설계는 시험으로', goal: '내 로직을 정상·비정상·버튼 유지 조건으로 검증하고 READY 기능을 차량에 적용하세요.', initial: 'OFF', mode: 'machine', scenarios: [...normal, ...exhaustive], requiredOutputs: ['request', 'ready', 'drive'], allowedBlocks: ['input', 'and', 'or', 'not', 'state', 'transition', 'output'],
    hints: ['성공하는 상황만으로는 충분하지 않아요. 허용되면 안 되는 상황도 확인하세요.', '브레이크 없음, 준비 미완료, 이동 중 종료, 버튼 유지가 중요해요.', '실패한 시험을 선택하면 당시 입력과 기대·실제 상태를 비교할 수 있어요.', '연결을 수정한 후 다시 전체 시험을 실행하세요. 48개 조건 조합과 버튼 유지도 같은 엔진으로 실행합니다.'], concept: '정상 시동뿐 아니라 잘못된 요청을 거부하는지도 검증해야 합니다. READY는 주행 가능 상태이며 실제 이동을 뜻하지 않아요.' },
]
