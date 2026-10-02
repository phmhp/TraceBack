import type { InvestigationTargetType, StructuredInvestigationContext } from './Verification.ts'

export type InvestigationPage = 1 | 2 | 3 | 4
export type InvestigationView = 'FLOW' | 'SIGNALS' | 'INTERFACES' | 'STANDARDS'

export interface InvestigationSelection {
  componentId?: string
  signalId?: string
  interfaceId?: string
  requirementId?: string
  testCaseId?: string
  frameIndex?: number
}

export interface PlayerHypothesis {
  id?: string
  targetType?: InvestigationTargetType
  target: string
  domainScope?: string
  observedReason?: string
  signal?: string
  requirementId?: string
  testCaseId?: string
  condition?: string
  prediction: string
  relevantSignalIds?: string[]
  relevantInterfaceId?: string
  investigationContext?: StructuredInvestigationContext
  status?: 'ACTIVE' | 'MAINTAINED' | 'REJECTED'
}

export interface InvestigationContext {
  page: InvestigationPage
  view: InvestigationView
  selection: InvestigationSelection
}

export interface InvestigationHistoryEntry extends InvestigationContext {
  id: number
  origin: string
}

export type InvestigationActionType =
  | 'REVIEW_PHENOMENON'
  | 'INSPECT_COMPONENT'
  | 'INSPECT_SIGNAL'
  | 'COMPARE_SIGNAL'
  | 'OPEN_INTERFACE'
  | 'OPEN_REQUIREMENT'
  | 'SELECT_TEST_CASE'
  | 'CHANGE_HYPOTHESIS'
  | 'RUN_EXPERIMENT'
  | 'COLLECT_EVIDENCE'
  | 'INTERPRET_VERIFICATION'
  | 'SUBMIT_DIAGNOSIS'
  | 'MEANINGFUL_DISCOVERY'
  | 'EVIDENCE_SAVED'
  | 'HYPOTHESIS_CREATED'
  | 'TEST_EXECUTED'
  | 'TEST_RESULT_INTERPRETED'
  | 'CONCLUSION_SUBMITTED'
  | 'CONCLUSION_CONFIRMED'
  | 'EXPECTED_BASIS_IDENTIFIED'

export interface InvestigationActionRecord {
  id: number
  type: InvestigationActionType
  subjectId?: string
}

export interface DiscoveredFinding {
  id: string
  kind: 'BOUNDARY' | 'SIGNAL' | 'INTERFACE' | 'REQUIREMENT' | 'TEST_RESULT'
  subjectId: string
  source: 'INCIDENT_OBSERVATION' | 'REFERENCE' | 'EXPERIMENT'
  outcome?: 'OBSERVED' | 'MATCH' | 'MISMATCH' | 'REFERENCE'
  claim?: string
  clueType?: 'NORMAL_CONFIRMATION' | 'MISMATCH' | 'EXPECTED_BASIS' | 'TEST_RESULT' | 'OBSERVATION'
}

export interface InvestigationMilestones {
  phenomenonConfirmed: boolean
  boundaryTracked: boolean
  hypothesisFormulated: boolean
  hypothesisVerified: boolean
  conclusionSubmitted: boolean
}

export interface InvestigationSessionState {
  context: InvestigationContext
  history: InvestigationHistoryEntry[]
  hypothesis: PlayerHypothesis | null
  discoveredFindings: DiscoveredFinding[]
  collectedEvidenceIds: string[]
  actions: InvestigationActionRecord[]
  nextId: number
}

export const initialInvestigationSession = (): InvestigationSessionState => ({
  context: {
    page: 1,
    view: 'FLOW',
    selection: {
      frameIndex: 0,
    },
  },
  history: [],
  hypothesis: null,
  discoveredFindings: [],
  collectedEvidenceIds: [],
  actions: [],
  nextId: 1,
})

export type InvestigationSessionAction =
  | { type: 'NAVIGATE'; context: Partial<Omit<InvestigationContext, 'selection'>> & { selection?: Partial<InvestigationSelection> }; origin: string; remember?: boolean }
  | { type: 'BACK' }
  | { type: 'RECORD'; actionType: InvestigationActionType; subjectId?: string }
  | { type: 'SET_HYPOTHESIS'; hypothesis: PlayerHypothesis | null }
  | { type: 'DISCOVER'; finding: DiscoveredFinding }
  | { type: 'COLLECT_EVIDENCE'; evidenceId: string }

const sameContext = (a: InvestigationContext, b: InvestigationContext) =>
  a.page === b.page && a.view === b.view && JSON.stringify(a.selection) === JSON.stringify(b.selection)

const appendAction = (state: InvestigationSessionState, type: InvestigationActionType, subjectId?: string) => ({
  ...state,
  actions: [...state.actions, { id: state.nextId, type, subjectId }],
  nextId: state.nextId + 1,
})

export function investigationSessionReducer(state: InvestigationSessionState, action: InvestigationSessionAction): InvestigationSessionState {
  if (action.type === 'BACK') {
    const previous = state.history.at(-1)
    if (!previous) return state
    return { ...state, context: { page: previous.page, view: previous.view, selection: previous.selection }, history: state.history.slice(0, -1) }
  }
  if (action.type === 'NAVIGATE') {
    const next: InvestigationContext = {
      page: action.context.page ?? state.context.page,
      view: action.context.view ?? state.context.view,
      selection: { ...state.context.selection, ...action.context.selection },
    }
    if (sameContext(state.context, next)) return state
    const history = action.remember === false ? state.history : [
      ...state.history,
      { ...state.context, id: state.nextId, origin: action.origin },
    ]
    return { ...state, context: next, history, nextId: action.remember === false ? state.nextId : state.nextId + 1 }
  }
  if (action.type === 'RECORD') return appendAction(state, action.actionType, action.subjectId)
  if (action.type === 'SET_HYPOTHESIS') {
    let next = appendAction({ ...state, hypothesis: action.hypothesis }, 'CHANGE_HYPOTHESIS', action.hypothesis?.target)
    if (action.hypothesis) next = appendAction(next, 'HYPOTHESIS_CREATED', action.hypothesis.target)
    return next
  }
  if (action.type === 'DISCOVER') {
    if (state.discoveredFindings.some(item => item.id === action.finding.id)) return state
    return appendAction({ ...state, discoveredFindings: [...state.discoveredFindings, action.finding] }, 'MEANINGFUL_DISCOVERY', action.finding.subjectId)
  }
  if (state.collectedEvidenceIds.includes(action.evidenceId)) return state
  const collected = appendAction({ ...state, collectedEvidenceIds: [...state.collectedEvidenceIds, action.evidenceId] }, 'COLLECT_EVIDENCE', action.evidenceId)
  return appendAction(collected, 'EVIDENCE_SAVED', action.evidenceId)
}

export function deriveInvestigationMilestones(state: InvestigationSessionState): InvestigationMilestones {
  const acted = (type: InvestigationActionType) => state.actions.some(action => action.type === type)
  return {
    phenomenonConfirmed: acted('REVIEW_PHENOMENON'),
    boundaryTracked: state.discoveredFindings.some(finding =>
      ['BOUNDARY', 'SIGNAL', 'INTERFACE'].includes(finding.kind)
      && (finding.outcome === 'MATCH' || finding.outcome === 'MISMATCH')
    ),
    hypothesisFormulated: Boolean(state.hypothesis?.target),
    hypothesisVerified: acted('INTERPRET_VERIFICATION') || state.discoveredFindings.some(finding => finding.kind === 'TEST_RESULT'),
    conclusionSubmitted: acted('SUBMIT_DIAGNOSIS'),
  }
}
