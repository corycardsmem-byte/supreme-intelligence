import { CRA_SPEC, CRA_STATE_COUNT, canonicalize, canonicalHash, normalizeTransition, verifyTransition } from './symbolic-spec.js';

export const NODE_TYPES = Object.freeze({
  PROPOSITION: 'PROPOSITION', EVIDENCE: 'EVIDENCE', BOUNDARY: 'BOUNDARY',
  STATE_VECTOR: 'STATE_VECTOR', PROOF_ARTIFACT: 'PROOF_ARTIFACT', EVENT: 'EVENT'
});

export const EDGE_TYPES = Object.freeze({
  SUPPORTS: 'SUPPORTS', CONTRADICTS: 'CONTRADICTS', DEPENDS_ON: 'DEPENDS_ON',
  DERIVED_FROM: 'DERIVED_FROM', EVALUATED_UNDER: 'EVALUATED_UNDER', HAS_STATE: 'HAS_STATE',
  VERIFIED_BY: 'VERIFIED_BY', SUPERSEDES: 'SUPERSEDES', OBSERVED_FROM: 'OBSERVED_FROM'
});

export const EVENT_TYPES = Object.freeze({
  NODE_CREATED: 'NODE_CREATED', EDGE_CREATED: 'EDGE_CREATED', STATE_CREATED: 'STATE_CREATED',
  STATE_SUPERSEDED: 'STATE_SUPERSEDED', VERIFICATION_ATTACHED: 'VERIFICATION_ATTACHED',
  DEPENDENCY_DECLARED: 'DEPENDENCY_DECLARED', CONTRADICTION_DECLARED: 'CONTRADICTION_DECLARED'
});

const RELATION_VALUES = new Set(Object.values(EDGE_TYPES));
const NODE_VALUE_TYPES = new Set(Object.values(NODE_TYPES));
const EVENT_VALUE_TYPES = new Set(Object.values(EVENT_TYPES));

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function normalizeText(value) {
  return typeof value === 'string' ? value.normalize('NFC') : value;
}

function normalizePayload(value) {
  if (typeof value === 'string') return normalizeText(value);
  if (Array.isArray(value)) return value.map(normalizePayload);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [normalizeText(key), normalizePayload(value[key])]));
  }
  return value;
}

function canonicalNode(type, payload, parents) {
  return { schema: 'cra-mesh-node-1', type, payload: normalizePayload(payload), parents: [...parents].sort(), spec: CRA_SPEC.version };
}

function canonicalEdge(source, relation, target, metadata) {
  return { schema: 'cra-mesh-edge-1', source, relation, target, metadata: normalizePayload(metadata), spec: CRA_SPEC.version };
}

function assertNodeType(type) {
  if (!NODE_VALUE_TYPES.has(type)) throw new TypeError(`Unsupported mesh node type: ${type}`);
}

function assertNodeShape(type, payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new TypeError('Node payload must be an object.');
  if (type === NODE_TYPES.PROPOSITION && typeof payload.statement !== 'string') throw new TypeError('PROPOSITION requires statement.');
  if (type === NODE_TYPES.EVIDENCE && typeof payload.evidenceType !== 'string') throw new TypeError('EVIDENCE requires evidenceType.');
  if (type === NODE_TYPES.BOUNDARY && !Array.isArray(payload.interventionSet)) throw new TypeError('BOUNDARY requires interventionSet.');
  if (type === NODE_TYPES.STATE_VECTOR) {
    if (typeof payload.propositionId !== 'string') throw new TypeError('STATE_VECTOR requires exactly one propositionId.');
    if (!CRA_SPEC.stateSpace.A.includes(payload.provenance) || !CRA_SPEC.stateSpace.E.includes(payload.evidence)) throw new TypeError('STATE_VECTOR contains an invalid CRA A or E value.');
    if (payload.causal !== CRA_SPEC.causalNotApplicable && !CRA_SPEC.stateSpace.C.includes(payload.causal)) throw new TypeError('STATE_VECTOR contains an invalid causal value.');
    if (payload.causal !== CRA_SPEC.causalNotApplicable && typeof payload.boundaryId !== 'string') throw new TypeError('Causal STATE_VECTOR requires boundaryId.');
  }
  if (type === NODE_TYPES.PROOF_ARTIFACT && typeof payload.result !== 'string') throw new TypeError('PROOF_ARTIFACT requires result.');
}

