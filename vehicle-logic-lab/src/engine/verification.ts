import { LogicSimulation } from './simulation.ts'
import type { Graph, Mission, TestResult, Snapshot } from './types.ts'

export function verify(graph: Graph, mission: Mission): TestResult[] {
  return mission.scenarios.map(scenario => {
    const sim = new LogicSimulation(scenario.initial, mission.mode)
    let actual!: Snapshot, expected = scenario.steps[0], pass = true
    for (const step of scenario.steps) {
      actual = sim.step(graph, step.inputs); expected = step
      if (actual.issues.length || actual.state !== step.state || mission.requiredOutputs.some(key => !(key in actual.outputs)) || Object.entries(step.outputs).some(([key, value]) => actual.outputs[key] !== value)) { pass = false; break }
    }
    return { id: scenario.id, name: scenario.name, challenge: !!scenario.challenge, pass, actual, expected,
      message: pass ? '기대 상태와 출력이 일치합니다.' : actual.issues[0]?.message ?? scenario.advice }
  })
}
export function rating(results: TestResult[]) {
  const required = results.filter(r => !r.challenge)
  if (!required.length) return 0
  if (!required.every(r => r.pass)) return required.some(r => r.pass) ? 1 : 0
  return results.filter(r => r.challenge).every(r => r.pass) ? 3 : 2
}
