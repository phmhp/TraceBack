import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
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
  assert.equal(useNavigation.getState().phase, 'PRE_RACE')
  useNavigation.getState().updateDraft({ raceLength: 'LONG', incidentCount: 3, difficulty: 'EXPERT' })
  useNavigation.getState().startSession()
  const config = useNavigation.getState().sessionConfig
  assert.deepEqual(config, { raceLength: 'LONG', incidentCount: 3, difficulty: 'EXPERT' })
  assert.equal(useNavigation.getState().phase, 'PRE_RACE')
  const runtime = new SimulationRuntime(cal)
  runtime.configureSession(config)
  useNavigation.getState().updateDraft({ difficulty: 'GUIDED' })
  assert.deepEqual(runtime.readSessionConfig(), { raceLength: 'LONG', incidentCount: 3, difficulty: 'EXPERT' })
})

test('shared gameplay lifecycle covers pre-race, fault, investigation, recovery and result', () => {
  resetFlow(); useNavigation.getState().next(); useNavigation.getState().startSession()
  useNavigation.getState().completeCountdown()
  assert.equal(useNavigation.getState().phase, 'NORMAL_DRIVE')
  useNavigation.getState().pauseRace(); assert.equal(useNavigation.getState().phase, 'PAUSE_MENU')
  useNavigation.getState().resumeRace(); assert.equal(useNavigation.getState().phase, 'NORMAL_DRIVE')
  useNavigation.getState().markFaultEvent();assert.equal(useNavigation.getState().phase,'FAULT_EVENT')
  useNavigation.getState().enterDebugXRay(); assert.deepEqual(
    { phase: useNavigation.getState().phase, screen: useNavigation.getState().screen },
    { phase: 'INVESTIGATION', screen: 'xray' },
  )
  useNavigation.getState().completeInvestigation('race');assert.equal(useNavigation.getState().phase,'RECOVERY_COUNTDOWN')
  useNavigation.getState().completeRecoveryCountdown();assert.equal(useNavigation.getState().phase,'RECOVERY_DRIVE')
  useNavigation.getState().finishRace(); assert.equal(useNavigation.getState().phase, 'MISSION_FINISH')
  useNavigation.getState().openDebrief(); assert.deepEqual({phase:useNavigation.getState().phase,screen:useNavigation.getState().screen},{phase:'MISSION_RESULT',screen:'debrief'})
  useNavigation.getState().retryRecovery();assert.equal(useNavigation.getState().phase,'RECOVERY_COUNTDOWN')
  useNavigation.getState().restartRace(); assert.equal(useNavigation.getState().phase, 'PRE_RACE')
  assert.deepEqual(useNavigation.getState().draftConfig, useNavigation.getState().sessionConfig)
  useNavigation.getState().reset(); assert.deepEqual(
    { phase: useNavigation.getState().phase, screen: useNavigation.getState().screen },
    { phase: 'MAIN', screen: 'main' },
  )
})

test('investigation exit cannot silently skip into a finished result', () => {
  resetFlow(); useNavigation.getState().next(); useNavigation.getState().completeCountdown()
  useNavigation.getState().enterDebugXRay()
  useNavigation.getState().completeInvestigation('race')
  assert.deepEqual({ phase: useNavigation.getState().phase, screen: useNavigation.getState().screen }, { phase: 'RECOVERY_COUNTDOWN', screen: 'race' })
  useNavigation.getState().openDebrief()
  assert.equal(useNavigation.getState().phase,'RECOVERY_COUNTDOWN')
})

test('fault event stops the vehicle without exposing the generic pause menu', () => {
  const composition=readFileSync(new URL('../src/app/GameApplication.tsx',import.meta.url),'utf8')
  assert.match(composition,/phase === 'PAUSE_MENU' \|\| phase === 'FAULT_EVENT' \|\| phase === 'INVESTIGATION'\) runtime\.pause\(\)/)
  const runtime=readFileSync(new URL('../src/runtime/SimulationRuntime.ts',import.meta.url),'utf8')
  assert.match(runtime,/phase === 'CAPTURED' \|\| phase === 'SUBMITTED'/)
  const race=readFileSync(new URL('../src/ui/screens/RaceScreen.tsx',import.meta.url),'utf8')
  assert.match(race,/phase !== 'FAULT_EVENT' && <RacePauseOverlay/)
})
