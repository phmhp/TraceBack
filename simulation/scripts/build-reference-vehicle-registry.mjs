import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputPath = resolve(repositoryRoot, 'src/referenceVehicle/generated/reference-vehicle-registry.json')
const sourcePaths = Object.freeze({
  functions: 'docs/reference_vehicle/architecture/02_DOMAIN_FUNCTION_DECOMPOSITION_KO.md',
  signals: 'docs/reference_vehicle/interfaces/04_SIGNAL_CATALOG.csv',
  interfaces: 'docs/reference_vehicle/interfaces/04_INTERFACE_CATALOG.csv',
  requirements: 'docs/reference_vehicle/requirements/05_REQUIREMENT_CATALOG.csv',
  requirementTrace: 'docs/reference_vehicle/requirements/05_TRACEABILITY.csv',
  tests: 'docs/reference_vehicle/verification/06_TEST_CASE_CATALOG.csv',
  requirementTests: 'docs/reference_vehicle/verification/06_REQUIREMENT_TC_TRACEABILITY.csv',
  cases: 'docs/reference_vehicle/cases/07_CASE_CATALOG.csv',
  caseTrace: 'docs/reference_vehicle/cases/07_CASE_REQUIREMENT_TC_TRACEABILITY.csv',
})

function sourceText(path) {
  return readFileSync(resolve(repositoryRoot, path), 'utf8').replace(/^\uFEFF/, '')
}

function parseCsv(text, source) {
  const rows = []
  let row = [], value = '', quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        value += '"'; index += 1
      } else if (character === '"') quoted = false
      else value += character
    } else if (character === '"') quoted = true
    else if (character === ',') { row.push(value); value = '' }
    else if (character === '\n') { row.push(value.replace(/\r$/, '')); rows.push(row); row = []; value = '' }
    else value += character
  }
  if (value.length || row.length) { row.push(value.replace(/\r$/, '')); rows.push(row) }
  if (quoted) throw new Error(`Unclosed quoted field in ${source}`)
  const nonEmpty = rows.filter(candidate => candidate.some(cell => cell.length))
  const [headers, ...records] = nonEmpty
  if (!headers) throw new Error(`Missing CSV header in ${source}`)
  return records.map((record, rowIndex) => {
    if (record.length !== headers.length) throw new Error(`${source}:${rowIndex + 2} has ${record.length} fields; expected ${headers.length}`)
    return Object.fromEntries(headers.map((header, column) => [header, record[column] ?? '']))
  })
}

const splitIds = value => value ? value.split(/[;,]/).map(item => item.trim()).filter(Boolean) : []
const canonicalSource = (path, row) => ({ path, ...(row ? { row } : {}) })
const sha256 = value => createHash('sha256').update(value).digest('hex')

function parseFunctionDetails(markdown) {
  const details = new Map()
  const heading = /^#### `(?<id>LF-[A-Z0-9-]+)` — (?<name>.+)$/gm
  const matches = [...markdown.matchAll(heading)]
  matches.forEach((match, index) => {
    const sectionEnd = matches[index + 1]?.index ?? markdown.length
    const section = markdown.slice((match.index ?? 0) + match[0].length, sectionEnd)
    const description = section.match(/^- \*\*역할:\*\* (.+)$/m)?.[1]
    details.set(match.groups.id, { name: match.groups.name.trim(), description: description?.trim() })
  })
  return details
}

function parseFunctionKinds(markdown) {
  const result = new Map()
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^\| `([A-Z_]+)` \| (.+) \|$/)
    if (!match) continue
    for (const id of match[2].match(/LF-[A-Z0-9-]+/g) ?? []) result.set(id, match[1])
  }
  return result
}

