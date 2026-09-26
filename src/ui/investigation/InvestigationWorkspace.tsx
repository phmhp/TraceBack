import { useState, useEffect, useLayoutEffect, useMemo } from 'react'
import { useCase } from '../state/CaseContext'
import { useNavigation } from '../state/navigation'
import { useInvestigationUIState } from './presentation/useInvestigationState'
import { createInvestigationPresentationModel } from './presentation/InvestigationPresentationModel'
import { InvestigationHeader } from './shell/InvestigationHeader'
import { InvestigationSidebar } from './shell/InvestigationSidebar'
import { InvestigationTimeline } from './shell/InvestigationTimeline'
import { Page1Phenomenon } from './pages/Page1Phenomenon'
import { Page2Tracking } from './pages/Page2Tracking'
import { Page3Verification } from './pages/Page3Verification'
import { Page4Conclusion } from './pages/Page4Conclusion'
import { RequirementMap } from '../xray/RequirementMap'
import { defaultExperimentOptions } from '../../runtime/case/CaseExperiment'
import type { RootCauseReport } from '../../runtime/investigation/Evidence'
import { getRequirement } from '../../registries/investigation/Trace'
import '../case.css'
import './investigation-layout.css'

export function InvestigationWorkspace() {
    const { controller, state } = useCase()
    const completeInvestigation = useNavigation((s) => s.completeInvestigation)
    const ui = useInvestigationUIState()

    const currentFrame = state.frames[state.selected]
    const definition = controller.definition

    const [videoSlot, setVideoSlot] = useState<HTMLDivElement | null>(null)
    const [showReqMapModal, setShowReqMapModal] = useState(false)

    // Create presentation model
    const presentationModel = useMemo(() => {
        return createInvestigationPresentationModel(state, definition, ui.hypothesis, ui.milestones, ui.session.discoveredFindings)
    }, [state, definition, ui.hypothesis, ui.milestones, ui.session.discoveredFindings])

    // InvestigationSession owns the player hypothesis; the case report receives an explicit synchronized copy.
    useEffect(() => {
        controller.setHypothesis(ui.hypothesis)
    }, [controller, ui.hypothesis])

    useEffect(() => {
        if (ui.selectedFrameIndex !== state.selected) ui.setSelectedFrameIndex(state.selected)
    }, [state.selected, ui])

    // 3D viewport projection: 원본 desk-video getBoundingClientRect 방식 복원 (commit 79ec3b baseline)
    useLayoutEffect(() => {
        if (!videoSlot) return
        const resize = () => {
            const rect = videoSlot.getBoundingClientRect()
            const box = videoSlot.closest('.investigation-sidebar')?.getBoundingClientRect()
            for (const [name, value] of Object.entries({
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height
            })) {
                document.documentElement.style.setProperty(`--case-video-${name}`, `${value}px`)
            }
            if (box) {
                const clipTop = Math.max(0, box.top - rect.top)
                const clipRight = Math.max(0, rect.right - box.right)
                const clipBottom = Math.max(0, rect.bottom - box.bottom)
                const clipLeft = Math.max(0, box.left - rect.left)
                document.documentElement.style.setProperty(
                    '--case-video-clip',
                    `inset(${clipTop}px ${clipRight}px ${clipBottom}px ${clipLeft}px round 10px)`
                )
            }
        }
        resize()
        const observer = new ResizeObserver(resize)
        observer.observe(videoSlot)
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
    }, [videoSlot])

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

    const handleSaveAsEvidence = (subjectId: string) => {
        const requirement = getRequirement(subjectId)
        if (requirement) {
            controller.discoverReference('REQUIREMENT', requirement.id, requirement.allocatedComponent, [requirement.id], requirement.linkedTestCases)
            const evidenceId = `REQUIREMENT:${requirement.id}`
            ui.discover({ id: `finding:${evidenceId}`, kind: 'REQUIREMENT', subjectId: requirement.id, source: 'REFERENCE' })
            ui.collectEvidence(evidenceId)
            return
        }
        const observation = controller.inspect(ui.selectedComponent)
        const frame = controller.getSnapshot().frames[controller.getSnapshot().selected]
        if (!observation || !frame) return
        const evidenceId = `boundary:${ui.selectedComponent}:${frame.id}`
        ui.discover({ id: `finding:${evidenceId}`, kind: subjectId === ui.selectedSignal ? 'SIGNAL' : 'BOUNDARY', subjectId: ui.selectedComponent, source: 'INCIDENT_OBSERVATION', outcome: observation.status })
        ui.collectEvidence(evidenceId)
    }

    const handleRunExperiment = (
        value: number,
        speed: number,
        direction: 'FORWARD' | 'REVERSE',
        validity: 'VALID' | 'INVALID',
        target: 'VMC' | 'eDrive'
    ) => {
        controller.runExperiment(value, undefined, target, {
            ...defaultExperimentOptions(),
            speed,
            direction,
            validity
        })
        ui.recordAction('RUN_EXPERIMENT', target)
    }

    const handleCollectTest = (runId: number) => {
        controller.collectTest(runId)
        const run = controller.getSnapshot().experiments.find(item => item.id === runId)
        if (run) {
            const evidenceId = `test:${runId}`
            ui.discover({ id: `finding:${evidenceId}`, kind: 'TEST_RESULT', subjectId: run.testCaseId ?? String(runId), source: 'EXPERIMENT' })
            ui.collectEvidence(evidenceId)
            ui.recordAction('INTERPRET_VERIFICATION', run.testCaseId)
        }
    }

    const handleSubmitReport = (report: RootCauseReport) => {
        controller.submitReport(report)
        ui.recordAction('SUBMIT_DIAGNOSIS', report.faultLocation)
    }

    const handleRunRepair = (variant: 0 | 2 | 3) => {
        controller.runRepair(variant)
    }

    const handleSelectEvidenceForReport = (id: string, selected: boolean) => {
        controller.selectEvidence(id, selected)
    }

    return (
        <div className="investigation-new-container">
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
                        if (ev.relatedComponent) {
                            ui.navigate({ page: 2, view: 'SIGNALS', selection: { componentId: ev.relatedComponent } }, `근거 ${ev.id}에서 신호 비교로 이동`)
                        }
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
                        onStartTracking={() => {
                            ui.reviewPhenomenon()
                            ui.navigate({ page: 2, view: 'FLOW' }, '현상 파악에서 원인 추적 시작')
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
                        onSetHypothesisTarget={(target, type) => {
                            ui.setHypothesis({ target, type, signal: ui.selectedSignal })
                            ui.navigate({ page: 3 }, '기능에서 가설 검증으로 이동')
                        }}
                        onOpenBenchWithTc={(tcId) => {
                            ui.navigate({ page: 3, selection: { testCaseId: tcId } }, `요구사항에서 ${tcId} 검증으로 이동`)
                            ui.recordAction('SELECT_TEST_CASE', tcId)
                        }}
                        onOpenReqMap={() => setShowReqMapModal(true)}
                        onNavigateContext={(view, selection, origin) => ui.navigate({ page: 2, view, selection }, origin ?? `원인 추적 ${view} 보기`)}
                    />
                )}

                    {ui.page === 3 && (
                    <Page3Verification
                        hypothesis={ui.hypothesis}
                        selectedTestCaseId={ui.selectedTestCase}
                        onUpdateHypothesis={ui.setHypothesis}
                        currentFrame={currentFrame}
                        frames={state.frames}
                        latestExperiment={state.experiment}
                        experiments={state.experiments}
                        onRunExperiment={handleRunExperiment}
                        onCollectTestAsEvidence={handleCollectTest}
                        onJumpToEvent={handleJumpToEvent}
                        onNavigateToTracking={() => ui.navigate({ page: 2 }, '가설 수정')}
                    />
                )}

                    {ui.page === 4 && (
                    <Page4Conclusion
                        definition={definition}
                        evidenceList={state.evidence}
                        diagnosis={state.diagnosis}
                        repairs={state.repairs}
                        resolved={state.phase === 'RESOLVED'}
                        onSelectEvidenceForReport={handleSelectEvidenceForReport}
                        onSubmitReport={handleSubmitReport}
                        onRunRepair={handleRunRepair}
                        onNavigateToDebrief={() => completeInvestigation('debrief')}
                    />
                    )}
                </div>
            </div>

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
                onOpenVideo={() => ui.setShowVideoModal(true)}
            />

            {/* 영상 보기 모달 */}
            {ui.showVideoModal && (
                <div className="investigation-modal-overlay" onClick={() => ui.setShowVideoModal(false)}>
                    <div className="investigation-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="investigation-modal-header">
                            <b style={{ fontSize: '15px' }}>📹 주행 상황 현장 기록</b>
                            <button
                                type="button"
                                onClick={() => ui.setShowVideoModal(false)}
                                style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="investigation-modal-body" style={{ textAlign: 'center' }}>
                            <img
                                src="/assets/investigation/driver-front-polaroid.png"
                                alt="주행 상황 현장 사진"
                                style={{ maxWidth: '100%', maxHeight: '420px', borderRadius: '8px' }}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/assets/investigation/village-polaroid.png'
                                }}
                            />
                            <p style={{ marginTop: '12px', fontSize: '13px', color: '#475569' }}>
                                사건 발생 시점 ({presentationModel.eventTimeSeconds.toFixed(3)} s) 전후의 차량 거동 스냅샷입니다.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* 전체 요구사항 계층 구조 / Mind-Map 모달 */}
            {showReqMapModal && (
                <div className="investigation-modal-overlay" onClick={() => setShowReqMapModal(false)}>
                    <div className="investigation-modal-content" style={{ maxWidth: '1100px', width: '92vw' }} onClick={(e) => e.stopPropagation()}>
                        <div className="investigation-modal-header">
                            <b style={{ fontSize: '15px' }}>🗺️ 전체 요구사항 계층 구조 & Mind-Map</b>
                            <button
                                type="button"
                                onClick={() => setShowReqMapModal(false)}
                                style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="investigation-modal-body" style={{ minHeight: '520px', overflowX: 'auto' }}>
                            <RequirementMap
                                initialRequirement={ui.selectedRequirement}
                                onComponent={(id) => {
                                    ui.setSelectedComponent(id)
                                    setShowReqMapModal(false)
                                }}
                                onRequirement={(id) => {
                                    ui.setSelectedRequirement(id)
                                    setShowReqMapModal(false)
                                    ui.setTrackingView('STANDARDS')
                                }}
                                onTest={(tcId) => {
                                    ui.navigate({ page: 3, selection: { testCaseId: tcId } }, `요구사항 지도에서 ${tcId} 검증으로 이동`)
                                    ui.recordAction('SELECT_TEST_CASE', tcId)
                                    setShowReqMapModal(false)
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
