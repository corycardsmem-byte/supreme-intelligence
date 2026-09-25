import { canonicalHash, CRA_SPEC } from '@supreme-intelligence/epistemic-mesh';

/**
 * Binary Frontier Protocol
 * 
 * Convergence gate between Atlas (operational rail) and Supreme Intelligence (formal rail).
 * Both rails must independently satisfy their predicates before state commit is authorized.
 * No authority is inherited; each layer must explicitly verify its domain.
 */

export const FRONTIER_STATUS = Object.freeze({
  CONVERGED: 'CONVERGED',   // both rails agree; state commit permitted
  DIVERGED: 'DIVERGED',     // rails disagree; no commit authorized
  ABSTAINED: 'ABSTAINED'    // incomplete or inconclusive; state preserved
});

export const FRONTIER_REJECTION_REASONS = Object.freeze({
  REQUEST_ID_MISMATCH: 'REQUEST_ID_MISMATCH',
  INTENT_HASH_MISMATCH: 'INTENT_HASH_MISMATCH',
  ATLAS_VALIDATION_FAILED: 'ATLAS_VALIDATION_FAILED',
  SUPREME_VERIFICATION_FAILED: 'SUPREME_VERIFICATION_FAILED',
  MISSING_ATLAS_PACKET: 'MISSING_ATLAS_PACKET',
  MISSING_SUPREME_RESULT: 'MISSING_SUPREME_RESULT',
  UNKNOWN_VERIFICATION: 'UNKNOWN_VERIFICATION',
  PACKET_HASH_INVALID: 'PACKET_HASH_INVALID',
  PROOF_ARTIFACT_MISSING: 'PROOF_ARTIFACT_MISSING'
});

export class AtlasFrontierPacket {
  constructor(input = {}) {
    if (typeof input.requestId !== 'string' || !input.requestId.trim()) {
      throw new TypeError('AtlasFrontierPacket requires requestId.');
    }
    if (typeof input.intentHash !== 'string' || !input.intentHash.trim()) {
      throw new TypeError('AtlasFrontierPacket requires intentHash.');
    }
    if (typeof input.answer !== 'string' || !input.answer.trim()) {
      throw new TypeError('AtlasFrontierPacket requires answer.');
    }
    
    this.schema = 'atlas-frontier-packet-1';
    this.requestId = input.requestId.trim();
    this.intentHash = input.intentHash.trim();
    this.answer = input.answer.trim();
    this.corpusSources = Array.isArray(input.corpusSources) ? input.corpusSources.map(s => ({
      title: String(s.title ?? ''),
      url: String(s.url ?? ''),
      hash: String(s.hash ?? '')
    })) : [];
    this.provenanceHashes = Array.isArray(input.provenanceHashes) ? input.provenanceHashes.map(String).sort() : [];
    this.atlasValidationResult = input.atlasValidationResult ?? 'UNKNOWN';
    this.modelMetadata = input.modelMetadata ?? {};
    this.runtimeMetadata = input.runtimeMetadata ?? {};
    this.timestamp = input.timestamp ?? new Date().toISOString();
    
    // Content hash must be computed after all fields are normalized
    const canonical = {
      schema: this.schema,
      requestId: this.requestId,
      intentHash: this.intentHash,
      answer: this.answer,
      corpusSources: this.corpusSources,
      provenanceHashes: this.provenanceHashes,
      atlasValidationResult: this.atlasValidationResult,
      modelMetadata: this.modelMetadata,
      runtimeMetadata: this.runtimeMetadata,
      timestamp: this.timestamp
    };
    this.packetHash = canonicalHash(canonical);
    Object.freeze(this);
  }
}