const functionMarkdown = sourceText(sourcePaths.functions)
const signalRows = parseCsv(sourceText(sourcePaths.signals), sourcePaths.signals)
const interfaceRows = parseCsv(sourceText(sourcePaths.interfaces), sourcePaths.interfaces)
const requirementRows = parseCsv(sourceText(sourcePaths.requirements), sourcePaths.requirements)
const requirementTraceRows = parseCsv(sourceText(sourcePaths.requirementTrace), sourcePaths.requirementTrace)
const testRows = parseCsv(sourceText(sourcePaths.tests), sourcePaths.tests)
const requirementTestRows = parseCsv(sourceText(sourcePaths.requirementTests), sourcePaths.requirementTests)
const caseRows = parseCsv(sourceText(sourcePaths.cases), sourcePaths.cases)
const caseTraceRows = parseCsv(sourceText(sourcePaths.caseTrace), sourcePaths.caseTrace)
const functionDetails = parseFunctionDetails(functionMarkdown)
const functionKinds = parseFunctionKinds(functionMarkdown)

const entities = []
const entityIds = new Set()
function addEntity(entity) {
  if (!entity.id) throw new Error(`Entity without an ID from ${entity.source.path}`)
  if (entityIds.has(entity.id)) throw new Error(`Duplicate canonical entity ID: ${entity.id}`)
  entityIds.add(entity.id)
  entities.push(entity)
}

const areaIds = [...new Set(testRows.map(row => row.area))].sort()
for (const areaId of areaIds) addEntity({
  id: areaId,
  entityKind: 'AREA',
  name: areaId,
  referenceStatus: 'REVIEWED_DRAFT',
  source: canonicalSource(sourcePaths.tests),
  metadata: {},
})

const functionRowsById = new Map()
testRows.forEach((row, index) => {
  const existing = functionRowsById.get(row.sourceLf)
  if (existing && (existing.area !== row.area || existing.codeAuditStatus !== row.codeAuditStatus)) {
    throw new Error(`Conflicting LF metadata for ${row.sourceLf}`)
  }
  functionRowsById.set(row.sourceLf, { ...row, rowNumber: index + 2 })
})
for (const [id, row] of [...functionRowsById].sort(([left], [right]) => left.localeCompare(right))) {
  const detail = functionDetails.get(id)
  addEntity({
    id,
    entityKind: 'LOGICAL_FUNCTION',
    name: detail?.name ?? id,
    ...(detail?.description ? { description: detail.description } : {}),
    implementationStatus: row.codeAuditStatus,
    referenceStatus: 'REFERENCE_DESIGN',
    approvalStatus: row.status,
    pathScope: row.codeAuditStatus === 'DESIGN_ONLY' ? 'REFERENCE_DESIGN' : 'BOTH',
    source: canonicalSource(sourcePaths.functions),
    metadata: {
      areaId: row.area,
      functionKind: functionKinds.get(id) ?? 'OPEN',
      executionCapability: row.executionCapability,
      executionRepresentationStatus: row.executionRepresentationStatus,
      phase08Gate: row.phase08Gate,
      codeEvidence: row.codeEvidence,
    },
  })
}

signalRows.forEach((row, index) => addEntity({
  id: row.signalName,
  entityKind: 'SIGNAL',
  name: row.signalName,
  description: row.meaningKO,
  implementationStatus: row.implementationStatus,
  referenceStatus: row.runtimeReferenceStatus,
  approvalStatus: row.semanticReviewStatus,
  pathScope: row.runtimeReferenceStatus,
  source: canonicalSource(sourcePaths.signals, index + 2),
  metadata: {
    semanticKind: row.semanticKind,
    unit: row.unit,
    shape: row.shape,
    rangeOrStates: row.rangeOrStates,
    clockBasis: row.clockBasis,
    validitySemantics: row.validitySemantics,
    externalValidationStatus: row.externalValidationStatus,
    controlOutputKind: row.controlOutputKind,
    quantityKind: row.quantityKind,
    warning: row.warning,
  },
}))

