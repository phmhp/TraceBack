import test from 'node:test'
import assert from 'node:assert/strict'
import { useNavigation } from '../src/ui/state/navigation.ts'
import { DEFAULT_SESSION_CONFIG } from '../src/domain/session/SessionConfig.ts'
import { SimulationRuntime } from '../src/runtime/SimulationRuntime.ts'
import { TRACKBACK_SIMULATION_CALIBRATION_V0_1 as cal } from '../src/data/calibration/TrackbackSimulationCalibration.ts'

function resetFlow() {
  useNavigation.setState({ phase: 'MAIN', screen: 'main', draftConfig: { ...DEFAULT_SESSION_CONFIG }, sessionConfig: null })
}

test('session setup commits a real immutable-by-copy runtime configuration', () => {
  resetFlow()
  const flow = useNavigation.getState()
  flow.next()
  assert.equal(useNavigation.getState().phase, 'RACE_COUNTDOWN')
  useNavigation.getState().updateDraft({ raceLength: 'LONG', incidentCount: 3, difficulty: 'EXPERT' })
  useNavigation.getState().startSession()
  const config = useNavigation.getState().sessionConfig
  assert.deepEqual(config, { raceLength: 'LONG', incidentCount: 3, difficulty: 'EXPERT' })
  assert.equal(useNavigation.getState().phase, 'RACE_COUNTDOWN')
  const runtime = new SimulationRuntime(cal)
  runtime.configureSession(config)
  useNavigation.getState().updateDraft({ difficulty: 'GUIDED' })
  assert.deepEqual(runtime.readSessionConfig(), { raceLength: 'LONG', incidentCount: 3, difficulty: 'EXPERT' })
})

test('race lifecycle uses explicit countdown, normal, pause, restart and debug xray phases', () => {
  resetFlow(); useNavigation.getState().next(); useNavigation.getState().startSession()
  useNavigation.getState().completeCountdown()
  assert.equal(useNavigation.getState().phase, 'RACE_NORMAL')
  useNavigation.getState().pauseRace(); assert.equal(useNavigation.getState().phase, 'PAUSE_MENU')
  useNavigation.getState().resumeRace(); assert.equal(useNavigation.getState().phase, 'RACE_NORMAL')
  useNavigation.getState().enterDebugXRay(); assert.deepEqual(
    { phase: useNavigation.getState().phase, screen: useNavigation.getState().screen },
    { phase: 'XRAY_MODE', screen: 'xray' },
  )
  useNavigation.getState().leaveXRay(); assert.equal(useNavigation.getState().phase, 'RACE_NORMAL')
  useNavigation.getState().finishRace(); assert.equal(useNavigation.getState().phase, 'FINISH')
  useNavigation.getState().openDebrief(); assert.deepEqual({phase:useNavigation.getState().phase,screen:useNavigation.getState().screen},{phase:'DEBRIEF',screen:'debrief'})
  useNavigation.getState().restartRace(); assert.equal(useNavigation.getState().phase, 'RACE_COUNTDOWN')
  assert.deepEqual(useNavigation.getState().draftConfig, useNavigation.getState().sessionConfig)
  useNavigation.getState().reset(); assert.deepEqual(
    { phase: useNavigation.getState().phase, screen: useNavigation.getState().screen },
    { phase: 'MAIN', screen: 'main' },
  )
})