export function createNode(type, payload, parents = []) {
  assertNodeType(type); assertNodeShape(type, payload);
  const canonical = canonicalNode(type, payload, parents);
  const id = canonicalHash(canonical);
  return deepFreeze({ id, nodeType: type, payload: normalizePayload(payload), parents: [...parents].sort(), canonical, contentHash: id });
}

export function createEdge(source, relation, target, metadata = {}) {
  if (!source || !target) throw new TypeError('Edges require source and target node IDs.');
  if (!RELATION_VALUES.has(relation)) throw new TypeError(`Unsupported edge type: ${relation}`);
  const canonical = canonicalEdge(source, relation, target, metadata);
  const id = canonicalHash(canonical);
  return deepFreeze({ id, source, relation, target, metadata: normalizePayload(metadata), canonical, contentHash: id });
}

export function createEvent(type, nodes = [], metadata = {}) {
  if (!EVENT_VALUE_TYPES.has(type)) throw new TypeError(`Unsupported event type: ${type}`);
  const canonical = { schema: 'cra-mesh-event-1', type, nodes: [...nodes].sort(), metadata: normalizePayload(metadata), spec: CRA_SPEC.version };
  const id = canonicalHash(canonical);
  return deepFreeze({ id, eventType: type, nodes: [...nodes].sort(), metadata: normalizePayload(metadata), canonical, contentHash: id });
}

export function proposition(payload) { return createNode(NODE_TYPES.PROPOSITION, payload); }
export function evidence(payload) { return createNode(NODE_TYPES.EVIDENCE, payload); }
export function boundary(payload) { return createNode(NODE_TYPES.BOUNDARY, payload); }

export function stateVector(payload, parents = []) {
  const normalized = normalizeTransition({
    provenance: payload.provenance, evidence: payload.evidence, causal: payload.causal,
    boundary: payload.causalBoundary ?? payload.boundaryId ?? 'Ø'
  });
  return createNode(NODE_TYPES.STATE_VECTOR, {
    propositionId: payload.propositionId,
    specification: CRA_SPEC.version,
    provenance: normalized.provenance,
    evidence: normalized.evidence,
    causal: normalized.causal,
    boundaryId: normalized.causal === CRA_SPEC.causalNotApplicable ? null : payload.boundaryId,
    dependencyHashes: [...(payload.dependencyHashes ?? [])].sort(),
    verificationId: payload.verificationId ?? null,
    creationEventId: payload.creationEventId ?? null,
    supersedes: payload.supersedes ?? null,
    parents
  }, parents);
}

export function proofArtifact(payload, parents = []) {
  if (!['SAT', 'UNSAT', 'UNKNOWN'].includes(payload.result)) throw new TypeError('Proof result must be SAT, UNSAT, or UNKNOWN.');
  return createNode(NODE_TYPES.PROOF_ARTIFACT, { ...payload, specification: payload.specification ?? CRA_SPEC.version }, parents);
}