interfaceRows.forEach((row, index) => addEntity({
  id: row.boundaryId,
  entityKind: 'INTERFACE',
  name: `${row.producerFunction} → ${row.consumerFunction}`,
  description: row.limitation,
  implementationStatus: row.implementationStatus,
  referenceStatus: row.logicalInterfaceStatus,
  approvalStatus: row.semanticReviewStatus,
  pathScope: row.runtimeTransferStatus === 'CURRENT_RUNTIME_TRANSFER' ? 'BOTH' : 'REFERENCE_DESIGN',
  source: canonicalSource(sourcePaths.interfaces, index + 2),
  metadata: {
    boundaryKind: row.boundaryKind,
    designStatus: row.designStatus,
    runtimeTransferStatus: row.runtimeTransferStatus,
    transportMappingStatus: row.transportMappingStatus,
    observationPointStatus: row.observationPointStatus,
    comparisonCapabilityStatus: row.comparisonCapabilityStatus,
    instrumentationClass: row.instrumentationClass,
    externalValidationStatus: row.externalValidationStatus,
    signalId: row.signalName,
  },
}))

requirementRows.forEach((row, index) => addEntity({
  id: row.requirementId,
  entityKind: 'REQUIREMENT',
  name: row.requirementId,
  description: row.text,
  implementationStatus: row.implementationStatus,
  referenceStatus: row.sourceClass,
  approvalStatus: row.statementStatus,
  source: canonicalSource(sourcePaths.requirements, index + 2),
  metadata: {
    level: row.level,
    areaId: row.area,
    owner: row.owner,
    ownerGateStatus: row.ownerGateStatus,
    verificationStatus: row.verificationStatus,
    verificationCapability: row.verificationCapability,
    expectedOracleStatus: row.expectedOracleStatus,
    calibrationStatus: row.calibrationStatus,
    safetyLifecycleStatus: row.safetyLifecycleStatus,
    architectureCorrectionStatus: row.architectureCorrectionStatus,
    architectureDecision: row.architectureDecision,
  },
}))

testRows.forEach((row, index) => addEntity({
  id: row.tcId,
  entityKind: 'TEST_CASE',
  name: row.tcId,
  description: row.expectedDesign,
  implementationStatus: row.executionCapability,
  referenceStatus: row.evidenceClass,
  approvalStatus: row.status,
  pathScope: row.codeAuditStatus === 'DESIGN_ONLY' ? 'REFERENCE_DESIGN' : 'BOTH',
  source: canonicalSource(sourcePaths.tests, index + 2),
  metadata: {
    areaId: row.area,
    sourceLf: row.sourceLf,
    verificationLevel: row.verificationLevel,
    targetType: row.targetType,
    primaryMethod: row.primaryMethod,
    secondaryMethods: splitIds(row.secondaryMethods),
    oracleStatus: row.oracleStatus,
    verdictPolicy: row.verdictPolicy,
    timingBasis: row.timingBasis,
    unresolved: row.unresolved,
    phase08Gate: row.phase08Gate,
  },
}))

caseRows.forEach((row, index) => addEntity({
  id: row.caseId,
  entityKind: 'CASE',
  name: row.title,
  description: row.playerSymptom,
  implementationStatus: row.runtimeCapability,
  referenceStatus: row.caseType,
  approvalStatus: row.approvalStatus,
  pathScope: row.approvalStatus === 'EXISTING_CANONICAL_GAME_CASE' ? 'BOTH' : 'REFERENCE_DESIGN',
  source: canonicalSource(sourcePaths.cases, index + 2),
  metadata: {
    primaryDomain: row.primaryDomain,
    faultId: row.faultId,
    softwareDefectCandidate: row.softwareDefectCandidate,
    faultStimulus: row.faultStimulus,
    correctiveActionCandidate: row.correctiveActionCandidate,
    rootCauseProvenance: row.rootCauseProvenance,
    oracleCapability: row.oracleCapability,
    visibleEvidencePolicy: row.visibleEvidencePolicy,
    hiddenGroundTruth: row.hiddenGroundTruth,
    engineeringOpenItem: row.engineeringOpenItem,
    architectureCompatibilityStatus: row.architectureCompatibilityStatus,
  },
}))

