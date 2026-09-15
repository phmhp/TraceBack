import { Component, lazy, Suspense, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import { createVehiclePose } from '../domain/vehicle/VehicleState'
import type { SimulationRuntime } from '../runtime/SimulationRuntime'
import type { Screen } from '../ui/state/navigation'
import { FollowCamera } from '../graphics/FollowCamera'
import { VehicleRenderer } from '../graphics/VehicleRenderer'
import { MapRenderer } from '../graphics/world/MapRenderer'
import { phase2Physics } from '../physics/rapier/phase2Config'
import type { LoadedMap } from '../world/MapLoader'
import { VehicleShadowLight } from '../graphics/VehicleShadowLight'
import { useRaceHud } from '../ui/state/raceHud'

const RaceViewport = lazy(() => import('../graphics/RaceViewport'))
const RapierWorld = lazy(() => import('../physics/RapierWorld').then((m) => ({ default: m.RapierWorld })))

class PhysicsBoundary extends Component<{ runtime: SimulationRuntime; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error) { this.props.runtime.fail(error.message) }
  render() { return this.state.failed ? null : this.props.children }
}
export function GameViewport({ screen, runtime, map }: { screen: Screen; runtime: SimulationRuntime; map: LoadedMap }) {
  const celebrating = useRaceHud((state) => state.raceFinished)
  const presentedPose = useRef(createVehiclePose())
  const readPresentedPose = useCallback(() => presentedPose.current, [])
  const racing = screen === 'race'
  const liveMonitor = screen === 'xray'
  const drivingView = racing || liveMonitor
  const hasSession = drivingView || screen === 'debrief'
  const mode = drivingView ? 'chase' : 'menu'
  return <Suspense fallback={<div className="viewport-fallback">3D 장면 불러오는 중…</div>}>
    <RaceViewport mode={mode} active={drivingView}>
      {hasSession && <PhysicsBoundary runtime={runtime}>
        <Suspense fallback={null}><RapierWorld runtime={runtime} map={map} /></Suspense>
      </PhysicsBoundary>}
      {drivingView && <>
        <MapRenderer map={map.definition} />
        <VehicleRenderer readState={runtime.readVehicleState} readPreviousPose={runtime.readPreviousPose}
          readAlpha={runtime.readInterpolationAlpha} presentedPose={presentedPose.current}
          originOffsetY={phase2Physics.visualOriginOffsetY} readSteering={() => runtime.driverInput.getState().steering} celebrating={celebrating} />
        <FollowCamera readPose={readPresentedPose} readState={runtime.readVehicleState} />
        <VehicleShadowLight readPose={readPresentedPose}/>
      </>}
    </RaceViewport>
  </Suspense>
}
