import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { App } from '../ui/App'
import { useNavigation } from '../ui/state/navigation'
import { publishRaceHud } from '../ui/state/raceHud'
import { RaceActionsContext } from '../ui/state/RaceActionsContext'
import { bindKeyboardInput } from '../input/keyboard/KeyboardInputAdapter'
import { SimulationRuntime } from '../runtime/SimulationRuntime'
import { GameViewport } from './GameViewport'
import { PANGYO2_MAP_ID, loadMapDefinition } from '../registries/MapRegistry'
import { createLoadedMap } from '../world/MapLoader'
import { WorldViewContext } from '../ui/state/WorldViewContext'
import { TRACKBACK_SIMULATION_CALIBRATION_V0_1 } from '../data/calibration/TrackbackSimulationCalibration'

/** Composition root: wires browser input, runtime, engine adapter and UI without reverse imports. */
export function GameApplication() {
  const [runtime] = useState(() => new SimulationRuntime(TRACKBACK_SIMULATION_CALIBRATION_V0_1, (telemetry) => {
    publishRaceHud(telemetry)
    if (telemetry.raceFinished) useNavigation.getState().finishRace()
  }))
  const [map] = useState(() => createLoadedMap(loadMapDefinition(PANGYO2_MAP_ID)))
  useEffect(() => { const route = map.definition.routes.find((candidate) => candidate.routeId === map.definition.minimapConfig.routeId)!; runtime.configureFinish(route.finishPoint, route.finishHeading ?? 0) }, [map, runtime])
  const screen = useNavigation((s) => s.screen)
  const phase = useNavigation((s) => s.phase)
  const sessionConfig = useNavigation((s) => s.sessionConfig)
  const completeCountdown = useNavigation((s) => s.completeCountdown)
  const pauseRace = useNavigation((s) => s.pauseRace)
  const resumeRace = useNavigation((s) => s.resumeRace)
  const restartRace = useNavigation((s) => s.restartRace)
  const enterDebugXRay = useNavigation((s) => s.enterDebugXRay)
  const openDebrief = useNavigation((s) => s.openDebrief)
  const quitToMain = useNavigation((s) => s.reset)
  const clearInput = useRef(() => {})
  const actions = useMemo(() => ({
    pause: () => { clearInput.current(); runtime.pause(); pauseRace() },
    resume: () => { clearInput.current(); runtime.resume(); resumeRace() },
    restart: () => { clearInput.current(); runtime.reset(); restartRace() },
    quitToMain: () => { clearInput.current(); runtime.reset(); quitToMain() },
  }), [pauseRace, quitToMain, restartRace, resumeRace, runtime])

  useLayoutEffect(() => {
    if (phase === 'RACE_COUNTDOWN') {
      if (sessionConfig) runtime.configureSession(sessionConfig)
      runtime.reset()
      const countdown = window.setTimeout(completeCountdown, 4000)
      return () => window.clearTimeout(countdown)
    }
    if (phase === 'RACE_NORMAL') {
      if (!runtime.clock.running) runtime.start()
      else if (runtime.clock.paused) runtime.resume()
    } else if (phase === 'PAUSE_MENU') runtime.pause()
    else if (phase === 'DEBRIEF') runtime.pause()
    else if (phase === 'MAIN' || phase === 'SESSION_SETUP') runtime.reset()
  }, [completeCountdown, phase, runtime, sessionConfig])

  useEffect(() => {
    if (phase !== 'FINISH') return
    const reportDelay = window.setTimeout(openDebrief, 4000)
    return () => window.clearTimeout(reportDelay)
  }, [openDebrief, phase])

  useEffect(() => {
    if (screen !== 'race' && screen !== 'xray') return
    const lifecycle = {
      acceptsDrivingInput: runtime.acceptsDrivingInput.bind(runtime),
      togglePause: () => phase === 'PAUSE_MENU' ? actions.resume() : actions.pause(),
      pause: actions.pause,
    }
    const binding = bindKeyboardInput(window, runtime.driverInput, lifecycle)
    clearInput.current = binding.clear
    const onVisibility = () => { if (document.hidden) { binding.clear(); runtime.pause() } }
    document.addEventListener('visibilitychange', onVisibility)
    return () => { binding.dispose(); clearInput.current = () => {}; document.removeEventListener('visibilitychange', onVisibility) }
  }, [actions, phase, runtime, screen])

  useEffect(() => {
    if ((screen !== 'race' && screen !== 'xray') || !new URLSearchParams(window.location.search).has('debug')) return
    const onDebugKey = (event: KeyboardEvent) => {
      if (event.code !== 'F9' || event.repeat) return
      event.preventDefault()
      if (screen === 'xray') useNavigation.getState().leaveXRay()
      else enterDebugXRay()
    }
    window.addEventListener('keydown', onDebugKey)
    return () => window.removeEventListener('keydown', onDebugKey)
  }, [enterDebugXRay, screen])

  const worldView = useMemo(() => ({ map, readVehicleState: runtime.readVehicleState }), [map, runtime])
  return <WorldViewContext.Provider value={worldView}><RaceActionsContext.Provider value={actions}>
    <App scene={<GameViewport screen={screen} runtime={runtime} map={map} />} />
  </RaceActionsContext.Provider></WorldViewContext.Provider>
}