const relations = []
const unresolvedReferences = []
const relationKeys = new Set()
function addRelation(sourceId, targetId, relationKind, path, row, options = {}) {
  if (!sourceId || !targetId) return
  const missing = [sourceId, targetId].filter(id => !entityIds.has(id))
  if (missing.length) {
    unresolvedReferences.push({ sourceId, targetId, relationKind, missingEntityIds: missing, source: canonicalSource(path, row), status: options.status ?? 'UNRESOLVED_EXTERNAL_REFERENCE' })
    return
  }
  const key = `${sourceId}\u0000${relationKind}\u0000${targetId}\u0000${path}`
  if (relationKeys.has(key)) return
  relationKeys.add(key)
  relations.push({ sourceId, targetId, relationKind, source: canonicalSource(path, row), ...(options.pathScope ? { pathScope: options.pathScope } : {}), ...(options.status ? { status: options.status } : {}) })
}

for (const [id, row] of functionRowsById) addRelation(row.area, id, 'CONTAINS_LOGICAL_FUNCTION', sourcePaths.tests, row.rowNumber, { status: row.status })

signalRows.forEach((row, index) => {
  splitIds(row.producerCandidate).forEach(id => addRelation(id, row.signalName, 'PRODUCES_SIGNAL', sourcePaths.signals, index + 2, { pathScope: row.runtimeReferenceStatus, status: row.producerReview }))
  splitIds(row.consumerCandidates).forEach(id => addRelation(id, row.signalName, 'CONSUMES_SIGNAL', sourcePaths.signals, index + 2, { pathScope: row.runtimeReferenceStatus, status: row.consumerReview }))
})

interfaceRows.forEach((row, index) => {
  splitIds(row.producerFunction).forEach(id => addRelation(id, row.boundaryId, 'PROVIDES_INTERFACE', sourcePaths.interfaces, index + 2, { pathScope: row.runtimeTransferStatus, status: row.designStatus }))
  splitIds(row.consumerFunction).forEach(id => addRelation(row.boundaryId, id, 'CONNECTS_TO_FUNCTION', sourcePaths.interfaces, index + 2, { pathScope: row.runtimeTransferStatus, status: row.designStatus }))
  addRelation(row.boundaryId, row.signalName, 'TRANSFERS_SIGNAL', sourcePaths.interfaces, index + 2, { pathScope: row.runtimeTransferStatus, status: row.comparisonCapabilityStatus })
})

requirementRows.forEach((row, index) => {
  addRelation(row.area, row.requirementId, 'CONTAINS_REQUIREMENT', sourcePaths.requirements, index + 2, { status: row.statementStatus })
  if (row.sourceLf) addRelation(row.requirementId, row.sourceLf, 'ALLOCATED_TO_LOGICAL_FUNCTION', sourcePaths.requirements, index + 2, { status: row.ownerGateStatus })
})
requirementTraceRows.forEach((row, index) => addRelation(row.fromId, row.toId, row.relation, sourcePaths.requirementTrace, index + 2, { status: row.approval }))

testRows.forEach((row, index) => {
  addRelation(row.area, row.tcId, 'CONTAINS_TEST_CASE', sourcePaths.tests, index + 2, { status: row.status })
  addRelation(row.tcId, row.sourceLf, 'TARGETS_LOGICAL_FUNCTION', sourcePaths.tests, index + 2, { status: row.status })
  if (row.linkedSYSR) addRelation(row.tcId, row.linkedSYSR, 'LINKED_SYSTEM_REQUIREMENT', sourcePaths.tests, index + 2, { status: row.status })
  if (row.linkedImplReq) addRelation(row.tcId, row.linkedImplReq, 'LINKED_IMPLEMENTATION_REQUIREMENT', sourcePaths.tests, index + 2, { status: row.status })
})
requirementTestRows.forEach((row, index) => addRelation(row.fromRequirementId, row.toTcId, row.relation, sourcePaths.requirementTests, index + 2, { status: row.approval }))

