import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  getReferenceEntity,
  getReferenceFocus,
  getReferenceFunctionContext,
  getReferenceFunctionsForArea,
  getReferenceInterfaceContext,
  getReferenceRequirementContext,
  getReferenceSignalContext,
  getReferenceStatus,
  referenceVehicleAreas,
  trackbackVmcUiBoundary,
} from '../src/ui/investigation/referenceVehicle/ReferenceVehicleUIAdapter.ts'
import { getSignalDefinition } from '../src/registries/investigation/Architecture.ts'
import { reconcileInvestigationSelection } from '../src/registries/investigation/Trace.ts'

test('whole vehicle Areas and Area to Function navigation resolve from Registry', () => {
  assert.equal(referenceVehicleAreas.length, 16)
  const propulsion=getReferenceFunctionsForArea('PROPULSION')
  assert.equal(propulsion.length, 10)
  assert.ok(propulsion.some(entity=>entity.id==='LF-PROP-EDRV'))
  assert.ok(getReferenceFunctionsForArea('MOTION_COORDINATION').some(entity=>entity.id==='LF-MC-AUTH'))
})

test('CASE-PT-001 active path is Registry-backed without hiding background functions', () => {
  const primary=getReferenceEntity('LF-PROP-EDRV')
  const background=getReferenceEntity('LF-MC-AUTH')
  assert.ok(primary&&background)
  assert.equal(getReferenceFocus(primary), 'PRIMARY_FOCUS')
  assert.equal(getReferenceFocus(background), 'BACKGROUND')
})

test('selected canonical Function resolves Signal, Interface, Requirement and Test traces', () => {
  const context=getReferenceFunctionContext('LF-PROP-EDRV')
  assert.ok(context)
  assert.ok(context.inputs.some(entity=>entity.id==='DriveTorqueRequest'))
  assert.ok(context.outputs.some(entity=>entity.id==='EDriveCommand'))
  assert.ok(context.interfaces.some(entity=>entity.id==='IFC-DESIGN-005'))
  assert.ok(context.requirements.some(entity=>entity.id==='CAND-SWR-PROP-EDRV'))
  assert.ok(context.tests.some(entity=>entity.id==='TC-CAND-PROP-EDRV-001'))
  assert.ok(getReferenceInterfaceContext('IFC-DESIGN-005'))
  assert.ok(getReferenceRequirementContext('CAND-SWR-PROP-EDRV')?.tests.some(entity=>entity.id==='TC-CAND-PROP-EDRV-001'))
})

test('canonical navigation reuses Page 2 selection without falling back to a legacy component ID', () => {
  const selected={componentId:'LF-PROP-EDRV'}
  const signal=reconcileInvestigationSelection(selected,{signalId:'EDriveCommand'})
  assert.equal(signal.componentId,'LF-PROP-EDRV')
  assert.equal(signal.signalId,'EDriveCommand')
  const requirement=reconcileInvestigationSelection(signal,{requirementId:'CAND-SWR-PROP-EDRV'})
  assert.equal(requirement.componentId,'LF-PROP-EDRV')
  assert.equal(requirement.requirementId,'CAND-SWR-PROP-EDRV')
  const legacy=reconcileInvestigationSelection({componentId:'eDrive'},{signalId:'EDriveCommand'})
  assert.equal(legacy.componentId,'eDrive')
  assert.equal(legacy.signalId,'EDriveCommand')
})

test('runtime observation stays separate from Reference Signal definition', () => {
  assert.equal(getReferenceSignalContext('EDriveCommand')?.runtimeObservable, true)
  assert.equal(getReferenceSignalContext('ControlAuthority')?.runtimeObservable, false)
  assert.equal(typeof getSignalDefinition('EDriveCommand')?.readIncidentActual, 'function')
})

