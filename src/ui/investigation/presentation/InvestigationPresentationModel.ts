import type { CaseState, IncidentFrame } from '../../../runtime/case/PropulsionCase'
import type { CaseDefinition } from '../../../runtime/investigation/CaseDefinition'
import type { DiscoveredFinding, InvestigationMilestones, PlayerHypothesis } from '../../../runtime/investigation/InvestigationSession'
import { interfaceEdges } from '../../../registries/investigation/Architecture.ts'

export type { InvestigationPage, InvestigationView as TrackingView } from '../../../runtime/investigation/InvestigationSession'

export type InspectionStatus =
  | 'UNINSPECTED'      // 미조사
  | 'INSPECTING'       // 조사 중
  | 'COMPARED'         // 비교 완료
  | 'NO_DIFFERENCE'    // 차이 없음
  | 'DIFFERENCE_FOUND' // 차이 발견
  | 'HYPOTHESIS_TARGET'// 가설 대상

export type HypothesisModel = PlayerHypothesis

export interface InterfaceEdgeModel {
  id: string
  from: string
  to: string
  signals: string[]
  mainSignal: string
  signalCount: number
  status: InspectionStatus
}

export interface PresentationSignalItem {
  name: string
  normalValue: string | number
  currentValue: string | number
  unit: string
  difference: string
  hasDifference: boolean
  description?: string
  producer?: string
  consumer?: string
}

export interface InvestigationPresentationModel {
  // Case info
  caseId: string
  caseTitle: string
  symptomName: string
  symptomSummary: string
  driverQuote: string
  eventTimeSeconds: number
  
  // Investigation status calculations
  progress: {
    phenomenonConfirmed: boolean
    boundaryTracked: boolean
    hypothesisFormulated: boolean
    hypothesisVerified: boolean
    conclusionSubmitted: boolean
  }
  
  // Path & nodes
  relevantFunctionPath: string[]
  getNodeStatus: (nodeId: string) => InspectionStatus
  getInterfaceEdges: () => InterfaceEdgeModel[]
  
  // Snapshots for selected frame
  currentFrame: IncidentFrame | undefined
  previousFrame: IncidentFrame | undefined
  relevantContextSignals: { key: string; label: string; value: string | number; unit?: string }[]
  inputSignalsSnapshot: PresentationSignalItem[]
  outputSignalsSnapshot: PresentationSignalItem[]
}

/** Helper to format numeric or object values cleanly */
export function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(3)
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  if (typeof value === 'object') {
    if ('magnitude' in (value as Record<string, unknown>)) {
      const v = value as { magnitude?: number; magnitudeNm?: number; direction?: string; validity?: string }
      return `${formatValue(v.magnitude ?? v.magnitudeNm)} (${v.direction ?? 'NONE'})`
    }
    return JSON.stringify(value)
  }
  return String(value)
}