export class SupremeVerificationResult {
  constructor(input = {}) {
    if (typeof input.requestId !== 'string' || !input.requestId.trim()) {
      throw new TypeError('SupremeVerificationResult requires requestId.');
    }
    if (typeof input.intentHash !== 'string' || !input.intentHash.trim()) {
      throw new TypeError('SupremeVerificationResult requires intentHash.');
    }
    if (!['SAT', 'UNSAT', 'UNKNOWN'].includes(input.verificationResult)) {
      throw new TypeError('SupremeVerificationResult requires verificationResult to be SAT, UNSAT, or UNKNOWN.');
    }
    
    this.schema = 'supreme-verification-result-1';
    this.requestId = input.requestId.trim();
    this.intentHash = input.intentHash.trim();
    this.verificationResult = input.verificationResult;
    this.proofArtifactHash = input.proofArtifactHash ?? null;
    this.graphExecutionHash = input.graphExecutionHash ?? null;
    this.constraintViolations = Array.isArray(input.constraintViolations) ? input.constraintViolations.map(String) : [];
    this.timestamp = input.timestamp ?? new Date().toISOString();
    
    const canonical = {
      schema: this.schema,
      requestId: this.requestId,
      intentHash: this.intentHash,
      verificationResult: this.verificationResult,
      proofArtifactHash: this.proofArtifactHash,
      graphExecutionHash: this.graphExecutionHash,
      constraintViolations: this.constraintViolations,
      timestamp: this.timestamp
    };
    this.resultHash = canonicalHash(canonical);
    Object.freeze(this);
  }
}

export class BinaryFrontierDecision {
  constructor(atlasPacket, supremeResult, input = {}) {
    if (!(atlasPacket instanceof AtlasFrontierPacket)) {
      throw new TypeError('BinaryFrontierDecision requires an AtlasFrontierPacket instance.');
    }
    if (!(supremeResult instanceof SupremeVerificationResult)) {
      throw new TypeError('BinaryFrontierDecision requires a SupremeVerificationResult instance.');
    }
    
    this.schema = 'binary-frontier-decision-1';
    this.specification = CRA_SPEC.version;
    this.atlasPacketHash = atlasPacket.packetHash;
    this.supremeResultHash = supremeResult.resultHash;
    this.requestId = atlasPacket.requestId;
    this.intentHash = atlasPacket.intentHash;
    this.timestamp = input.timestamp ?? new Date().toISOString();
    this.status = null;
    this.rejectionReasons = [];
    this.authorizedCommit = false;
    
    // Validation logic
    if (atlasPacket.requestId !== supremeResult.requestId) {
      this.rejectionReasons.push(FRONTIER_REJECTION_REASONS.REQUEST_ID_MISMATCH);
    }
    
    if (atlasPacket.intentHash !== supremeResult.intentHash) {
      this.rejectionReasons.push(FRONTIER_REJECTION_REASONS.INTENT_HASH_MISMATCH);
    }
    
    if (atlasPacket.atlasValidationResult !== 'PASSED' && atlasPacket.atlasValidationResult !== 'PASSED_WITH_WARNINGS') {
      this.rejectionReasons.push(FRONTIER_REJECTION_REASONS.ATLAS_VALIDATION_FAILED);
    }
    
    if (supremeResult.verificationResult === 'UNSAT') {
      this.rejectionReasons.push(FRONTIER_REJECTION_REASONS.SUPREME_VERIFICATION_FAILED);
    }
    
    if (supremeResult.verificationResult === 'UNKNOWN') {
      this.status = FRONTIER_STATUS.ABSTAINED;
    } else if (this.rejectionReasons.length > 0) {
      this.status = FRONTIER_STATUS.DIVERGED;
    } else if (supremeResult.verificationResult === 'SAT' && atlasPacket.atlasValidationResult === 'PASSED') {
      this.status = FRONTIER_STATUS.CONVERGED;
      this.authorizedCommit = true;
    } else {
      this.status = FRONTIER_STATUS.ABSTAINED;
    }
    
    const canonical = {
      schema: this.schema,
      atlasPacketHash: this.atlasPacketHash,
      supremeResultHash: this.supremeResultHash,
      requestId: this.requestId,
      intentHash: this.intentHash,
      status: this.status,
      rejectionReasons: this.rejectionReasons.sort(),
      authorizedCommit: this.authorizedCommit,
      timestamp: this.timestamp
    };
    this.decisionHash = canonicalHash(canonical);
    Object.freeze(this);
  }
}

export function evaluateBinaryFrontier(atlasPacket, supremeResult) {
  if (!(atlasPacket instanceof AtlasFrontierPacket)) {
    throw new TypeError('evaluateBinaryFrontier requires an AtlasFrontierPacket instance.');
  }
  if (!(supremeResult instanceof SupremeVerificationResult)) {
    throw new TypeError('evaluateBinaryFrontier requires a SupremeVerificationResult instance.');
  }
  
  return new BinaryFrontierDecision(atlasPacket, supremeResult);
}