test('Reference Design, DESIGN_ONLY and open decisions are not shown as executable', () => {
  const motionCoordination=getReferenceEntity('LF-MC-AUTH')
  const eDriveRequirement=getReferenceEntity('CAND-SWR-PROP-EDRV')
  assert.ok(motionCoordination&&eDriveRequirement)
  assert.deepEqual(getReferenceStatus(motionCoordination), {
    capability:'DESIGN_ONLY', scope:'REFERENCE_DESIGN', approval:'DRAFT_NOT_APPROVED', open:false,
  })
  assert.equal(getReferenceStatus(eDriveRequirement).open, true)
})

test('Trackback_VMC copy explicitly rejects full Motion Coordination identity', () => {
  assert.match(trackbackVmcUiBoundary.label, /좁은 추진 토크 생성 역할/)
  assert.match(trackbackVmcUiBoundary.explanation, /전체 구현이 아닙니다/)
  assert.match(trackbackVmcUiBoundary.explanation, /LF-MC-REQ\/AUTH\/LON\/LAT\/ALLOC/)
})

test('Page 2 integrates whole-vehicle context into the existing structure view', async () => {
  const source=await readFile(new URL('../src/ui/investigation/pages/page2/ViewAFlow.tsx', import.meta.url),'utf8')
  assert.doesNotMatch(source, /<ReferenceVehicleArchitecture/)
  assert.match(source, /className="vehicle-domain-main-flow/)
  assert.match(source, /vehicle-architecture-diagram vehicle-domain-architecture/)
  assert.match(source, /architecture-breadcrumb/)
  assert.match(source, /1단계 · 전체 차량/)
  assert.match(source, /2단계 · 도메인 서브시스템/)
  assert.match(source, /3단계 · 기능 내부 확대/)
  assert.match(source, /'GEAR'/)
  assert.match(source, /'PROPULSION'/)
  assert.match(source, /'BRAKING'/)
  assert.match(source, /'STEERING'/)
})

test('canonical functions preserve the established signal, interface and requirement tool shapes', async () => {
  const flow=await readFile(new URL('../src/ui/investigation/pages/page2/ViewAFlow.tsx', import.meta.url),'utf8')
  const panels=await readFile(new URL('../src/ui/investigation/referenceVehicle/ReferenceVehiclePanels.tsx', import.meta.url),'utf8')
  assert.match(flow, /reference-function-group/)
  assert.match(flow, /'LF-GEAR-INTERLOCK':'Gear'/)
  assert.match(flow, /'LF-PROP-EDRV':'eDrive'/)
  assert.match(panels, /A\. 전제조건 \/ 상태/)
  assert.match(panels, /B\. 기능 입력/)
  assert.match(panels, /C\. 기능 출력/)
  assert.match(panels, /function-port-diagram/)
  assert.match(panels, /interface-direction-diagram/)
  assert.match(panels, /requirement-mind-map/)
  assert.match(panels, /reference-requirement-map/)
})

test('Page 2 flow uses the existing Function Inspector for canonical and runtime functions', async () => {
  const source=await readFile(new URL('../src/ui/investigation/pages/Page2Tracking.tsx', import.meta.url),'utf8')
  assert.match(source, /trackingView === 'FLOW' && selectedComponent&&<details[^>]*function-inspector-drawer/)
  assert.match(source, /<FunctionInspector/)
  assert.doesNotMatch(source, /trackingView === 'FLOW' && !referenceFunction/)
})

test('Page 3 exposes one test-design-technique source of truth', async () => {
  const page=await readFile(new URL('../src/ui/investigation/pages/Page3Verification.tsx', import.meta.url),'utf8')
  const workbench=await readFile(new URL('../src/ui/investigation/pages/VehicleScenarioWorkbench.tsx', import.meta.url),'utf8')
  assert.match(page, /technique=\{technique\}/)
  assert.doesNotMatch(page, /4 · VERIFICATION METHOD/)
  assert.doesNotMatch(page, /3 · 통합 검증 워크벤치/)
  assert.doesNotMatch(workbench, /TEST DESIGN TECHNIQUE/)
  assert.doesNotMatch(workbench, /technique-picker/)
})
