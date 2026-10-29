import { starter } from '../content/ready.ts'
import type { Graph } from '../engine/types.ts'
import { BLOCKS } from '../engine/registry.ts'
export interface Save { version: 1; graphs: Record<string, Graph>; grades: Record<string, number>; verified: Record<string, string> }
export interface StoragePort { getItem(key: string): string | null; setItem(key: string, value: string): void }
export const SAVE_KEY = 'vehicle-logic-lab.v1'
export function emptySave(): Save { return { version: 1, graphs: { conditions: starter() }, grades: {}, verified: {} } }
export function fingerprint(graph: Graph) {
  // Layout is not behavior: moving a node does not revoke a verified design.
  return JSON.stringify({ nodes: graph.nodes.map(({ x: _x, y: _y, ...n }) => n).sort((a, b) => a.id.localeCompare(b.id)), edges: [...graph.edges].sort((a, b) => a.id.localeCompare(b.id)) })
}
export function loadSave(storage: StoragePort): { save: Save; warning?: string } {
  try {
    const raw = storage.getItem(SAVE_KEY)
    if (!raw) return { save: emptySave() }
    const save = JSON.parse(raw) as Save
    if (save.version !== 1 || !save.graphs?.conditions || !save.grades || !save.verified || [save.graphs, save.grades, save.verified].some(v => typeof v !== 'object' || Array.isArray(v))) throw new Error('version')
    for (const graph of Object.values(save.graphs)) {
      if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges) || graph.nodes.length > 100 || graph.edges.length > 400) throw new Error('graph')
      if (graph.nodes.some(n => !n || typeof n.id !== 'string' || !Object.hasOwn(BLOCKS, n.kind) || typeof n.label !== 'string' || !Number.isFinite(n.x) || !Number.isFinite(n.y) || n.x < 0 || n.y < 0 || n.x > 10000 || n.y > 10000)) throw new Error('node')
      if (graph.edges.some(e => !e || ['id', 'from', 'out', 'to', 'in'].some(key => typeof e[key as keyof typeof e] !== 'string'))) throw new Error('edge')
    }
    return { save }
  } catch { return { save: emptySave(), warning: '저장 기록을 읽지 못했습니다. 원본 기록은 덮어쓰지 않았습니다. 새 기록을 저장하려면 내보낸 후 저장을 눌러주세요.' } }
}
export function persist(storage: StoragePort, save: Save): string | undefined {
  try { storage.setItem(SAVE_KEY, JSON.stringify(save)); return undefined }
  catch { return '브라우저 저장 공간에 기록하지 못했습니다. 진행 내보내기로 파일을 보관하세요.' }
}
