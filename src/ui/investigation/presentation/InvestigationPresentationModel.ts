import type { CaseState, IncidentFrame } from '../../../runtime/case/PropulsionCase'
import type { CaseDefinition } from '../../../runtime/investigation/CaseDefinition'
import { inspectBoundary } from '../../../runtime/investigation/Boundary'

export type InvestigationPage = 1 | 2 | 3 | 4
export type TrackingView = 'FLOW' | 'SIGNALS' | 'INTERFACES' | 'STANDARDS'

export type InspectionStatus =
  | 'UNINSPECTED'      // 미조사
  | 'INSPECTING'       // 조사 중
  | 'COMPARED'         // 비교 완료
  | 'NO_DIFFERENCE'    // 차이 없음
  | 'DIFFERENCE_FOUND' // 차이 발견
  | 'HYPOTHESIS_TARGET'// 가설 대상

export interface HypothesisModel {
  target: string
  type: string
  signal?: string
  status?: 'ACTIVE' | 'MAINTAINED' | 'REJECTED'
}

export interface InterfaceEdgeModel {
  id: string
  from: string
  to: string
  signals: string[]
  mainSignal: string
  signalCount: number
  status: InspectionStatus
  communicationInfo?: {
    messageName: string
    protocol: string
    cycleMs: number
    timeoutMs: number
    crc: 'PASS' | 'FAIL' | 'NONE'
    aliveCounter: 'NORMAL' | 'ABNORMAL' | 'NONE'
  }
}

