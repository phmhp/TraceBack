import { useMemo, useReducer, useState } from 'react'
import { deriveInvestigationMilestones, initialInvestigationSession, investigationSessionReducer } from '../../../runtime/investigation/InvestigationSession'
import type { DiscoveredFinding, InvestigationActionType, InvestigationContext, InvestigationPage, InvestigationSelection, InvestigationView, PlayerHypothesis } from '../../../runtime/investigation/InvestigationSession'
import { reconcileInvestigationSelection } from '../../../registries/investigation/Trace'

export function useInvestigationUIState() {
  const [session, dispatch] = useReducer(investigationSessionReducer, undefined, initialInvestigationSession)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [showFullArchModal, setShowFullArchModal] = useState(false)
  const navigate = (context: Partial<Omit<InvestigationContext, 'selection'>> & { selection?: Partial<InvestigationSelection> }, origin: string, remember = true) => dispatch({
    type: 'NAVIGATE',
    context: context.selection ? { ...context, selection: reconcileInvestigationSelection(session.context.selection, context.selection) } : context,
    origin,
    remember,
  })
  const select = (selection: Partial<InvestigationSelection>, actionType?: InvestigationActionType, subjectId?: string) => {
    navigate({ selection }, actionType ?? 'selection', false)
    if (actionType) dispatch({ type: 'RECORD', actionType, subjectId })
  }
  return {
    session,
    milestones: useMemo(() => deriveInvestigationMilestones(session), [session]),
    page: session.context.page,
    trackingView: session.context.view,
    selectedComponent: session.context.selection.componentId ?? '',
    selectedSignal: session.context.selection.signalId ?? '',
    selectedInterface: session.context.selection.interfaceId ?? '',
    selectedRequirement: session.context.selection.requirementId ?? '',
    selectedTestCase: session.context.selection.testCaseId ?? '',
    selectedFrameIndex: session.context.selection.frameIndex ?? 0,
    hypothesis: session.hypothesis,
    canGoBack: session.history.length > 0,
    navigate,
    back: () => dispatch({ type: 'BACK' }),
    setPage: (page: InvestigationPage) => navigate({ page }, `page:${page}`),
    setTrackingView: (view: InvestigationView) => navigate({ view }, `view:${view}`),
    setSelectedComponent: (id: string) => select({ componentId: id }, 'INSPECT_COMPONENT', id),
    setSelectedSignal: (id: string) => select({ signalId: id }, 'INSPECT_SIGNAL', id),
    setSelectedInterface: (id: string) => select({ interfaceId: id }, 'OPEN_INTERFACE', id),
    setSelectedRequirement: (id: string) => select({ requirementId: id }, 'OPEN_REQUIREMENT', id),
    setSelectedTestCase: (id: string) => select({ testCaseId: id }, 'SELECT_TEST_CASE', id),
    setSelectedFrameIndex: (frameIndex: number) => select({ frameIndex }),
    setHypothesis: (hypothesis: PlayerHypothesis | null) => dispatch({ type: 'SET_HYPOTHESIS', hypothesis }),
    reviewPhenomenon: () => dispatch({ type: 'RECORD', actionType: 'REVIEW_PHENOMENON' }),
    recordAction: (actionType: InvestigationActionType, subjectId?: string) => dispatch({ type: 'RECORD', actionType, subjectId }),
    discover: (finding: DiscoveredFinding) => dispatch({ type: 'DISCOVER', finding }),
    collectEvidence: (evidenceId: string) => dispatch({ type: 'COLLECT_EVIDENCE', evidenceId }),
    isPlaying, setIsPlaying, showVideoModal, setShowVideoModal, showFullArchModal, setShowFullArchModal,
  }
}
