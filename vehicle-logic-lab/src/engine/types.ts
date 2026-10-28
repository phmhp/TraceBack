export type BlockKind = 'input' | 'and' | 'or' | 'not' | 'state' | 'transition' | 'output'
export type Value = boolean | string
export type ValueType = 'boolean' | 'state'
export interface Port { id: string; label: string; type: ValueType }
export interface Block { id: string; kind: BlockKind; label: string; x: number; y: number; key?: string }
export interface Wire { id: string; from: string; out: string; to: string; in: string }
export interface Graph { nodes: Block[]; edges: Wire[] }
export interface Issue { message: string; nodes: string[] }
export interface Evaluation {
  values: Record<string, Value>; outputs: Record<string, boolean>; issues: Issue[]
}
export interface Snapshot extends Evaluation { state: string; previousState: string; pulse: boolean; time: number; transition?: string }
export interface Sample { inputs: Record<string, boolean>; state: string; outputs: Record<string, boolean> }
export interface Scenario { id: string; name: string; initial: string; steps: Sample[]; advice: string; challenge?: boolean }
export interface Mismatch { signal:string; expected:Value; actual:Value|undefined }
export interface VerificationFrame { index:number;expected:Sample;actual:Snapshot;pass:boolean;mismatches:Mismatch[] }
export interface TestResult { id: string; name: string; pass: boolean; challenge: boolean; expected: Sample; actual: Snapshot; message: string; trace?:VerificationFrame[]; failureStep?:number; category?:'PASS'|'STRUCTURE'|'BEHAVIOR'; inspectNodes?:string[] }
export interface Mission {
  id: string; title: string; subtitle: string; goal: string; initial: string; mode: 'logic' | 'machine';
  hints: string[]; scenarios: Scenario[]; requiredOutputs: string[]; allowedBlocks: BlockKind[]; concept: string
}
