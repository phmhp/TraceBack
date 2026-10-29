export type ReferenceVehicleEntityKind =
  | 'AREA'
  | 'LOGICAL_FUNCTION'
  | 'SIGNAL'
  | 'INTERFACE'
  | 'REQUIREMENT'
  | 'TEST_CASE'
  | 'CASE'

export interface CanonicalSourceReference {
  readonly path: string
  readonly row?: number
}

export interface ReferenceVehicleEntity {
  readonly id: string
  readonly entityKind: ReferenceVehicleEntityKind
  readonly name?: string
  readonly description?: string
  readonly implementationStatus?: string
  readonly referenceStatus?: string
  readonly approvalStatus?: string
  readonly pathScope?: string
  readonly source: CanonicalSourceReference
  readonly metadata: Readonly<Record<string, string | readonly string[]>>
}

export interface ReferenceVehicleRelation {
  readonly sourceId: string
  readonly targetId: string
  readonly relationKind: string
  readonly source: CanonicalSourceReference
  readonly pathScope?: string
  readonly status?: string
}

export interface UnresolvedReferenceVehicleReference {
  readonly sourceId: string
  readonly targetId: string
  readonly relationKind: string
  readonly missingEntityIds: readonly string[]
  readonly source: CanonicalSourceReference
  readonly status: string
}

export interface ReferenceVehicleRegistryData {
  readonly schemaVersion: number
  readonly generator: string
  readonly canonicalRoot: string
  readonly sourceHashes: readonly { readonly path: string; readonly sha256: string }[]
  readonly counts: Readonly<Record<ReferenceVehicleEntityKind, number>>
  readonly relationCount: number
  readonly unresolvedReferenceCount: number
  readonly entities: readonly ReferenceVehicleEntity[]
  readonly relations: readonly ReferenceVehicleRelation[]
  readonly unresolvedReferences: readonly UnresolvedReferenceVehicleReference[]
}

export interface ReferenceVehicleValidationResult {
  readonly duplicateIds: readonly string[]
  readonly danglingRelations: readonly ReferenceVehicleRelation[]
  readonly invalidRelationDirections: readonly ReferenceVehicleRelation[]
  readonly unknownEntityKinds: readonly string[]
  readonly countMismatches: readonly string[]
  readonly valid: boolean
}
