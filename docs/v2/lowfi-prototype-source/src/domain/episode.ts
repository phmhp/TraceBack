export type EpisodePhase =
  | 'BRIEF'
  | 'DRIVE'
  | 'INCIDENT'
  | 'REQUEST'
  | 'XRAY'
  | 'BOUNDARY'
  | 'TEST'
  | 'REPORT'
  | 'REPAIR'
  | 'REDRIVE'
  | 'RESULT'

export type SourceKind =
  | 'FIELD FREQUENCY'
  | 'OWNER MANUAL FACT'
  | 'TRACKBACK RUNTIME FACT'
  | 'SIMULATION ASSUMPTION'

export interface FlowNode {
  id: string
  label: string
  role: string
  actual: string
  expected: string
  state: 'normal' | 'abnormal' | 'blocked'
  source: SourceKind
}

export interface FaultCase {
  id: string
  order: number
  title: string
  symptom: string
  frequencyBasis: string
  mission: string
  incident: {
    request: string
    condition: string
    response: string
  }
  flow: FlowNode[]
}

