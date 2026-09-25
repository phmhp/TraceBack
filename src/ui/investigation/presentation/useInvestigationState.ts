import { useState } from 'react'
import type { InvestigationPage, TrackingView, HypothesisModel } from './InvestigationPresentationModel'

export interface InvestigationUIState {
  page: InvestigationPage
  setPage: (page: InvestigationPage) => void
  trackingView: TrackingView
  setTrackingView: (view: TrackingView) => void
  selectedComponent: string
  setSelectedComponent: (id: string) => void
  selectedSignal: string
  setSelectedSignal: (sig: string) => void
  selectedInterface: string
  setSelectedInterface: (id: string) => void
  selectedRequirement: string
  setSelectedRequirement: (id: string) => void
  selectedTestCase: string
  setSelectedTestCase: (id: string) => void
  hypothesis: HypothesisModel | null
  setHypothesis: (h: HypothesisModel | null) => void
  isPlaying: boolean
  setIsPlaying: (playing: boolean | ((prev: boolean) => boolean)) => void
  showVideoModal: boolean
  setShowVideoModal: (show: boolean) => void
  showFullArchModal: boolean
  setShowFullArchModal: (show: boolean) => void
}

export function useInvestigationUIState(): InvestigationUIState {
  const [page, setPage] = useState<InvestigationPage>(1)
  const [trackingView, setTrackingView] = useState<TrackingView>('FLOW')
  const [selectedComponent, setSelectedComponent] = useState<string>('PropulsionFunction')
  const [selectedSignal, setSelectedSignal] = useState<string>('eDriveMagnitude')
  const [selectedInterface, setSelectedInterface] = useState<string>('PropulsionFunction->VMC')
  const [selectedRequirement, setSelectedRequirement] = useState<string>('SWR-VMC-001')
  const [selectedTestCase, setSelectedTestCase] = useState<string>('TC-PROP-NORMAL-009')
  const [hypothesis, setHypothesis] = useState<HypothesisModel | null>(null)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false)
  const [showFullArchModal, setShowFullArchModal] = useState<boolean>(false)

  return {
    page,
    setPage,
    trackingView,
    setTrackingView,
    selectedComponent,
    setSelectedComponent,
    selectedSignal,
    setSelectedSignal,
    selectedInterface,
    setSelectedInterface,
    selectedRequirement,
    setSelectedRequirement,
    selectedTestCase,
    setSelectedTestCase,
    hypothesis,
    setHypothesis,
    isPlaying,
    setIsPlaying,
    showVideoModal,
    setShowVideoModal,
    showFullArchModal,
    setShowFullArchModal
  }
}
