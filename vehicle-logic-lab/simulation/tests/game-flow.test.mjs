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
  assert.deepEqual(
    { phase: useNavigation.getState().phase, screen: useNavigation.getState().screen, sessionConfig: useNavigation.getState().sessionConfig },
    { phase: 'SESSION_SETUP', screen: 'setup', sessionConfig: null },
  )
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

test('mission brief exposes the symptom and test contract without leaking the root cause', () => {
  const setup=readFileSync(new URL('../src/ui/screens/SessionSetupScreen.tsx',import.meta.url),'utf8')
  const mission=readFileSync(new URL('../src/data/gameplay/VerificationMissions.ts',import.meta.url),'utf8')
  assert.match(setup,/DRIVER REPORT/)
  assert.match(mission,/가속 페달을 밟아도 차량이 기대만큼 나가지 않는다고 제보/)
  assert.match(mission,/원인을 단정하지 않은 상태/)
  assert.doesNotMatch(setup,/스케일링|scaling|INCORRECT_SCALING|추진 SW 계산 오류/i)
  assert.doesNotMatch(mission,/INCORRECT_SCALING|eDrive의 로직/i)
})

test('investigation exit cannot silently skip into a finished result', () => {
  resetFlow(); useNavigation.getState().next(); useNavigation.getState().startSession(); useNavigation.getState().completeCountdown()
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
  assert.match(race,/!\['FAULT_EVENT','RECOVERY_COUNTDOWN'\]\.includes\(phase\) && <RacePauseOverlay/)
  assert.match(race,/RepairReturnOverlay/)
})

test('fault transition shows cockpit facts without revealing a hidden cause', () => {
  const dialogue=readFileSync(new URL('../src/ui/components/IncidentDialogue.tsx',import.meta.url),'utf8')
  const race=readFileSync(new URL('../src/ui/screens/RaceScreen.tsx',import.meta.url),'utf8')
  assert.match(dialogue,/incident-wheel/)
  assert.match(dialogue,/ACCEL/)
  assert.match(dialogue,/BRAKE/)
  assert.match(dialogue,/GEAR/)
  assert.match(dialogue,/원인은 아직 특정하지 않았습니다/)
  assert.match(race,/incidentFrame\.sw\.input\.acceleratorPedalPosition/)
  assert.doesNotMatch(dialogue,/INCORRECT_SCALING|eDrive|스케일링 오류/i)
})

test('investigation chapters unlock from semantic evidence instead of page visits', () => {
  const workspace=readFileSync(new URL('../src/ui/investigation/InvestigationWorkspace.tsx',import.meta.url),'utf8')
  const header=readFileSync(new URL('../src/ui/investigation/shell/InvestigationHeader.tsx',import.meta.url),'utf8')
  assert.match(workspace,/rootCauseUnlocked\?4/)
  assert.match(workspace,/active==='PROOF'\?3/)
  assert.match(workspace,/active==='FAULT_BOUNDARY'\?2:1/)
  assert.match(header,/disabled=\{locked\}/)
  assert.match(header,/이전 조사 근거 확보 후 열림/)
  assert.doesNotMatch(workspace,/page\s*[>=]=?\s*\d.*unlockedPage/)
})
