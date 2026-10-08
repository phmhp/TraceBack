import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from 'react'
import { useCase } from '../state/CaseContext'
import { useNavigation } from '../state/navigation'
import { useInvestigationUIState } from './presentation/useInvestigationState'
import { createInvestigationPresentationModel } from './presentation/InvestigationPresentationModel'
import { InvestigationHeader } from './shell/InvestigationHeader'
import { InvestigationSidebar } from './shell/InvestigationSidebar'
import { InvestigationTimeline } from './shell/InvestigationTimeline'
import { ClueToast, DriverDialogue, MissionCompleteToast, NotebookToast, type DialogueBeat } from './shell/InvestigationMissionLayer'
import { Page1Phenomenon } from './pages/Page1Phenomenon'
import { Page2Tracking } from './pages/Page2Tracking'
import { Page3Verification } from './pages/Page3Verification'
import { Page4Conclusion } from './pages/Page4Conclusion'
import { defaultExperimentOptions } from '../../runtime/case/CaseExperiment'
import type { RootCauseReport } from '../../runtime/investigation/Evidence'
import { getRequirement, getRequirementsForComponent, getTestCase, getTestsForRequirement } from '../../registries/investigation/Trace'
import { compareSignalAtFrame } from '../../runtime/investigation/SignalComparison'
import { reactionForInvestigationEvent, type CatReactionState } from '../../runtime/investigation/Reaction'
import type { VerificationRunMetadata } from '../../runtime/investigation/Verification'
import { architectureNode, getInputSignals, getOutputSignals, getIncomingInterfaces, getOutgoingInterfaces } from '../../registries/investigation/Architecture'
import { useSimulationRuntime } from '../state/SimulationRuntimeContext.ts'
import type { VehicleScenarioDefinition } from '../../runtime/scenario/VehicleScenario.ts'
import '../case.css'
import './investigation-layout.css'

const guidedReview = [
    { page: 1 as const, view: 'FLOW' as const, selection: {}, focusSelector:'.observed-response-heading', title: '관찰된 차량 반응', copy: '조사는 내부 원인이 아니라 실제로 관찰된 약한 차량 반응에서 시작합니다.' },
    { page: 2 as const, view: 'FLOW' as const, selection: { componentId: 'VehiclePhysics', signalId: 'VehicleSpeed' }, focusSelector:'.vehicle-architecture-node.selected', title: '차량 반응의 인접 구조', copy: '차량 반응 바로 앞의 명령과 기능을 구조에서 거슬러 올라갑니다.' },
    { page: 2 as const, view: 'SIGNALS' as const, selection: { componentId: 'eDrive', signalId: 'EDriveCommand' }, focusSelector:'.signal-identity-card', title: '처음 확인되는 내부 차이', copy: '상류 요청과 출력 명령을 같은 시간축에서 비교해 차이가 생기는 위치를 좁힙니다.' },
    { page: 2 as const, view: 'STANDARDS' as const, selection: { componentId: 'eDrive', requirementId: 'SWR-EDR-001' }, focusSelector:'.requirement-source-statement', title: 'Expected의 근거', copy: 'Expected는 정상 주행 기록이 아니라 선택 조건에 적용되는 요구사항과 오라클에서 나옵니다.' },
    { page: 3 as const, view: 'STANDARDS' as const, selection: { componentId: 'eDrive', requirementId: 'SWR-EDR-001', testCaseId: 'TC-PROP-NORMAL-010A' }, focusSelector:'.verification-run-button', title: '가설 검증', copy: '전제조건을 고정하고 서로 다른 입력에서 Expected와 Actual의 반복 패턴을 확인합니다.' },
    { page: 4 as const, view: 'STANDARDS' as const, selection: {}, focusSelector:'.submit-cta-btn', title: '근거에서 결론으로', copy: '발견한 경계 차이와 반복 시험 결과가 함께 원인 위치와 문제 유형을 지지합니다.' },
]

