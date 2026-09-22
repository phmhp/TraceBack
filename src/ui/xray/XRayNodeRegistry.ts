import type { XRayNodeId } from '../../data/ground-truth/PropulsionGroundTruth'
import { architectureNode, componentIds, requirementsFor } from '../../registries/investigation/Architecture'
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
/** Legacy screen adapter; component metadata is owned by the architecture registry. */
export const xrayNodeRegistry: XRayNodeDefinition[] = componentIds.map(id => {
  const node = architectureNode(id)
  return { id, label: node.label, layer: 'FUNCTION_FLOW', domain: node.kind === 'DRIVER' ? 'DRIVER' : node.kind === 'PLANT' ? 'PLANT' : 'POWERTRAIN', domainLabel: node.area, inputs: node.inputs, outputs: node.outputs, requirementIds: requirementsFor(id).map(r => r.id) }
})
