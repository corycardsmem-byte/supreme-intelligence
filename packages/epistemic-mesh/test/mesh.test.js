import test from 'node:test';
import assert from 'node:assert/strict';
import { CRA_SPEC, CRA_STATE_COUNT, EpistemicMesh, EDGE_TYPES, EVENT_TYPES, NODE_TYPES, canonicalHash, createNode, proposition, evidence, boundary, proofArtifact, stateVector } from '../src/index.js';

test('canonical identity is deterministic and order-independent', () => {
  assert.equal(CRA_STATE_COUNT, 144);
  assert.equal(canonicalHash({ a: 1, b: 2 }), canonicalHash({ b: 2, a: 1 }));
  assert.notEqual(canonicalHash({ a: 1 }), canonicalHash({ a: 2 }));
  assert.equal(proposition({ statement: 'P', sourceReferences: ['s'] }).id, proposition({ sourceReferences: ['s'], statement: 'P' }).id);
});

test('node creation is immutable and idempotent', () => {
  const first = createNode(NODE_TYPES.PROPOSITION, { statement: 'P', sourceReferences: [] });
  assert.equal(first.id, createNode(NODE_TYPES.PROPOSITION, { statement: 'P', sourceReferences: [] }).id);
  assert.throws(() => { first.payload.statement = 'changed'; }, TypeError);
  assert.notEqual(first.id, createNode(NODE_TYPES.PROPOSITION, { statement: 'Q', sourceReferences: [] }).id);
});

test('mesh enforces references and preserves typed graph history', () => {
  const mesh = new EpistemicMesh();
  const p = mesh.createNode(NODE_TYPES.PROPOSITION, { statement: 'P', sourceReferences: [] });
  const e = mesh.createNode(NODE_TYPES.EVIDENCE, { evidenceType: 'empirical', payloadReference: 'ref', citation: {} });
  const b = mesh.createNode(NODE_TYPES.BOUNDARY, { interventionSet: ['I1'], domain: 'D', observationWindow: 'W', scope: {} });
  mesh.createEdge(e.id, EDGE_TYPES.SUPPORTS, p.id);
  assert.throws(() => mesh.createEdge('missing', EDGE_TYPES.SUPPORTS, p.id));
  const oldState = mesh.createNode(NODE_TYPES.STATE_VECTOR, { propositionId: p.id, specification: CRA_SPEC.version, provenance: 'P1', evidence: 'Established', causal: 'Demonstrated', boundaryId: b.id, dependencyHashes: [], verificationId: 'proof-a', creationEventId: 'event-a' });
  const nextState = mesh.createNode(NODE_TYPES.STATE_VECTOR, { propositionId: p.id, specification: CRA_SPEC.version, provenance: 'P1', evidence: 'Contradicted', causal: 'Invalidated', boundaryId: b.id, dependencyHashes: [], verificationId: 'proof-b', creationEventId: 'event-b', supersedes: oldState.id }, [oldState.id]);
  mesh.createEdge(nextState.id, EDGE_TYPES.SUPERSEDES, oldState.id);
  assert.equal(mesh.stateHistory(p.id).length, 2);
  assert.equal(mesh.edgesTo(oldState.id, EDGE_TYPES.SUPERSEDES).length, 1);
});

test('Ø is external and not a causal state value', () => {
  assert.throws(() => stateVector({ propositionId: 'p', provenance: 'P1', evidence: 'Unverified', causal: 'Ø', boundaryId: null }));
});

test('proof artifacts accept only symbolic outcomes', () => {
  assert.equal(proofArtifact({ result: 'UNKNOWN', inputHash: 'x' }).payload.result, 'UNKNOWN');
  assert.throws(() => proofArtifact({ result: 'TRUE' }));
  assert.equal(EVENT_TYPES.STATE_CREATED, 'STATE_CREATED');
});
