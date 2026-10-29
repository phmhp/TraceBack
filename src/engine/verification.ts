import { LogicSimulation } from './simulation.ts'
import type { Graph, Mission, TestResult, Snapshot,VerificationFrame,Mismatch } from './types.ts'
import {signalCone} from '../engineering/workspace.ts'

export function verify(graph: Graph, mission: Mission): TestResult[] {
  return mission.scenarios.map(scenario => {
    const sim = new LogicSimulation(scenario.initial, mission.mode)
    let actual!: Snapshot, expected = scenario.steps[0], pass = true
    const trace:VerificationFrame[]=[]
    for (const [index,step] of scenario.steps.entries()) {
      actual = sim.step(graph, step.inputs); expected = step
      const mismatches:Mismatch[]=[]
      if(actual.state!==step.state)mismatches.push({signal:'state',expected:step.state,actual:actual.state})
      for(const key of new Set([...mission.requiredOutputs,...Object.keys(step.outputs)])){if(!(key in actual.outputs)||key in step.outputs&&actual.outputs[key]!==step.outputs[key])mismatches.push({signal:key,expected:step.outputs[key]??false,actual:actual.outputs[key]})}
      const framePass=!actual.issues.length&&!mismatches.length
      trace.push({index,expected:step,actual,pass:framePass,mismatches})
      if(!framePass){pass=false;break}
    }
    const inspect=new Set(actual.issues.flatMap(i=>i.nodes))
    for(const diff of trace.at(-1)?.mismatches??[]){const outputs=graph.nodes.filter(n=>diff.signal==='state'?n.kind==='transition':n.kind==='output'&&n.key===diff.signal);for(const n of outputs)for(const id of signalCone(graph.edges,n.id).nodes)inspect.add(id)}
    return { id: scenario.id, name: scenario.name, challenge: !!scenario.challenge, pass, actual, expected,
      trace, failureStep:pass?undefined:trace.length-1,category:pass?'PASS':actual.issues.length?'STRUCTURE':'BEHAVIOR',inspectNodes:[...inspect],
      message: pass ? '기대 상태와 출력이 일치합니다.' : actual.issues[0]?.message ?? scenario.advice }
  })
}
export function rating(results: TestResult[]) {
  const required = results.filter(r => !r.challenge)
  if (!required.length) return 0
  if (!required.every(r => r.pass)) return required.some(r => r.pass) ? 1 : 0
  return results.filter(r => r.challenge).every(r => r.pass) ? 3 : 2
}
