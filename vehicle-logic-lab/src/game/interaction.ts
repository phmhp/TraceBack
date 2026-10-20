import type { Graph, Mission, Snapshot, ValueType } from '../engine/types.ts'
import { BLOCKS } from '../engine/registry.ts'
import { LogicSimulation } from '../engine/simulation.ts'

export type Look = { yaw: number; pitch: number }
export const lookPresets: Record<string, Look> = { road: { yaw: 0, pitch: -.08 }, pedals: { yaw: -.12, pitch: -.92 }, gear: { yaw: -.72, pitch: -.65 } }
export function moveLook(look: Look, dx: number, dy: number): Look {
  return { yaw: Math.max(-1.15, Math.min(1.15, look.yaw - dx * .004)), pitch: Math.max(-1.15, Math.min(.24, look.pitch - dy * .004)) }
}
export type Socket = { node: string; port: string; direction: 'in' | 'out'; type: ValueType }
export function matchingSockets(a: Socket, b: Socket) { return a.node !== b.node && a.direction !== b.direction && a.type === b.type }
export function socketWire(a: Socket, b: Socket) {
  if (!matchingSockets(a, b)) throw new Error('출력과 입력, 같은 신호 종류끼리 연결해 주세요.')
  const [from, to] = a.direction === 'out' ? [a, b] : [b, a]
  return { id: crypto.randomUUID(), from: from.node, out: from.port, to: to.node, in: to.port }
}
export function socketsFor(graph: Graph): Socket[] {
  return graph.nodes.flatMap(n => [...BLOCKS[n.kind].inputs.map(p => ({ node: n.id, port: p.id, type: p.type, direction: 'in' as const })), ...BLOCKS[n.kind].outputs.map(p => ({ node: n.id, port: p.id, type: p.type, direction: 'out' as const }))])
}
/** Display playback uses the same evaluator as the verdict; no animation-based pass. */
export function trialTrace(graph: Graph, mission: Mission, id: string) {
  const scenario = mission.scenarios.find(s => s.id === id)
  if (!scenario) return []
  const sim = new LogicSimulation(scenario.initial, mission.mode)
  return scenario.steps.map((expected, index) => {
    const actual = sim.step(graph, expected.inputs)
    const pass = !actual.issues.length && actual.state === expected.state && mission.requiredOutputs.every(key => key in actual.outputs) && Object.entries(expected.outputs).every(([key, value]) => actual.outputs[key] === value)
    return { index, expected, actual, pass }
  })
}
export function driveGate(snapshot: Pick<Snapshot, 'state' | 'outputs' | 'issues'>) { return !snapshot.issues.length && snapshot.state === 'READY' && snapshot.outputs.drive === true }