caseRows.forEach((row, index) => {
  addRelation(row.caseId, row.primaryLf, 'PRIMARY_LOGICAL_FUNCTION', sourcePaths.cases, index + 2, { status: row.approvalStatus })
  splitIds(row.secondaryLfs).forEach(id => addRelation(row.caseId, id, 'SECONDARY_LOGICAL_FUNCTION', sourcePaths.cases, index + 2, { status: row.approvalStatus }))
  if (row.linkedSYSR) addRelation(row.caseId, row.linkedSYSR, 'LINKED_SYSTEM_REQUIREMENT', sourcePaths.cases, index + 2, { status: row.approvalStatus })
  if (row.linkedImplReq) addRelation(row.caseId, row.linkedImplReq, 'LINKED_IMPLEMENTATION_REQUIREMENT', sourcePaths.cases, index + 2, { status: row.approvalStatus })
  if (row.linkedTcCandidate) addRelation(row.caseId, row.linkedTcCandidate, 'LINKED_TEST_CASE', sourcePaths.cases, index + 2, { status: row.approvalStatus })
})
caseTraceRows.forEach((row, index) => {
  addRelation(row.caseId, row.lfId, `${row.lfRole}_LOGICAL_FUNCTION_TRACE`, sourcePaths.caseTrace, index + 2, { status: row.approval })
  addRelation(row.caseId, row.sysrId, row.relation, sourcePaths.caseTrace, index + 2, { status: row.approval })
  addRelation(row.caseId, row.implRequirementId, row.relation, sourcePaths.caseTrace, index + 2, { status: row.approval })
  addRelation(row.caseId, row.tcCandidateId, row.relation, sourcePaths.caseTrace, index + 2, { status: row.approval })
})

const kindOrder = ['AREA', 'LOGICAL_FUNCTION', 'SIGNAL', 'INTERFACE', 'REQUIREMENT', 'TEST_CASE', 'CASE']
entities.sort((left, right) => kindOrder.indexOf(left.entityKind) - kindOrder.indexOf(right.entityKind) || left.id.localeCompare(right.id))
relations.sort((left, right) => left.sourceId.localeCompare(right.sourceId) || left.relationKind.localeCompare(right.relationKind) || left.targetId.localeCompare(right.targetId) || left.source.path.localeCompare(right.source.path))
unresolvedReferences.sort((left, right) => left.sourceId.localeCompare(right.sourceId) || left.relationKind.localeCompare(right.relationKind) || left.targetId.localeCompare(right.targetId))

const counts = Object.fromEntries(kindOrder.map(kind => [kind, entities.filter(entity => entity.entityKind === kind).length]))
const sourceHashes = Object.values(sourcePaths).map(path => ({ path, sha256: sha256(sourceText(path)) })).sort((left, right) => left.path.localeCompare(right.path))
const artifact = {
  schemaVersion: 1,
  generator: 'scripts/build-reference-vehicle-registry.mjs',
  canonicalRoot: 'docs/reference_vehicle/',
  sourceHashes,
  counts,
  relationCount: relations.length,
  unresolvedReferenceCount: unresolvedReferences.length,
  entities,
  relations,
  unresolvedReferences,
}
const serialized = `${JSON.stringify(artifact, null, 2)}\n`
const check = globalThis.process.argv.includes('--check')
if (check) {
  let current = ''
  try { current = readFileSync(outputPath, 'utf8') } catch { /* reported below */ }
  if (current !== serialized) {
    globalThis.console.error(`Generated registry is stale: ${relative(repositoryRoot, outputPath)}`)
    globalThis.process.exitCode = 1
  } else globalThis.console.log(`Registry artifact is current (${entities.length} entities, ${relations.length} relations).`)
} else {
  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, serialized)
  globalThis.console.log(`Generated ${relative(repositoryRoot, outputPath)} (${entities.length} entities, ${relations.length} relations).`)
}
