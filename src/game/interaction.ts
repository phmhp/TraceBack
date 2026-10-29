import type { Graph, Mission, Snapshot, ValueType } from '../engine/types.ts'
import { BLOCKS } from '../engine/registry.ts'
import {verify} from '../engine/verification.ts'

export type Look = { yaw: number; pitch: number; zone?:'pedals'|'gear' }
export const lookPresets: Record<string, Look> = { road: { yaw: 0, pitch: -.08 }, pedals: { yaw: 0, pitch: -.44,zone:'pedals' }, gear: { yaw: -.72, pitch: -.65,zone:'gear' } }
/** Footwell is a translated cutaway camera, not a steeper view blocked by the wheel. */
export function cameraOffsetForLook(look:Look):[number,number,number]{return look.zone==='pedals'?[0,.92,.3]:[0,1.27,.52]}
export function moveLook(look: Look, dx: number, dy: number): Look {
  return { ...look,yaw: Math.max(-1.15, Math.min(1.15, look.yaw - dx * .004)), pitch: Math.max(-1.15, Math.min(.24, look.pitch - dy * .004)) }
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
  return verify(graph,mission).find(row=>row.id===id)?.trace??[]
}
export function driveGate(snapshot: Pick<Snapshot, 'state' | 'outputs' | 'issues'>) { return !snapshot.issues.length && snapshot.state === 'READY' && snapshot.outputs.drive === true }
