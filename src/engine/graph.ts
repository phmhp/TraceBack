import { BLOCKS, valueKey } from './registry.ts'
import type { Graph, Wire, Issue, Evaluation, Value } from './types.ts'

export function validateGraph(graph: Graph): Issue[] {
  const issues: Issue[] = []
  const ids = new Set<string>(), used = new Set<string>(), outputKeys = new Set<string>()
  for (const node of graph.nodes) {
    if (ids.has(node.id)) issues.push({ message: '중복된 블록이 있습니다.', nodes: [node.id] })
    ids.add(node.id)
    if (!BLOCKS[node.kind]) { issues.push({ message: '지원하지 않는 블록입니다.', nodes: [node.id] }); continue }
    for (const port of BLOCKS[node.kind].inputs) {
      if (!graph.edges.some(e => e.to === node.id && e.in === port.id)) issues.push({ message: `${node.label}의 ${port.label}을 연결하세요.`, nodes: [node.id] })
    }
    if (['input', 'output', 'state'].includes(node.kind) && !node.key) issues.push({ message: `${node.label}의 신호 또는 상태를 지정하세요.`, nodes: [node.id] })
    if (node.kind === 'output') {
      if (outputKeys.has(node.key!)) issues.push({ message: '같은 출력 신호를 여러 블록에서 내보낼 수 없습니다.', nodes: [node.id] })
      outputKeys.add(node.key!)
    }
  }
  for (const edge of graph.edges) {
    const from = graph.nodes.find(n => n.id === edge.from), to = graph.nodes.find(n => n.id === edge.to)
    const out = from && BLOCKS[from.kind]?.outputs.find(p => p.id === edge.out)
    const input = to && BLOCKS[to.kind]?.inputs.find(p => p.id === edge.in)
    if (!out || !input) issues.push({ message: '존재하지 않는 포트에 연결되어 있습니다.', nodes: [edge.from, edge.to] })
    else if (out.type !== input.type) issues.push({ message: '조건 신호와 상태 값은 서로 연결할 수 없습니다.', nodes: [edge.from, edge.to] })
    const target = valueKey(edge.to, edge.in)
    if (used.has(target)) issues.push({ message: '입력 포트 하나에는 연결선 하나만 연결하세요.', nodes: [edge.to] })
    used.add(target)
  }
  const visiting = new Set<string>(), done = new Set<string>()
  const visit = (id: string) => {
    if (visiting.has(id)) { issues.push({ message: '계산 블록 사이의 순환 연결을 제거하세요.', nodes: [...visiting] }); return }
    if (done.has(id)) return
    visiting.add(id)
    for (const edge of graph.edges.filter(e => e.to === id)) visit(edge.from)
    visiting.delete(id); done.add(id)
  }
  for (const n of graph.nodes) visit(n.id)
  return issues
}

export function connect(graph: Graph, wire: Wire): Graph {
  // Reconnecting a socket replaces its previous incoming wire as one undoable edit.
  const edges = graph.edges.filter(e => !(e.to === wire.to && e.in === wire.in))
  const candidate = { ...graph, edges: [...edges, wire] }
  const fatal = validateGraph(candidate).find(i => !i.message.endsWith('연결하세요.'))
  if (fatal) throw new Error(fatal.message)
  return candidate
}

export function evaluate(graph: Graph, inputs: Record<string, boolean>, state: string): Evaluation {
  const issues = validateGraph(graph)
  const values: Record<string, Value> = {}, outputs: Record<string, boolean> = {}
  // Incomplete graphs never drive the vehicle. This also avoids infinite recursion.
  if (issues.length) return { issues, values, outputs }
  const done = new Set<string>()
  const run = (id: string) => {
    if (done.has(id)) return
    const node = graph.nodes.find(n => n.id === id)!
    const args: Record<string, Value> = {}
    for (const edge of graph.edges.filter(e => e.to === id)) { run(edge.from); args[edge.in] = values[valueKey(edge.from, edge.out)] }
    let value: Value = false
    switch (node.kind) {
      case 'input': value = inputs[node.key!] === true; break
      case 'state': value = node.key!; values[valueKey(id, 'active')] = node.key === state; break
      case 'and': value = args.a === true && args.b === true; break
      case 'or': value = args.a === true || args.b === true; break
      case 'not': value = args.a !== true; break
      case 'transition': value = args.from === state && args.when === true; break
      case 'output': value = args.value === true; outputs[node.key!] = value; break
    }
    values[valueKey(id)] = value; done.add(id)
  }
  graph.nodes.forEach(n => run(n.id))
  return { issues, values, outputs }
}