export function InvestigationWorkspace() {
    const { controller, state } = useCase()
    const {runtime,scenario}=useSimulationRuntime()
    const completeInvestigation = useNavigation((s) => s.completeInvestigation)
    const recordDiagnosis=useNavigation(s=>s.recordDiagnosis)
    const beginRepairSelection=useNavigation(s=>s.beginRepairSelection)
    const beginRepairVerification=useNavigation(s=>s.beginRepairVerification)
    const repairVerificationFailed=useNavigation(s=>s.repairVerificationFailed)
    const resumeInvestigation=useNavigation(s=>s.resumeInvestigation)
    const ui = useInvestigationUIState()

    const currentFrame = state.frames[state.selected]
    const definition = controller.definition

    const [videoSlot, setVideoSlot] = useState<HTMLDivElement | null>(null)
    const [scenarioVideoSlot,setScenarioVideoSlot]=useState<HTMLDivElement|null>(null)
    const [guidedReviewStep, setGuidedReviewStep] = useState<number | null>(null)
    const [clueFeedback,setClueFeedback]=useState<(typeof ui.session.discoveredFindings)[number]|null>(null)
    const [notebookFeedback,setNotebookFeedback]=useState(false)
    const [missionFeedback,setMissionFeedback]=useState<(typeof ui.missions)[number]|null>(null)
    const [dialogueQueue,setDialogueQueue]=useState<DialogueBeat[]>([{id:'fault-intro',speaker:'고양이 운전자',line:'어...? 페달은 밟았는데 차가 잘 안 나가. 무슨 일이었는지 같이 봐줄래?'}])
    const [catReaction,setCatReaction]=useState<CatReactionState>('CAT_FAULT')
    const processedActionId=useRef(0)
    const completedMissionIds=useRef(new Set<string>())
    const guidedNavigationTimer=useRef<number|null>(null)
    const navigateRef=useRef(ui.navigate)
    navigateRef.current=ui.navigate
    const showGuidedStep = useCallback((index: number) => {
        const step = guidedReview[index]
        if (!step) return
        setGuidedReviewStep(index)
        if(guidedNavigationTimer.current!==null)window.clearTimeout(guidedNavigationTimer.current)
        guidedNavigationTimer.current=window.setTimeout(()=>{
            navigateRef.current({ page: step.page, view: step.view, selection: step.selection }, `guided-review:${index}`, false)
            guidedNavigationTimer.current=null
            window.setTimeout(()=>document.querySelector(step.focusSelector)?.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'}),180)
        },1200)
    },[])
    useEffect(()=>()=>{if(guidedNavigationTimer.current!==null)window.clearTimeout(guidedNavigationTimer.current)},[])

    // Create presentation model
    const presentationModel = useMemo(() => {
        return createInvestigationPresentationModel(state, definition, ui.hypothesis, ui.milestones, ui.session.discoveredFindings)
    }, [state, definition, ui.hypothesis, ui.milestones, ui.session.discoveredFindings])

    useEffect(()=>{
        const unseen=ui.session.actions.filter(action=>action.id>processedActionId.current)
        if(!unseen.length)return
        processedActionId.current=Math.max(...unseen.map(action=>action.id))
        const dialogue:DialogueBeat[]=[]
        for(const action of unseen){
            const actionFinding=action.type==='MEANINGFUL_DISCOVERY'?[...ui.session.discoveredFindings].reverse().find(item=>item.subjectId===action.subjectId):undefined
            setCatReaction(reactionForInvestigationEvent(action.type,actionFinding?.outcome,controller.getSnapshot().diagnosis?.correct))
            if(action.type==='MEANINGFUL_DISCOVERY'){
                const finding=actionFinding
                if(finding){
                    setClueFeedback(finding)
                    if(finding.clueType==='MISMATCH'&&ui.session.discoveredFindings.find(item=>item.clueType==='MISMATCH')?.id===finding.id)dialogue.push({id:`clue:${finding.id}`,speaker:'고양이 운전자',line:'앗, 출력에서 차이가 보여. 바로 위 입력과 이 값의 기준을 확인해보자.'})
                    if(finding.clueType==='EXPECTED_BASIS'&&ui.session.discoveredFindings.find(item=>item.clueType==='EXPECTED_BASIS')?.id===finding.id)dialogue.push({id:`basis:${finding.id}`,speaker:'고양이 운전자',line:'이 조건에서 기대해야 할 값의 기준을 찾았어.'})
                }
            }
            if(action.type==='EVIDENCE_SAVED')setNotebookFeedback(true)
            if(action.type==='REVIEW_PHENOMENON'&&ui.session.actions.find(item=>item.type==='REVIEW_PHENOMENON')?.id===action.id)dialogue.push({id:`review:${action.id}`,speaker:'고양이 운전자',line:'그럼 내가 페달을 안 밟은 건 아니네. 차 안에서 요청이 어떻게 처리됐는지 볼까?'})
            if(action.type==='TEST_RESULT_INTERPRETED'&&ui.session.actions.find(item=>item.type==='TEST_RESULT_INTERPRETED')?.id===action.id)dialogue.push({id:`test:${action.subjectId}`,speaker:'고양이 운전자',line:'시험 결과가 나왔어. 이걸로 어디까지 말할 수 있을까?'})
            if(action.type==='CONCLUSION_SUBMITTED'&&!controller.getSnapshot().diagnosis?.correct)dialogue.push({id:`submit:${action.id}`,speaker:'고양이 운전자',line:'보고서 결과를 받았어. 남은 단서를 다시 확인해보자.'})
            if(action.type==='CONCLUSION_CONFIRMED')dialogue.push({id:`confirmed:${action.id}`,speaker:'고양이 운전자',line:'찾았다! 어디서 문제가 생겼는지 설명할 수 있게 됐어.'})
        }
        if(dialogue.length)setDialogueQueue(queue=>[...queue,...dialogue.filter(beat=>!queue.some(item=>item.id===beat.id))])
    },[controller,ui.session.actions,ui.session.discoveredFindings])

    useEffect(()=>{
        for(const mission of ui.missions){
            if(mission.completed&&!completedMissionIds.current.has(mission.id)){
                completedMissionIds.current.add(mission.id)
                setMissionFeedback(mission)
            }
        }
    },[ui.missions])
    useEffect(()=>{if(!clueFeedback)return;const timer=window.setTimeout(()=>setClueFeedback(null),3600);return()=>window.clearTimeout(timer)},[clueFeedback])
    useEffect(()=>{if(!notebookFeedback)return;const timer=window.setTimeout(()=>setNotebookFeedback(false),2600);return()=>window.clearTimeout(timer)},[notebookFeedback])
    useEffect(()=>{if(!missionFeedback)return;const timer=window.setTimeout(()=>setMissionFeedback(null),2800);return()=>window.clearTimeout(timer)},[missionFeedback])
    // InvestigationSession owns the player hypothesis; the case report receives an explicit synchronized copy.
    useEffect(() => {
        controller.setHypothesis(ui.hypothesis)
    }, [controller, ui.hypothesis])

    useEffect(()=>{
        if(scenario.status==='COMPLETED'&&scenario.completedRun)controller.recordVehicleScenario(scenario.completedRun)
    },[controller,scenario.completedRun,scenario.status])

    useEffect(() => {
        if (ui.selectedFrameIndex !== state.selected) ui.setSelectedFrameIndex(state.selected)
    }, [state.selected, ui])

    // 3D viewport projection: 원본 desk-video getBoundingClientRect 방식 복원 (commit 79ec3b baseline)
    useLayoutEffect(() => {
        const projectionSlot=ui.page===3?scenarioVideoSlot:videoSlot
        if (!projectionSlot) return
        const resize = () => {
            const rect = projectionSlot.getBoundingClientRect()
            const headerBottom = document.querySelector('.investigation-top-header')?.getBoundingClientRect().bottom ?? 0
            const timelineTop = document.querySelector('.investigation-timeline,.investigation-bottom-timeline,.case-timeline')?.getBoundingClientRect().top ?? window.innerHeight
            for (const [name, value] of Object.entries({
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height
            })) {
                document.documentElement.style.setProperty(`--case-video-${name}`, `${value}px`)
            }
            const clipTop = Math.max(0, headerBottom - rect.top)
            const clipBottom = Math.max(0, rect.bottom - timelineTop)
            document.documentElement.style.setProperty('--case-video-clip',`inset(${clipTop}px 0 ${clipBottom}px 0 round 16px)`)
        }
        resize()
        const observer = new ResizeObserver(resize)
        observer.observe(projectionSlot)
        window.addEventListener('resize', resize)
        window.addEventListener('scroll', resize, true)
        return () => {
            observer.disconnect()
            window.removeEventListener('resize', resize)
            window.removeEventListener('scroll', resize, true)
            for (const name of ['left', 'top', 'width', 'height']) {
                document.documentElement.style.removeProperty(`--case-video-${name}`)
            }
            document.documentElement.style.removeProperty('--case-video-clip')
        }
    }, [videoSlot,scenarioVideoSlot,ui.page])

    // Playback timer loop
    useEffect(() => {
        if (!ui.isPlaying) return
        const timer = window.setInterval(() => {
            const snapshot = controller.getSnapshot()
            if (snapshot.selected >= snapshot.frames.length - 1) {
                ui.setIsPlaying(false)
            } else {
                controller.select(snapshot.selected + 1)
                ui.setSelectedFrameIndex(snapshot.selected + 1)
            }
        }, 95)
        return () => window.clearInterval(timer)
    }, [ui.isPlaying, controller, ui])

    // Handlers
    const handleTogglePlay = () => {
        if (state.selected >= state.frames.length - 1) {
            controller.select(0)
            ui.setSelectedFrameIndex(0)
        }
        ui.setIsPlaying((prev) => !prev)
    }

    const handleSeek = (idx: number) => {
        ui.setIsPlaying(false)
        controller.select(idx)
        ui.setSelectedFrameIndex(idx)
    }

    const handleJumpToEvent = () => {
        ui.setIsPlaying(false)
        const index = Math.max(0, state.frames.length - 1)
        controller.select(index)
        ui.setSelectedFrameIndex(index)
    }

    const handleIdentifyExpectedBasis=(requirementId:string)=>{
        if(ui.session.discoveredFindings.some(item=>item.id===`finding:REQUIREMENT:${requirementId}`))return
        const requirement=getRequirement(requirementId);if(!requirement)return
        ui.recordAction('EXPECTED_BASIS_IDENTIFIED',requirement.id)
        ui.discover({id:`finding:REQUIREMENT:${requirement.id}`,kind:'REQUIREMENT',subjectId:requirement.id,source:'REFERENCE',outcome:'REFERENCE',clueType:'EXPECTED_BASIS',claim:`${requirement.id}가 ${requirement.statement}`})
    }

    const handleCompareSignal=(subjectId:string)=>{
        if(!currentFrame||!ui.selectedComponent)return
        const previous=state.frames[state.selected-1]
        const comparison=compareSignalAtFrame(subjectId,ui.selectedComponent,currentFrame,previous);if(!comparison)return
        const id=`finding:signal:${ui.selectedComponent}:${subjectId}:${currentFrame.id}`
        if(ui.session.discoveredFindings.some(item=>item.id===id))return
        ui.recordAction('COMPARE_SIGNAL',subjectId)
        const claim=comparison.status==='MISMATCH'
            ? `\`${subjectId}\` Actual ${comparison.actual}, ${comparison.criterionLabel} ${comparison.criterionValue}. ${comparison.interpretation}`
            : comparison.status==='MATCH'
              ? `\`${subjectId}\` = ${comparison.actual}. ${comparison.interpretation}`
              : `\`${subjectId}\` = ${comparison.actual}. ${comparison.interpretation}`
        ui.discover({id,kind:'SIGNAL',subjectId,source:'INCIDENT_OBSERVATION',outcome:comparison.status,claim,clueType:comparison.status==='MATCH'?'NORMAL_CONFIRMATION':comparison.status==='MISMATCH'?'MISMATCH':'OBSERVATION'})
    }

    const handleInspectInterfaceCapability=(interfaceId:string)=>{
        const id=`finding:interface-capability:${interfaceId}`
        if(ui.session.discoveredFindings.some(item=>item.id===id))return
        ui.discover({id,kind:'INTERFACE',subjectId:interfaceId,source:'INCIDENT_OBSERVATION',outcome:'OBSERVED',clueType:'OBSERVATION',claim:'현재 데이터에서는 이 전달 경계의 양단 값 비교를 지원하지 않습니다.'})
    }

    const handleSaveAsEvidence = (subjectId: string) => {
        const requirement = getRequirement(subjectId)
        if (requirement) {
            handleIdentifyExpectedBasis(requirement.id)
            controller.discoverReference('REQUIREMENT', requirement.id, requirement.allocatedComponent, [requirement.id], requirement.linkedTestCases)
            const evidenceId = `REQUIREMENT:${requirement.id}`
            ui.collectEvidence(evidenceId)
            return
        }
        handleCompareSignal(subjectId)
        const saved = controller.saveSignalEvidence(ui.selectedComponent, subjectId)
        if (!saved) return
        ui.collectEvidence(saved.id)
    }

    const handleSaveIncidentObservation = () => {
        const evidenceId=controller.saveIncidentObservation()
        if(!evidenceId)return
        ui.collectEvidence(evidenceId)
        ui.recordAction('COLLECT_EVIDENCE',evidenceId)
    }

    const handleRunExperiment = (
        value: number,
        speed: number,
        direction: 'FORWARD' | 'REVERSE',
        validity: 'VALID' | 'INVALID',
        target: 'VMC' | 'eDrive',
        verification: VerificationRunMetadata
    ) => {
        controller.runExperiment(value, undefined, target, {
            ...defaultExperimentOptions(),
            speed,
            direction,
            validity
        }, verification)
        ui.recordAction('RUN_EXPERIMENT', target)
        ui.recordAction('TEST_EXECUTED', target)
    }

    const handleCollectTest = (runId: number) => {
        handleInterpretTestResult(runId)
        controller.collectTest(runId)
        const run = controller.getSnapshot().experiments.find(item => item.id === runId)
        if (run) {
            const evidenceId = `test:${runId}`
            ui.collectEvidence(evidenceId)
        }
    }

    const handleRunVehicleScenario=(definition:VehicleScenarioDefinition)=>{
        runtime.startVehicleScenario(definition)
        ui.recordAction('RUN_EXPERIMENT','VehiclePhysics')
        ui.recordAction('TEST_EXECUTED','VehiclePhysics')
    }
    const handleCollectVehicleScenario=(scenarioId:string)=>{
        const run=controller.getSnapshot().vehicleScenarioRuns.find(item=>item.runId===scenarioId)??scenario.completedRun
        if(run)controller.recordVehicleScenario(run)
        controller.collectVehicleScenario(scenarioId)
        ui.collectEvidence(`scenario:${scenarioId}`)
        ui.recordAction('INTERPRET_VERIFICATION',scenarioId)
        ui.recordAction('TEST_RESULT_INTERPRETED',scenarioId)
    }

    const handleInterpretTestResult=(runId:number)=>{
        const run=controller.getSnapshot().experiments.find(item=>item.id===runId);if(!run)return
        const evidenceId=`test:${runId}`,findingId=`finding:${evidenceId}`
        if(ui.session.discoveredFindings.some(item=>item.id===findingId))return
        const passed=run.rows.every(row=>row.pass),subjectId=run.testCaseId??String(runId)
        ui.discover({id:findingId,kind:'TEST_RESULT',subjectId,source:'EXPERIMENT',outcome:passed?'MATCH':'MISMATCH',clueType:'TEST_RESULT',claim:passed?'이 시험 범위의 동작이 Expected를 만족했습니다.':'이 시험 범위에서 동작이 Expected를 만족하지 않았습니다.'})
        ui.recordAction('INTERPRET_VERIFICATION',run.testCaseId)
        ui.recordAction('TEST_RESULT_INTERPRETED',run.testCaseId)
    }

    const handleSubmitReport = (report: RootCauseReport) => {
        controller.submitReport(report)
        ui.recordAction('SUBMIT_DIAGNOSIS', report.faultLocation)
        ui.recordAction('CONCLUSION_SUBMITTED', report.faultLocation)
        const diagnosis=controller.getSnapshot().diagnosis
        if (diagnosis?.correct&&diagnosis.evidenceSufficient) ui.recordAction('CONCLUSION_CONFIRMED', report.faultLocation)
        if(diagnosis)recordDiagnosis(diagnosis.correct?(diagnosis.evidenceSufficient?'CORRECT_SUPPORTED':'CORRECT_INCOMPLETE'):'INCORRECT')
        beginRepairSelection()
    }

    const handleRunRepair = (variant: 0 | 2 | 3) => {
        beginRepairVerification()
        const run=controller.runRepair(variant)
        if(run.rows.every(row=>row.pass))runtime.unlockRecoveryChallenge()
        else repairVerificationFailed()
    }

    const handleSelectEvidenceForReport = (id: string, selected: boolean) => {
        controller.selectEvidence(id, selected)
    }

    return (
        <div className={`investigation-new-container ${guidedReviewStep === null ? '' : `guided-review-active guided-review-step-${guidedReviewStep}`}`}>
            {/* 1. 상단 Stepper 헤더 */}
            <InvestigationHeader
                currentPage={ui.page}
                onSelectPage={ui.setPage}
            />

            {/* 2. 본문 영역: 사이드바 + 메인 페이지 */}
            <div className="investigation-body">
                <InvestigationSidebar
                    model={presentationModel}
                    hypothesis={ui.hypothesis}
                    evidenceList={state.evidence}
                    videoSlotRef={setVideoSlot}
                    onSelectEvidence={(ev) => {
                        const frameIndex=state.frames.findIndex(frame=>frame.id===ev.reference.frameId)
                        if(ev.type==='REQUIREMENT'&&ev.reference.requirementId)ui.navigate({page:2,view:'STANDARDS',selection:{componentId:ev.relatedComponent,requirementId:ev.reference.requirementId}},`근거 ${ev.id}로 이동`)
                        else if(ev.type==='INCIDENT_FRAME')ui.navigate({page:1,selection:{...(frameIndex>=0?{frameIndex}:{})}},`사건 관찰 ${ev.id}로 이동`)
                        else if(ev.type==='TEST_RESULT'&&ev.reference.scenarioId){const run=state.vehicleScenarioRuns.find(item=>item.runId===ev.reference.scenarioId);if(run)runtime.reviewVehicleScenario(run);ui.navigate({page:3,selection:{componentId:'VehiclePhysics'}},`차량 시나리오 ${ev.reference.scenarioId} 다시 열기`)}
                        else if(ev.type==='TEST_RESULT'&&ev.reference.runId){const run=state.experiments.find(item=>item.id===ev.reference.runId);ui.navigate({page:3,selection:{componentId:ev.relatedComponent,testCaseId:run?.testCaseId}},`근거 ${ev.id}로 이동`)}
                        else if(ev.type==='INTERFACE_COMPARISON'&&ev.details?.subjectId)ui.navigate({page:2,view:'INTERFACES',selection:{componentId:ev.relatedComponent,interfaceId:ev.details.subjectId,...(frameIndex>=0?{frameIndex}:{})}},`근거 ${ev.id}로 이동`)
                        else if(ev.relatedComponent)ui.navigate({page:2,view:'SIGNALS',selection:{componentId:ev.relatedComponent,signalId:ev.details?.subjectId,...(frameIndex>=0?{frameIndex}:{})}},`근거 ${ev.id}에서 신호 비교로 이동`)
                    }}
                    onNavigateToTracking={() => {
                        ui.navigate({ page: 2 }, '사이드바에서 원인 추적으로 이동')
                    }}
                />

                <div className="investigation-main-stack">
                    {/* Investigation history is separate from browser history. */}
                    {ui.canGoBack && (
                        <div className="investigation-back-row">
                            <button type="button" className="investigation-back-btn" onClick={ui.back} aria-label="이전 조사 컨텍스트로 돌아가기">
                                ← 이전 조사
                            </button>
                        </div>
                    )}

                    {/* 4개 사고 흐름 PAGE */}
                    {ui.page === 1 && (
                    <Page1Phenomenon
                        model={presentationModel}
                        onSelectFrameIndex={handleSeek}
                        onSaveIncidentObservation={handleSaveIncidentObservation}
                        onStartTracking={() => {
                            ui.reviewPhenomenon()
                            ui.navigate({ page: 2, view: 'FLOW', selection: { componentId: 'VehiclePhysics', signalId: presentationModel.startingObservation.signalId } }, '관찰된 차량 반응에서 원인 추적 시작')
                        }}
                    />
                )}

                    {ui.page === 2 && (
                    <Page2Tracking
                        model={presentationModel}
                        trackingView={ui.trackingView}
                        onSelectView={ui.setTrackingView}
                        selectedComponent={ui.selectedComponent}
                        onSelectComponent={ui.setSelectedComponent}
                        selectedSignal={ui.selectedSignal}
                        onSelectSignal={ui.setSelectedSignal}
                        selectedInterface={ui.selectedInterface}
                        onSelectInterface={ui.setSelectedInterface}
                        selectedRequirement={ui.selectedRequirement}
                        onSelectRequirement={ui.setSelectedRequirement}
                        selectedTestCase={ui.selectedTestCase}
                        currentFrame={currentFrame}
                        frames={state.frames}
                        onSelectFrameIndex={handleSeek}
                        onSaveAsEvidence={handleSaveAsEvidence}
                        onCompareSignal={handleCompareSignal}
                        onIdentifyExpectedBasis={handleIdentifyExpectedBasis}
                        onInspectInterfaceCapability={handleInspectInterfaceCapability}
                        onSetHypothesisTarget={(target) => {
                            const requirements=getRequirementsForComponent(target)
                            const requested=getRequirement(ui.selectedRequirement)
                            const requirement=requested?.allocatedComponent===target?requested:requirements.find(item=>item.level==='SOFTWARE')??requirements[0]
                            const tests=requirement?getTestsForRequirement(requirement.id):[]
                            const requestedTest=getTestCase(ui.selectedTestCase)
                            const test=requestedTest&&tests.some(item=>item.id===requestedTest.id)?requestedTest:tests[0]
                            const condition=test?.precondition??'선택 기능의 정상 전제조건'
                            const observation=test?.observation??ui.selectedSignal??'관찰 출력'
                            const observedReason=[...ui.session.discoveredFindings].reverse().find(item=>item.outcome==='MISMATCH'&&(item.subjectId===ui.selectedSignal||item.claim?.includes(target)))?.claim
                            const node=architectureNode(target)
                            const stateSignals=getInputSignals(target).filter(signal=>signal.semanticRole==='STATE_OR_PRECONDITION').map(signal=>signal.id)
                            const inputSignals=getInputSignals(target).filter(signal=>signal.semanticRole!=='STATE_OR_PRECONDITION').map(signal=>signal.id)
                            const outputSignals=getOutputSignals(target).map(signal=>signal.id)
                            const interfaceIds=[...getIncomingInterfaces(target),...getOutgoingInterfaces(target)].map(edge=>edge.id)
                            const noteIds=state.evidence.filter(item=>item.type!=='TEST_RESULT').map(item=>item.id)
                            const context={domainScope:node?.area,architectureNodeId:target,target:{type:'FUNCTION' as const,id:target,label:node?.label,domainScope:node?.area},observedReason:observedReason??`${target} 출력에서 Expected와 다른 값을 확인했습니다.`,stateSignalIds:stateSignals,inputSignalIds:inputSignals,outputSignalIds:outputSignals,interfaceIds,requirementIds:requirements.map(item=>item.id),investigationNoteIds:noteIds,frameIndex:state.selected}
                            ui.setHypothesis({id:`hypothesis:FUNCTION:${target}`,targetType:'FUNCTION',target,domainScope:node?.area,observedReason:context.observedReason,signal:ui.selectedSignal||outputSignals[0],requirementId:requirement?.id,testCaseId:test?.id,condition,prediction:`다른 정상 입력에서도 ${observation}이 Expected 기준을 만족하지 않을 것이다.`,relevantSignalIds:[...stateSignals,...inputSignals,...outputSignals],investigationContext:context,status:'ACTIVE'})
                            ui.navigate({ page: 3 }, '기능에서 가설 검증으로 이동')
                        }}
                        onOpenBenchWithTc={(tcId) => {
                            ui.navigate({ page: 3, selection: { testCaseId: tcId } }, `요구사항에서 ${tcId} 검증으로 이동`)
                            ui.recordAction('SELECT_TEST_CASE', tcId)
                        }}
                        onNavigateContext={(view, selection, origin) => ui.navigate({ page: 2, view, selection }, origin ?? `원인 추적 ${view} 보기`)}
                        discoveredFindings={ui.session.discoveredFindings}
                        collectedEvidenceIds={ui.session.collectedEvidenceIds}
                    />
                )}

                    {ui.page === 3 && (
                    <Page3Verification
                        hypothesis={ui.hypothesis}
                        selectedTestCaseId={ui.selectedTestCase}
                        selectedContextTarget={ui.selectedInterface?{type:'INTERFACE_BOUNDARY',id:ui.selectedInterface,domainScope:'Propulsion'}:undefined}
                        onUpdateHypothesis={ui.setHypothesis}
                        currentFrame={currentFrame}
                        frames={state.frames}
                        latestExperiment={state.experiment}
                        experiments={state.experiments}
                        limits={controller.limits}
                        onRunExperiment={handleRunExperiment}
                        onCollectTestAsEvidence={handleCollectTest}
                        onInterpretTestResult={handleInterpretTestResult}
                        onJumpToEvent={handleJumpToEvent}
                        onNavigateToTracking={() => ui.navigate({ page: 2 }, '가설 수정')}
                        onOpenRequirement={(requirementId) => ui.navigate({ page: 2, view: 'STANDARDS', selection: { requirementId } }, `가설 검증에서 ${requirementId} 요구사항 확인`)}
                        vehicleScenario={scenario}
                        scenarioViewportRef={setScenarioVideoSlot}
                        onRunVehicleScenario={handleRunVehicleScenario}
                        onReplayVehicleScenario={()=>runtime.replayVehicleScenario()}
                        onAbortVehicleScenario={()=>runtime.abortVehicleScenario()}
                        onCollectVehicleScenario={handleCollectVehicleScenario}
                    />
                )}

                    {ui.page === 4 && (
                    <Page4Conclusion
                        definition={definition}
                        hypothesis={ui.hypothesis}
                        evidenceList={state.evidence}
                        frames={state.frames}
                        experiments={state.experiments}
                        diagnosis={state.diagnosis}
                        repairs={state.repairs}
                        resolved={state.phase === 'RESOLVED'}
                        onSelectEvidenceForReport={handleSelectEvidenceForReport}
                        onSubmitReport={handleSubmitReport}
                        onRunRepair={handleRunRepair}
                        onStartRecovery={() => completeInvestigation('race')}
                        onStartGuidedReview={() => showGuidedStep(0)}
                        onRetryInvestigation={() => {
                            const needsMore=Boolean(controller.getSnapshot().diagnosis?.correct&&!controller.getSnapshot().diagnosis?.evidenceSufficient)
                            controller.retryDiagnosis();resumeInvestigation()
                            ui.navigate({ page: needsMore?3:2, view: 'FLOW' }, needsMore?'근거 보강 시험으로 이동':'오답 후 다시 조사')
                        }}
                    />
                    )}
                </div>
            </div>

            <ClueToast finding={clueFeedback}/>
            <NotebookToast visible={notebookFeedback}/>
            <MissionCompleteToast mission={missionFeedback}/>
            <DriverDialogue beat={dialogueQueue[0]??null} reaction={catReaction} remaining={dialogueQueue.length} onNext={()=>setDialogueQueue(queue=>queue.slice(1))} onSkip={()=>setDialogueQueue([])}/>

            {/* 3. 하단 공통 타임라인 바 */}
            <InvestigationTimeline
                currentIndex={state.selected}
                totalFrames={state.frames.length}
                currentTimeSeconds={currentFrame?.sw.executionTime ?? 0}
                totalTimeSeconds={state.frames[state.frames.length - 1]?.sw.executionTime ?? 60}
                eventTimeSeconds={presentationModel.eventTimeSeconds}
                isPlaying={ui.isPlaying}
                onTogglePlay={handleTogglePlay}
                onSeek={handleSeek}
                onJumpToEvent={handleJumpToEvent}
            />

            {guidedReviewStep !== null && <aside className="guided-review-controls" aria-live="polite">
                <p className="investigation-section-label">조사 해설 {guidedReviewStep + 1} / {guidedReview.length}</p>
                <h3>{guidedReview[guidedReviewStep]!.title}</h3>
                <p>{guidedReview[guidedReviewStep]!.copy}</p>
                <small className="guided-review-prompt">내용을 확인한 뒤 ‘다음’을 눌러 계속하세요.</small>
                <div>
                    <button type="button" disabled={guidedReviewStep === 0} onClick={() => showGuidedStep(guidedReviewStep - 1)}>이전</button>
                    {guidedReviewStep < guidedReview.length - 1 && <button type="button" onClick={() => showGuidedStep(guidedReviewStep + 1)}>다음</button>}
                    <button type="button" onClick={() => {
                        if(guidedReviewStep===guidedReview.length-1){controller.completeGuidedResolution();recordDiagnosis('ASSISTED');beginRepairSelection();ui.navigate({page:4},'assisted solution result',false)}
                        setGuidedReviewStep(null)
                    }}>{guidedReviewStep===guidedReview.length-1?'해설 결과 확인':'해설 종료'}</button>
                </div>
            </aside>}
        </div>
    )
}