export interface PresentationSignalItem {
  name: string
  normalValue: string | number
  currentValue: string | number
  unit: string
  difference: string
  hasDifference: boolean
  range?: string
  validity?: string
  updatePeriod?: string
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
  hypothesis: HypothesisModel | null
): InvestigationPresentationModel {
  const currentFrame = state.frames[state.selected]
  const previousFrame = state.selected > 0 ? state.frames[state.selected - 1] : undefined
  const eventFrame = state.frames.length > 0 ? state.frames[state.frames.length - 1] : undefined
  const eventTimeSeconds = eventFrame?.sw.executionTime ?? 24.783

  // Determine progress state
  const phenomenonConfirmed = true // At least entered investigation
  const boundaryTracked = state.evidence.some(e => e.type === 'SIGNAL_BOUNDARY') || state.selected > 0
  const hypothesisFormulated = Boolean(hypothesis?.target && hypothesis.target !== '-') || Boolean(state.hypothesis)
  const hypothesisVerified = state.experiments.length > 0 || hypothesis?.status === 'MAINTAINED' || hypothesis?.status === 'REJECTED'
  const conclusionSubmitted = Boolean(state.diagnosis)

  // Map runtime components into relevant path
  const relevantFunctionPath = ['DriverInput', 'GearLogic', 'PropulsionFunction', 'VMC', 'eDrive', 'VehiclePhysics']

  const getNodeStatus = (nodeId: string): InspectionStatus => {
    if (hypothesis?.target === nodeId) return 'HYPOTHESIS_TARGET'
    
    // Check if user has inspected boundary or saved evidence
    const boundaryEv = state.evidence.find(e => e.type === 'SIGNAL_BOUNDARY' && e.relatedComponent === nodeId)
    if (boundaryEv) {
      return boundaryEv.status === 'MISMATCH' ? 'DIFFERENCE_FOUND' : 'NO_DIFFERENCE'
    }

    if (currentFrame) {
      const obs = inspectBoundary(currentFrame, nodeId, previousFrame)
      if (obs.status === 'MISMATCH') return 'DIFFERENCE_FOUND'
      if (obs.status === 'MATCH') return 'NO_DIFFERENCE'
    }

    return 'UNINSPECTED'
  }

  // Pre-configured interfaces based on architecture
  const getInterfaceEdges = (): InterfaceEdgeModel[] => [
    {
      id: 'DriverInput->GearLogic',
      from: 'DriverInput',
      to: 'GearLogic',
      signals: ['GearRequest', 'GearRequestValidity'],
      mainSignal: 'GearRequest',
      signalCount: 2,
      status: 'COMPARED'
    },
    {
      id: 'DriverInput->PropulsionFunction',
      from: 'DriverInput',
      to: 'PropulsionFunction',
      signals: ['AcceleratorPedalPosition', 'AcceleratorPedalValidity'],
      mainSignal: 'AcceleratorPedalPosition',
      signalCount: 2,
      status: 'NO_DIFFERENCE'
    },
    {
      id: 'GearLogic->PropulsionFunction',
      from: 'GearLogic',
      to: 'PropulsionFunction',
      signals: ['GearState', 'GearStateValidity', 'TransitionAccepted'],
      mainSignal: 'GearState',
      signalCount: 3,
      status: 'NO_DIFFERENCE'
    },
    {
      id: 'PropulsionFunction->VMC',
      from: 'PropulsionFunction',
      to: 'VMC',
      signals: ['PropulsionRequest', 'PropulsionState', 'PropulsionEnable'],
      mainSignal: 'PropulsionRequest',
      signalCount: 3,
      status: 'DIFFERENCE_FOUND',
      communicationInfo: {
        messageName: 'VMC_Command',
        protocol: 'CAN',
        cycleMs: 10,
        timeoutMs: 30,
        crc: 'PASS',
        aliveCounter: 'NORMAL'
      }
    },
    {
      id: 'VMC->eDrive',
      from: 'VMC',
      to: 'eDrive',
      signals: ['DriveTorqueRequest', 'eDriveDirection', 'eDriveMagnitude'],
      mainSignal: 'DriveTorqueRequest',
      signalCount: 3,
      status: 'INSPECTING'
    },
    {
      id: 'eDrive->VehiclePhysics',
      from: 'eDrive',
      to: 'VehiclePhysics',
      signals: ['EDriveCommand', 'WheelTorque'],
      mainSignal: 'EDriveCommand',
      signalCount: 2,
      status: 'UNINSPECTED'
    }
  ]

  // Context Signals for Page 1 Card Grid
  const relevantContextSignals = [
    { key: 'GearState', label: 'GearState', value: currentFrame?.sw.output.gearState ?? 'D' },
    { key: 'VehicleReady', label: 'VehicleReady', value: currentFrame?.sw.input.vehicleReady ? 'TRUE' : 'FALSE' },
    { key: 'VehicleSpeed', label: 'VehicleSpeed', value: currentFrame?.plant?.speed ?? (currentFrame?.sw.input.vehicleSpeed ?? 15.64), unit: 'm/s' },
    { key: 'AccelPedal', label: 'AccelPedal', value: Math.round((currentFrame?.sw.input.acceleratorPedalPosition ?? 1.0) * 100), unit: '%' },
    { key: 'Brake', label: 'Brake', value: Math.round((currentFrame?.brake ?? 0) * 100), unit: '%' },
    { key: 'DriveMode', label: 'DriveMode', value: 'NORMAL' }
  ]

  // Snapshots for Page 1
  const inputSignalsSnapshot: PresentationSignalItem[] = [
    {
      name: 'AcceleratorPedalPosition',
      normalValue: '1.000',
      currentValue: formatValue(currentFrame?.sw.input.acceleratorPedalPosition ?? 1.0),
      unit: 'ratio',
      difference: '-',
      hasDifference: false,
      description: '가속 페달 입력'
    },
    {
      name: 'GearRequest',
      normalValue: 'D',
      currentValue: String(currentFrame?.sw.input.gearRequest ?? 'D'),
      unit: '-',
      difference: '-',
      hasDifference: false,
      description: '변속 요청'
    },
    {
      name: 'Brake',
      normalValue: '0.000',
      currentValue: formatValue(currentFrame?.brake ?? 0.0),
      unit: '-',
      difference: '-',
      hasDifference: false,
      description: '브레이크 입력'
    },
    {
      name: 'Steering',
      normalValue: '0.000',
      currentValue: formatValue(currentFrame?.steering ?? 0.0),
      unit: '-',
      difference: '-',
      hasDifference: false,
      description: '조향 입력'
    }
  ]

  const outputSignalsSnapshot: PresentationSignalItem[] = [
    {
      name: 'VehicleSpeed',
      normalValue: '15.635',
      currentValue: formatValue(currentFrame?.plant?.speed ?? (currentFrame?.sw.input.vehicleSpeed ?? 15.635)),
      unit: 'm/s',
      difference: '-',
      hasDifference: false,
      description: '차량 속도'
    },
    {
      name: 'LongitudinalVelocity',
      normalValue: '15.634',
      currentValue: formatValue(currentFrame?.plant?.longitudinalVelocity ?? (currentFrame?.sw.input.longitudinalVelocity ?? 15.634)),
      unit: 'm/s',
      difference: '-',
      hasDifference: false,
      description: '종방향 속도'
    },
    {
      name: 'LongitudinalAcceleration',
      normalValue: '0.450',
      currentValue: formatValue(currentFrame?.plant?.longitudinalAcceleration ?? -0.452),
      unit: 'm/s²',
      difference: '▼ 0.902',
      hasDifference: true,
      description: '종방향 가속도'
    }
  ]

  return {
    caseId: definition.id,
    caseTitle: definition.title,
    symptomName: '가속 응답 저하',
    symptomSummary: '가속 페달을 밟았지만 차량의 가속 반응이 예상보다 약합니다.',
    driverQuote: '페달을 끝까지 밟아도 차가 잘 안 나가요…',
    eventTimeSeconds,
    progress: {
      phenomenonConfirmed,
      boundaryTracked,
      hypothesisFormulated,
      hypothesisVerified,
      conclusionSubmitted
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
