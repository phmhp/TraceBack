import type { XRayNodeId } from '../../data/ground-truth/PropulsionGroundTruth'

export interface XRayNodeDefinition {
  id: XRayNodeId
  label: string
  layer: 'FUNCTION_FLOW'
  domain: 'DRIVER' | 'POWERTRAIN' | 'PLANT'
  domainLabel: string
  inputs: string[]
  outputs: string[]
  requirementIds: string[]
}

export const xrayNodeRegistry: XRayNodeDefinition[] = [
  { id:'DriverInput', label:'Driver Input', layer:'FUNCTION_FLOW', domain:'DRIVER', domainLabel:'DRIVER INTERFACE', inputs:[], outputs:['AcceleratorPedalPosition','GearRequest','Brake','Steering'], requirementIds:['SYSR-PROP-001'] },
  { id:'GearLogic', label:'Gear Logic', layer:'FUNCTION_FLOW', domain:'POWERTRAIN', domainLabel:'POWERTRAIN / PROPULSION', inputs:['GearRequest','LongitudinalVelocity'], outputs:['GearState','GearStateValidity'], requirementIds:['SYSR-GEAR-001'] },
  { id:'PropulsionFunction', label:'Propulsion Function', layer:'FUNCTION_FLOW', domain:'POWERTRAIN', domainLabel:'POWERTRAIN / PROPULSION', inputs:['AcceleratorPedalPosition','GearState','VehicleReady','PropulsionEnable'], outputs:['PropulsionRequestMagnitude','PropulsionRequestDirection','PropulsionRequestValidity'], requirementIds:['SYSR-PROP-007'] },
  { id:'VMC', label:'VMC', layer:'FUNCTION_FLOW', domain:'POWERTRAIN', domainLabel:'POWERTRAIN / PROPULSION', inputs:['PropulsionRequest'], outputs:['DriveTorqueRequest'], requirementIds:['SYSR-PROP-009'] },
  { id:'eDrive', label:'eDrive', layer:'FUNCTION_FLOW', domain:'POWERTRAIN', domainLabel:'POWERTRAIN / PROPULSION', inputs:['DriveTorqueRequest'], outputs:['EDriveTorqueCommand'], requirementIds:['SYSR-PROP-009'] },
  { id:'VehiclePhysics', label:'Vehicle Physics', layer:'FUNCTION_FLOW', domain:'PLANT', domainLabel:'PLANT', inputs:['EDriveTorqueCommand'], outputs:['VehicleSpeed','LongitudinalVelocity','LongitudinalAcceleration'], requirementIds:['SYSR-PROP-011'] },
]