export class InMemoryMeshStore {
  #nodes = new Map(); #edges = new Map(); #events = new Map();
  putNode(value) { const existing = this.#nodes.get(value.id); if (existing && canonicalize(existing.canonical) !== canonicalize(value.canonical)) throw new Error('Content hash collision detected.'); this.#nodes.set(value.id, existing ?? value); return existing ?? value; }
  getNode(id) { return this.#nodes.get(id); }
  putEdge(value) { const existing = this.#edges.get(value.id); if (existing && canonicalize(existing.canonical) !== canonicalize(value.canonical)) throw new Error('Edge hash collision detected.'); this.#edges.set(value.id, existing ?? value); return existing ?? value; }
  getEdge(id) { return this.#edges.get(id); }
  putEvent(value) { this.#events.set(value.id, this.#events.get(value.id) ?? value); return this.#events.get(value.id); }
  allNodes() { return [...this.#nodes.values()]; }
  allEdges() { return [...this.#edges.values()]; }
  allEvents() { return [...this.#events.values()]; }
}

export class EpistemicMesh {
  constructor(store = new InMemoryMeshStore()) { this.store = store; }
  createNode(type, payload, parents = []) { return this.store.putNode(createNode(type, payload, parents)); }
  createEdge(source, relation, target, metadata = {}) { if (!this.store.getNode(source) || !this.store.getNode(target)) throw new Error('Edges can only reference committed nodes.'); return this.store.putEdge(createEdge(source, relation, target, metadata)); }
  createEvent(type, nodes, metadata = {}) { return this.store.putEvent(createEvent(type, nodes, metadata)); }
  getNode(id) { return this.store.getNode(id); }
  nodesByType(type) { return this.store.allNodes().filter((value) => value.nodeType === type); }
  edgesFrom(source, relation) { return this.store.allEdges().filter((value) => value.source === source && (!relation || value.relation === relation)); }
  edgesTo(target, relation) { return this.store.allEdges().filter((value) => value.target === target && (!relation || value.relation === relation)); }
  stateHistory(propositionId) { return this.nodesByType(NODE_TYPES.STATE_VECTOR).filter((value) => value.payload.propositionId === propositionId); }
  evidenceFor(propositionId, relation = EDGE_TYPES.SUPPORTS) { return this.edgesTo(propositionId, relation).map((edge) => this.getNode(edge.source)); }
  dependenciesOf(nodeId) { return this.edgesTo(nodeId, EDGE_TYPES.DEPENDS_ON).map((edge) => this.getNode(edge.source)); }
  dependentsOf(nodeId) { return this.edgesFrom(nodeId, EDGE_TYPES.DEPENDS_ON).map((edge) => this.getNode(edge.target)); }
  proofsFor(stateId) { return this.edgesTo(stateId, EDGE_TYPES.VERIFIED_BY).map((edge) => this.getNode(edge.source)); }
  descendantsOf(nodeId, limit = 10000) { const seen = new Set(), queue = [nodeId]; while (queue.length && seen.size < limit) { const current = queue.shift(); for (const node of this.dependentsOf(current)) if (!seen.has(node.id)) { seen.add(node.id); queue.push(node.id); } } return [...seen].map((id) => this.getNode(id)); }
  snapshot() { return { nodes: this.store.allNodes(), edges: this.store.allEdges(), events: this.store.allEvents() }; }
}

export async function commitVerifiedState(mesh, { propositionNode, evidenceNode, boundaryNode, transition, verification, previousState = null }) {
  if (!verification || !['SAT', 'UNSAT', 'UNKNOWN'].includes(verification.result)) throw new TypeError('A symbolic verification artifact is required.');
  const proof = mesh.createNode(NODE_TYPES.PROOF_ARTIFACT, { ...verification, inputHash: verification.inputHash ?? canonicalHash(transition) }, [propositionNode.id, ...(evidenceNode ? [evidenceNode.id] : []), ...(boundaryNode ? [boundaryNode.id] : [])]);
  const proofEvent = mesh.createEvent(EVENT_TYPES.VERIFICATION_ATTACHED, [proof.id, propositionNode.id], { result: verification.result });
  const state = stateVector({ propositionId: propositionNode.id, provenance: transition.provenance, evidence: transition.evidence, causal: transition.causalApplicable === false ? 'Presumed' : transition.causal, boundaryId: boundaryNode?.id ?? null, dependencyHashes: [propositionNode.id, ...(evidenceNode ? [evidenceNode.id] : [])], verificationId: proof.id, creationEventId: proofEvent.id, supersedes: previousState?.id ?? null }, [propositionNode.id, proof.id, ...(previousState ? [previousState.id] : [])]);
  mesh.store.putNode(state);
  mesh.createEdge(state.id, EDGE_TYPES.DESCRIBES ?? EDGE_TYPES.HAS_STATE, propositionNode.id);
  mesh.createEdge(proof.id, EDGE_TYPES.VERIFIED_BY, state.id);
  mesh.createEdge(propositionNode.id, EDGE_TYPES.HAS_STATE, state.id);
  if (previousState) { mesh.createEdge(state.id, EDGE_TYPES.SUPERSEDES, previousState.id); mesh.createEvent(EVENT_TYPES.STATE_SUPERSEDED, [state.id, previousState.id], { result: verification.result }); }
  mesh.createEvent(EVENT_TYPES.STATE_CREATED, [state.id, propositionNode.id], { result: verification.result });
  return { proof, state };
}

export { CRA_SPEC, CRA_STATE_COUNT, canonicalize, canonicalHash, normalizeTransition, verifyTransition };
