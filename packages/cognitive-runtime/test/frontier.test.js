import test from 'node:test';
import assert from 'node:assert/strict';
import { AtlasFrontierPacket, SupremeVerificationResult, BinaryFrontierDecision, evaluateBinaryFrontier, FRONTIER_STATUS, FRONTIER_REJECTION_REASONS } from '../src/binary-frontier.js';

test('Binary Frontier Protocol', async (t) => {
  await t.test('AtlasFrontierPacket creation and hashing', () => {
    const packet = new AtlasFrontierPacket({
      requestId: 'req-001',
      intentHash: 'intent-abc123',
      answer: 'The answer is 42',
      corpusSources: [
        { title: 'Source 1', url: 'http://example.com/1', hash: 'hash1' },
        { title: 'Source 2', url: 'http://example.com/2', hash: 'hash2' }
      ],
      provenanceHashes: ['prov-hash-1', 'prov-hash-2'],
      atlasValidationResult: 'PASSED'
    });
    
    assert.strictEqual(packet.requestId, 'req-001');
    assert.strictEqual(packet.intentHash, 'intent-abc123');
    assert.strictEqual(packet.answer, 'The answer is 42');
    assert.strictEqual(packet.corpusSources.length, 2);
    assert.ok(packet.packetHash);
    assert.strictEqual(packet.packetHash.length, 64); // SHA-256 hex
  });
  
  await t.test('SupremeVerificationResult creation and hashing', () => {
    const result = new SupremeVerificationResult({
      requestId: 'req-001',
      intentHash: 'intent-abc123',
      verificationResult: 'SAT',
      proofArtifactHash: 'proof-hash-xyz'
    });
    
    assert.strictEqual(result.requestId, 'req-001');
    assert.strictEqual(result.intentHash, 'intent-abc123');
    assert.strictEqual(result.verificationResult, 'SAT');
    assert.ok(result.resultHash);
  });
  
  await t.test('BinaryFrontierDecision CONVERGED status', () => {
    const packet = new AtlasFrontierPacket({
      requestId: 'req-001',
      intentHash: 'intent-abc123',
      answer: 'Converged answer',
      atlasValidationResult: 'PASSED'
    });
    
    const result = new SupremeVerificationResult({
      requestId: 'req-001',
      intentHash: 'intent-abc123',
      verificationResult: 'SAT'
    });
    
    const decision = new BinaryFrontierDecision(packet, result);
    assert.strictEqual(decision.status, FRONTIER_STATUS.CONVERGED);
    assert.strictEqual(decision.authorizedCommit, true);
    assert.strictEqual(decision.rejectionReasons.length, 0);
  });
  
  await t.test('BinaryFrontierDecision DIVERGED on request mismatch', () => {
    const packet = new AtlasFrontierPacket({
      requestId: 'req-001',
      intentHash: 'intent-abc123',
      answer: 'Answer',
      atlasValidationResult: 'PASSED'
    });
    
    const result = new SupremeVerificationResult({
      requestId: 'req-002',
      intentHash: 'intent-abc123',
      verificationResult: 'SAT'
    });
    
    const decision = new BinaryFrontierDecision(packet, result);
    assert.strictEqual(decision.status, FRONTIER_STATUS.DIVERGED);
    assert.strictEqual(decision.authorizedCommit, false);
    assert.ok(decision.rejectionReasons.includes(FRONTIER_REJECTION_REASONS.REQUEST_ID_MISMATCH));
  });
  
  await t.test('BinaryFrontierDecision DIVERGED on intent hash mismatch', () => {
    const packet = new AtlasFrontierPacket({
      requestId: 'req-001',
      intentHash: 'intent-abc123',
      answer: 'Answer',
      atlasValidationResult: 'PASSED'
    });
    
    const result = new SupremeVerificationResult({
      requestId: 'req-001',
      intentHash: 'intent-different',
      verificationResult: 'SAT'
    });
    
    const decision = new BinaryFrontierDecision(packet, result);
    assert.strictEqual(decision.status, FRONTIER_STATUS.DIVERGED);
    assert.ok(decision.rejectionReasons.includes(FRONTIER_REJECTION_REASONS.INTENT_HASH_MISMATCH));
  });
  
  await t.test('BinaryFrontierDecision DIVERGED on Atlas validation failure', () => {
    const packet = new AtlasFrontierPacket({
      requestId: 'req-001',
      intentHash: 'intent-abc123',
      answer: 'Answer',
      atlasValidationResult: 'FAILED'
    });
    
    const result = new SupremeVerificationResult({
      requestId: 'req-001',
      intentHash: 'intent-abc123',
      verificationResult: 'SAT'
    });
    
    const decision = new BinaryFrontierDecision(packet, result);
    assert.strictEqual(decision.status, FRONTIER_STATUS.DIVERGED);
    assert.ok(decision.rejectionReasons.includes(FRONTIER_REJECTION_REASONS.ATLAS_VALIDATION_FAILED));
  });
  
  await t.test('BinaryFrontierDecision DIVERGED on Supreme verification failure', () => {
    const packet = new AtlasFrontierPacket({
      requestId: 'req-001',
      intentHash: 'intent-abc123',
      answer: 'Answer',
      atlasValidationResult: 'PASSED'
    });
    
    const result = new SupremeVerificationResult({
      requestId: 'req-001',
      intentHash: 'intent-abc123',
      verificationResult: 'UNSAT'
    });
    
    const decision = new BinaryFrontierDecision(packet, result);
    assert.strictEqual(decision.status, FRONTIER_STATUS.DIVERGED);
    assert.ok(decision.rejectionReasons.includes(FRONTIER_REJECTION_REASONS.SUPREME_VERIFICATION_FAILED));
  });
  
  await t.test('BinaryFrontierDecision ABSTAINED on unknown verification', () => {
    const packet = new AtlasFrontierPacket({
      requestId: 'req-001',
      intentHash: 'intent-abc123',
      answer: 'Answer',
      atlasValidationResult: 'PASSED'
    });
    
    const result = new SupremeVerificationResult({
      requestId: 'req-001',
      intentHash: 'intent-abc123',
      verificationResult: 'UNKNOWN'
    });
    
    const decision = new BinaryFrontierDecision(packet, result);
    assert.strictEqual(decision.status, FRONTIER_STATUS.ABSTAINED);
    assert.strictEqual(decision.authorizedCommit, false);
  });
  
  await t.test('evaluateBinaryFrontier helper function', () => {
    const packet = new AtlasFrontierPacket({
      requestId: 'req-001',
      intentHash: 'intent-abc123',
      answer: 'Answer',
      atlasValidationResult: 'PASSED'
    });
    
    const result = new SupremeVerificationResult({
      requestId: 'req-001',
      intentHash: 'intent-abc123',
      verificationResult: 'SAT'
    });
    
    const decision = evaluateBinaryFrontier(packet, result);
    assert.strictEqual(decision.status, FRONTIER_STATUS.CONVERGED);
    assert.ok(decision.decisionHash);
  });
  
  await t.test('Deterministic hashing across repeated runs', () => {
    const packet1 = new AtlasFrontierPacket({
      requestId: 'req-001',
      intentHash: 'intent-abc123',
      answer: 'Answer',
      atlasValidationResult: 'PASSED'
    });
    
    const packet2 = new AtlasFrontierPacket({
      requestId: 'req-001',
      intentHash: 'intent-abc123',
      answer: 'Answer',
      atlasValidationResult: 'PASSED'
    });
    
    assert.strictEqual(packet1.packetHash, packet2.packetHash);
  });
});
