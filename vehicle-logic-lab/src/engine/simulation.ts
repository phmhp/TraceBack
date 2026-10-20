import { evaluate } from './graph.ts'
import { valueKey } from './registry.ts'
import { SimulationClock } from './SimulationClock.ts'
import type { Graph, Snapshot } from './types.ts'

/** A discrete educational controller, not an ECU emulator or a physical vehicle model. */
export class LogicSimulation {
  state: string
  held = false
  readonly clock = new SimulationClock()
  readonly mode: 'logic' | 'machine'
  readonly eventKey: string
  constructor(initial: string, mode: 'logic' | 'machine' = 'logic', eventKey = 'power') {
    this.state = initial; this.mode = mode; this.eventKey = eventKey; this.clock.start()
  }
  reset(initial: string) { this.state = initial; this.held = false; this.clock.start() }
  step(graph: Graph, inputs: Record<string, boolean>): Snapshot {
    this.clock.step()
    const previousState = this.state
    const pulse = inputs[this.eventKey] === true && !this.held
    this.held = inputs[this.eventKey] === true
    const sampled = { ...inputs, [this.eventKey]: pulse }
    const before = evaluate(graph, sampled, this.state)
    let transition: string | undefined
    if (this.mode === 'machine' && !before.issues.length) {
      const enabled = graph.nodes.filter(n => n.kind === 'transition' && before.values[valueKey(n.id)] === true)
      if (enabled.length > 1) before.issues.push({ message: '두 개 이상의 상태 전이가 동시에 활성화되었습니다. 조건을 구분하세요.', nodes: enabled.map(n => n.id) })
      else if (enabled.length === 1) {
        const edge = graph.edges.find(e => e.to === enabled[0].id && e.in === 'to')!
        this.state = String(before.values[valueKey(edge.from, edge.out)])
        transition = enabled[0].id
      }
    }
    // Outputs reflect the committed state, guards reflect this tick's pre-state.
    const after = evaluate(graph, sampled, this.state)
    for (const n of graph.nodes.filter(n => n.kind === 'transition')) after.values[valueKey(n.id)] = before.values[valueKey(n.id)]
    return { ...after, outputs: before.issues.length ? {} : after.outputs, issues: before.issues, state: this.state, previousState, pulse, time: this.clock.currentTime, transition }
  }
}
