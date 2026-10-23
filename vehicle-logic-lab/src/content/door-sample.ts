import type { Graph, Mission } from '../engine/types.ts'
/** Internal content-registration sample, deliberately not exposed as reviewed vehicle content. */
export const doorGraph: Graph = { nodes: [
  { id: 'closed', kind: 'input', key: 'closed', label: '문 닫힘', x: 0, y: 0 },
  { id: 'request', kind: 'input', key: 'lock', label: '잠금 요청', x: 0, y: 150 },
  { id: 'gate', kind: 'and', label: '모두 만족', x: 300, y: 0 },
  { id: 'locked', kind: 'output', key: 'locked', label: '잠금 허용', x: 600, y: 0 },
], edges: [
  { id: 'a', from: 'closed', out: 'value', to: 'gate', in: 'a' },
  { id: 'b', from: 'request', out: 'value', to: 'gate', in: 'b' },
  { id: 'c', from: 'gate', out: 'value', to: 'locked', in: 'value' },
] }
export const doorMission: Mission = {
  id: 'door-sample', title: '도어 잠금 조건', subtitle: '내부 확장성 시험', goal: '문 닫힘과 요청을 함께 확인', initial: 'IDLE', mode: 'logic', hints: [], requiredOutputs: ['locked'], allowedBlocks: ['input', 'and', 'output'], concept: '교육용 가상 사양',
  scenarios: [false, true].flatMap(closed => [false, true].map(lock => ({ id: `${closed}-${lock}`, name: '잠금 조건 확인', initial: 'IDLE', advice: '문이 닫힌 상태에서 요청해야 잠깁니다.', steps: [{ inputs: { closed, lock }, state: 'IDLE', outputs: { locked: closed && lock } }] })))
}