/** Build presentation model from runtime state without mutating domain entities */
export function createInvestigationPresentationModel(
  state: CaseState,
  definition: CaseDefinition,
  hypothesis: HypothesisModel | null,
  milestones: InvestigationMilestones,
  discoveredFindings: readonly DiscoveredFinding[]
): InvestigationPresentationModel {
  const currentFrame = state.frames[state.selected]
  const previousFrame = state.selected > 0 ? state.frames[state.selected - 1] : undefined
  const eventFrame = state.frames.length > 0 ? state.frames[state.frames.length - 1] : undefined
  const eventTimeSeconds = eventFrame?.sw.executionTime ?? 0

  // Determine progress state
  // Incident path directly from definition or fallback
  const relevantFunctionPath = definition.incidentPath?.length
    ? definition.incidentPath.filter(id => id !== 'DriveAdapter')
    : ['DriverInput', 'GearLogic', 'PropulsionFunction', 'VMC', 'eDrive', 'VehiclePhysics']

  const getNodeStatus = (nodeId: string): InspectionStatus => {
    if (hypothesis?.target === nodeId) return 'HYPOTHESIS_TARGET'
    
    // Oracle truth is not player knowledge. Only an explicitly discovered finding can color a node.
    const finding = discoveredFindings.find(item => item.subjectId === nodeId || item.id.includes(`boundary:${nodeId}:`))
    if (finding?.outcome === 'MISMATCH') return 'DIFFERENCE_FOUND'
    if (finding?.outcome === 'MATCH') return 'NO_DIFFERENCE'

    return 'UNINSPECTED'
  }

  const getInterfaceEdges = (): InterfaceEdgeModel[] => interfaceEdges.map(edge => ({
    id:edge.id, from:edge.sourceId, to:edge.targetId, signals:edge.signalIds,
    mainSignal:edge.signalIds[0] ?? '', signalCount:edge.signalIds.length, status:getNodeStatus(edge.sourceId),
  }))

  // Context Signals for Page 1 Card Grid from real state
  const relevantContextSignals = [
    { key: 'GearState', label: 'GearState', value: currentFrame?.sw.output.gearState ?? '—' },
    { key: 'VehicleReady', label: 'VehicleReady', value: currentFrame?.sw.input.vehicleReady ? 'TRUE' : 'FALSE' },
    { key: 'VehicleSpeed', label: 'VehicleSpeed', value: currentFrame?.plant?.speed?.toFixed(3) ?? (currentFrame?.sw.input.vehicleSpeed?.toFixed(3) ?? '—'), unit: 'm/s' },
    { key: 'AccelPedal', label: 'AccelPedal', value: currentFrame?.sw.input.acceleratorPedalPosition !== undefined ? Math.round(currentFrame.sw.input.acceleratorPedalPosition * 100) : '—', unit: '%' },
    { key: 'Brake', label: 'Brake', value: currentFrame?.brake !== undefined ? Math.round(currentFrame.brake * 100) : '—', unit: '%' },
    { key: 'DriveMode', label: 'DriveMode', value: 'NORMAL' }
  ]

  // Snapshots for Page 1 from real frame
  const inputSignalsSnapshot: PresentationSignalItem[] = [
    {
      name: 'AcceleratorPedalPosition',
      normalValue: '—',
      currentValue: formatValue(currentFrame?.sw.input.acceleratorPedalPosition),
      unit: 'ratio',
      difference: '—',
      hasDifference: false,
      description: '가속 페달 입력'
    },
    {
      name: 'GearRequest',
      normalValue: '—',
      currentValue: String(currentFrame?.sw.input.gearRequest ?? '—'),
      unit: '-',
      difference: '—',
      hasDifference: false,
      description: '변속 요청'
    },
    {
      name: 'Brake',
      normalValue: '—',
      currentValue: formatValue(currentFrame?.brake),
      unit: '-',
      difference: '—',
      hasDifference: false,
      description: '브레이크 입력'
    },
    {
      name: 'Steering',
      normalValue: '—',
      currentValue: formatValue(currentFrame?.steering),
      unit: '-',
      difference: '—',
      hasDifference: false,
      description: '조향 입력'
    }
  ]

  const outputSignalsSnapshot: PresentationSignalItem[] = [
    {
      name: 'VehicleSpeed',
      normalValue: '—',
      currentValue: formatValue(currentFrame?.plant?.speed ?? currentFrame?.sw.input.vehicleSpeed),
      unit: 'm/s',
      difference: '—',
      hasDifference: false,
      description: '차량 속도'
    },
    {
      name: 'LongitudinalVelocity',
      normalValue: '—',
      currentValue: formatValue(currentFrame?.plant?.longitudinalVelocity ?? currentFrame?.sw.input.longitudinalVelocity),
      unit: 'm/s',
      difference: '—',
      hasDifference: false,
      description: '종방향 속도'
    },
    {
      name: 'LongitudinalAcceleration',
      normalValue: '—',
      currentValue: formatValue(currentFrame?.plant?.longitudinalAcceleration),
      unit: 'm/s²',
      difference: '—',
      hasDifference: false,
      description: '종방향 가속도'
    }
  ]

  return {
    caseId: definition.id,
    caseTitle: definition.title,
    symptomName: definition.title || '고장 현상',
    symptomSummary: definition.symptom,
    driverQuote: '페달을 밟아도 차가 잘 안 나가요…',
    eventTimeSeconds,
    progress: {
      ...milestones
    },
    relevantFunctionPath,
    getNodeStatus,
    getInterfaceEdges,
    currentFrame,
    previousFrame,
    relevantContextSignals,
    inputSignalsSnapshot,
    outputSignalsSnapshot
  }
}
